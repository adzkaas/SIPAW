import { useState } from 'react'
import { TentTree, LogIn, AlertCircle } from 'lucide-react'
import authService from '../services/authService'

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('logistik@wapeala.or.id')
  const [password, setPassword] = useState('logistik123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setLoading(true)
      const res = await authService.login(email, password)
      if (res.success) onLoginSuccess(res.data)
    } catch (err) {
      setError(err.message || 'Login gagal, periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-header">
          <div className="brand-mark" style={{ width: 48, height: 48, margin: '0 auto 14px' }}>
            <TentTree size={28} strokeWidth={1.8} />
          </div>
          <h1>SIPAW WAPEALA</h1>
          <p>Sistem Peminjaman &amp; Inventaris Alat — Universitas Diponegoro</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email Akun WAPEALA
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@wapeala.or.id"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="button primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            <LogIn size={17} />
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="demo-section">
          <span>Pilih Akun Demo (Klik untuk isi cepat):</span>
          <div className="demo-chips">
            <button
              type="button"
              className={email === 'admin@wapeala.or.id' ? 'demo-chip active' : 'demo-chip'}
              onClick={() => setDemoAccount('admin@wapeala.or.id', 'admin123')}
            >
              Super Admin
            </button>
            <button
              type="button"
              className={email === 'logistik@wapeala.or.id' ? 'demo-chip active' : 'demo-chip'}
              onClick={() => setDemoAccount('logistik@wapeala.or.id', 'logistik123')}
            >
              Pengurus Logistik
            </button>
            <button
              type="button"
              className={email === 'adzka@students.undip.ac.id' ? 'demo-chip active' : 'demo-chip'}
              onClick={() => setDemoAccount('adzka@students.undip.ac.id', 'anggota123')}
            >
              Anggota
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
