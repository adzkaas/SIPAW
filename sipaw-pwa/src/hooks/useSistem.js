import { useState, useEffect, useCallback } from 'react'
import logistikExtraService from '../services/logistikExtraService'

export function useSistem(userId) {
  const [notifikasi, setNotifikasi] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [pengaturan, setPengaturan] = useState({
    maks_hari_pinjam: 7,
    denda_per_hari: 10000,
    nama_organisasi: 'WAPEALA UNIVERSITAS DIPONEGORO'
  })

  const fetchSistem = useCallback(async () => {
    try {
      const [notif, logs, cfg] = await Promise.all([
        logistikExtraService.getNotifikasi(userId),
        logistikExtraService.getAuditLogs(),
        logistikExtraService.getPengaturan()
      ])
      setNotifikasi(notif || [])
      setAuditLogs(logs || [])
      if (cfg) setPengaturan(cfg)
    } catch {
      // Fallback
    }
  }, [userId])

  useEffect(() => {
    fetchSistem()
  }, [fetchSistem])

  return { notifikasi, auditLogs, pengaturan, refetch: fetchSistem }
}
