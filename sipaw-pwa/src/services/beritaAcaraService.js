import { apiClient } from '../config/api'
import { generateKode } from '../utils/helpers'
import authService from './authService'

class BeritaAcaraService {
  // Fitur 6: Berita Acara Kehilangan & Kerusakan
  async getAllBeritaAcara() {
    const res = await apiClient.get(
      '/rest/v1/berita_acara?select=*,inventaris_barang(kode_inventaris,nama_barang),users(nama,nia)&order=created_at.desc'
    )
    return Array.isArray(res) ? res : []
  }

  async createBeritaAcara(payload) {
    const nomor_ba = generateKode('BA-WPL')
    const user = authService.getCurrentUser()
    const res = await apiClient.post(
      '/rest/v1/berita_acara',
      {
        ...payload,
        nomor_ba,
        penanggung_jawab_id: user?.id || null
      },
      { headers: { Prefer: 'return=representation' } }
    )

    // Sinkronkan kondisi alat
    const kondisiBaru = payload.jenis_kasus === 'Kehilangan' ? 'Hilang' : 'Rusak Berat'
    const statusBaru = payload.jenis_kasus === 'Kehilangan' ? 'Hilang' : 'Perawatan'
    try {
      await apiClient.patch(`/rest/v1/inventaris_barang?id=eq.${payload.barang_id}`, {
        kondisi: kondisiBaru,
        status: statusBaru
      })
    } catch {
      // Ignore
    }

    await authService.catatAudit(
      user,
      'BUAT_BERITA_ACARA',
      'Berita Acara',
      `Menerbitkan ${nomor_ba} (${payload.jenis_kasus})`
    )

    return Array.isArray(res) ? res[0] : res || { nomor_ba }
  }

  async updateStatusBA(id, status_penyelesaian, tindak_lanjut) {
    return apiClient.patch(`/rest/v1/berita_acara?id=eq.${id}`, {
      status_penyelesaian,
      tindak_lanjut
    })
  }

  // Fitur 7: Perawatan Barang
  async getAllPerawatan() {
    const res = await apiClient.get(
      '/rest/v1/perawatan_barang?select=*,inventaris_barang(id,kode_inventaris,nama_barang,kondisi)&order=created_at.desc'
    )
    return Array.isArray(res) ? res : []
  }

  async createPerawatan(payload) {
    const res = await apiClient.post('/rest/v1/perawatan_barang', payload, {
      headers: { Prefer: 'return=representation' }
    })
    try {
      await apiClient.patch(`/rest/v1/inventaris_barang?id=eq.${payload.barang_id}`, {
        status: 'Perawatan'
      })
    } catch {
      // Ignore
    }
    return Array.isArray(res) ? res[0] : res
  }

  async selesaikanPerawatan(perawatan, biaya_perbaikan, catatan_teknisi) {
    await apiClient.patch(`/rest/v1/perawatan_barang?id=eq.${perawatan.id}`, {
      status_perawatan: 'Selesai',
      tanggal_selesai: new Date().toISOString().split('T')[0],
      biaya_perbaikan: Number(biaya_perbaikan) || 0,
      catatan_teknisi
    })
    try {
      await apiClient.patch(`/rest/v1/inventaris_barang?id=eq.${perawatan.barang_id}`, {
        kondisi: 'Baik',
        status: 'Tersedia'
      })
      await apiClient.post('/rest/v1/notifikasi', {
        user_id: null,
        judul: 'Perawatan Alat Selesai',
        pesan: `Alat ${perawatan.inventaris_barang?.nama_barang || ''} telah selesai diperbaiki dan siap digunakan kembali.`,
        tipe: 'PERAWATAN_SELESAI'
      })
    } catch {
      // Ignore
    }
  }

  // Fitur 8: Stock Opname
  async getAllStockOpname() {
    const res = await apiClient.get(
      '/rest/v1/stock_opname?select=*,users(nama,nia),detail_stock_opname(*,inventaris_barang(kode_inventaris,nama_barang))&order=created_at.desc'
    )
    return Array.isArray(res) ? res : []
  }

  async simpanStockOpname({ periode, petugas_id, catatan_umum, items }) {
    const headerRes = await apiClient.post(
      '/rest/v1/stock_opname',
      {
        periode,
        petugas_id: petugas_id || null,
        catatan_umum
      },
      { headers: { Prefer: 'return=representation' } }
    )
    const opname = Array.isArray(headerRes) ? headerRes[0] : headerRes

    if (opname?.id && Array.isArray(items)) {
      const detailRows = items.map((it) => ({
        opname_id: opname.id,
        barang_id: it.barang_id,
        jumlah_sistem: Number(it.jumlah_sistem),
        jumlah_fisik: Number(it.jumlah_fisik),
        jumlah_rusak: Number(it.jumlah_rusak || 0),
        jumlah_hilang: Number(it.jumlah_hilang || 0),
        catatan_pengecekan: it.catatan_pengecekan || ''
      }))
      await apiClient.post('/rest/v1/detail_stock_opname', detailRows)

      // Sinkronkan status alat
      for (const it of items) {
        const updateBody = {
          jumlah_total: Number(it.jumlah_fisik),
          jumlah_tersedia: Math.max(0, Number(it.jumlah_fisik) - Number(it.jumlah_rusak || 0))
        }
        if (Number(it.jumlah_hilang) > 0 && Number(it.jumlah_fisik) === 0) {
          updateBody.kondisi = 'Hilang'
          updateBody.status = 'Hilang'
        } else if (Number(it.jumlah_rusak) > 0) {
          updateBody.kondisi = 'Rusak Ringan'
        }
        await apiClient.patch(`/rest/v1/inventaris_barang?id=eq.${it.barang_id}`, updateBody)
      }
    }

    await authService.catatAudit(
      authService.getCurrentUser(),
      'STOCK_OPNAME',
      'Stock Opname',
      `Menyelesaikan stock opname periode ${periode}`
    )
    return opname
  }

  // Fitur 9: Booking Alat Kegiatan Internal
  async getAllBooking() {
    const res = await apiClient.get('/rest/v1/booking_alat?select=*,users(nama,nia)&order=tanggal_mulai.asc')
    return Array.isArray(res) ? res : []
  }

  async createBooking(payload) {
    const kode_booking = generateKode('BKG')
    const user = authService.getCurrentUser()
    const res = await apiClient.post(
      '/rest/v1/booking_alat',
      {
        ...payload,
        kode_booking,
        user_id: user?.id || null
      },
      { headers: { Prefer: 'return=representation' } }
    )
    return Array.isArray(res) ? res[0] : res
  }

  async updateStatusBooking(id, status_booking) {
    return apiClient.patch(`/rest/v1/booking_alat?id=eq.${id}`, { status_booking })
  }
}

export default new BeritaAcaraService()
