import { useState, useEffect, useCallback } from 'react'
import peminjamanService from '../services/peminjamanService'
import beritaAcaraService from '../services/beritaAcaraService'

export function usePeminjaman(userId = null) {
  const [peminjamanList, setPeminjamanList] = useState([])
  const [bookingList, setBookingList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pjm, bkg] = await Promise.all([
        peminjamanService.getAllPeminjaman(userId),
        beritaAcaraService.getAllBooking()
      ])
      setPeminjamanList(Array.isArray(pjm) ? pjm : [])
      setBookingList(Array.isArray(bkg) ? bkg : [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { peminjamanList, bookingList, loading, refetch: fetchAll }
}
