import { apiClient } from '../config/api'

const SESSION_KEY = 'sipaw_current_user'

class AuthService {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async login(email, password) {
    const users = await apiClient.get(
      `/rest/v1/users?email=eq.${encodeURIComponent(email)}&password_hash=eq.${encodeURIComponent(password)}&is_active=eq.true&select=*`
    )
    if (Array.isArray(users) && users.length > 0) {
      const user = users[0]
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      await this.catatAudit(user, 'LOGIN', 'Autentikasi', `User ${user.nama} (${user.role}) masuk ke sistem`)
      return { success: true, data: user }
    }
    throw new Error('Email atau password salah, atau akun dinonaktifkan di Supabase.')
  }

  logout() {
    localStorage.removeItem(SESSION_KEY)
  }

  setCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }

  async getAllUsers() {
    const res = await apiClient.get('/rest/v1/users?select=*&order=created_at.desc')
    return Array.isArray(res) ? res : []
  }

  async createUser(payload) {
    const res = await apiClient.post('/rest/v1/users', payload, {
      headers: { Prefer: 'return=representation' }
    })
    return Array.isArray(res) ? res[0] : res
  }

  async updateUser(id, payload) {
    const res = await apiClient.patch(`/rest/v1/users?id=eq.${id}`, payload, {
      headers: { Prefer: 'return=representation' }
    })
    return Array.isArray(res) ? res[0] : res
  }

  async catatAudit(user, aksi, modul, detail) {
    try {
      await apiClient.post('/rest/v1/audit_log', {
        user_id: user?.id || null,
        nama_user: user?.nama || 'System Logistik',
        aksi,
        modul,
        detail
      })
    } catch {
      // Ignore
    }
  }
}

export default new AuthService()
