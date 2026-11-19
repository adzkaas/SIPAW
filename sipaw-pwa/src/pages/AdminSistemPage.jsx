import { useState, useEffect } from 'react'
import {
  Users,
  Settings,
  ShieldCheck,
  FileBarChart,
  Boxes,
  Database,
  Plus,
  RefreshCw,
  KeyRound
} from 'lucide-react'
import authService from '../services/authService'
import kategoriService from '../services/kategoriService'
import logistikExtraService from '../services/logistikExtraService'
import { formatTanggal, formatRupiah } from '../utils/helpers'

export default function AdminSistemPage({
  kategoriList = [],
  lokasiList = [],
  pengaturan,
  auditLogs = [],
  onRefresh
}) {
  const [users, setUsers] = useState([])
  const [cfg, setCfg] = useState(pengaturan || { maks_hari_pinjam: 7, denda_per_hari: 10000, nama_organisasi: 'WAPEALA UNDIP' })
  const [namaKat, setNamaKat] = useState('')
  const [prefixKat, setPrefixKat] = useState('')
  const [namaLok, setNamaLok] = useState('')
  const [ketLok, setKetLok] = useState('')
  const [savingCfg, setSavingCfg] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  useEffect(() => {
    authService.getAllUsers().then(setUsers).catch(() => {})
  }, [])

  const handleSavePengaturan = async (e) => {
    e.preventDefault()
    setSavingCfg(true)
    try {
      await logistikExtraService.updatePengaturan({
        nama_organisasi: cfg.nama_organisasi,
        maks_hari_pinjam: Number(cfg.maks_hari_pinjam),
        denda_per_hari: Number(cfg.denda_per_hari)
      })
      alert('Pengaturan kebijakan SIPAW berhasil diperbarui!')
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSavingCfg(false)
    }
  }

  const handleBackupJSON = async () => {
    setBackingUp(true)
    try {
      const data = await logistikExtraService.backupDatabaseJSON()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SIPAW_WAPEALA_Backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">ADMINISTRASI &amp; MASTER DATA</span>
          <h1>Pengaturan Sistem</h1>
          <p>Kelola pengguna, kebijakan peminjaman, tarif denda, master kategori &amp; lokasi, serta audit log.</p>
        </div>
        <button type="button" className="button secondary" onClick={handleBackupJSON} disabled={backingUp}>
          <Database size={16} /> {backingUp ? 'Mengekspor...' : 'Backup Database (.JSON)'}
        </button>
      </section>

      {/* Fitur 16: Kebijakan Peminjaman & Denda */}
      <form className="panel form-panel" onSubmit={handleSavePengaturan}>
        <div className="panel-heading">
          <div>
            <h2>Kebijakan Peminjaman &amp; Denda Otomatis</h2>
            <p>Aturan batas maksimal lama hari peminjaman dan tarif denda per hari keterlambatan.</p>
          </div>
        </div>

        <div className="form-grid-3">
          <label>
            Nama Organisasi
            <input
              value={cfg.nama_organisasi || ''}
              onChange={(e) => setCfg({ ...cfg, nama_organisasi: e.target.value })}
            />
          </label>

          <label>
            Maksimal Lama Peminjaman (Hari)
            <input
              type="number"
              min="1"
              value={cfg.maks_hari_pinjam || 7}
              onChange={(e) => setCfg({ ...cfg, maks_hari_pinjam: e.target.value })}
            />
          </label>

          <label>
            Tarif Denda Terlambat / Hari (Rp)
            <input
              type="number"
              min="0"
              value={cfg.denda_per_hari || 10000}
              onChange={(e) => setCfg({ ...cfg, denda_per_hari: e.target.value })}
            />
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button type="submit" className="button primary" disabled={savingCfg}>
            {savingCfg ? 'Menyimpan...' : 'Simpan Perubahan Kebijakan'}
          </button>
        </div>
      </form>

      {/* Fitur 3 & 16: Master Kategori & Master Lokasi */}
      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        {/* Master Kategori */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Master Kategori ({kategoriList.length})</h2>
              <p>Pengelompokan divisi peralatan WAPEALA</p>
            </div>
          </div>

          <form
            style={{ display: 'flex', gap: 8, marginBottom: 14 }}
            onSubmit={async (e) => {
              e.preventDefault()
              await kategoriService.createKategori({ nama_kategori: namaKat, kode_prefix: prefixKat })
              setNamaKat('')
              setPrefixKat('')
              onRefresh?.()
            }}
          >
            <input
              required
              placeholder="Nama Kategori Baru"
              value={namaKat}
              onChange={(e) => setNamaKat(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              required
              placeholder="Prefix (mis: RC)"
              value={prefixKat}
              onChange={(e) => setPrefixKat(e.target.value)}
              style={{ width: 100 }}
            />
            <button type="submit" className="button primary" style={{ padding: '6px 12px' }}>
              <Plus size={15} />
            </button>
          </form>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Kategori</th>
                  <th>Deskripsi Alat</th>
                </tr>
              </thead>
              <tbody>
                {kategoriList.map((k) => (
                  <tr key={k.id}>
                    <td><b>[{k.kode_prefix}]</b></td>
                    <td>{k.nama_kategori}</td>
                    <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{k.deskripsi || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Master Lokasi */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Master Lokasi Penyimpanan ({lokasiList.length})</h2>
              <p>Gudang dan titik penyimpanan fisik alat</p>
            </div>
          </div>

          <form
            style={{ display: 'flex', gap: 8, marginBottom: 14 }}
            onSubmit={async (e) => {
              e.preventDefault()
              await kategoriService.createLokasi({ nama_lokasi: namaLok, keterangan: ketLok })
              setNamaLok('')
              setKetLok('')
              onRefresh?.()
            }}
          >
            <input
              required
              placeholder="Nama Lokasi / Gudang"
              value={namaLok}
              onChange={(e) => setNamaLok(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              placeholder="Keterangan"
              value={ketLok}
              onChange={(e) => setKetLok(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="button primary" style={{ padding: '6px 12px' }}>
              <Plus size={15} />
            </button>
          </form>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Lokasi Gudang</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {lokasiList.map((l) => (
                  <tr key={l.id}>
                    <td><b>{l.nama_lokasi}</b></td>
                    <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{l.keterangan || '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Fitur 12: Manajemen Pengguna & Hak Akses Role */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-heading">
          <div>
            <h2>Manajemen Pengguna &amp; Hak Akses Role</h2>
            <p>Atur otorisasi Super Admin, Pengurus Logistik, dan Anggota WAPEALA.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nomor Induk (NIA)</th>
                <th>Nama Anggota</th>
                <th>Email Akun</th>
                <th>Hak Akses (Role)</th>
                <th>Aksi Akun</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.nia}</b></td>
                  <td>{u.nama}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        await authService.updateUser(u.id, { role: e.target.value })
                        setUsers(await authService.getAllUsers())
                      }}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="pengurus_logistik">Pengurus Logistik</option>
                      <option value="anggota">Anggota</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={async () => {
                        await authService.updateUser(u.id, { password_hash: 'wapeala2026' })
                        alert(`Password ${u.nama} berhasil direset menjadi: wapeala2026`)
                      }}
                    >
                      <KeyRound size={12} /> Reset Sandi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fitur 15: Audit Log Aktivitas Sistem */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-heading">
          <div>
            <h2>Audit Log Aktivitas Sistem</h2>
            <p>Catatan kronologis perubahan data, login, dan aksi pengguna dalam SIPAW.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Waktu Kejadian</th>
                <th>Pengguna</th>
                <th>Aksi</th>
                <th>Modul</th>
                <th>Detail Informasi</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                  <td><b>{log.nama_user || 'System'}</b></td>
                  <td>
                    <span className="status status-tersedia" style={{ fontSize: 10 }}>
                      {log.aksi}
                    </span>
                  </td>
                  <td>{log.modul}</td>
                  <td><span style={{ fontSize: 12 }}>{log.detail}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
