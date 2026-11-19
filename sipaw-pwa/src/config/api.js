import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://goahbbamamzckclebnkz.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''

const IS_SUPABASE = BASE_URL.includes('supabase.co') || Boolean(SUPABASE_KEY)

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 12000
})

apiClient.interceptors.request.use(
  (config) => {
    if (IS_SUPABASE && SUPABASE_KEY) {
      config.headers['apikey'] = SUPABASE_KEY
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${SUPABASE_KEY}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Terjadi kesalahan pada server.'
    if (error.response) {
      message =
        error.response.data?.message ||
        error.response.data?.details ||
        error.response.data?.hint ||
        `Server error (${error.response.status})`
    } else if (error.request) {
      message = 'Tidak dapat terhubung ke server database. Menggunakan data offline.'
    } else {
      message = error.message
    }
    return Promise.reject({ message, status: error.response?.status })
  }
)

export { apiClient, BASE_URL, SUPABASE_KEY, IS_SUPABASE }
