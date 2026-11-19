import { useState, useMemo } from 'react'
import {
  FileText,
  Wrench,
  ClipboardCheck,
  Printer,
  CheckCircle,
  Plus,
  Upload,
  AlertTriangle,
  History
} from 'lucide-react'
import beritaAcaraService from '../services/beritaAcaraService'
import uploadService from '../services/uploadService'
import { cetakBeritaAcaraPDF } from '../utils/exportUtils'
import { formatTanggal, formatRupiah } from '../utils/helpers'

export default function OperasionalPage({
  user,
  alatList = [],
  beritaAcara = [],
  perawatan = [],
  stockOpname = [],
  onRefresh
}) {
  const isPengurus = user?.role === 'super_admin' || user?.role === 'pengurus_logistik'
  const [tab, setTab] = useState('ba') // 'ba' | 'perawatan' | 'opname'

  // Form Berita Acara
  const [jenisKasus, setJenisKasus] = useState('Kerusakan')
  const [barangId, setBarangId] = useState('')
  const [tglKejadian, setTglKejadian] = useState(new Date().toISOString().split('T')[0])
  const [kronologi, setKronologi] = useState('')
  const [fotoBukti, setFotoBukti] = useState('')
  const [submittingBA, setSubmittingBA] = useState(false)

  // Form Perawatan
  const [servisBarangId, setServisBarangId] = useState('')
  const [jenisServis, setJenisServis] = useState('')
  const [biayaServis, setBiayaServis] = useState(0)
  const [submittingServis, setSubmittingServis] = useState(false)

  // Form Stock Opname
  const [periodeOpname, setPeriodeOpname] = useState('Stock Opname Triwulan IV 2026')
  const [opnameItems, setOpnameItems] = useState([])
  const [savingOpname, setSavingOpname] = useState(false)

  const initStockOpname = () => {
    setOpnameItems(
      alatList.map((a) => ({
        barang_id: a.id,
        kode_inventaris: a.kode_inventaris,
        nama_barang: a.nama_barang,
        jumlah_sistem: a.jumlah_total,
        jumlah_fisik: a.jumlah_total,
        jumlah_rusak: 0,
        jumlah_hilang: 0,
        catatan_pengecekan: ''
      }))
    )
  }

  const handleBuatBA = async (e) => {
    e.preventDefault()
    if (!barangId) {
      alert('Pilih barang yang mengalami kasus.')
      return
    }
    setSubmittingBA(true)
    try {
      await beritaAcaraService.createBeritaAcara({
        jenis_kasus: jenisKasus,
        barang_id: barangId,
        tanggal_kejadian: tglKejadian,
        kronologi,
        foto_bukti_url: fotoBukti
      })
      alert(`Berita Acara ${jenisKasus} berhasil diterbitkan dengan nomor resmi!`)
      setKronologi('')
      setBarangId('')
      setFotoBukti('')
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal menerbitkan Berita Acara.')
    } finally {
      setSubmittingBA(false)
    }
  }

  const handleJadwalServis = async (e) => {
    e.preventDefault()
    if (!servisBarangId) {
      alert('Pilih alat yang akan diservis.')
      return
    }
    setSubmittingServis(true)
    try {
      await beritaAcaraService.createPerawatan({
        barang_id: servisBarangId,
        tanggal_mulai: new Date().toISOString().split('T')[0],
        jenis_perawatan: jenisServis,
        biaya_perbaikan: Number(biayaServis) || 0,
        status_perawatan: 'Sedang Diperbaiki'
      })
      alert('Jadwal perawatan alat berhasil dibuat!')
      setJenisServis('')
      setServisBarangId('')
      setBiayaServis(0)
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal menjadwalkan servis.')
    } finally {
      setSubmittingServis(false)
    }
  }

  const handleSimpanOpname = async () => {
    if (opnameItems.length === 0) {
      alert('Inisialisasi daftar alat terlebih dahulu.')
      return
    }
    setSavingOpname(true)
    try {
      await beritaAcaraService.simpanStockOpname({
        periode: periodeOpname,
        petugas_id: user?.id,
        catatan_umum: 'Pengecekan fisik berkala inventaris WAPEALA',
        items: opnameItems
      })
      alert('Laporan Stock Opname berhasil disimpan dan stok sistem disinkronkan!')
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan Stock Opname.')
    } finally {
      setSavingOpname(false)
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">PEMELIHARAAN &amp; KONTROL FISIK</span>
          <h1>Operasional Logistik</h1>
          <p>Dokumentasi Berita Acara, servis perawatan berkala, dan Stock Opname inventaris.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={tab === 'ba' ? 'button primary' : 'button secondary'}
            onClick={() => setTab('ba')}
          >
            <FileText size={16} /> Berita Acara
          </button>
          <button
            type="button"
            className={tab === 'perawatan' ? 'button primary' : 'button secondary'}
            onClick={() => setTab('perawatan')}
          >
            <Wrench size={16} /> Perawatan Alat
          </button>
          <button
            type="button"
            className={tab === 'opname' ? 'button primary' : 'button secondary'}
            onClick={() => {
              setTab('opname')
              if (opnameItems.length === 0) initStockOpname()
            }}
          >
            <ClipboardCheck size={16} /> Stock Opname
          </button>
        </div>
      </section>

      {/* MODUL 1: BERITA ACARA KEHILANGAN & KERUSAKAN (FITUR 6) */}
      {tab === 'ba' && (
        <>
          {isPengurus && (
            <form className="panel form-panel" onSubmit={handleBuatBA}>
              <div className="panel-heading">
                <div>
                  <h2>Terbitkan Berita Acara Baru</h2>
                  <p>Penomoran dokumen otomatis terstandar untuk pertanggungjawaban organisasi.</p>
                </div>
              </div>

              <div className="form-grid-3">
                <label>
                  Jenis Kasus *
                  <select value={jenisKasus} onChange={(e) => setJenisKasus(e.target.value)}>
                    <option value="Kerusakan">Kerusakan Alat</option>
                    <option value="Kehilangan">Kehilangan Alat</option>
                  </select>
                </label>

                <label>
                  Peralatan Terdampak *
                  <select value={barangId} onChange={(e) => setBarangId(e.target.value)} required>
                    <option value="">-- Pilih Barang --</option>
                    {alatList.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.kode_inventaris}] {a.nama_barang}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Tanggal Kejadian *
                  <input
                    type="date"
                    value={tglKejadian}
                    onChange={(e) => setTglKejadian(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Kronologi Kejadian *
                <textarea
                  required
                  rows={3}
                  placeholder="Ceritakan detail tempat, penyebab kerusakan/kehilangan, dan pihak yang terlibat..."
                  value={kronologi}
                  onChange={(e) => setKronologi(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div>
                  <label className="button secondary" style={{ cursor: 'pointer', fontSize: 12 }}>
                    <Upload size={14} /> Upload Foto Bukti Kerusakan
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) setFotoBukti(await uploadService.uploadImage(f, 'ba'))
                      }}
                      hidden
                    />
                  </label>
                  {fotoBukti && <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--green-2)' }}>✓ Bukti terlampir</span>}
                </div>

                <button type="submit" className="button primary" disabled={submittingBA}>
                  <CheckCircle size={16} /> {submittingBA ? 'Menerbitkan...' : 'Terbitkan Berita Acara'}
                </button>
              </div>
            </form>
          )}

          <section className="panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h2>Daftar Berita Acara Kasus Inventaris</h2>
                <p>Arsip resmi dan cetak dokumen Berita Acara format PDF bertanda tangan.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nomor Dokumen</th>
                    <th>Jenis</th>
                    <th>Barang Terdampak</th>
                    <th>Penanggung Jawab</th>
                    <th>Kronologi</th>
                    <th>Status</th>
                    <th>Dokumen PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {beritaAcara.map((b) => (
                    <tr key={b.id}>
                      <td><b>{b.nomor_ba}</b></td>
                      <td>
                        <span className={`status status-${b.jenis_kasus === 'Kehilangan' ? 'karantina' : 'perawatan'}`}>
                          <i />
                          {b.jenis_kasus}
                        </span>
                      </td>
                      <td>{b.inventaris_barang?.nama_barang || '-'}</td>
                      <td>{b.users?.nama || '-'}</td>
                      <td>
                        <span style={{ fontSize: 12 }}>{b.kronologi}</span>
                      </td>
                      <td>{b.status_penyelesaian || 'Proses'}</td>
                      <td>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => cetakBeritaAcaraPDF(b)}
                        >
                          <Printer size={13} /> Cetak PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* MODUL 2: PERAWATAN & SERVIS ALAT (FITUR 7) */}
      {tab === 'perawatan' && (
        <>
          {isPengurus && (
            <form className="panel form-panel" onSubmit={handleJadwalServis}>
              <div className="panel-heading">
                <div>
                  <h2>Jadwalkan Servis &amp; Perawatan Alat</h2>
                  <p>Catat pekerjaan teknisi, pelapisan seam seal, penggantian spare part, atau jahit strap.</p>
                </div>
              </div>

              <div className="form-grid-3">
                <label>
                  Peralatan Rusak / Perlu Servis *
                  <select
                    value={servisBarangId}
                    onChange={(e) => setServisBarangId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Alat untuk Diservis --</option>
                    {alatList.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.kode_inventaris}] {a.nama_barang} ({a.kondisi})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Jenis Tindakan Perawatan *
                  <input
                    required
                    placeholder="Contoh: Jahit strap / Seam seal tenda"
                    value={jenisServis}
                    onChange={(e) => setJenisServis(e.target.value)}
                  />
                </label>

                <label>
                  Estimasi Biaya Perbaikan (Rp)
                  <input
                    type="number"
                    value={biayaServis}
                    onChange={(e) => setBiayaServis(e.target.value)}
                  />
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button type="submit" className="button primary" disabled={submittingServis}>
                  <Wrench size={16} /> {submittingServis ? 'Menjadwalkan...' : 'Jadwalkan Perawatan'}
                </button>
              </div>
            </form>
          )}

          <section className="panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h2>Riwayat &amp; Antrean Perawatan Alat</h2>
                <p>Daftar perbaikan fisik dan riwayat biaya pemeliharaan inventaris.</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Alat</th>
                    <th>Jenis Perawatan</th>
                    <th>Tanggal Mulai</th>
                    <th>Biaya Servis</th>
                    <th>Status</th>
                    {isPengurus && <th>Tindakan Selesai</th>}
                  </tr>
                </thead>
                <tbody>
                  {perawatan.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.inventaris_barang?.nama_barang}</b>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                          {p.inventaris_barang?.kode_inventaris}
                        </span>
                      </td>
                      <td>{p.jenis_perawatan}</td>
                      <td>{formatTanggal(p.tanggal_mulai)}</td>
                      <td><b>{formatRupiah(p.biaya_perbaikan || 0)}</b></td>
                      <td>
                        <span className={`status status-${p.status_perawatan === 'Selesai' ? 'tersedia' : 'perawatan'}`}>
                          <i />
                          {p.status_perawatan}
                        </span>
                      </td>
                      {isPengurus && (
                        <td>
                          {p.status_perawatan !== 'Selesai' ? (
                            <button
                              type="button"
                              className="button primary"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={async () => {
                                await beritaAcaraService.selesaikanPerawatan(
                                  p,
                                  p.biaya_perbaikan,
                                  'Perbaikan selesai dan siap operasional'
                                )
                                onRefresh?.()
                              }}
                            >
                              <CheckCircle size={14} /> Selesai Servis
                            </button>
                          ) : (
                            <span className="condition-good">Selesai</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* MODUL 3: STOCK OPNAME BERKALA (FITUR 8) */}
      {tab === 'opname' && (
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h2>Pemeriksaan Stock Opname Fisik Berkala</h2>
              <p>Periksa kuantitas fisik alat secara langsung di rak penyimpanan dan selaraskan dengan sistem.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={periodeOpname}
                onChange={(e) => setPeriodeOpname(e.target.value)}
                style={{ width: 240 }}
              />
              <button
                type="button"
                className="button primary"
                disabled={savingOpname}
                onClick={handleSimpanOpname}
              >
                <ClipboardCheck size={16} /> {savingOpname ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Stok'}
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Kode &amp; Nama Alat</th>
                  <th>Stok Sistem</th>
                  <th>Fisik Tersedia</th>
                  <th>Jumlah Rusak</th>
                  <th>Jumlah Hilang</th>
                  <th>Catatan Pemeriksaan Fisik</th>
                </tr>
              </thead>
              <tbody>
                {opnameItems.map((item, idx) => (
                  <tr key={item.barang_id}>
                    <td>
                      <b>{item.nama_barang}</b>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        {item.kode_inventaris}
                      </span>
                    </td>
                    <td><b>{item.jumlah_sistem}</b> unit</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.jumlah_fisik}
                        onChange={(e) => {
                          const copy = [...opnameItems]
                          copy[idx].jumlah_fisik = e.target.value
                          setOpnameItems(copy)
                        }}
                        style={{ width: 75 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.jumlah_rusak}
                        onChange={(e) => {
                          const copy = [...opnameItems]
                          copy[idx].jumlah_rusak = e.target.value
                          setOpnameItems(copy)
                        }}
                        style={{ width: 75 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.jumlah_hilang}
                        onChange={(e) => {
                          const copy = [...opnameItems]
                          copy[idx].jumlah_hilang = e.target.value
                          setOpnameItems(copy)
                        }}
                        style={{ width: 75 }}
                      />
                    </td>
                    <td>
                      <input
                        placeholder="Contoh: Aman di rak wall climbing"
                        value={item.catatan_pengecekan}
                        onChange={(e) => {
                          const copy = [...opnameItems]
                          copy[idx].catatan_pengecekan = e.target.value
                          setOpnameItems(copy)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
