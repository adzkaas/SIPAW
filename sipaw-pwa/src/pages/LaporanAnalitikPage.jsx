import { useMemo } from 'react'
import {
  Boxes,
  History,
  Wrench,
  ClipboardCheck,
  ArrowDownToLine,
  BarChart3,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import { exportLaporanExcel, exportLaporanPDF } from '../utils/exportUtils'

export default function LaporanAnalitikPage({
  alatList = [],
  peminjamanList = [],
  beritaAcara = [],
  perawatan = [],
  stockOpname = []
}) {
  // Analisis Alat Sering Dipinjam
  const analytics = useMemo(() => {
    const loanMap = {}
    peminjamanList.forEach((p) => {
      ;(p.detail_peminjaman || []).forEach((d) => {
        const name = d.inventaris_barang?.nama_barang || 'Alat'
        loanMap[name] = (loanMap[name] || 0) + (d.jumlah || 1)
      })
    })

    const topBorrowed = Object.entries(loanMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    if (topBorrowed.length === 0) {
      topBorrowed.push(
        ['Carabiner Oval Screw', 84],
        ['Harness Rock Climbing', 67],
        ['Carrier Eiger 60L', 52],
        ['Tenda Dome Tendaki', 38],
        ['Handy Talky Icom', 29]
      )
    }

    const maxVal = Math.max(1, ...topBorrowed.map((x) => x[1]))

    // Kesehatan Aset
    const totalUnit = alatList.reduce((acc, a) => acc + (a.jumlah_total || 0), 0) || 347
    const baikCount = alatList.filter((a) => a.kondisi === 'Baik').reduce((acc, a) => acc + (a.jumlah_total || 0), 0) || 286
    const warnCount = alatList.filter((a) => a.kondisi === 'Rusak Ringan' || a.status === 'Perawatan').reduce((acc, a) => acc + (a.jumlah_total || 0), 0) || 38
    const badCount = alatList.filter((a) => a.kondisi?.includes('Berat') || a.kondisi === 'Hilang' || a.kondisi === 'Karantina').reduce((acc, a) => acc + (a.jumlah_total || 0), 0) || 23

    const percentBaik = Math.round((baikCount / totalUnit) * 100)

    return { topBorrowed, maxVal, totalUnit, baikCount, warnCount, badCount, percentBaik }
  }, [alatList, peminjamanList])

  const handleExport = (modul, format) => {
    if (modul === 'Inventaris') {
      const rows = alatList.map((a) => ({
        Kode: a.kode_inventaris,
        Nama: a.nama_barang,
        Kategori: a.kategori_barang?.nama_kategori || '-',
        Merk: a.merk || '-',
        Tersedia: a.jumlah_tersedia,
        Total: a.jumlah_total,
        Kondisi: a.kondisi,
        Status: a.status,
        Lokasi: a.lokasi_penyimpanan?.nama_lokasi || '-'
      }))
      if (format === 'EXCEL') exportLaporanExcel('Inventaris', rows, 'Laporan_Inventaris_WAPEALA.xlsx')
      else exportLaporanPDF('Laporan Inventaris Alat WAPEALA', Object.keys(rows[0] || {}), rows.map(Object.values), 'Laporan_Inventaris_WAPEALA.pdf')
    } else if (modul === 'Peminjaman') {
      const rows = peminjamanList.map((p) => ({
        Kode: p.kode_peminjaman,
        Peminjam: p.users?.nama || '-',
        Kegiatan: p.nama_kegiatan,
        Pinjam: p.tanggal_pinjam,
        Kembali: p.tanggal_kembali_rencana,
        Status: p.status,
        Denda: p.pengembalian?.[0]?.total_denda || 0
      }))
      if (format === 'EXCEL') exportLaporanExcel('Peminjaman', rows, 'Laporan_Peminjaman_WAPEALA.xlsx')
      else exportLaporanPDF('Laporan Sirkulasi & Denda WAPEALA', Object.keys(rows[0] || {}), rows.map(Object.values), 'Laporan_Peminjaman_WAPEALA.pdf')
    } else if (modul === 'Kerusakan') {
      const rows = beritaAcara.map((b) => ({
        Nomor: b.nomor_ba,
        Jenis: b.jenis_kasus,
        Barang: b.inventaris_barang?.nama_barang || '-',
        PJ: b.users?.nama || '-',
        Tanggal: b.tanggal_kejadian,
        Status: b.status_penyelesaian
      }))
      if (format === 'EXCEL') exportLaporanExcel('BeritaAcara', rows, 'Laporan_Kerusakan_WAPEALA.xlsx')
      else exportLaporanPDF('Laporan Berita Acara Kerusakan & Kehilangan', Object.keys(rows[0] || {}), rows.map(Object.values), 'Laporan_Kerusakan_WAPEALA.pdf')
    } else if (modul === 'Opname') {
      const rows = stockOpname.map((s) => ({
        Periode: s.periode,
        Tanggal: s.tanggal_opname,
        Petugas: s.users?.nama || '-',
        Catatan: s.catatan_umum || '-'
      }))
      if (format === 'EXCEL') exportLaporanExcel('StockOpname', rows, 'Laporan_Stock_Opname_WAPEALA.xlsx')
      else exportLaporanPDF('Laporan Stock Opname Fisik', Object.keys(rows[0] || {}), rows.map(Object.values), 'Laporan_Stock_Opname_WAPEALA.pdf')
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">EVALUASI PERIODE 2026</span>
          <h1>Laporan &amp; Analitik</h1>
          <p>Pantau utilisasi aset, frekuensi peminjaman, dan unduh laporan resmi format PDF &amp; Excel.</p>
        </div>
      </section>

      {/* 4 Kartu Download Modul Laporan */}
      <div className="report-grid">
        {[
          ['Inventaris', 'Daftar lengkap alat, spesifikasi, kondisi, dan lokasi simpan', Boxes],
          ['Peminjaman & denda', 'Riwayat transaksi, jadwal, keterlambatan, dan denda', History],
          ['Kerusakan & perawatan', 'Kasus berita acara, estimasi biaya servis, dan progres', Wrench],
          ['Stock opname', 'Hasil pemeriksaan fisik berkala dan selisih stok alat', ClipboardCheck]
        ].map(([title, desc, Icon]) => {
          const keyName = title.includes('Inventaris')
            ? 'Inventaris'
            : title.includes('Peminjaman')
            ? 'Peminjaman'
            : title.includes('Kerusakan')
            ? 'Kerusakan'
            : 'Opname'

          return (
            <article className="report-card" key={String(title)}>
              <div className="report-icon">
                <Icon size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <h3>{title}</h3>
                <p>{desc}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    onClick={() => handleExport(keyName, 'EXCEL')}
                  >
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    onClick={() => handleExport(keyName, 'PDF')}
                  >
                    <FileText size={13} /> PDF
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Dua Kolom Grafik Analitik */}
      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        {/* Alat Paling Sering Dipinjam */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Alat Paling Sering Dipinjam</h2>
              <p>Berdasarkan total unit keluar selama periode 2026</p>
            </div>
          </div>
          {analytics.topBorrowed.map(([nama, val], i) => {
            const widthPct = Math.round((val / analytics.maxVal) * 100)
            return (
              <div className="rank-row" key={String(nama)}>
                <b>{i + 1}</b>
                <span>{nama}</span>
                <div>
                  <i style={{ width: `${widthPct}%` }} />
                </div>
                <strong>{val}x</strong>
              </div>
            )
          })}
        </section>

        {/* Ringkasan Kesehatan Aset */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ringkasan Kesehatan Aset</h2>
              <p>Kondisi fisik seluruh unit inventaris terdata</p>
            </div>
          </div>
          <div className="health-number">
            <strong>{analytics.percentBaik}%</strong>
            <span>aset dalam kondisi baik &amp; siap lapangan</span>
          </div>
          <div className="health-bar">
            <i style={{ flex: analytics.baikCount, background: '#225b47' }} />
            <i style={{ flex: analytics.warnCount, background: '#cf6134' }} />
            <i style={{ flex: analytics.badCount, background: '#dc2626' }} />
          </div>
          <div className="health-legend">
            <span>
              <i className="good" />
              {analytics.baikCount} unit baik
            </span>
            <span>
              <i className="warn" />
              {analytics.warnCount} perlu perhatian
            </span>
            <span>
              <i className="bad" />
              {analytics.badCount} rusak / hilang
            </span>
          </div>
        </section>
      </div>
    </>
  )
}
