import { apiClient } from '../config/api'

class AlatService {
  async getAllAlat(filters = {}) {
    const params = [
      'select=*,kategori_barang(id,nama_kategori,kode_prefix),lokasi_penyimpanan(id,nama_lokasi)',
      'order=kode_inventaris.asc'
    ]
    if (filters.search) {
      params.push(
        `or=(nama_barang.ilike.*${encodeURIComponent(filters.search)}*,kode_inventaris.ilike.*${encodeURIComponent(filters.search)}*,merk.ilike.*${encodeURIComponent(filters.search)}*)`
      )
    }
    if (filters.kategori_id && filters.kategori_id !== 'ALL') {
      params.push(`kategori_id=eq.${filters.kategori_id}`)
    }
    if (filters.status && filters.status !== 'ALL') {
      params.push(`status=eq.${encodeURIComponent(filters.status)}`)
    }
    if (filters.lokasi_id && filters.lokasi_id !== 'ALL') {
      params.push(`lokasi_id=eq.${filters.lokasi_id}`)
    }

    const data = await apiClient.get(`/rest/v1/inventaris_barang?${params.join('&')}`)
    return { success: true, data: Array.isArray(data) ? data : [], offline: false }
  }

  async createAlat(payload) {
    const body = {
      ...payload,
      qr_code_value: payload.qr_code_value || `SIPAW:${payload.kode_inventaris}`,
      jumlah_tersedia: payload.jumlah_tersedia ?? payload.jumlah_total
    }
    const res = await apiClient.post('/rest/v1/inventaris_barang', body, {
      headers: { Prefer: 'return=representation' }
    })
    return Array.isArray(res) ? res[0] : res
  }

  async updateAlat(id, payload) {
    const res = await apiClient.patch(
      `/rest/v1/inventaris_barang?id=eq.${id}`,
      { ...payload, updated_at: new Date().toISOString() },
      { headers: { Prefer: 'return=representation' } }
    )
    return Array.isArray(res) ? res[0] : res
  }

  async deleteAlat(id) {
    await apiClient.delete(`/rest/v1/inventaris_barang?id=eq.${id}`)
    return { success: true }
  }

  // Riwayat Penggunaan, Kerusakan & Perawatan per Alat (Fitur 10)
  async getRiwayatAlat(barangId) {
    const [pinjam, ba, perawatan] = await Promise.all([
      apiClient.get(
        `/rest/v1/detail_peminjaman?barang_id=eq.${barangId}&select=*,peminjaman(*,users(nama,nia))`
      ),
      apiClient.get(`/rest/v1/berita_acara?barang_id=eq.${barangId}&select=*,users(nama,nia)`),
      apiClient.get(`/rest/v1/perawatan_barang?barang_id=eq.${barangId}&select=*&order=tanggal_mulai.desc`)
    ])
    return {
      peminjaman: Array.isArray(pinjam) ? pinjam : [],
      beritaAcara: Array.isArray(ba) ? ba : [],
      perawatan: Array.isArray(perawatan) ? perawatan : []
    }
  }
}

export default new AlatService()
