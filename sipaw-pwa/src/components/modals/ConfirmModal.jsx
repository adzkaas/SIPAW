import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  danger = false,
  loading = false,
  children,
  onConfirm,
  onCancel
}) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: danger ? '#fee2e2' : '#e0f2fe',
                display: 'grid',
                placeItems: 'center',
                color: danger ? '#dc2626' : '#0369a1'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="eyebrow">SIPAW WAPEALA</span>
              <h2>{title}</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onCancel}>
            <X size={18} />
          </button>
        </header>

        {message && <p style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 16px' }}>{message}</p>}

        {children}

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={onCancel} disabled={loading}>
            Batal
          </button>
          <button
            type="button"
            className={`button ${danger ? 'danger-btn' : 'primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
