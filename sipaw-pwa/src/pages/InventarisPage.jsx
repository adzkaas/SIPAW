import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Menu,
  Boxes,
  ArrowDownToLine,
  TentTree,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  QrCode
} from 'lucide-react'
import DetailAlatModal from '../components/modals/DetailAlatModal'
import ConfirmModal from '../components/modals/ConfirmModal'
import alatService from '../services/alatService'
import { exportLaporanExcel, exportLaporanPDF } from '../utils/exportUtils'
import { getCategoryColor } from '../utils/helpers'

export default function InventarisPage({
  user,
  alatList = [],
  kategoriList = [],
  lokasiList = [],
  onOpenForm,
  onRefresh
}) {
  const isPengurus = user?.role === 'super_admin' || user?.role === 'pengurus_logistik'

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua kategori')
  const [selectedStatus, setSelectedStatus] = useState('Semua status')
  const [view, setView] = useState('table') // 'table' | 'grid'
  const [activeDetailAlat, setActiveDetailAlat] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filteredAlat = useMemo(() => {
    return alatList.filter((item) => {
      const matchSearch =
        item.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
        item.kode_inventaris.toLowerCase().includes(search.toLowerCase()) ||
        (item.merk || '').toLowerCase().includes(search.toLowerCase())

      const catName = item.kategori_barang?.nama_kategori || ''
      const matchCategory =
        selectedCategory === 'Semua kategori' || catName === selectedCategory

      const matchStatus =
        selectedStatus === 'Semua status' || item.status === selectedStatus

      return matchSearch && matchCategory && matchStatus
    })
  }, [alatList, search, selectedCategory, selectedStatus])

  const miniStats = useMemo(() => {
    const totalJenis = alatList.length
    const totalUnit = alatList.reduce((acc, a) => acc + (a.jumlah_total || 0), 0)
    const baik = alatList.filter((a) => a.kondisi === 'Baik').length
    const perbaikan = alatList.filter((a) => a.kondisi?.includes('Rusak') || a.status === 'Perawatan').length
    const karantina = alatList.filter((a) => a.kondisi === 'Karantina' || a.status === 'Karantina').length

    return { totalJenis, totalUnit, baik, perbaikan, karantina }
  }, [alatList])

  const categories = ['Semua kategori', ...kategoriList.map((k) => k.nama_kategori)]

  const handleExport = (format) => {
    const rows = filteredAlat.map((a) => ({
      Kode: a.kode_inventaris,
      Nama: a.nama_barang,
      Kategori: a.kategori_barang?.nama_kategori || '-',
      Merk: a.merk || '-',
      Tipe: a.tipe_model || '-',
      Tersedia: a.jumlah_tersedia,
      Total: a.jumlah_total,
      Kondisi: a.kondisi,
      Status: a.status,
      Lokasi: a.lokasi_penyimpanan?.nama_lokasi || '-'
    }))
    if (format === 'EXCEL') {
      exportLaporanExcel('Inventaris', rows, 'Inventaris_WAPEALA.xlsx')
    } else {
      exportLaporanPDF('Inventaris Peralatan', Object.keys(rows[0] || {}), rows.map(Object.values), 'Inventaris_WAPEALA.pdf')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await alatService.deleteAlat(deleteTarget.id, deleteTarget.nama_barang)
      setDeleteTarget(null)
      onRefresh?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">DATA MASTER · PERIODE 2026</span>
          <h1>Inventaris Peralatan</h1>
          <p>Kelola data, kondisi, lokasi, dan ketersediaan seluruh alat WAPEALA.</p>
        </div>
        {isPengurus && (
          <button type="button" className="button primary" onClick={() => onOpenForm(null)}>
            <Plus size={17} /> Tambah Alat
          </button>
        )}
      </section>

      {/* Mini Stats Banner */}
      <div className="mini-stats">
        <div>
          <span>Total jenis alat</span>
          <strong>{miniStats.totalJenis}</strong>
          <small>{miniStats.totalUnit} unit tercatat</small>
        </div>
        <div>
          <span>Kondisi baik</span>
          <strong>{miniStats.baik}</strong>
          <small className="positive">
            {miniStats.totalJenis ? `${Math.round((miniStats.baik / miniStats.totalJenis) * 100)}% inventaris` : '-'}
          </small>
        </div>
        <div>
          <span>Perlu perbaikan</span>
          <strong>{miniStats.perbaikan}</strong>
          <small>Prioritas penanganan</small>
        </div>
        <div>
          <span>Karantina / Rusak</span>
          <strong>{miniStats.karantina}</strong>
          <small>Tidak dapat dipinjam</small>
        </div>
      </div>

      <section className="panel inventory-panel">
        <div className="toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode inventaris..."
            />
          </div>

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {['Semua status', 'Tersedia', 'Dipinjam', 'Perawatan', 'Karantina', 'Hilang'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="view-switch">
            <button
              type="button"
              className={view === 'table' ? 'active' : ''}
              onClick={() => setView('table')}
              title="Tampilan Tabel"
            >
              <Menu size={16} />
            </button>
            <button
              type="button"
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              title="Tampilan Kartu"
            >
              <Boxes size={16} />
            </button>
          </div>
        </div>

        <div className="result-line">
          <span>
            Menampilkan <b>{filteredAlat.length}</b> dari {alatList.length} jenis alat
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => handleExport('EXCEL')}>
              <ArrowDownToLine size={14} /> Export Excel
            </button>
            <button type="button" onClick={() => handleExport('PDF')}>
              <ArrowDownToLine size={14} /> Export PDF
            </button>
          </div>
        </div>

        {view === 'table' ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Kondisi</th>
                  <th>Status</th>
                  <th>Lokasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlat.map((item) => (
                  <tr key={item.id || item.kode_inventaris}>
                    <td>
                      <div className="item-name">
                        <div className="item-thumb rope">
                          <TentTree size={20} />
                        </div>
                        <div>
                          <b>{item.nama_barang}</b>
                          <span>
                            {item.kode_inventaris} {item.merk ? `· ${item.merk}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">
                        <i style={{ background: getCategoryColor(item.kategori_barang?.nama_kategori) }} />
                        {item.kategori_barang?.nama_kategori || 'Inventaris'}
                      </span>
                    </td>
                    <td>
                      <b>{item.jumlah_tersedia}</b>
                      <span className="muted"> / {item.jumlah_total} unit</span>
                    </td>
                    <td>
                      <span className={item.kondisi === 'Baik' ? 'condition-good' : 'condition-warn'}>
                        {item.kondisi}
                      </span>
                    </td>
                    <td>
                      <span className={`status status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                        <i />
                        {item.status}
                      </span>
                    </td>
                    <td>{item.lokasi_penyimpanan?.nama_lokasi || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setActiveDetailAlat(item)}
                          title="Detail, QR & Riwayat Alat"
                        >
                          <Eye size={16} />
                        </button>
                        {isPengurus && (
                          <>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => onOpenForm(item)}
                              title="Edit Alat"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus Alat"
                            >
                              <Trash2 size={16} color="#dc2626" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredAlat.map((item) => (
              <article className="inventory-card" key={item.id || item.kode_inventaris}>
                <div className="inventory-visual rope">
                  <TentTree size={36} />
                  <span className={`status status-${item.status?.toLowerCase().replace(' ', '-')}`}>
                    <i />
                    {item.status}
                  </span>
                </div>
                <span className="eyebrow">{item.kode_inventaris}</span>
                <h3>{item.nama_barang}</h3>
                <p>{item.merk} {item.tipe_model ? `· ${item.tipe_model}` : ''}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>Tersedia</span>
                    <b>{item.jumlah_tersedia} / {item.jumlah_total} unit</b>
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setActiveDetailAlat(item)}
                  >
                    <QrCode size={13} /> Detail
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal Detail Alat & QR Code */}
      {activeDetailAlat && (
        <DetailAlatModal alat={activeDetailAlat} onClose={() => setActiveDetailAlat(null)} />
      )}

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Data Inventaris"
        message={`Hapus alat "${deleteTarget?.nama_barang}" (${deleteTarget?.kode_inventaris}) secara permanen?`}
        confirmLabel="Hapus Permanen"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
