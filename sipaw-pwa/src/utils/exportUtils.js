import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatTanggal, formatRupiah } from './helpers'

// Cetak Berita Acara Kehilangan / Kerusakan ke PDF Resmi (Fitur 6)
export const cetakBeritaAcaraPDF = (ba) => {
  const doc = new jsPDF()

  // Kop Resmi WAPEALA
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('WAPEALA UNIVERSITAS DIPONEGORO', 105, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Gedung PKM FT Universitas Diponegoro, Tembalang, Semarang', 105, 23, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`BERITA ACARA ${ba.jenis_kasus?.toUpperCase()} ALAT`, 105, 32, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${ba.nomor_ba}`, 105, 37, { align: 'center' })
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  const rows = [
    ['Nomor Dokumen', ba.nomor_ba],
    ['Jenis Kasus', ba.jenis_kasus],
    ['Tanggal Kejadian', formatTanggal(ba.tanggal_kejadian)],
    ['Barang', `${ba.inventaris_barang?.kode_inventaris || ''} - ${ba.inventaris_barang?.nama_barang || '-'}`],
    ['Penanggung Jawab', `${ba.users?.nama || '-'} (NIA: ${ba.users?.nia || '-'})`],
    ['Status Penyelesaian', ba.status_penyelesaian || 'Proses'],
    ['Kronologi Kejadian', ba.kronologi || '-'],
    ['Tindak Lanjut / Solusi', ba.tindak_lanjut || 'Menunggu verifikasi pengurus logistik']
  ]

  autoTable(doc, {
    startY: 46,
    head: [['Komponen', 'Keterangan']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [18, 56, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  })

  const finalY = doc.lastAutoTable.finalY + 20
  doc.setFontSize(9)
  doc.text('Semarang, ' + formatTanggal(new Date()), 140, finalY - 5)
  doc.text('Penanggung Jawab,', 30, finalY)
  doc.text('Koordinator Logistik PH,', 140, finalY)

  doc.text(`( ${ba.users?.nama || '....................'} )`, 25, finalY + 28)
  doc.text('( .............................. )', 135, finalY + 28)
  doc.text(`NIA: ${ba.users?.nia || '................'}`, 25, finalY + 33)
  doc.text('NIA: ............................', 135, finalY + 33)

  doc.save(`${ba.nomor_ba}.pdf`)
}

// Export Laporan Umum ke PDF (Fitur 13)
export const exportLaporanPDF = (judul, headers, bodyRows, filename = 'Laporan_SIPAW.pdf') => {
  const doc = new jsPDF('landscape')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`SIPAW WAPEALA UNDIP — ${judul.toUpperCase()}`, 14, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Periode Aktif 2026`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: bodyRows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [18, 56, 45], textColor: [255, 255, 255] }
  })

  doc.save(filename)
}

// Export Laporan Umum ke Excel .xlsx (Fitur 13)
export const exportLaporanExcel = (sheetName, jsonData, filename = 'Laporan_SIPAW.xlsx') => {
  const ws = XLSX.utils.json_to_sheet(jsonData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export { formatRupiah }
