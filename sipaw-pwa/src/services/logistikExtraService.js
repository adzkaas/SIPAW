import { apiClient } from '../config/api'
import authService from './authService'

class LogistikExtraService {
  // Fitur 18: Barang Habis Pakai
  async getBarangHabisPakai() {
    const res = await apiClient.get(
      '/rest/v1/barang_habis_pakai?select=*,lokasi_penyimpanan(nama_lokasi)&order=id.asc'
    )
    return Array.isArray(res) ? res : []
  }

  async getLogHabisPakai() {
    const res = await apiClient.get(
      '/rest/v1/log_habis_pakai?select=*,barang_habis_pakai(nama_barang,satuan),users(nama)&order=created_at.desc&limit=50'
    )
    return Array.isArray(res) ? res : []
  }

  async catatTransaksiHabisPakai({ item, jenis_transaksi, jumlah, keterangan }) {
    const qty = Number(jumlah)
    const stokBaru =
      jenis_transaksi === 'MASUK'
        ? item.stok_saat_ini + qty
        : Math.max(0, item.stok_saat_ini - qty)

    await apiClient.patch(`/rest/v1/barang_habis_pakai?id=eq.${item.id}`, {
      stok_saat_ini: stokBaru,
      updated_at: new Date().toISOString()
    })

    const user = authService.getCurrentUser()
    await apiClient.post('/rest/v1/log_habis_pakai', {
      item_id: item.id,
      jenis_transaksi,
      jumlah: qty,
      keterangan,
      user_id: user?.id || null
    })

    if (stokBaru <= item.batas_minimum) {
      try {
        await apiClient.post('/rest/v1/notifikasi', {
          user_id: null,
          judul: 'Stok Barang Habis Pakai Menipis',
          pesan: `Stok ${item.nama_barang} tersisa ${stokBaru} ${item.satuan} (Batas minimum: ${item.batas_minimum}).`,
          tipe: 'STOK_MENIPIS'
        })
      } catch {
        // Ignore
      }
    }
  }

  // Fitur 14: Notifikasi
  async getNotifikasi(userId) {
    const query = userId
      ? `/rest/v1/notifikasi?or=(user_id.eq.${userId},user_id.is.null)&order=created_at.desc&limit=30`
      : '/rest/v1/notifikasi?order=created_at.desc&limit=30'
    const res = await apiClient.get(query)
    return Array.isArray(res) ? res : []
  }

  async tandaiDibaca(id) {
    return apiClient.patch(`/rest/v1/notifikasi?id=eq.${id}`, { is_read: true })
  }

  // Fitur 15: Audit Log
  async getAuditLogs() {
    const res = await apiClient.get('/rest/v1/audit_log?select=*&order=created_at.desc&limit=60')
    return Array.isArray(res) ? res : []
  }

  // Fitur 16: Pengaturan Sistem & Backup JSON
  async getPengaturan() {
    const res = await apiClient.get('/rest/v1/pengaturan_sistem?id=eq.1&select=*')
    return res?.[0] || { maks_hari_pinjam: 7, denda_per_hari: 10000, nama_organisasi: 'WAPEALA UNIVERSITAS DIPONEGORO' }
  }

  async updatePengaturan(payload) {
    return apiClient.patch('/rest/v1/pengaturan_sistem?id=eq.1', {
      ...payload,
      updated_at: new Date().toISOString()
    })
  }

  async backupDatabaseJSON() {
    const [alat, peminjaman, pengembalian, ba, perawatan, habisPakai] = await Promise.all([
      apiClient.get('/rest/v1/inventaris_barang?select=*'),
      apiClient.get('/rest/v1/peminjaman?select=*,detail_peminjaman(*)'),
      apiClient.get('/rest/v1/pengembalian?select=*'),
      apiClient.get('/rest/v1/berita_acara?select=*'),
      apiClient.get('/rest/v1/perawatan_barang?select=*'),
      apiClient.get('/rest/v1/barang_habis_pakai?select=*')
    ])
    return {
      exported_at: new Date().toISOString(),
      organisasi: 'WAPEALA UNIVERSITAS DIPONEGORO',
      inventaris: alat,
      peminjaman,
      pengembalian,
      berita_acara: ba,
      perawatan,
      barang_habis_pakai: habisPakai
    }
  }
}

export default new LogistikExtraService()
