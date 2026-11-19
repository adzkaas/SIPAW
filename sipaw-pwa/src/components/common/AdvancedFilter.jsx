import { Search } from 'lucide-react'

export default function AdvancedFilter({
  search,
  onSearch,
  categories,
  activeCategory,
  onCategory,
  activeStatus,
  onStatus,
  locations,
  activeLocation,
  onLocation
}) {
  const statusOptions = ['ALL', 'Tersedia', 'Dipinjam', 'Perawatan', 'Karantina', 'Hilang']

  return (
    <div className="adv-filter-box">
      <div className="toolbar" style={{ border: 0, padding: 0 }}>
        <div className="search-field" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Cari kode inventaris, nama alat, atau merk..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <select
          value={activeStatus}
          onChange={(e) => onStatus(e.target.value)}
          style={{ width: 140 }}
        >
          {statusOptions.map((st) => (
            <option key={st} value={st}>
              {st === 'ALL' ? 'Semua Status' : st}
            </option>
          ))}
        </select>

        <select
          value={activeLocation}
          onChange={(e) => onLocation(e.target.value)}
          style={{ width: 170 }}
        >
          <option value="ALL">Semua Lokasi Simpan</option>
          {locations.map((lok) => (
            <option key={lok.id} value={lok.id}>
              {lok.nama_lokasi}
            </option>
          ))}
        </select>
      </div>

      <div className="tab-row" style={{ marginTop: 12, marginBottom: 0 }}>
        <button
          type="button"
          className={activeCategory === 'ALL' ? 'active' : ''}
          onClick={() => onCategory('ALL')}
        >
          Semua Kategori
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={String(activeCategory) === String(cat.id) ? 'active' : ''}
            onClick={() => onCategory(cat.id)}
          >
            {cat.nama_kategori}
          </button>
        ))}
      </div>
    </div>
  )
}
