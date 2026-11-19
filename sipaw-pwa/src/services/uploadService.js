import axios from 'axios'
import { BASE_URL, SUPABASE_KEY, IS_SUPABASE } from '../config/api'

class UploadService {
  async uploadImage(file, folder = 'inventaris') {
    if (!file) throw new Error('File gambar tidak ditemukan.')
    if (file.size > 6 * 1024 * 1024) throw new Error('Ukuran file maksimal 6MB.')

    if (IS_SUPABASE && SUPABASE_KEY) {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      const bucket = 'sipaw-assets'
      try {
        await axios.post(`${BASE_URL}/storage/v1/object/${bucket}/${fileName}`, file, {
          headers: {
            'Content-Type': file.type,
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        })
        return `${BASE_URL}/storage/v1/object/public/${bucket}/${fileName}`
      } catch {
        // Fallback Base64 jika bucket storage belum dibuat atau offline
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }
    }
    return '/placeholder-alat.svg'
  }
}

export default new UploadService()
