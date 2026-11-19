import {
  TentTree,
  LayoutDashboard,
  Boxes,
  History,
  Wrench,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  PackageCheck,
  X
} from 'lucide-react'

export default function Sidebar({
  user,
  activeTab,
  onTab,
  activeLoansCount = 0,
  mobileOpen,
  onCloseMobile,
  onLogout
}) {
  const isPengurus = user?.role === 'super_admin' || user?.role === 'pengurus_logistik'

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventaris', label: 'Inventaris', icon: Boxes },
    { id: 'peminjaman', label: 'Peminjaman', icon: History, badge: activeLoansCount > 0 ? activeLoansCount : null },
    { id: 'operasional', label: 'Operasional', icon: Wrench },
    ...(isPengurus ? [{ id: 'habis_pakai', label: 'Habis Pakai', icon: PackageCheck }] : []),
    { id: 'laporan', label: 'Laporan & Analitik', icon: BarChart3 }
  ]

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase() || 'WP'
  }

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand" onClick={() => { onTab('dashboard'); onCloseMobile?.() }} style={{ cursor: 'pointer' }}>
            <div className="brand-mark">
              <TentTree size={24} strokeWidth={1.8} />
            </div>
            <div>
              <b>SIPAW</b>
              <span>WAPEALA UNDIP</span>
            </div>
          </div>
          <button type="button" className="mobile-close" onClick={onCloseMobile}>
            <X size={18} />
          </button>
        </div>

        <nav>
          <span className="nav-label">MENU UTAMA</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => {
                onTab(item.id)
                onCloseMobile?.()
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && <b className="nav-badge">{item.badge}</b>}
            </button>
          ))}

          {isPengurus && (
            <>
              <span className="nav-label second">SISTEM</span>
              <button
                type="button"
                className={activeTab === 'pengaturan' ? 'active' : ''}
                onClick={() => {
                  onTab('pengaturan')
                  onCloseMobile?.()
                }}
              >
                <Settings size={18} />
                <span>Pengaturan</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-card">
          <div>
            <ShieldCheck size={18} />
            <b>{isPengurus ? 'Mode Pengurus' : 'Mode Anggota'}</b>
          </div>
          <p>{isPengurus ? 'Akses penuh modul inventaris & logistik aktif.' : 'Peminjaman dan riwayat operasional anggota.'}</p>
        </div>

        <div className="profile">
          <div className="avatar">{getInitials(user?.nama)}</div>
          <div>
            <b>{user?.nama || 'Anggota WAPEALA'}</b>
            <span>{user?.role ? user.role.replace('_', ' ') : 'Anggota'}</span>
          </div>
          <button type="button" onClick={onLogout} title="Keluar dari akun">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="mobile-overlay" onClick={onCloseMobile} />}
    </>
  )
}
