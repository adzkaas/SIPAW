import { useState, useMemo } from 'react'
import authService from './services/authService'
import { useAlat } from './hooks/useAlat'
import { usePeminjaman } from './hooks/usePeminjaman'
import { useOperasional } from './hooks/useOperasional'
import { useSistem } from './hooks/useSistem'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Footer from './components/Footer'
import PWABadge from './components/common/PWABadge'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventarisPage from './pages/InventarisPage'
import FormAlatPage from './pages/FormAlatPage'
import PeminjamanPage from './pages/PeminjamanPage'
import OperasionalPage from './pages/OperasionalPage'
import HabisPakaiPage from './pages/HabisPakaiPage'
import LaporanAnalitikPage from './pages/LaporanAnalitikPage'
import AdminSistemPage from './pages/AdminSistemPage'

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [formAlatMode, setFormAlatMode] = useState({ open: false, data: null })
  const [globalSearch, setGlobalSearch] = useState('')

  const isAnggota = user?.role === 'anggota'

  // Data Hooks
  const { alatList, kategoriList, lokasiList, refetch: refetchAlat } = useAlat()
  const { peminjamanList, bookingList, refetch: refetchPinjam } = usePeminjaman(
    isAnggota ? user?.id : null
  )
  const {
    beritaAcara,
    perawatan,
    stockOpname,
    habisPakai,
    logHabisPakai,
    refetch: refetchOps
  } = useOperasional()
  const { notifikasi, auditLogs, pengaturan, refetch: refetchSistem } = useSistem(user?.id)

  const refreshAll = () => {
    refetchAlat()
    refetchPinjam()
    refetchOps()
    refetchSistem()
  }

  // Active loans count for badge
  const activeLoansCount = useMemo(() => {
    return peminjamanList.filter((p) => p.status === 'Dipinjam' || p.status === 'Menunggu').length
  }, [peminjamanList])

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    inventaris: 'Inventaris Peralatan',
    peminjaman: 'Peminjaman & Kembali',
    operasional: 'Operasional Logistik',
    habis_pakai: 'Barang Habis Pakai',
    laporan: 'Laporan & Analitik',
    pengaturan: 'Pengaturan Sistem'
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTab={(t) => {
          setActiveTab(t)
          setFormAlatMode({ open: false, data: null })
        }}
        activeLoansCount={activeLoansCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => {
          authService.logout()
          setUser(null)
        }}
      />

      <div className="content-shell">
        <Topbar
          title={formAlatMode.open ? 'Formulir Inventaris' : pageTitles[activeTab] || 'SIPAW'}
          dark={dark}
          onToggleDark={() => setDark(!dark)}
          onOpenMobile={() => setMobileOpen(true)}
          onNewLoan={() => {
            setActiveTab('peminjaman')
            setFormAlatMode({ open: false, data: null })
          }}
          notifikasi={notifikasi}
          onRefreshNotif={refetchSistem}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        <main>
          {formAlatMode.open ? (
            <FormAlatPage
              editData={formAlatMode.data}
              kategoriList={kategoriList}
              lokasiList={lokasiList}
              onBack={() => setFormAlatMode({ open: false, data: null })}
              onSuccess={() => {
                setFormAlatMode({ open: false, data: null })
                refreshAll()
              }}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  user={user}
                  alatList={alatList}
                  peminjamanList={peminjamanList}
                  notifikasi={notifikasi}
                  auditLogs={auditLogs}
                  habisPakai={habisPakai}
                  onNavigate={(t) => {
                    setActiveTab(t)
                    setFormAlatMode({ open: false, data: null })
                  }}
                  onNewLoan={() => setActiveTab('peminjaman')}
                  onOpenScan={() => setActiveTab('inventaris')}
                />
              )}

              {activeTab === 'inventaris' && (
                <InventarisPage
                  user={user}
                  alatList={alatList}
                  kategoriList={kategoriList}
                  lokasiList={lokasiList}
                  onOpenForm={(data) => setFormAlatMode({ open: true, data })}
                  onRefresh={refreshAll}
                />
              )}

              {activeTab === 'peminjaman' && (
                <PeminjamanPage
                  user={user}
                  alatList={alatList}
                  peminjamanList={peminjamanList}
                  bookingList={bookingList}
                  pengaturan={pengaturan}
                  onRefresh={refreshAll}
                />
              )}

              {activeTab === 'operasional' && (
                <OperasionalPage
                  user={user}
                  alatList={alatList}
                  beritaAcara={beritaAcara}
                  perawatan={perawatan}
                  stockOpname={stockOpname}
                  onRefresh={refreshAll}
                />
              )}

              {activeTab === 'habis_pakai' && (
                <HabisPakaiPage
                  habisPakai={habisPakai}
                  logHabisPakai={logHabisPakai}
                  onRefresh={refreshAll}
                />
              )}

              {activeTab === 'laporan' && (
                <LaporanAnalitikPage
                  alatList={alatList}
                  peminjamanList={peminjamanList}
                  beritaAcara={beritaAcara}
                  perawatan={perawatan}
                  stockOpname={stockOpname}
                />
              )}

              {activeTab === 'pengaturan' && (
                <AdminSistemPage
                  kategoriList={kategoriList}
                  lokasiList={lokasiList}
                  pengaturan={pengaturan}
                  auditLogs={auditLogs}
                  onRefresh={refreshAll}
                />
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      <PWABadge />
    </div>
  )
}
