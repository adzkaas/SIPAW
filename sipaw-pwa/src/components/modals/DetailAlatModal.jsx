import { useState, useEffect } from 'react'
import { X, QrCode, History, Wrench, ShieldAlert, Calendar, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import alatService from '../../services/alatService'
import { formatTanggal } from '../../utils/helpers'

export default function DetailAlatModal({ alat, onClose }) {
  const [riwayat, setRiwayat] = useState({ peminjaman: [], beritaAcara: [], perawatan: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!alat?.id) return
    setLoading(true)
    alatService
      .getRiwayatAlat(alat.id)
      .then(setRiwayat)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [alat?.id])

  if (!alat) return null

  const qrValue = alat.qr_code_value || `SIPAW:${alat.kode_inventaris}`

  const downloadQR = () => {
    const svg = document.getElementById('alat-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width + 40
      canvas.height = img.height + 70
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 20, 20)
      ctx.fillStyle = '#17231e'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(alat.kode_inventaris, canvas.width / 2, canvas.height - 30)
      ctx.font = '10px sans-serif'
      ctx.fillText(alat.nama_barang, canvas.width / 2, canvas.height - 14)
      const a = document.createElement('a')
      a.download = `QR_${alat.kode_inventaris}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">{alat.kategori_barang?.nama_kategori || 'Inventaris'}</span>
            <h2>{alat.nama_barang}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="detail-modal-body">
          <div className="detail-modal-left">
            <div className="detail-photo-wrap">
              <img
                src={alat.foto_url || '/placeholder-alat.svg'}
                alt={alat.nama_barang}
                className="detail-photo-img"
              />
            </div>

            <div className="qr-card">
              <QRCodeSVG id="alat-qr-svg" value={qrValue} size={110} />
              <div>
                <b>QR Code Inventaris</b>
                <span className="mono">{alat.kode_inventaris}</span>
                <small>Scan saat serah terima &amp; stock opname</small>
                <button type="button" className="text-button" style={{ marginTop: 6 }} onClick={downloadQR}>
                  <Download size={13} /> Unduh QR (.PNG)
                </button>
              </div>
            </div>
          </div>

          <div className="detail-modal-right">
            <table className="spec-table">
              <tbody>
                <tr>
                  <th>Kode Inventaris</th>
                  <td><strong>{alat.kode_inventaris}</strong></td>
                </tr>
                <tr>
                  <th>Merk &amp; Tipe</th>
                  <td>{alat.merk || '-'} {alat.tipe_model ? `(${alat.tipe_model})` : ''}</td>
                </tr>
                <tr>
                  <th>Ketersediaan Unit</th>
                  <td>
                    <b style={{ color: 'var(--green-2)' }}>{alat.jumlah_tersedia}</b> dari {alat.jumlah_total} unit
                  </td>
                </tr>
                <tr>
                  <th>Kondisi Fisik</th>
                  <td>{alat.kondisi} ({alat.status})</td>
                </tr>
                <tr>
                  <th>Lokasi Penyimpanan</th>
                  <td>{alat.lokasi_penyimpanan?.nama_lokasi || '-'}</td>
                </tr>
                <tr>
                  <th>Tahun Pengadaan</th>
                  <td>{alat.tahun_pembelian || '-'}</td>
                </tr>
                <tr>
                  <th>Ciri-ciri Khusus</th>
                  <td>{alat.ciri_ciri || '-'}</td>
                </tr>
                <tr>
                  <th>Catatan Logistik</th>
                  <td>{alat.catatan || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fitur 10: Riwayat Penggunaan, Kerusakan & Perawatan Alat */}
        <div className="riwayat-section" style={{ marginTop: 20 }}>
          <div className="panel-heading" style={{ marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} /> Riwayat Lengkap Alat
              </h3>
              <p style={{ margin: 0, fontSize: 11 }}>Histori peminjaman, servis perawatan, dan berita acara kerusakan</p>
            </div>
          </div>

          <div className="history-tabs-content">
            {loading ? (
              <p className="muted" style={{ padding: 12 }}>Memuat riwayat alat...</p>
            ) : riwayat.peminjaman.length === 0 && riwayat.perawatan.length === 0 && riwayat.beritaAcara.length === 0 ? (
              <p className="muted" style={{ padding: 12 }}>Belum ada catatan transaksi untuk alat ini.</p>
            ) : (
              <div className="history-list">
                {riwayat.peminjaman.map((p) => (
                  <div key={p.id} className="history-item">
                    <Calendar size={15} style={{ color: 'var(--green-2)' }} />
                    <div style={{ flex: 1 }}>
                      <b>Dipinjam: {p.peminjaman?.nama_kegiatan}</b>
                      <span>Peminjam: {p.peminjaman?.users?.nama} ({formatTanggal(p.peminjaman?.tanggal_pinjam)})</span>
                    </div>
                    <span className="condition-good">Kembali: {p.kondisi_kembali || 'Dipinjam'}</span>
                  </div>
                ))}

                {riwayat.perawatan.map((prw) => (
                  <div key={prw.id} className="history-item">
                    <Wrench size={15} style={{ color: '#d97706' }} />
                    <div style={{ flex: 1 }}>
                      <b>Servis: {prw.jenis_perawatan}</b>
                      <span>Mulai: {formatTanggal(prw.tanggal_mulai)} • Status: {prw.status_perawatan}</span>
                    </div>
                    <span>Rp {Number(prw.biaya_perbaikan || 0).toLocaleString('id-ID')}</span>
                  </div>
                ))}

                {riwayat.beritaAcara.map((ba) => (
                  <div key={ba.id} className="history-item">
                    <ShieldAlert size={15} style={{ color: '#dc2626' }} />
                    <div style={{ flex: 1 }}>
                      <b>Berita Acara {ba.jenis_kasus}: {ba.nomor_ba}</b>
                      <span>{ba.kronologi} ({formatTanggal(ba.tanggal_kejadian)})</span>
                    </div>
                    <span className="status status-karantina">{ba.status_penyelesaian}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  )
}
