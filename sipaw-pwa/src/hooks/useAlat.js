import { useState, useEffect, useCallback } from 'react'
import alatService from '../services/alatService'
import kategoriService from '../services/kategoriService'

export function useAlat(filters = {}) {
  const [alatList, setAlatList] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [lokasiList, setLokasiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const filterKey = JSON.stringify(filters)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resAlat, resKat, resLok] = await Promise.all([
        alatService.getAllAlat(filters),
        kategoriService.getKategori().catch(() => []),
        kategoriService.getLokasi().catch(() => [])
      ])
      setAlatList(resAlat.data || [])
      setIsOffline(Boolean(resAlat.offline))
      if (Array.isArray(resKat)) setKategoriList(resKat)
      if (Array.isArray(resLok)) setLokasiList(resLok)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { alatList, kategoriList, lokasiList, loading, isOffline, refetch: fetchData }
}
