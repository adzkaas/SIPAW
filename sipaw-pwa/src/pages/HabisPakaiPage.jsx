import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, PackageCheck, AlertTriangle } from 'lucide-react'
import logistikExtraService from '../services/logistikExtraService'
import { formatTanggal } from '../utils/helpers'

export default function HabisPakaiPage({ habisPakai = [], logHabisPakai = [], onRefresh }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [jenis, setJenis] = useState('KELUAR')
  const [jumlah, setJumlah] = useState(1)
  const [keterangan, setKeterangan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSimpan = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    setSubmitting(true)
    try {
      await logistikExtraService.catatTransaksiHabisPakai({
        item: selectedItem,
        jenis_transaksi: jenis,
        jumlah,
        keterangan
      })
      alert(`Transaksi stok ${jenis.toLowerCase()} ${selectedItem.nama_barang} berhasil dicatat!`)
      setSelectedItem(null)
      setKeterangan('')
      setJumlah(1)
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan transaksi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">LOGISTIK HABIS PAKAI · NON-RETURNABLE</span>
          <h1>Barang Habis Pakai</h1>
          <p>Pencatatan sirkulasi Gas Kaleng, Baterai Cadangan HT, Plester Medis P3K, dan Tali Rafia.</p>
        </div>
      </section>

      {/* Grid Stok Kartu */}
      <div className="metric-grid">
        {habisPakai.map((item) => {
          const menipis = item.stok_saat_ini <= item.batas_minimum
          return (
            <article
              key={item.id}
              className="metric-card"
              style={{
                borderColor: menipis ? '#fca5a5' : 'var(--line)',
                background: menipis ? 'color-mix(in srgb, #fee2e2 20%, var(--surface))' : 'var(--surface)'
              }}
            >
              <div className={`metric-icon ${menipis ? 'orange' : 'green'}`}>
                {menipis ? <AlertTriangle size={20} /> : <PackageCheck size={20} />}
              </div>
              <div className="metric-top">
                <span>{item.nama_barang}</span>
              </div>
              <strong style={{ fontSize: 26, margin: '6px 0' }}>
                {item.stok_saat_ini} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>{item.satuan}</span>
              </strong>
              <div className="metric-foot">
                <span>Batas min: {item.batas_minimum} {item.satuan}</span>
                <small>{item.lokasi_penyimpanan?.nama_lokasi || 'Sekretariat PKM'}</small>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ flex: 1, padding: '5px 8px', fontSize: 11 }}
                  onClick={() => {
                    setSelectedItem(item)
                    setJenis('MASUK')
                  }}
                >
                  <ArrowDownCircle size={13} /> Masuk
                </button>
                <button
                  type="button"
                  className="button primary"
                  style={{ flex: 1, padding: '5px 8px', fontSize: 11 }}
                  onClick={() => {
                    setSelectedItem(item)
                    setJenis('KELUAR')
                  }}
                >
                  <ArrowUpCircle size={13} /> Keluar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Form Dialog Transaksi Stok */}
      {selectedItem && (
        <form className="panel form-panel" style={{ marginTop: 20 }} onSubmit={handleSimpan}>
          <div className="panel-heading">
            <div>
              <h2>Catat Stok {jenis}: {selectedItem.nama_barang}</h2>
              <p>Stok saat ini: {selectedItem.stok_saat_ini} {selectedItem.satuan}</p>
            </div>
            <button type="button" className="text-button" onClick={() => setSelectedItem(null)}>
              Tutup
            </button>
          </div>

          <div className="form-grid-3">
            <label>
              Jenis Transaksi
              <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                <option value="MASUK">Stok Masuk (Pengadaan / Donasi)</option>
                <option value="KELUAR">Stok Keluar (Kegiatan Lapangan)</option>
              </select>
            </label>

            <label>
              Jumlah ({selectedItem.satuan}) *
              <input
                required
                type="number"
                min="1"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
              />
            </label>

            <label>
              Keterangan Penggunaan *
              <input
                required
                placeholder="Contoh: Logistik Diklatsar 2026 di Gunung Ungaran"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: 14 }}>
            <button type="button" className="button secondary" onClick={() => setSelectedItem(null)}>
              Batal
            </button>
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      )}

      {/* Riwayat Keluar Masuk */}
      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-heading">
          <div>
            <h2>Riwayat Keluar Masuk Barang Habis Pakai</h2>
            <p>Arsip pemakaian dan pengadaan logistik operasional.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Waktu Transaksi</th>
                <th>Nama Barang</th>
                <th>Jenis</th>
                <th>Kuantitas</th>
                <th>Keterangan Kegiatan</th>
                <th>Petugas Logistik</th>
              </tr>
            </thead>
            <tbody>
              {logHabisPakai.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>
                    Belum ada catatan transaksi keluar masuk.
                  </td>
                </tr>
              ) : (
                logHabisPakai.map((l) => (
                  <tr key={l.id}>
                    <td>{formatTanggal(l.created_at)}</td>
                    <td><b>{l.barang_habis_pakai?.nama_barang || 'Barang'}</b></td>
                    <td>
                      <span className={`status status-${l.jenis_transaksi === 'MASUK' ? 'tersedia' : 'perawatan'}`}>
                        <i />
                        {l.jenis_transaksi}
                      </span>
                    </td>
                    <td><b>{l.jumlah}</b> {l.barang_habis_pakai?.satuan || 'Pcs'}</td>
                    <td>{l.keterangan}</td>
                    <td>{l.users?.nama || 'Pengurus Logistik'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
