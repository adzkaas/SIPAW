import { useState } from 'react'
import { Menu, Search, Sun, Moon, Bell, Check, Plus, X } from 'lucide-react'
import { formatTanggal } from '../utils/helpers'
import logistikExtraService from '../services/logistikExtraService'

export default function Topbar({
  title = 'Dashboard',
  dark,
  onToggleDark,
  onOpenMobile,
  onNewLoan,
  notifikasi = [],
  onRefreshNotif,
  searchQuery,
  onSearchChange
}) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const unreadCount = notifikasi.filter((n) => !n.is_read).length

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="mobile-menu" onClick={onOpenMobile}>
          <Menu size={21} />
        </button>
        <span>{title}</span>
        <i />
        <small>Periode 2026</small>
      </div>

      <div className="topbar-actions">
        <div className="global-search">
          <Search size={16} />
          <input
            placeholder="Cari alat, kode, atau peminjam..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          <kbd>Ctrl+K</kbd>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onToggleDark}
          title={dark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-button notification"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            title="Notifikasi Sistem"
          >
            <Bell size={18} />
            {unreadCount > 0 && <i />}
          </button>

          {showNotifDropdown && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <div>
                  <b>Notifikasi Logistik</b>
                  <span>{unreadCount} belum dibaca</span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: 24, height: 24 }}
                  onClick={() => setShowNotifDropdown(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="notif-dropdown-list">
                {notifikasi.length === 0 ? (
                  <p className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    Tidak ada notifikasi baru.
                  </p>
                ) : (
                  notifikasi.slice(0, 7).map((n) => (
                    <div key={n.id} className={`notif-dropdown-item ${n.is_read ? 'read' : 'unread'}`}>
                      <div>
                        <b>{n.judul}</b>
                        <p>{n.pesan}</p>
                        <small>{formatTanggal(n.created_at)}</small>
                      </div>
                      {!n.is_read && (
                        <button
                          type="button"
                          className="icon-button"
                          style={{ width: 26, height: 26 }}
                          title="Tandai dibaca"
                          onClick={async () => {
                            await logistikExtraService.tandaiDibaca(n.id)
                            onRefreshNotif?.()
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {onNewLoan && (
          <button type="button" className="button primary" onClick={onNewLoan} style={{ padding: '7px 14px' }}>
            <Plus size={16} /> Pinjam Alat
          </button>
        )}
      </div>
    </header>
  )
}
