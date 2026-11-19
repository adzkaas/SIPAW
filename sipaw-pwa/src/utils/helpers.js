export const formatRupiah = (angka) => {
  const num = Number(angka) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

export const formatTanggal = (tgl) => {
  if (!tgl) return '-'
  return new Date(tgl).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const formatTanggalLengkap = (tgl) => {
  if (!tgl) return '-'
  return new Date(tgl).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export const hitungDendaKeterlambatan = (
  tglRencana,
  tglAktual = new Date().toISOString().split('T')[0],
  tarifPerHari = 10000
) => {
  if (!tglRencana) return { hariTerlambat: 0, totalDenda: 0 }
  const d1 = new Date(tglRencana)
  const d2 = new Date(tglAktual)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  const diffTime = d2.getTime() - d1.getTime()
  const hariTerlambat = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  return {
    hariTerlambat,
    totalDenda: hariTerlambat * Number(tarifPerHari)
  }
}

export const generateKode = (prefix) => {
  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = Math.floor(100 + Math.random() * 900)
  return `${prefix}-${ymd}-${rand}`
}

export const getCategoryColor = (kategoriNama) => {
  const map = {
    'Caving & Rock Climbing': '#d35f33',
    'Mountaineering': '#275f4e',
    'Water Sport': '#287c91',
    'Alat Komunikasi': '#76644b',
    'P3K & Logistik Umum': '#a44343'
  }
  return map[kategoriNama] || '#225b47'
}
