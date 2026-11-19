import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Check,
  X,
  RotateCcw,
  Calendar,
  UserCheck,
  History,
  AlertTriangle,
  Upload
} from 'lucide-react'
import peminjamanService from '../services/peminjamanService'
import beritaAcaraService from '../services/beritaAcaraService'
import uploadService from '../services/uploadService'
import ConfirmModal from '../components/modals/ConfirmModal'
import { formatTanggal, formatRupiah, hitungDendaKeterlambatan } from '../utils/helpers'

export default function PeminjamanPage({
  user,
  alatList = [],
  peminjamanList = [],
  bookingList = [],
  pengaturan,
  onRefresh
}) {
  const isPengurus = user?.role === 'super_admin' || user?.role === 'pengurus_logistik'
  const [activeSubTab, setActiveSubTab] = useState('transaksi') // 'transaksi' | 'ajukan' | 'booking' | 'riwayat_anggota'
  const [filterStatus, setFilterStatus] = useState('Semua')

  // Search
  const [search, setSearch] = useState('')

  // State Form Pengajuan Multi-Alat
  const [namaKegiatan, setNamaKegiatan] = useState('')
  const [tglPinjam, setTglPinjam] = useState(new Date().toISOString().split('T')[0])
  const [tglKembali, setTglKembali] = useState('')
  const [catatan, setCatatan] = useState('')
  const [keranjang, setKeranjang] = useState([])
  const [selectedBarangId, setSelectedBarangId] = useState('')
  const [qtyPinjam, setQtyPinjam] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // State Modal Penolakan & Pengembalian
  const [rejectTarget, setRejectTarget] = useState(null)
  const [alasanTolak, setAlasanTolak] = useState('')
  const [returnTarget, setReturnTarget] = useState(null)
  const [tglKembaliAktual, setTglKembaliAktual] = useState(new Date().toISOString().split('T')[0])
  const [checklistKembali, setChecklistKembali] = useState([])
  const [catatanRusak, setCatatanRusak] = useState('')
  const [fotoKembaliUrl, setFotoKembaliUrl] = useState('')
  const [processingReturn, setProcessingReturn] = useState(false)

  // State Booking Internal (Fitur 9)
  const [kegiatanBooking, setKegiatanBooking] = useState('')
  const [mulaiBooking, setMulaiBooking] = useState('')
  const [selesaiBooking, setSelesaiBooking] = useState('')

  const filteredPeminjaman = useMemo(() => {
    return peminjamanList.filter((p) => {
      const matchSearch =
        p.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) ||
        p.kode_peminjaman.toLowerCase().includes(search.toLowerCase()) ||
        (p.users?.nama || '').toLowerCase().includes(search.toLowerCase())

      const matchTab =
        filterStatus === 'Semua' || p.status === filterStatus

      return matchSearch && matchTab
    })
  }, [peminjamanList, search, filterStatus])

  const tambahKeKeranjang = () => {
    const barang = alatList.find((a) => a.id === selectedBarangId)
    if (!barang) return
    const requested = Number(qtyPinjam)
    if (requested > barang.jumlah_tersedia) {
      alert(`Stok ${barang.nama_barang} tersedia hanya ${barang.jumlah_tersedia} unit.`)
      return
    }

    setKeranjang((prev) => {
      const exists = prev.find((i) => i.barang_id === barang.id)
      if (exists) {
        return prev.map((i) =>
          i.barang_id === barang.id
            ? { ...i, jumlah: Math.min(barang.jumlah_tersedia, i.jumlah + requested) }
            : i
        )
      }
      return [
        ...prev,
        {
          barang_id: barang.id,
          nama_barang: barang.nama_barang,
          kode_inventaris: barang.kode_inventaris,
          jumlah: requested
        }
      ]
    })
    setSelectedBarangId('')
    setQtyPinjam(1)
  }

  const handleAjukan = async (e) => {
    e.preventDefault()
    if (keranjang.length === 0) {
      alert('Pilih minimal 1 jenis alat untuk diajukan.')
      return
    }
    setSubmitting(true)
    try {
      await peminjamanService.ajukanPeminjaman({
        user_id: user?.id,
        nama_kegiatan: namaKegiatan,
        tanggal_pinjam: tglPinjam,
        tanggal_kembali_rencana: tglKembali,
        catatan_peminjam: catatan,
        items: keranjang
      })
      alert('Pengajuan peminjaman berhasil dikirim ke pengurus logistik!')
      setKeranjang([])
      setNamaKegiatan('')
      setCatatan('')
      setActiveSubTab('transaksi')
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal mengajukan peminjaman.')
    } finally {
      setSubmitting(false)
    }
  }

  const bukaModalPengembalian = (pjm) => {
    setReturnTarget(pjm)
    setTglKembaliAktual(new Date().toISOString().split('T')[0])
    setChecklistKembali(
      (pjm.detail_peminjaman || []).map((d) => ({
        detail_id: d.id,
        barang_id: d.barang_id,
        nama_barang: d.inventaris_barang?.nama_barang || 'Alat',
        jumlah: d.jumlah,
        kondisi_kembali: 'Baik',
        catatan_item: ''
      }))
    )
  }

  const kalkulasiDenda = useMemo(() => {
    if (!returnTarget) return { hariTerlambat: 0, totalDenda: 0 }
    return hitungDendaKeterlambatan(
      returnTarget.tanggal_kembali_rencana,
      tglKembaliAktual,
      pengaturan?.denda_per_hari || 10000
    )
  }, [returnTarget, tglKembaliAktual, pengaturan])

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase() || 'WP'
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">SIRKULASI PERALATAN WAPEALA</span>
          <h1>Peminjaman &amp; Pengembalian</h1>
          <p>
            Validasi ketersediaan stok, persetujuan pengurus, konfirmasi pengembalian, dan denda keterlambatan (
            {formatRupiah(pengaturan?.denda_per_hari || 10000)}/hari).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={activeSubTab === 'transaksi' ? 'button primary' : 'button secondary'}
            onClick={() => setActiveSubTab('transaksi')}
          >
            Daftar Transaksi
          </button>
          <button
            type="button"
            className={activeSubTab === 'ajukan' ? 'button primary' : 'button secondary'}
            onClick={() => setActiveSubTab('ajukan')}
          >
            <Plus size={16} /> Ajukan Pinjam
          </button>
          <button
            type="button"
            className={activeSubTab === 'booking' ? 'button primary' : 'button secondary'}
            onClick={() => setActiveSubTab('booking')}
          >
            <Calendar size={16} /> Booking Internal
          </button>
          <button
            type="button"
            className={activeSubTab === 'riwayat_anggota' ? 'button primary' : 'button secondary'}
            onClick={() => setActiveSubTab('riwayat_anggota')}
          >
            <UserCheck size={16} /> Riwayat Anggota
          </button>
        </div>
      </section>

      {/* SUBTAB 1: DAFTAR TRANSAKSI & STATUS */}
      {activeSubTab === 'transaksi' && (
        <>
          <div className="tab-row">
            {['Semua', 'Menunggu', 'Disetujui', 'Dipinjam', 'Selesai'].map((st) => (
              <button
                key={st}
                type="button"
                className={filterStatus === st ? 'active' : ''}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <section className="panel loan-table">
            <div className="toolbar">
              <div className="search-field">
                <Search size={16} />
                <input
                  placeholder="Cari kode peminjaman, anggota, atau kegiatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Kode &amp; Peminjam</th>
                    <th>Kegiatan Lapangan</th>
                    <th>Jadwal Peminjaman</th>
                    <th>Peralatan</th>
                    <th>Status</th>
                    {isPengurus && <th>Aksi Pengurus</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPeminjaman.map((p) => {
                    const overdue = p.status === 'Dipinjam' && p.tanggal_kembali_rencana < new Date().toISOString().split('T')[0]
                    return (
                      <tr key={p.id || p.kode_peminjaman}>
                        <td>
                          <div className="person-cell">
                            <div className="avatar">{getInitials(p.users?.nama)}</div>
                            <div>
                              <b>{p.users?.nama || 'Anggota'}</b>
                              <span>{p.kode_peminjaman} · {p.users?.nia || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <b>{p.nama_kegiatan}</b>
                          {p.catatan_peminjam && <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{p.catatan_peminjam}</span>}
                        </td>
                        <td>
                          <span>{formatTanggal(p.tanggal_pinjam)}</span>
                          <span style={{ margin: '0 4px', color: 'var(--muted)' }}>s/d</span>
                          <b className={overdue ? 'danger-text' : ''}>{formatTanggal(p.tanggal_kembali_rencana)}</b>
                          {overdue && <span style={{ display: 'block', fontSize: 10, color: '#dc2626' }}>Terlambat</span>}
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>
                            {(p.detail_peminjaman || []).map((d) => (
                              <div key={d.id}>
                                • {d.inventaris_barang?.nama_barang || 'Alat'} (<b>{d.jumlah}x</b>)
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`status status-${p.status?.toLowerCase().replace(' ', '-')}`}>
                            <i />
                            {p.status}
                          </span>
                          {p.alasan_penolakan && (
                            <span style={{ display: 'block', fontSize: 11, color: '#dc2626', marginTop: 4 }}>
                              Alasan: {p.alasan_penolakan}
                            </span>
                          )}
                          {p.pengembalian?.[0]?.total_denda > 0 && (
                            <span style={{ display: 'block', fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                              Denda: {formatRupiah(p.pengembalian[0].total_denda)}
                            </span>
                          )}
                        </td>
                        {isPengurus && (
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {p.status === 'Menunggu' && (
                                <>
                                  <button
                                    type="button"
                                    className="button primary"
                                    style={{ padding: '5px 10px', fontSize: 12 }}
                                    onClick={async () => {
                                      await peminjamanService.updateStatusPeminjaman(p, 'Disetujui')
                                      onRefresh?.()
                                    }}
                                  >
                                    <Check size={14} /> Setujui
                                  </button>
                                  <button
                                    type="button"
                                    className="button secondary"
                                    style={{ padding: '5px 10px', fontSize: 12, borderColor: '#fca5a5', color: '#dc2626' }}
                                    onClick={() => setRejectTarget(p)}
                                  >
                                    <X size={14} /> Tolak
                                  </button>
                                </>
                              )}

                              {p.status === 'Disetujui' && (
                                <button
                                  type="button"
                                  className="button primary"
                                  style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={async () => {
                                    await peminjamanService.updateStatusPeminjaman(p, 'Dipinjam')
                                    onRefresh?.()
                                  }}
                                >
                                  Serahkan Alat
                                </button>
                              )}

                              {p.status === 'Dipinjam' && (
                                <button
                                  type="button"
                                  className="button secondary"
                                  style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={() => bukaModalPengembalian(p)}
                                >
                                  <RotateCcw size={14} /> Proses Kembali
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* SUBTAB 2: FORM PENGAJUAN MULTI-ALAT */}
      {activeSubTab === 'ajukan' && (
        <form className="panel form-panel" onSubmit={handleAjukan}>
          <div className="panel-heading">
            <div>
              <h2>Formulir Pengajuan Peminjaman Alat</h2>
              <p>Pilih perlengkapan ekspedisi dan tentukan estimasi waktu penggunaan.</p>
            </div>
          </div>

          <div className="form-grid-3">
            <label>
              Nama Kegiatan / Ekspedisi *
              <input
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Diklatsar 2026 / Simulasi Caving"
              />
            </label>

            <label>
              Tanggal Pinjam *
              <input
                required
                type="date"
                value={tglPinjam}
                onChange={(e) => setTglPinjam(e.target.value)}
              />
            </label>

            <label>
              Rencana Tanggal Kembali *
              <input
                required
                type="date"
                value={tglKembali}
                onChange={(e) => setTglKembali(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Pilih Peralatan (Validasi Stok Otomatis)
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedBarangId}
                onChange={(e) => setSelectedBarangId(e.target.value)}
                style={{ flex: 1, minWidth: 260 }}
              >
                <option value="">-- Pilih Alat dari Inventaris Tersedia --</option>
                {alatList
                  .filter((a) => a.jumlah_tersedia > 0 && a.status === 'Tersedia')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.kode_inventaris}] {a.nama_barang} (Tersedia: {a.jumlah_tersedia} unit)
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min="1"
                value={qtyPinjam}
                onChange={(e) => setQtyPinjam(e.target.value)}
                style={{ width: 80 }}
              />

              <button type="button" className="button secondary" onClick={tambahKeKeranjang}>
                <Plus size={16} /> Tambah ke Daftar
              </button>
            </div>
          </div>

          {keranjang.length > 0 && (
            <div style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
              <b style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                Daftar Alat yang Dipilih ({keranjang.length} item):
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {keranjang.map((item) => (
                  <div
                    key={item.barang_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--surface-soft)',
                      borderRadius: 6
                    }}
                  >
                    <span>
                      <strong>{item.kode_inventaris}</strong> — {item.nama_barang} (<b>{item.jumlah}</b> unit)
                    </span>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '3px 8px', fontSize: 11, color: '#dc2626' }}
                      onClick={() => setKeranjang((prev) => prev.filter((x) => x.barang_id !== item.barang_id))}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label style={{ marginTop: 14 }}>
            Catatan Tambahan
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Kebutuhan khusus, jalur ekspedisi, atau permohonan dispensasi..."
              rows={2}
            />
          </label>

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || keranjang.length === 0}
            >
              <Check size={16} /> {submitting ? 'Mengirim...' : 'Kirim Pengajuan Peminjaman'}
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 3: BOOKING ALAT INTERNAL (Fitur 9) */}
      {activeSubTab === 'booking' && (
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h2>Booking Alat Kegiatan Internal Organisasi</h2>
              <p>Amankan kuota peralatan untuk agenda resmi internal seperti Diklatsar dan Ekspedisi WAPEALA.</p>
            </div>
          </div>

          <form
            className="form-grid-3"
            onSubmit={async (e) => {
              e.preventDefault()
              await beritaAcaraService.createBooking({
                kegiatan: kegiatanBooking,
                tanggal_mulai: mulaiBooking,
                tanggal_selesai: selesaiBooking,
                daftar_alat: keranjang
              })
              alert('Booking kegiatan internal tersimpan!')
              setKegiatanBooking('')
              onRefresh?.()
            }}
          >
            <input
              required
              placeholder="Nama Agenda (mis: Diklatsar 2026)"
              value={kegiatanBooking}
              onChange={(e) => setKegiatanBooking(e.target.value)}
            />
            <input
              required
              type="date"
              value={mulaiBooking}
              onChange={(e) => setMulaiBooking(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                required
                type="date"
                value={selesaiBooking}
                onChange={(e) => setSelesaiBooking(e.target.value)}
              />
              <button type="submit" className="button primary">
                Simpan Booking
              </button>
            </div>
          </form>

          <div className="table-scroll" style={{ marginTop: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Kode Booking</th>
                  <th>Kegiatan</th>
                  <th>Pemohon</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingList.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.kode_booking}</b></td>
                    <td>{b.kegiatan}</td>
                    <td>{b.users?.nama || 'Pengurus Logistik'}</td>
                    <td>{formatTanggal(b.tanggal_mulai)} s/d {formatTanggal(b.tanggal_selesai)}</td>
                    <td>
                      <span className="status status-tersedia">
                        <i />
                        {b.status_booking}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUBTAB 4: RIWAYAT ANGGOTA (Fitur 11) */}
      {activeSubTab === 'riwayat_anggota' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Histori Sirkulasi &amp; Tanggung Jawab Anggota</h2>
              <p>Rekap peminjaman, ketepatan waktu pengembalian, dan riwayat denda anggota.</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Anggota</th>
                  <th>Kegiatan</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                  <th>Keterlambatan &amp; Denda</th>
                </tr>
              </thead>
              <tbody>
                {peminjamanList.map((p) => {
                  const ret = p.pengembalian?.[0]
                  return (
                    <tr key={p.id}>
                      <td>
                        <b>{p.users?.nama || 'Anggota'}</b>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                          {p.users?.nia || '-'}
                        </span>
                      </td>
                      <td>{p.nama_kegiatan}</td>
                      <td>{formatTanggal(p.tanggal_pinjam)} s/d {formatTanggal(p.tanggal_kembali_rencana)}</td>
                      <td>
                        <span className={`status status-${p.status?.toLowerCase().replace(' ', '-')}`}>
                          <i />
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {ret ? (
                          ret.total_denda > 0 ? (
                            <b style={{ color: '#dc2626' }}>
                              Terlambat {ret.hari_terlambat} hari ({formatRupiah(ret.total_denda)})
                            </b>
                          ) : (
                            <span className="condition-good">Tepat Waktu (Rp 0)</span>
                          )
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL PENOLAKAN DENGAN ALASAN */}
      <ConfirmModal
        open={Boolean(rejectTarget)}
        title="Tolak Pengajuan Peminjaman"
        message={`Berikan keterangan penolakan untuk pengajuan ${rejectTarget?.kode_peminjaman}:`}
        confirmLabel="Tolak Pengajuan"
        danger
        onConfirm={async () => {
          await peminjamanService.updateStatusPeminjaman(rejectTarget, 'Ditolak', alasanTolak)
          setRejectTarget(null)
          setAlasanTolak('')
          onRefresh?.()
        }}
        onCancel={() => setRejectTarget(null)}
      >
        <textarea
          placeholder="Contoh: Alat dijadwalkan untuk Diklatsar pada rentang tanggal tersebut."
          value={alasanTolak}
          onChange={(e) => setAlasanTolak(e.target.value)}
          rows={3}
          style={{ width: '100%', marginTop: 8 }}
          required
        />
      </ConfirmModal>

      {/* MODAL PROSES PENGEMBALIAN + CHECKLIST KONDISI + PERHITUNGAN DENDA OTOMATIS */}
      <ConfirmModal
        open={Boolean(returnTarget)}
        title={`Konfirmasi Kembali: ${returnTarget?.kode_peminjaman}`}
        message="Periksa kondisi fisik setiap alat dan verifikasi keterlambatan pengembalian."
        confirmLabel="Selesaikan Pengembalian"
        loading={processingReturn}
        onConfirm={async () => {
          setProcessingReturn(true)
          try {
            await peminjamanService.prosesPengembalian({
              peminjaman: returnTarget,
              tanggal_kembali_aktual: tglKembaliAktual,
              tarif_denda_per_hari: pengaturan?.denda_per_hari || 10000,
              checklist_items: checklistKembali,
              foto_kondisi_url: fotoKembaliUrl,
              catatan_kerusakan: catatanRusak
            })
            alert('Pengembalian berhasil dicatat & stok alat disinkronkan kembali!')
            setReturnTarget(null)
            onRefresh?.()
          } finally {
            setProcessingReturn(false)
          }
        }}
        onCancel={() => setReturnTarget(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <label>
            Tanggal Pengembalian Aktual
            <input
              type="date"
              value={tglKembaliAktual}
              onChange={(e) => setTglKembaliAktual(e.target.value)}
            />
          </label>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: kalkulasiDenda.hariTerlambat > 0 ? '#fee2e2' : '#f0fdf4',
              color: kalkulasiDenda.hariTerlambat > 0 ? '#991b1b' : '#166534',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              Keterlambatan: <strong>{kalkulasiDenda.hariTerlambat} hari</strong>
            </span>
            <span>
              Total Denda Otomatis: <strong>{formatRupiah(kalkulasiDenda.totalDenda)}</strong>
            </span>
          </div>

          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            Checklist Kondisi Fisik Alat:
          </span>
          {checklistKembali.map((item, idx) => (
            <div
              key={item.detail_id || idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'var(--surface-soft)',
                borderRadius: 6
              }}
            >
              <span style={{ fontSize: 12 }}>
                {item.nama_barang} (<b>{item.jumlah}x</b>)
              </span>
              <select
                value={item.kondisi_kembali}
                onChange={(e) => {
                  const copy = [...checklistKembali]
                  copy[idx].kondisi_kembali = e.target.value
                  setChecklistKembali(copy)
                }}
                style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Hilang">Hilang</option>
              </select>
            </div>
          ))}

          <input
            placeholder="Catatan kondisi / kelengkapan alat kembali..."
            value={catatanRusak}
            onChange={(e) => setCatatanRusak(e.target.value)}
          />

          <div>
            <label className="button secondary" style={{ fontSize: 12, cursor: 'pointer' }}>
              <Upload size={14} /> Upload Bukti Foto Kondisi
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) setFotoKembaliUrl(await uploadService.uploadImage(f, 'kembali'))
                }}
                hidden
              />
            </label>
            {fotoKembaliUrl && (
              <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--green-2)' }}>
                ✓ Foto terunggah
              </span>
            )}
          </div>
        </div>
      </ConfirmModal>
    </>
  )
}
