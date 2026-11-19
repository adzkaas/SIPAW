import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Upload, Check, AlertCircle } from 'lucide-react'
import alatService from '../services/alatService'
import uploadService from '../services/uploadService'
import { saveDraft, loadDraft, deleteDraft, hasDraft } from '../utils/draftStorage'

export default function FormAlatPage({
  editData,
  kategoriList = [],
  lokasiList = [],
  onBack,
  onSuccess
}) {
  const isEdit = Boolean(editData)
  const draftKey = isEdit ? `edit_${editData.id}` : 'alat_create'

  const [form, setForm] = useState({
    kode_inventaris: editData?.kode_inventaris || 'WPL-RC-050',
    nama_barang: editData?.nama_barang || '',
    kategori_id: editData?.kategori_id || kategoriList[0]?.id || 1,
    merk: editData?.merk || '',
    tipe_model: editData?.tipe_model || '',
    deskripsi: editData?.deskripsi || '',
    ciri_ciri: editData?.ciri_ciri || '',
    foto_url: editData?.foto_url || '',
    jumlah_total: editData?.jumlah_total ?? 1,
    jumlah_tersedia: editData?.jumlah_tersedia ?? 1,
    kondisi: editData?.kondisi || 'Baik',
    lokasi_id: editData?.lokasi_id || lokasiList[0]?.id || 1,
    tahun_pembelian: editData?.tahun_pembelian || 2026,
    status: editData?.status || 'Tersedia',
    catatan: editData?.catatan || ''
  })

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draftNotice, setDraftNotice] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit && hasDraft(draftKey)) {
      const saved = loadDraft(draftKey)
      if (saved) {
        setForm((prev) => ({ ...prev, ...saved }))
        setDraftNotice(true)
      }
    }
  }, [isEdit, draftKey])

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)
    saveDraft(next, draftKey)
  }

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadService.uploadImage(file, 'alat')
      const next = { ...form, foto_url: url }
      setForm(next)
      saveDraft(next, draftKey)
    } catch (err) {
      alert(err.message || 'Gagal mengunggah foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        kategori_id: Number(form.kategori_id),
        lokasi_id: Number(form.lokasi_id),
        jumlah_total: Number(form.jumlah_total),
        jumlah_tersedia: isEdit ? Number(form.jumlah_tersedia) : Number(form.jumlah_total),
        tahun_pembelian: Number(form.tahun_pembelian)
      }

      if (isEdit) {
        await alatService.updateAlat(editData.id, payload)
      } else {
        await alatService.createAlat(payload)
      }

      deleteDraft(draftKey)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data inventaris.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="page-title">
        <div>
          <button type="button" className="button secondary" onClick={onBack} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} /> Kembali ke Inventaris
          </button>
          <span className="eyebrow">{isEdit ? 'PERBARUI DATA' : 'REGISTRASI ALAT BARU'}</span>
          <h1>{isEdit ? `Edit: ${editData.nama_barang}` : 'Tambah Inventaris Alat'}</h1>
          <p>Lengkapi spesifikasi, kondisi fisik, dan lokasi penyimpanan barang.</p>
        </div>
      </section>

      {draftNotice && (
        <div className="toast" style={{ marginBottom: 16 }}>
          <Check size={16} />
          <span>Draft form offline berhasil dipulihkan secara otomatis.</span>
        </div>
      )}

      {error && (
        <div className="login-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-grid-3">
          <label>
            Kode Inventaris *
            <input
              name="kode_inventaris"
              value={form.kode_inventaris}
              onChange={handleChange}
              placeholder="Contoh: WPL-RC-001"
              required
            />
          </label>

          <label>
            Nama Barang *
            <input
              name="nama_barang"
              value={form.nama_barang}
              onChange={handleChange}
              placeholder="Contoh: Tali Karnmantel Statis"
              required
            />
          </label>

          <label>
            Kategori Peralatan *
            <select name="kategori_id" value={form.kategori_id} onChange={handleChange}>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>
                  [{k.kode_prefix}] {k.nama_kategori}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid-3">
          <label>
            Merk Pabrikan
            <input
              name="merk"
              value={form.merk}
              onChange={handleChange}
              placeholder="Contoh: Beal / Petzl / Eiger"
            />
          </label>

          <label>
            Tipe / Model
            <input
              name="tipe_model"
              value={form.tipe_model}
              onChange={handleChange}
              placeholder="Contoh: Borneo 4 / Oval Screw"
            />
          </label>

          <label>
            Tahun Pengadaan
            <input
              type="number"
              name="tahun_pembelian"
              value={form.tahun_pembelian}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="form-grid-3">
          <label>
            Jumlah Unit Total *
            <input
              type="number"
              min="1"
              name="jumlah_total"
              value={form.jumlah_total}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Kondisi Fisik *
            <select name="kondisi" value={form.kondisi} onChange={handleChange}>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
              <option value="Karantina">Karantina</option>
              <option value="Hilang">Hilang</option>
            </select>
          </label>

          <label>
            Lokasi Penyimpanan *
            <select name="lokasi_id" value={form.lokasi_id} onChange={handleChange}>
              {lokasiList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama_lokasi}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Ciri-ciri Fisik Barang
          <input
            name="ciri_ciri"
            value={form.ciri_ciri}
            onChange={handleChange}
            placeholder="Warna, nomor seri, kabel ties penanda, tanda khusus..."
          />
        </label>

        <label>
          Deskripsi &amp; SOP Lapangan
          <textarea
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
            rows={3}
            placeholder="Fungsi utama, batas beban, panduan keselamatan..."
          />
        </label>

        <label>
          Catatan Logistik
          <textarea
            name="catatan"
            value={form.catatan}
            onChange={handleChange}
            rows={2}
            placeholder="Riwayat potongan tali, bagian yang diperbaiki, rencana peremajaan..."
          />
        </label>

        <div className="photo-upload-section">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Foto Dokumentasi Alat
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label className="button secondary" style={{ cursor: 'pointer' }}>
              <Upload size={15} /> {uploading ? 'Mengunggah Foto...' : 'Pilih File Foto'}
              <input type="file" accept="image/*" onChange={handleUploadFoto} hidden />
            </label>
            {form.foto_url ? (
              <img
                src={form.foto_url}
                alt="Preview"
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
              />
            ) : (
              <span className="muted" style={{ fontSize: 12 }}>Belum ada foto dipilih</span>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button type="button" className="button secondary" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="button primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Data Alat'}
          </button>
        </div>
      </form>
    </>
  )
}
