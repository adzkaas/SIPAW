import { useState, useEffect, useCallback } from 'react'
import beritaAcaraService from '../services/beritaAcaraService'
import logistikExtraService from '../services/logistikExtraService'

export function useOperasional() {
  const [beritaAcara, setBeritaAcara] = useState([])
  const [perawatan, setPerawatan] = useState([])
  const [stockOpname, setStockOpname] = useState([])
  const [habisPakai, setHabisPakai] = useState([])
  const [logHabisPakai, setLogHabisPakai] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOperasional = useCallback(async () => {
    setLoading(true)
    try {
      const [ba, prw, so, bhp, logBhp] = await Promise.all([
        beritaAcaraService.getAllBeritaAcara(),
        beritaAcaraService.getAllPerawatan(),
        beritaAcaraService.getAllStockOpname(),
        logistikExtraService.getBarangHabisPakai(),
        logistikExtraService.getLogHabisPakai()
      ])
      setBeritaAcara(ba || [])
      setPerawatan(prw || [])
      setStockOpname(so || [])
      setHabisPakai(bhp || [])
      setLogHabisPakai(logBhp || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOperasional()
  }, [fetchOperasional])

  return {
    beritaAcara,
    perawatan,
    stockOpname,
    habisPakai,
    logHabisPakai,
    loading,
    refetch: fetchOperasional
  }
}
