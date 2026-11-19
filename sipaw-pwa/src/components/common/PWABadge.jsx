import { useState, useEffect } from 'react'
import { Download, WifiOff, X } from 'lucide-react'

export default function PWABadge() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (dismissed) return null

  if (isOffline) {
    return (
      <aside className="pwa-badge pwa-badge--offline">
        <WifiOff size={16} />
        <span>Mode Offline: Menampilkan data inventaris dari cache lokal perangkat.</span>
      </aside>
    )
  }

  if (installPrompt) {
    return (
      <aside className="pwa-badge">
        <Download size={16} />
        <span>Install <strong>SIPAW WAPEALA</strong> di ponsel/desktop untuk akses cepat.</span>
        <button
          type="button"
          className="button primary"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={async () => {
            installPrompt.prompt()
            await installPrompt.userChoice
            setInstallPrompt(null)
          }}
        >
          Install
        </button>
        <button type="button" className="icon-button" style={{ width: 26, height: 26 }} onClick={() => setDismissed(true)}>
          <X size={14} />
        </button>
      </aside>
    )
  }

  return null
}
