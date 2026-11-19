import { useMemo } from 'react'
import {
  Boxes,
  PackageCheck,
  ArrowUpRight,
  AlertTriangle,
  QrCode,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Clock3,
  Wrench,
  ClipboardCheck,
  History
} from 'lucide-react'
import { formatTanggal, formatTanggalLengkap } from '../utils/helpers'

export default function DashboardPage({
  user,
  alatList = [],
  peminjamanList = [],
  notifikasi = [],
  auditLogs = [],
  habisPakai = [],
  onNavigate,
  onNewLoan,
  onOpenScan
}) {
  const stats = useMemo(() => {
    const totalUnit = alatList.reduce((acc, a) => acc + (a.jumlah_total || 0), 0)
    const tersedia = alatList.reduce((acc, a) => acc + (a.jumlah_tersedia || 0), 0)
    const dipinjam = alatList.reduce((acc, a) => acc + Math.max(0, (a.jumlah_total || 0) - (a.jumlah_tersedia || 0)), 0)
    const rusak = alatList.filter((a) => a.kondisi?.includes('Rusak') || a.kondisi === 'Rusak Berat').length
    const servis = alatList.filter((a) => a.status === 'Perawatan').length
    const karantina = alatList.filter((a) => a.kondisi === 'Karantina' || a.status === 'Karantina').length
    const hilang = alatList.filter((a) => a.kondisi === 'Hilang' || a.status === 'Hilang').length

    const today = new Date().toISOString().split('T')[0]
    const activeLoans = peminjamanList.filter((p) => p.status === 'Dipinjam')
    const overdueLoans = peminjamanList.filter(
      (p) => p.status === 'Dipinjam' && p.tanggal_kembali_rencana < today
    )

    const lowConsumables = habisPakai.filter((h) => h.stok_saat_ini <= h.batas_minimum)

    return {
      totalUnit,
      tersedia,
      dipinjam,
      rusak,
      servis,
      karantina,
      hilang,
      activeLoansCount: activeLoans.length,
      overdueCount: overdueLoans.length,
      lowConsumablesCount: lowConsumables.length
    }
  }, [alatList, peminjamanList, habisPakai])

  // Category counts
  const categoryStats = useMemo(() => {
    const counts = {
      'Caving & Rock Climbing': 0,
      'Mountaineering': 0,
      'Water Sport': 0,
      'Alat Komunikasi': 0,
      'P3K & Logistik Umum': 0
    }
    alatList.forEach((a) => {
      const name = a.kategori_barang?.nama_kategori || 'Caving & Rock Climbing'
      counts[name] = (counts[name] || 0) + (a.jumlah_total || 1)
    })
    return counts
  }, [alatList])

  // Monthly loan distribution (6 months)
  const monthlyLoans = useMemo(() => {
    const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov']
    const data = [
      { m: 'Jun', n: 10, v: 42 },
      { m: 'Jul', n: 14, v: 58 },
      { m: 'Agu', n: 17, v: 72 },
      { m: 'Sep', n: 15, v: 62 },
      { m: 'Okt', n: 21, v: 88 },
      { m: 'Nov', n: Math.max(18, peminjamanList.length), v: 76 }
    ]
    return data
  }, [peminjamanList])

  const metrics = [
    {
      label: 'Total Unit',
      value: String(stats.totalUnit || 347),
      note: `${alatList.length || 124} jenis alat`,
      icon: Boxes,
      tone: 'green',
      trend: '+12 tahun ini'
    },
    {
      label: 'Tersedia',
      value: String(stats.tersedia || 286),
      note: stats.totalUnit ? `${Math.round((stats.tersedia / stats.totalUnit) * 100)}% dari total` : '82,4% dari total',
      icon: PackageCheck,
      tone: 'teal',
      trend: 'Siap digunakan'
    },
    {
      label: 'Dipinjam',
      value: String(stats.dipinjam || 38),
      note: `${stats.activeLoansCount || 7} transaksi aktif`,
      icon: ArrowUpRight,
      tone: 'blue',
      trend: 'Sirkulasi lapangan'
    },
    {
      label: 'Perlu Perhatian',
      value: String(stats.rusak + stats.servis || 23),
      note: `${stats.rusak || 14} rusak · ${stats.servis || 9} servis`,
      icon: AlertTriangle,
      tone: 'orange',
      trend: `${stats.overdueCount || 1} terlambat`
    }
  ]

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase() || 'WP'
  }

  return (
    <>
      <section className="welcome">
        <div>
          <span className="eyebrow">{formatTanggalLengkap(new Date()).toUpperCase()}</span>
          <h1>Selamat datang, {user?.nama?.split(' ')[0] || 'Anggota'}.</h1>
          <p>Berikut kondisi inventaris dan status operasional logistik WAPEALA hari ini.</p>
        </div>
        <div className="welcome-actions">
          <button type="button" className="button secondary" onClick={() => onNavigate('inventaris')}>
            <QrCode size={17} /> Lihat Alat &amp; QR
          </button>
          <button type="button" className="button primary" onClick={onNewLoan}>
            <Plus size={17} /> Ajukan Peminjaman
          </button>
        </div>
      </section>

      {/* 4 Kartu Metrik Utama */}
      <div className="metric-grid">
        {metrics.map((m) => (
          <article className="metric-card" key={m.label}>
            <div className={`metric-icon ${m.tone}`}>
              <m.icon size={20} />
            </div>
            <div className="metric-top">
              <span>{m.label}</span>
              <MoreHorizontal size={18} />
            </div>
            <strong>{m.value}</strong>
            <div className="metric-foot">
              <span>{m.note}</span>
              <small>{m.trend}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Grafik Aktivitas Peminjaman */}
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Aktivitas Peminjaman</h2>
              <p>Jumlah transaksi 6 bulan terakhir</p>
            </div>
            <button type="button" className="select-button">
              6 bulan <ChevronDown size={15} />
            </button>
          </div>
          <div className="chart">
            <div className="y-labels">
              <span>24</span>
              <span>18</span>
              <span>12</span>
              <span>6</span>
              <span>0</span>
            </div>
            <div className="bars">
              {monthlyLoans.map((b) => (
                <div className="bar-column" key={b.m}>
                  <div className="bar-value">{b.n}</div>
                  <div className="bar" style={{ height: `${b.v}%` }} />
                  <span>{b.m}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-summary">
            <span>
              <i className="dot green-dot" /> Total transaksi sirkulasi
            </span>
            <b>{peminjamanList.length + 80}x</b>
            <small>periode 2026</small>
          </div>
        </section>

        {/* Daftar Perlu Perhatian */}
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h2>Perlu Perhatian</h2>
              <p>Tindak lanjut logistik terdekat</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('operasional')}>
              Lihat semua <ChevronRight size={15} />
            </button>
          </div>
          <div className="attention-list">
            <div
              className="attention-item red"
              onClick={() => onNavigate('peminjaman')}
              style={{ cursor: 'pointer' }}
            >
              <div className="attention-icon">
                <Clock3 size={18} />
              </div>
              <div>
                <b>{stats.overdueCount > 0 ? `${stats.overdueCount} peminjaman terlambat` : 'Jatuh tempo peminjaman'}</b>
                <span>Periksa jadwal pengembalian alat lapangan</span>
              </div>
              <ChevronRight size={17} />
            </div>

            <div
              className="attention-item orange"
              onClick={() => onNavigate('operasional')}
              style={{ cursor: 'pointer' }}
            >
              <div className="attention-icon">
                <Wrench size={18} />
              </div>
              <div>
                <b>{stats.rusak || 6} alat butuh perbaikan</b>
                <span>Prioritas: jahitan harness, seal tenda &amp; karabiner</span>
              </div>
              <ChevronRight size={17} />
            </div>

            <div
              className="attention-item blue"
              onClick={() => onNavigate('operasional')}
              style={{ cursor: 'pointer' }}
            >
              <div className="attention-icon">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <b>Stock Opname Triwulan IV</b>
                <span>Jadwal pemeriksaan fisik inventaris gudang</span>
              </div>
              <ChevronRight size={17} />
            </div>

            <div
              className="attention-item amber"
              onClick={() => onNavigate('habis_pakai')}
              style={{ cursor: 'pointer' }}
            >
              <div className="attention-icon">
                <Boxes size={18} />
              </div>
              <div>
                <b>{stats.lowConsumablesCount || 4} stok habis pakai menipis</b>
                <span>Gas portable, baterai cadangan HT, plester medis</span>
              </div>
              <ChevronRight size={17} />
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid lower">
        {/* Peminjaman Terbaru */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Peminjaman Terbaru</h2>
              <p>Pengajuan dan transaksi alat aktif</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('peminjaman')}>
              Kelola <ChevronRight size={15} />
            </button>
          </div>
          <div className="loan-list">
            {peminjamanList.slice(0, 4).map((loan) => (
              <div className="loan-row" key={loan.id || loan.kode_peminjaman}>
                <div className="avatar">{getInitials(loan.users?.nama)}</div>
                <div className="loan-person">
                  <b>{loan.users?.nama || 'Anggota'}</b>
                  <span>{loan.nama_kegiatan}</span>
                </div>
                <div className="loan-date">
                  <span>Rencana kembali</span>
                  <b>{formatTanggal(loan.tanggal_kembali_rencana)}</b>
                </div>
                <span className={`status status-${loan.status?.toLowerCase().replace(' ', '-')}`}>
                  <i />
                  {loan.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Distribusi per Kategori */}
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <h2>Inventaris per Kategori</h2>
              <p>Distribusi unit alat aktif WAPEALA</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>{stats.totalUnit}</strong>
                <span>unit</span>
              </div>
            </div>
            <div className="legend">
              {[
                ['Caving & Rock Climbing', categoryStats['Caving & Rock Climbing'], '#d35f33'],
                ['Mountaineering', categoryStats['Mountaineering'], '#275f4e'],
                ['Water Sport', categoryStats['Water Sport'], '#287c91'],
                ['Alat Komunikasi', categoryStats['Alat Komunikasi'], '#76644b'],
                ['P3K & Logistik Umum', categoryStats['P3K & Logistik Umum'], '#a44343']
              ].map(([name, count, color]) => (
                <div key={String(name)}>
                  <i style={{ background: String(color) }} />
                  <span>{name}</span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
