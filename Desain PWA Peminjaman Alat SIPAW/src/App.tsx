import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileBarChart,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  PackageCheck,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TentTree,
  Users,
  Wrench,
  X,
} from "lucide-react";

type Page = "dashboard" | "inventaris" | "peminjaman" | "operasional" | "laporan" | "pengaturan";
type Status = "Tersedia" | "Dipinjam" | "Perawatan" | "Karantina";

const inventory = [
  {
    code: "WPL-RC-001",
    name: "Tali Karnmantel Statis",
    brand: "Beal · 90 meter",
    category: "Caving & Rock Climbing",
    total: 4,
    available: 3,
    status: "Tersedia" as Status,
    condition: "Baik",
    location: "Wall Climbing",
    tone: "rope",
  },
  {
    code: "WPL-RC-002",
    name: "Harness Rock Climbing",
    brand: "Beal / Petzl · Seat Harness",
    category: "Caving & Rock Climbing",
    total: 7,
    available: 5,
    status: "Tersedia" as Status,
    condition: "2 perlu perbaikan",
    location: "Wall Climbing",
    tone: "harness",
  },
  {
    code: "WPL-RC-003",
    name: "Carabiner Oval Screw",
    brand: "Petzl / Camp · Alloy",
    category: "Caving & Rock Climbing",
    total: 24,
    available: 24,
    status: "Tersedia" as Status,
    condition: "Baik",
    location: "Wall Climbing",
    tone: "carabiner",
  },
  {
    code: "WPL-MNT-001",
    name: "Tenda Dome Tendaki",
    brand: "Tendaki · Borneo 4",
    category: "Mountaineering",
    total: 4,
    available: 4,
    status: "Tersedia" as Status,
    condition: "Baik",
    location: "Sekretariat PKM",
    tone: "tent",
  },
  {
    code: "WPL-MNT-002",
    name: "Tenda Great Outdoor",
    brand: "Great Outdoor · Java 4",
    category: "Mountaineering",
    total: 2,
    available: 0,
    status: "Perawatan" as Status,
    condition: "Rusak ringan",
    location: "Sekretariat PKM",
    tone: "tent2",
  },
  {
    code: "WPL-MNT-003",
    name: "Carrier Eiger 60L",
    brand: "Eiger · Mountaineering 60L",
    category: "Mountaineering",
    total: 5,
    available: 3,
    status: "Dipinjam" as Status,
    condition: "2 perlu dijahit",
    location: "Sekretariat PKM",
    tone: "carrier",
  },
  {
    code: "WPL-WTR-001",
    name: "Perahu Karet Rafting",
    brand: "West Point · 380cm PVC",
    category: "Water Sport",
    total: 1,
    available: 1,
    status: "Tersedia" as Status,
    condition: "Baik",
    location: "Gudang Rusunawa",
    tone: "boat",
  },
  {
    code: "WPL-WTR-002",
    name: "Life Jacket Elcamino",
    brand: "Elcamino · Standard",
    category: "Water Sport",
    total: 7,
    available: 7,
    status: "Tersedia" as Status,
    condition: "Baik",
    location: "Gudang Rusunawa",
    tone: "jacket",
  },
  {
    code: "WPL-KOM-001",
    name: "Handy Talky Icom",
    brand: "Icom · IC-V80",
    category: "Alat Komunikasi",
    total: 2,
    available: 1,
    status: "Dipinjam" as Status,
    condition: "Baik",
    location: "Sekretariat PKM",
    tone: "radio",
  },
  {
    code: "WPL-LOG-001",
    name: "Tas Medis Lapangan",
    brand: "WAPEALA Custom",
    category: "P3K & Lain-lain",
    total: 2,
    available: 2,
    status: "Tersedia" as Status,
    condition: "Perlu cek resleting",
    location: "Sekretariat PKM",
    tone: "medical",
  },
];

const loans = [
  {
    code: "PJM-20261128-014",
    name: "Adzka Mahendra",
    activity: "Simulasi Lanjut RC",
    items: "8 jenis alat",
    due: "02 Des 2026",
    status: "Dipinjam",
    initials: "AM",
  },
  {
    code: "PJM-20261127-012",
    name: "Nadia Oktaviani",
    activity: "Survei Goa Petruk",
    items: "12 jenis alat",
    due: "01 Des 2026",
    status: "Terlambat",
    initials: "NO",
  },
  {
    code: "PJM-20261129-016",
    name: "Fikri Ramadhan",
    activity: "Latihan Navigasi Darat",
    items: "4 jenis alat",
    due: "05 Des 2026",
    status: "Menunggu",
    initials: "FR",
  },
  {
    code: "PJM-20261126-009",
    name: "Raka Pratama",
    activity: "Rafting Elo",
    items: "5 jenis alat",
    due: "30 Nov 2026",
    status: "Disetujui",
    initials: "RP",
  },
];

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "inventaris" as Page, label: "Inventaris", icon: Boxes },
  { id: "peminjaman" as Page, label: "Peminjaman", icon: History, badge: 3 },
  { id: "operasional" as Page, label: "Operasional", icon: Wrench },
  { id: "laporan" as Page, label: "Laporan & Analitik", icon: BarChart3 },
];

const categoryColors: Record<string, string> = {
  "Caving & Rock Climbing": "#d35f33",
  Mountaineering: "#275f4e",
  "Water Sport": "#287c91",
  "Alat Komunikasi": "#76644b",
  "P3K & Lain-lain": "#a44343",
};

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <TentTree size={24} strokeWidth={1.8} />
      </div>
      <div>
        <b>SIPAW</b>
        <span>WAPEALA UNDIP</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const type = status.toLowerCase().replace(" ", "-");
  return (
    <span className={`status status-${type}`}>
      <i />
      {status}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">SIPAW WAPEALA</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Dashboard({
  onNavigate,
  onNewLoan,
}: {
  onNavigate: (page: Page) => void;
  onNewLoan: () => void;
}) {
  const metrics = [
    {
      label: "Total Unit",
      value: "347",
      note: "124 jenis alat",
      icon: Boxes,
      tone: "green",
      trend: "+12 tahun ini",
    },
    {
      label: "Tersedia",
      value: "286",
      note: "82,4% dari total",
      icon: PackageCheck,
      tone: "teal",
      trend: "Siap digunakan",
    },
    {
      label: "Dipinjam",
      value: "38",
      note: "7 transaksi aktif",
      icon: ArrowUpRight,
      tone: "blue",
      trend: "11% inventaris",
    },
    {
      label: "Perlu Perhatian",
      value: "23",
      note: "14 rusak · 9 servis",
      icon: AlertTriangle,
      tone: "orange",
      trend: "6 prioritas tinggi",
    },
  ];
  return (
    <>
      <section className="welcome">
        <div>
          <span className="eyebrow">SENIN, 30 NOVEMBER 2026</span>
          <h1>Selamat pagi, Adzka.</h1>
          <p>Berikut kondisi inventaris dan aktivitas logistik WAPEALA hari ini.</p>
        </div>
        <div className="welcome-actions">
          <button className="button secondary" onClick={() => onNavigate("inventaris")}>
            <QrCode size={17} /> Scan alat
          </button>
          <button className="button primary" onClick={onNewLoan}>
            <Plus size={17} /> Ajukan peminjaman
          </button>
        </div>
      </section>

      <div className="metric-grid">
        {metrics.map((m) => (
          <article className="metric-card" key={m.label}>
            <div className={`metric-icon ${m.tone}`}>
              <m.icon size={20} />
            </div>
            <div className="metric-top">
              <span>{m.label}</span>
              <MoreHorizontal size={18} />
            </div>
            <strong>{m.value}</strong>
            <div className="metric-foot">
              <span>{m.note}</span>
              <small>{m.trend}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Aktivitas peminjaman</h2>
              <p>Jumlah transaksi 6 bulan terakhir</p>
            </div>
            <button className="select-button">
              6 bulan <ChevronDown size={15} />
            </button>
          </div>
          <div className="chart">
            <div className="y-labels">
              <span>24</span>
              <span>18</span>
              <span>12</span>
              <span>6</span>
              <span>0</span>
            </div>
            <div className="bars">
              {[
                { m: "Jun", v: 42, n: 10 },
                { m: "Jul", v: 58, n: 14 },
                { m: "Agu", v: 72, n: 17 },
                { m: "Sep", v: 62, n: 15 },
                { m: "Okt", v: 88, n: 21 },
                { m: "Nov", v: 76, n: 18 },
              ].map((b) => (
                <div className="bar-column" key={b.m}>
                  <div className="bar-value">{b.n}</div>
                  <div className="bar" style={{ height: `${b.v}%` }} />
                  <span>{b.m}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-summary">
            <span>
              <i className="dot green-dot" /> Total 95 transaksi
            </span>
            <b>+18,7%</b>
            <small>dari periode sebelumnya</small>
          </div>
        </section>

        <section className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h2>Perlu perhatian</h2>
              <p>Tindak lanjut logistik terdekat</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("operasional")}>
              Lihat semua <ChevronRight size={15} />
            </button>
          </div>
          <div className="attention-list">
            <div className="attention-item red">
              <div className="attention-icon">
                <Clock3 size={18} />
              </div>
              <div>
                <b>1 peminjaman terlambat</b>
                <span>Survei Goa Petruk · 1 hari</span>
              </div>
              <ChevronRight size={17} />
            </div>
            <div className="attention-item orange">
              <div className="attention-icon">
                <Wrench size={18} />
              </div>
              <div>
                <b>6 alat perlu perbaikan</b>
                <span>2 prioritas keselamatan tinggi</span>
              </div>
              <ChevronRight size={17} />
            </div>
            <div className="attention-item blue">
              <div className="attention-icon">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <b>Stock opname Desember</b>
                <span>Dijadwalkan 05 Des 2026</span>
              </div>
              <ChevronRight size={17} />
            </div>
            <div className="attention-item amber">
              <div className="attention-icon">
                <Boxes size={18} />
              </div>
              <div>
                <b>4 stok habis pakai menipis</b>
                <span>Gas, baterai, plester, rafia</span>
              </div>
              <ChevronRight size={17} />
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid lower">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Peminjaman terbaru</h2>
              <p>Pengajuan dan transaksi aktif</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("peminjaman")}>
              Kelola <ChevronRight size={15} />
            </button>
          </div>
          <div className="loan-list">
            {loans.slice(0, 3).map((loan) => (
              <div className="loan-row" key={loan.code}>
                <div className="avatar">{loan.initials}</div>
                <div className="loan-person">
                  <b>{loan.name}</b>
                  <span>{loan.activity}</span>
                </div>
                <div className="loan-date">
                  <span>Jatuh tempo</span>
                  <b>{loan.due}</b>
                </div>
                <StatusPill status={loan.status} />
              </div>
            ))}
          </div>
        </section>
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <h2>Inventaris per kategori</h2>
              <p>Distribusi 347 unit aktif</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>347</strong>
                <span>unit</span>
              </div>
            </div>
            <div className="legend">
              {[
                ["Caving & Rock Climbing", 156, "#d35f33"],
                ["Mountaineering", 92, "#275f4e"],
                ["Water Sport", 48, "#287c91"],
                ["Komunikasi & Lainnya", 51, "#bd9b65"],
              ].map(([name, count, color]) => (
                <div key={String(name)}>
                  <i style={{ background: String(color) }} />
                  <span>{name}</span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Inventaris({ onAdd }: { onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua kategori");
  const [status, setStatus] = useState("Semua status");
  const [view, setView] = useState<"table" | "grid">("table");
  const filtered = useMemo(
    () =>
      inventory.filter(
        (i) =>
          (i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.code.toLowerCase().includes(search.toLowerCase())) &&
          (category === "Semua kategori" || i.category === category) &&
          (status === "Semua status" || i.status === status),
      ),
    [search, category, status],
  );
  const categories = ["Semua kategori", ...Array.from(new Set(inventory.map((i) => i.category)))];
  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">DATA MASTER · PERIODE 2026</span>
          <h1>Inventaris peralatan</h1>
          <p>Kelola data, kondisi, lokasi, dan ketersediaan seluruh alat WAPEALA.</p>
        </div>
        <button className="button primary" onClick={onAdd}>
          <Plus size={17} /> Tambah alat
        </button>
      </section>
      <div className="mini-stats">
        <div>
          <span>Total jenis alat</span>
          <strong>124</strong>
          <small>347 unit tercatat</small>
        </div>
        <div>
          <span>Kondisi baik</span>
          <strong>101</strong>
          <small className="positive">81,5% inventaris</small>
        </div>
        <div>
          <span>Perlu perbaikan</span>
          <strong>14</strong>
          <small>6 prioritas tinggi</small>
        </div>
        <div>
          <span>Karantina</span>
          <strong>9</strong>
          <small>Tidak dapat dipinjam</small>
        </div>
      </div>
      <section className="panel inventory-panel">
        <div className="toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode inventaris..."
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Semua status", "Tersedia", "Dipinjam", "Perawatan", "Karantina"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="view-switch">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>
              <Menu size={16} />
            </button>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>
              <Boxes size={16} />
            </button>
          </div>
        </div>
        <div className="result-line">
          <span>
            Menampilkan <b>{filtered.length}</b> dari 124 jenis alat
          </span>
          <button>
            <ArrowDownToLine size={15} /> Export
          </button>
        </div>
        {view === "table" ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Kondisi</th>
                  <th>Status</th>
                  <th>Lokasi</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.code}>
                    <td>
                      <div className="item-name">
                        <div className={`item-thumb ${item.tone}`}>
                          <TentTree size={20} />
                        </div>
                        <div>
                          <b>{item.name}</b>
                          <span>
                            {item.code} · {item.brand}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">
                        <i style={{ background: categoryColors[item.category] }} />
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <b>{item.available}</b>
                      <span className="muted"> / {item.total} unit</span>
                    </td>
                    <td>
                      <span
                        className={item.condition === "Baik" ? "condition-good" : "condition-warn"}
                      >
                        {item.condition}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={item.status} />
                    </td>
                    <td>{item.location}</td>
                    <td>
                      <button className="icon-button">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inventory-grid">
            {filtered.map((item) => (
              <article className="inventory-card" key={item.code}>
                <div className={`inventory-visual ${item.tone}`}>
                  <TentTree size={36} />
                  <StatusPill status={item.status} />
                </div>
                <span className="eyebrow">{item.code}</span>
                <h3>{item.name}</h3>
                <p>{item.brand}</p>
                <div>
                  <span>Tersedia</span>
                  <b>
                    {item.available} / {item.total} unit
                  </b>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Peminjaman({ onNewLoan }: { onNewLoan: () => void }) {
  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">SIRKULASI ALAT</span>
          <h1>Peminjaman & pengembalian</h1>
          <p>Validasi pengajuan, serah terima, dan pantau pengembalian alat.</p>
        </div>
        <button className="button primary" onClick={onNewLoan}>
          <Plus size={17} /> Pengajuan baru
        </button>
      </section>
      <div className="tab-row">
        <button className="active">
          Semua <span>18</span>
        </button>
        <button>
          Menunggu <span>3</span>
        </button>
        <button>
          Dipinjam <span>7</span>
        </button>
        <button>
          Terlambat <span>1</span>
        </button>
        <button>Selesai</button>
      </div>
      <section className="panel loan-table">
        <div className="toolbar">
          <div className="search-field">
            <Search size={17} />
            <input placeholder="Cari kode, anggota, atau kegiatan..." />
          </div>
          <select>
            <option>30 hari terakhir</option>
          </select>
          <button className="button secondary">
            <FileText size={16} /> Laporan
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kode & peminjam</th>
                <th>Kegiatan</th>
                <th>Peralatan</th>
                <th>Jatuh tempo</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.code}>
                  <td>
                    <div className="person-cell">
                      <div className="avatar">{loan.initials}</div>
                      <div>
                        <b>{loan.name}</b>
                        <span>{loan.code}</span>
                      </div>
                    </div>
                  </td>
                  <td>{loan.activity}</td>
                  <td>{loan.items}</td>
                  <td>
                    <b className={loan.status === "Terlambat" ? "danger-text" : ""}>{loan.due}</b>
                  </td>
                  <td>
                    <StatusPill status={loan.status} />
                  </td>
                  <td>
                    <button className="text-button">
                      {loan.status === "Menunggu" ? "Tinjau" : "Detail"} <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Operasional() {
  const cards = [
    {
      icon: FileText,
      title: "Berita Acara",
      value: "4 kasus",
      text: "2 kerusakan dalam proses",
      color: "orange",
    },
    {
      icon: Wrench,
      title: "Perawatan Alat",
      value: "9 alat",
      text: "3 servis selesai bulan ini",
      color: "green",
    },
    {
      icon: ClipboardCheck,
      title: "Stock Opname",
      value: "05 Des",
      text: "Pemeriksaan Triwulan IV",
      color: "blue",
    },
    {
      icon: CalendarDays,
      title: "Booking Internal",
      value: "6 booking",
      text: "2 kegiatan pekan ini",
      color: "amber",
    },
  ];
  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">PEMELIHARAAN & KONTROL</span>
          <h1>Operasional logistik</h1>
          <p>Kelola insiden, perawatan berkala, stock opname, dan booking internal.</p>
        </div>
        <button className="button primary">
          <Plus size={17} /> Buat berita acara
        </button>
      </section>
      <div className="operation-grid">
        {cards.map((c) => (
          <article className="operation-card" key={c.title}>
            <div className={`metric-icon ${c.color}`}>
              <c.icon size={21} />
            </div>
            <span>{c.title}</span>
            <strong>{c.value}</strong>
            <p>{c.text}</p>
            <button>
              Buka modul <ChevronRight size={15} />
            </button>
          </article>
        ))}
      </div>
      <section className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <h2>Jadwal & tindak lanjut</h2>
            <p>Agenda operasional logistik mendatang</p>
          </div>
        </div>
        {[
          [
            "02 DES",
            "Evaluasi Tenda Great Outdoor",
            "Pemeriksaan seam seal dan frame · Sekretariat PKM",
            "Perawatan",
          ],
          ["05 DES", "Stock Opname Triwulan IV", "124 jenis alat · 3 lokasi penyimpanan", "Opname"],
          [
            "08 DES",
            "Booking Diklatsar 2026",
            "Mountaineering & navigasi darat · 34 unit",
            "Booking",
          ],
        ].map((x) => (
          <div className="timeline-row" key={x[0]}>
            <div className="date-box">
              {x[0].split(" ")[0]}
              <b>{x[0].split(" ")[1]}</b>
            </div>
            <div>
              <b>{x[1]}</b>
              <span>{x[2]}</span>
            </div>
            <StatusPill status={x[3]} />
            <ChevronRight size={18} />
          </div>
        ))}
      </section>
    </>
  );
}

function Reports() {
  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">EVALUASI PERIODE 2026</span>
          <h1>Laporan & analitik</h1>
          <p>Pantau utilisasi aset dan unduh laporan administrasi WAPEALA.</p>
        </div>
        <button className="button primary">
          <ArrowDownToLine size={17} /> Export laporan
        </button>
      </section>
      <div className="report-grid">
        {[
          ["Inventaris", "Daftar lengkap alat, stok, kondisi, dan lokasi", Boxes],
          ["Peminjaman & denda", "Riwayat transaksi, keterlambatan, dan denda", History],
          ["Kerusakan & perawatan", "Kasus, biaya, dan progres penyelesaian", Wrench],
          ["Stock opname", "Selisih stok dan hasil pemeriksaan fisik", ClipboardCheck],
        ].map(([title, desc, Icon]) => (
          <article className="report-card" key={String(title)}>
            <div className="report-icon">
              <Icon size={21} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
            <button className="icon-button">
              <ArrowDownToLine size={17} />
            </button>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Alat paling sering dipinjam</h2>
              <p>Berdasarkan jumlah unit selama 2026</p>
            </div>
          </div>
          {[
            ["Carabiner Oval Screw", 84, 100],
            ["Harness Rock Climbing", 67, 80],
            ["Carrier Eiger 60L", 52, 62],
            ["Tenda Dome Tendaki", 38, 45],
            ["Handy Talky Icom", 29, 35],
          ].map(([n, v, w], i) => (
            <div className="rank-row" key={String(n)}>
              <b>{i + 1}</b>
              <span>{n}</span>
              <div>
                <i style={{ width: `${w}%` }} />
              </div>
              <strong>{v}x</strong>
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ringkasan kesehatan aset</h2>
              <p>Kondisi seluruh unit inventaris</p>
            </div>
          </div>
          <div className="health-number">
            <strong>82,4%</strong>
            <span>aset dalam kondisi baik</span>
          </div>
          <div className="health-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="health-legend">
            <span>
              <i className="good" />
              286 baik
            </span>
            <span>
              <i className="warn" />
              38 perhatian
            </span>
            <span>
              <i className="bad" />
              23 rusak
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <section className="page-title">
        <div>
          <span className="eyebrow">ADMINISTRASI SISTEM</span>
          <h1>Pengaturan</h1>
          <p>Kelola pengguna, kebijakan peminjaman, kategori, dan audit log.</p>
        </div>
      </section>
      <div className="settings-grid">
        {[
          ["Manajemen pengguna", "Akun, role, dan hak akses anggota", Users],
          ["Kebijakan peminjaman", "Durasi maksimal dan besaran denda", ShieldCheck],
          ["Kategori & lokasi", "Master kategori dan lokasi penyimpanan", Boxes],
          ["Audit log", "Riwayat aktivitas dan perubahan data", FileBarChart],
        ].map(([title, desc, Icon]) => (
          <button className="setting-card" key={String(title)}>
            <div className="report-icon">
              <Icon size={21} />
            </div>
            <div>
              <b>{title}</b>
              <span>{desc}</span>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<"loan" | "asset" | null>(null);
  const [toast, setToast] = useState("");
  const title = navItems.find((i) => i.id === page)?.label || "Pengaturan";
  const save = (message: string) => {
    setModal(null);
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={mobileOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <Brand />
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          <span className="nav-label">MENU UTAMA</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileOpen(false);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && <b className="nav-badge">{item.badge}</b>}
            </button>
          ))}
          <span className="nav-label second">SISTEM</span>
          <button
            className={page === "pengaturan" ? "active" : ""}
            onClick={() => {
              setPage("pengaturan");
              setMobileOpen(false);
            }}
          >
            <Settings size={18} />
            <span>Pengaturan</span>
          </button>
        </nav>
        <div className="sidebar-card">
          <div>
            <ShieldCheck size={18} />
            <b>Mode pengurus</b>
          </div>
          <p>Akses penuh modul logistik aktif.</p>
          <button>Lihat hak akses</button>
        </div>
        <div className="profile">
          <div className="avatar">AM</div>
          <div>
            <b>Adzka Mahendra</b>
            <span>Pengurus Logistik</span>
          </div>
          <button>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
              <Menu size={21} />
            </button>
            <span>{title}</span>
            <i />
            <small>Periode 2026</small>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input placeholder="Cari apa saja..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button notification">
              <Bell size={18} />
              <i />
            </button>
          </div>
        </header>
        <main>
          {page === "dashboard" && (
            <Dashboard onNavigate={setPage} onNewLoan={() => setModal("loan")} />
          )}
          {page === "inventaris" && <Inventaris onAdd={() => setModal("asset")} />}
          {page === "peminjaman" && <Peminjaman onNewLoan={() => setModal("loan")} />}
          {page === "operasional" && <Operasional />}
          {page === "laporan" && <Reports />}
          {page === "pengaturan" && <SettingsPage />}
        </main>
      </div>
      {modal === "loan" && (
        <Modal title="Ajukan peminjaman" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save("Pengajuan peminjaman berhasil dibuat");
            }}
            className="modal-form"
          >
            <label>
              Nama kegiatan
              <input required placeholder="Contoh: Simulasi Lanjut RC" />
            </label>
            <div className="form-row">
              <label>
                Tanggal pinjam
                <input required type="date" />
              </label>
              <label>
                Rencana kembali
                <input required type="date" />
              </label>
            </div>
            <label>
              Pilih peralatan
              <select required defaultValue="">
                <option value="" disabled>
                  Pilih alat dari inventaris
                </option>
                {inventory
                  .filter((i) => i.available > 0)
                  .map((i) => (
                    <option key={i.code}>
                      {i.name} — {i.available} tersedia
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Catatan
              <textarea placeholder="Kebutuhan khusus, lokasi kegiatan, atau catatan lain..." />
            </label>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setModal(null)}>
                Batal
              </button>
              <button className="button primary">
                <Check size={16} /> Kirim pengajuan
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "asset" && (
        <Modal title="Tambah alat baru" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save("Data alat berhasil disimpan");
            }}
            className="modal-form"
          >
            <div className="form-row">
              <label>
                Kode inventaris
                <input required placeholder="WPL-RC-000" />
              </label>
              <label>
                Jumlah
                <input required type="number" min="1" defaultValue="1" />
              </label>
            </div>
            <label>
              Nama alat
              <input required placeholder="Nama peralatan" />
            </label>
            <div className="form-row">
              <label>
                Kategori
                <select>
                  <option>Caving & Rock Climbing</option>
                  <option>Mountaineering</option>
                  <option>Water Sport</option>
                  <option>Alat Komunikasi</option>
                </select>
              </label>
              <label>
                Kondisi
                <select>
                  <option>Baik</option>
                  <option>Rusak Ringan</option>
                  <option>Karantina</option>
                </select>
              </label>
            </div>
            <label>
              Catatan kondisi
              <textarea placeholder="Ciri-ciri, kondisi fisik, dan catatan penggunaan..." />
            </label>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setModal(null)}>
                Batal
              </button>
              <button className="button primary">
                <Check size={16} /> Simpan alat
              </button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
