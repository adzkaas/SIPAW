import { apiClient } from '../config/api'
import { generateKode, hitungDendaKeterlambatan } from '../utils/helpers'
import authService from './authService'

class PeminjamanService {
  async getAllPeminjaman(userId = null) {
    let query =
      '/rest/v1/peminjaman?select=*,users!peminjaman_user_id_fkey(id,nama,nia,no_hp),detail_peminjaman(*,inventaris_barang(id,kode_inventaris,nama_barang,kondisi,foto_url)),pengembalian(*)&order=created_at.desc'
    if (userId) {
      query += `&user_id=eq.${userId}`
    }
    const res = await apiClient.get(query)
    return Array.isArray(res) ? res : []
  }

  // Pengajuan Peminjaman Multi-Barang + Validasi Stok Otomatis (Fitur 4)
  async ajukanPeminjaman({ user_id, nama_kegiatan, tanggal_pinjam, tanggal_kembali_rencana, catatan_peminjam, items }) {
    if (!items || items.length === 0) {
      throw new Error('Pilih minimal 1 jenis alat untuk dipinjam.')
    }

    // Validasi stok aktual dari server Supabase
    for (const item of items) {
      const check = await apiClient.get(
        `/rest/v1/inventaris_barang?id=eq.${item.barang_id}&select=nama_barang,jumlah_tersedia`
      )
      const stok = check?.[0]?.jumlah_tersedia ?? 0
      if (item.jumlah > stok) {
        throw new Error(`Stok "${check?.[0]?.nama_barang || item.nama_barang}" tidak mencukupi (tersedia: ${stok} unit).`)
      }
    }

    const kode_peminjaman = generateKode('PJM')
    const headerRes = await apiClient.post(
      '/rest/v1/peminjaman',
      {
        kode_peminjaman,
        user_id: user_id || null,
        nama_kegiatan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        catatan_peminjam,
        status: 'Menunggu'
      },
      { headers: { Prefer: 'return=representation' } }
    )
    const createdHeader = Array.isArray(headerRes) ? headerRes[0] : headerRes

    if (createdHeader?.id) {
      const detailPayload = items.map((it) => ({
        peminjaman_id: createdHeader.id,
        barang_id: it.barang_id,
        jumlah: Number(it.jumlah),
        kondisi_awal: it.kondisi || 'Baik'
      }))
      await apiClient.post('/rest/v1/detail_peminjaman', detailPayload)
    }

    // Notifikasi otomatis ke pengurus (Fitur 14)
    try {
      await apiClient.post('/rest/v1/notifikasi', {
        user_id: null,
        judul: 'Pengajuan Peminjaman Baru',
        pesan: `Peminjaman ${kode_peminjaman} (${nama_kegiatan}) menunggu persetujuan pengurus.`,
        tipe: 'PENGAJUAN_BARU'
      })
    } catch {
      // Ignore
    }

    await authService.catatAudit(
      authService.getCurrentUser(),
      'AJUKAN_PINJAM',
      'Peminjaman',
      `Mengajukan peminjaman ${kode_peminjaman} (${nama_kegiatan})`
    )

    return createdHeader || { kode_peminjaman }
  }

  // Persetujuan / Penolakan / Serah Terima (Fitur 4 & 14)
  async updateStatusPeminjaman(peminjaman, statusBaru, alasanPenolakan = '') {
    const admin = authService.getCurrentUser()
    const payload = {
      status: statusBaru,
      updated_at: new Date().toISOString()
    }
    if (statusBaru === 'Disetujui' && admin?.id) {
      payload.approved_by = admin.id
    }
    if (statusBaru === 'Ditolak') {
      payload.alasan_penolakan = alasanPenolakan
    }

    await apiClient.patch(`/rest/v1/peminjaman?id=eq.${peminjaman.id}`, payload)

    try {
      await apiClient.post('/rest/v1/notifikasi', {
        user_id: peminjaman.user_id,
        judul: `Peminjaman ${statusBaru}`,
        pesan:
          statusBaru === 'Ditolak'
            ? `Pengajuan ${peminjaman.kode_peminjaman} ditolak. Alasan: ${alasanPenolakan}`
            : `Status peminjaman ${peminjaman.kode_peminjaman} diperbarui menjadi ${statusBaru}.`,
        tipe: `PINJAM_${statusBaru.toUpperCase()}`
      })
    } catch {
      // Ignore
    }

    await authService.catatAudit(
      admin,
      `STATUS_${statusBaru.toUpperCase()}`,
      'Peminjaman',
      `Status ${peminjaman.kode_peminjaman} -> ${statusBaru}`
    )
  }

  // Konfirmasi Pengembalian + Denda Otomatis + Update Kondisi Barang (Fitur 5)
  async prosesPengembalian({
    peminjaman,
    tanggal_kembali_aktual,
    tarif_denda_per_hari,
    checklist_items,
    foto_kondisi_url,
    catatan_kerusakan
  }) {
    const penerima = authService.getCurrentUser()
    const { hariTerlambat, totalDenda } = hitungDendaKeterlambatan(
      peminjaman.tanggal_kembali_rencana,
      tanggal_kembali_aktual,
      tarif_denda_per_hari
    )

    // 1. Simpan record pengembalian di Supabase
    await apiClient.post('/rest/v1/pengembalian', {
      peminjaman_id: peminjaman.id,
      tanggal_kembali_aktual,
      hari_terlambat: hariTerlambat,
      total_denda: totalDenda,
      status_denda: totalDenda > 0 ? 'Belum Lunas' : 'Lunas',
      foto_kondisi_url,
      catatan_kerusakan,
      diterima_oleh: penerima?.id || null
    })

    // 2. Update kondisi setiap item pada detail_peminjaman & inventaris
    if (Array.isArray(checklist_items)) {
      for (const item of checklist_items) {
        if (item.detail_id) {
          await apiClient.patch(`/rest/v1/detail_peminjaman?id=eq.${item.detail_id}`, {
            kondisi_kembali: item.kondisi_kembali,
            catatan_item: item.catatan_item || ''
          })
        }
        if (item.barang_id && item.kondisi_kembali !== 'Baik') {
          await apiClient.patch(`/rest/v1/inventaris_barang?id=eq.${item.barang_id}`, {
            kondisi: item.kondisi_kembali,
            catatan: item.catatan_item || catatan_kerusakan
          })
        }
      }
    }

    // 3. Ubah status peminjaman menjadi Selesai (memicu trigger sync_stok_peminjaman Supabase)
    await apiClient.patch(`/rest/v1/peminjaman?id=eq.${peminjaman.id}`, {
      status: 'Selesai',
      updated_at: new Date().toISOString()
    })

    await authService.catatAudit(
      penerima,
      'PENGEMBALIAN',
      'Pengembalian',
      `Konfirmasi kembali ${peminjaman.kode_peminjaman} (Telat: ${hariTerlambat} hari, Denda: Rp${totalDenda})`
    )

    return { hariTerlambat, totalDenda }
  }
}

export default new PeminjamanService()
