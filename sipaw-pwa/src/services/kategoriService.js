import { apiClient } from '../config/api'

class KategoriService {
  async getKategori() {
    const res = await apiClient.get('/rest/v1/kategori_barang?select=*&order=id.asc')
    return Array.isArray(res) ? res : []
  }

  async createKategori(payload) {
    const res = await apiClient.post('/rest/v1/kategori_barang', payload, {
      headers: { Prefer: 'return=representation' }
    })
    return Array.isArray(res) ? res[0] : res
  }

  async updateKategori(id, payload) {
    return apiClient.patch(`/rest/v1/kategori_barang?id=eq.${id}`, payload)
  }

  async deleteKategori(id) {
    return apiClient.delete(`/rest/v1/kategori_barang?id=eq.${id}`)
  }

  async getLokasi() {
    const res = await apiClient.get('/rest/v1/lokasi_penyimpanan?select=*&order=id.asc')
    return Array.isArray(res) ? res : []
  }

  async createLokasi(payload) {
    const res = await apiClient.post('/rest/v1/lokasi_penyimpanan', payload, {
      headers: { Prefer: 'return=representation' }
    })
    return Array.isArray(res) ? res[0] : res
  }
}

export default new KategoriService()
