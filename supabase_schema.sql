-- ============================================================================
-- SIPAW (SISTEM PEMINJAMAN ALAT WAPEALA) - SUPABASE POSTGRESQL SCHEMA & SEED
-- Database: Supabase (PostgreSQL 15+)
-- Proyek: https://goahbbamamzckclebnkz.supabase.co
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- 0. KEEPALIVE AUTO-PING (ANTI-PAUSE SUPABASE FREE TIER)
-- Setiap hari jam 00:00 UTC akan otomatis melakukan INSERT agar database aktif
-- ============================================================================
CREATE TABLE IF NOT EXISTS keepalive_heartbeat (
    id SERIAL PRIMARY KEY,
    ping_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    catatan TEXT DEFAULT 'Keep-alive daily ping anti-pause SIPAW WAPEALA'
);

-- Hapus job lama jika ada agar tidak duplikat
DO $$
BEGIN
    PERFORM cron.unschedule('sipaw-keepalive-daily');
EXCEPTION WHEN OTHERS THEN
    -- abaikan jika job belum ada
END $$;

-- Jadwalkan cron internal Supabase berjalan setiap hari jam 00:00 UTC
SELECT cron.schedule(
    'sipaw-keepalive-daily',
    '0 0 * * *',
    $$INSERT INTO keepalive_heartbeat (ping_time, catatan) VALUES (NOW(), 'Keep-alive daily auto-ping SIPAW WAPEALA');$$
);

-- Pembersihan berkala otomatis (setiap tanggal 1 jam 01:00 UTC): hanya simpan 30 hari terakhir
DO $$
BEGIN
    PERFORM cron.unschedule('sipaw-keepalive-cleanup');
EXCEPTION WHEN OTHERS THEN
END $$;

SELECT cron.schedule(
    'sipaw-keepalive-cleanup',
    '0 1 1 * *',
    $$DELETE FROM keepalive_heartbeat WHERE ping_time < NOW() - INTERVAL '30 days';$$
);


-- 1. PENGATURAN SISTEM (Fitur 16)
CREATE TABLE IF NOT EXISTS pengaturan_sistem (
    id INT PRIMARY KEY DEFAULT 1,
    nama_organisasi VARCHAR(150) DEFAULT 'WAPEALA UNIVERSITAS DIPONEGORO',
    alamat_sekretariat TEXT DEFAULT 'Gedung PKM Fakultas Teknik Universitas Diponegoro, Tembalang, Semarang',
    maks_hari_pinjam INT NOT NULL DEFAULT 7,
    denda_per_hari NUMERIC(12, 2) NOT NULL DEFAULT 10000,
    batas_stok_menipis INT NOT NULL DEFAULT 2,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pengaturan_sistem (id, nama_organisasi, maks_hari_pinjam, denda_per_hari, batas_stok_menipis)
VALUES (1, 'WAPEALA UNIVERSITAS DIPONEGORO', 7, 10000, 2)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 2. MANAJEMEN PENGGUNA (Fitur 12)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nia VARCHAR(50) UNIQUE NOT NULL, -- Nomor Induk Anggota WAPEALA
    nama VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    no_hp VARCHAR(25),
    role VARCHAR(30) NOT NULL CHECK (role IN ('super_admin', 'pengurus_logistik', 'anggota')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KATEGORI BARANG & LOKASI PENYIMPANAN (Fitur 3 & 16)
CREATE TABLE IF NOT EXISTS kategori_barang (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) UNIQUE NOT NULL,
    kode_prefix VARCHAR(10) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lokasi_penyimpanan (
    id SERIAL PRIMARY KEY,
    nama_lokasi VARCHAR(100) UNIQUE NOT NULL,
    keterangan TEXT
);

-- 4. INVENTARIS BARANG (Fitur 2 & 10)
CREATE TABLE IF NOT EXISTS inventaris_barang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_inventaris VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(150) NOT NULL,
    kategori_id INT REFERENCES kategori_barang(id) ON DELETE SET NULL,
    merk VARCHAR(100),
    tipe_model VARCHAR(100),
    deskripsi TEXT,
    ciri_ciri TEXT,
    foto_url TEXT,
    qr_code_value VARCHAR(150) UNIQUE,
    jumlah_total INT NOT NULL DEFAULT 1,
    jumlah_tersedia INT NOT NULL DEFAULT 1,
    kondisi VARCHAR(50) NOT NULL CHECK (kondisi IN ('Baik', 'Rusak Ringan', 'Rusak Berat', 'Karantina', 'Hilang')),
    lokasi_id INT REFERENCES lokasi_penyimpanan(id) ON DELETE SET NULL,
    tahun_pembelian INT DEFAULT 2026,
    status VARCHAR(30) NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Dipinjam', 'Perawatan', 'Karantina', 'Hilang')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PEMINJAMAN & DETAIL PEMINJAMAN (Fitur 4)
CREATE TABLE IF NOT EXISTS peminjaman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_peminjaman VARCHAR(40) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_kegiatan VARCHAR(200) NOT NULL,
    tanggal_pinjam DATE NOT NULL,
    tanggal_kembali_rencana DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu'
        CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak', 'Dipinjam', 'Selesai')),
    alasan_penolakan TEXT,
    approved_by UUID REFERENCES users(id),
    bukti_peminjaman_url TEXT,
    catatan_peminjam TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detail_peminjaman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    peminjaman_id UUID REFERENCES peminjaman(id) ON DELETE CASCADE,
    barang_id UUID REFERENCES inventaris_barang(id) ON DELETE RESTRICT,
    jumlah INT NOT NULL CHECK (jumlah > 0),
    kondisi_awal VARCHAR(50) DEFAULT 'Baik',
    kondisi_kembali VARCHAR(50),
    catatan_item TEXT
);

-- 6. PENGEMBALIAN & DENDA OTOMATIS (Fitur 5)
CREATE TABLE IF NOT EXISTS pengembalian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    peminjaman_id UUID UNIQUE REFERENCES peminjaman(id) ON DELETE CASCADE,
    tanggal_kembali_aktual DATE NOT NULL,
    hari_terlambat INT NOT NULL DEFAULT 0,
    total_denda NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status_denda VARCHAR(20) DEFAULT 'Lunas' CHECK (status_denda IN ('Belum Lunas', 'Lunas')),
    foto_kondisi_url TEXT,
    catatan_kerusakan TEXT,
    diterima_oleh UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BERITA ACARA KEHILANGAN & KERUSAKAN (Fitur 6)
CREATE TABLE IF NOT EXISTS berita_acara (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_ba VARCHAR(60) UNIQUE NOT NULL,
    jenis_kasus VARCHAR(20) NOT NULL CHECK (jenis_kasus IN ('Kerusakan', 'Kehilangan')),
    barang_id UUID REFERENCES inventaris_barang(id) ON DELETE RESTRICT,
    peminjaman_id UUID REFERENCES peminjaman(id) ON DELETE SET NULL,
    penanggung_jawab_id UUID REFERENCES users(id),
    tanggal_kejadian DATE NOT NULL,
    kronologi TEXT NOT NULL,
    foto_bukti_url TEXT,
    tindak_lanjut TEXT,
    status_penyelesaian VARCHAR(30) DEFAULT 'Proses'
        CHECK (status_penyelesaian IN ('Proses', 'Diganti', 'Diperbaiki', 'Selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERAWATAN / SERVIS BARANG (Fitur 7)
CREATE TABLE IF NOT EXISTS perawatan_barang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barang_id UUID REFERENCES inventaris_barang(id) ON DELETE CASCADE,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    jenis_perawatan VARCHAR(120) NOT NULL,
    biaya_perbaikan NUMERIC(12, 2) DEFAULT 0,
    status_perawatan VARCHAR(30) DEFAULT 'Dijadwalkan'
        CHECK (status_perawatan IN ('Dijadwalkan', 'Sedang Diperbaiki', 'Selesai')),
    catatan_teknisi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STOCK OPNAME BERKALA (Fitur 8)
CREATE TABLE IF NOT EXISTS stock_opname (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periode VARCHAR(50) NOT NULL,
    tanggal_opname DATE NOT NULL DEFAULT CURRENT_DATE,
    petugas_id UUID REFERENCES users(id),
    catatan_umum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detail_stock_opname (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opname_id UUID REFERENCES stock_opname(id) ON DELETE CASCADE,
    barang_id UUID REFERENCES inventaris_barang(id) ON DELETE CASCADE,
    jumlah_sistem INT NOT NULL,
    jumlah_fisik INT NOT NULL,
    jumlah_rusak INT DEFAULT 0,
    jumlah_hilang INT DEFAULT 0,
    catatan_pengecekan TEXT
);

-- 10. BOOKING ALAT KEGIATAN INTERNAL (Fitur 9)
CREATE TABLE IF NOT EXISTS booking_alat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_booking VARCHAR(40) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    kegiatan VARCHAR(200) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    daftar_alat JSONB NOT NULL DEFAULT '[]', -- [{barang_id, nama_barang, jumlah}]
    status_booking VARCHAR(30) DEFAULT 'Aktif'
        CHECK (status_booking IN ('Aktif', 'Dikonversi Pinjam', 'Batal', 'Selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BARANG HABIS PAKAI (Fitur 18)
CREATE TABLE IF NOT EXISTS barang_habis_pakai (
    id SERIAL PRIMARY KEY,
    nama_barang VARCHAR(120) NOT NULL,
    satuan VARCHAR(30) NOT NULL,
    stok_saat_ini INT NOT NULL DEFAULT 0,
    batas_minimum INT NOT NULL DEFAULT 3,
    lokasi_id INT REFERENCES lokasi_penyimpanan(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_habis_pakai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id INT REFERENCES barang_habis_pakai(id) ON DELETE CASCADE,
    jenis_transaksi VARCHAR(10) CHECK (jenis_transaksi IN ('MASUK', 'KELUAR')),
    jumlah INT NOT NULL CHECK (jumlah > 0),
    keterangan TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFIKASI & AUDIT LOG (Fitur 14 & 15)
CREATE TABLE IF NOT EXISTS notifikasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast pengurus logistik
    judul VARCHAR(150) NOT NULL,
    pesan TEXT NOT NULL,
    tipe VARCHAR(40) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    nama_user VARCHAR(120),
    aksi VARCHAR(80) NOT NULL,
    modul VARCHAR(50) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGER SINKRONISASI STOK OTOMATIS (PINJAM / KEMBALI)
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_stok_peminjaman() RETURNS TRIGGER AS $$
BEGIN
    -- Saat status peminjaman berubah menjadi 'Dipinjam' -> kurangi jumlah_tersedia
    IF (TG_OP = 'UPDATE' AND OLD.status <> 'Dipinjam' AND NEW.status = 'Dipinjam') THEN
        UPDATE inventaris_barang ib
        SET jumlah_tersedia = GREATEST(0, ib.jumlah_tersedia - dp.jumlah),
            status = CASE WHEN (ib.jumlah_tersedia - dp.jumlah) <= 0 THEN 'Dipinjam' ELSE 'Tersedia' END,
            updated_at = NOW()
        FROM detail_peminjaman dp
        WHERE dp.peminjaman_id = NEW.id AND ib.id = dp.barang_id;
    END IF;

    -- Saat status peminjaman berubah dari 'Dipinjam' ke 'Selesai' -> kembalikan stok
    IF (TG_OP = 'UPDATE' AND OLD.status = 'Dipinjam' AND NEW.status = 'Selesai') THEN
        UPDATE inventaris_barang ib
        SET jumlah_tersedia = LEAST(ib.jumlah_total, ib.jumlah_tersedia + dp.jumlah),
            status = 'Tersedia',
            updated_at = NOW()
        FROM detail_peminjaman dp
        WHERE dp.peminjaman_id = NEW.id AND ib.id = dp.barang_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_stok_peminjaman ON peminjaman;
CREATE TRIGGER trg_sync_stok_peminjaman
AFTER UPDATE ON peminjaman
FOR EACH ROW EXECUTE FUNCTION sync_stok_peminjaman();

-- ============================================================================
-- SEED DATA AWAL: KATEGORI & LOKASI
-- ============================================================================
INSERT INTO kategori_barang (nama_kategori, kode_prefix, deskripsi) VALUES
('Caving & Rock Climbing', 'RC', 'Karnmantel, Harness, Carabiner, Ascender, Descender, Chock, Webbing, Piton'),
('Mountaineering', 'MNT', 'Carrier, Tenda, Sleeping Bag, Cooking Set, Fly Sheet, Kompas, Matras, Nesting'),
('Water Sport', 'WTR', 'Perahu Karet, Life Jacket, Helm Rafting, Dayung, Regulator Selam, Tabung, Masker'),
('Alat Komunikasi', 'KOM', 'Handy Talky (HT), Antena VHF, Charger HT, Konektor Antena'),
('P3K & Logistik Umum', 'LOG', 'Tas Medis Lapangan, Kotak Peluru, Bendera, Wearpack, Kaos SAR, Lampu Badai')
ON CONFLICT (nama_kategori) DO NOTHING;

INSERT INTO lokasi_penyimpanan (nama_lokasi, keterangan) VALUES
('Sekretariat PKM FT', 'Gedung PKM FT Undip - Rak utama perlengkapan gunung, komunikasi & P3K'),
('Wall Climbing Undip', 'Area Wall Climbing Undip - Gudang alat panjat tebing, caving, dan harness'),
('Gudang Rusunawa', 'Gudang Rusunawa Undip - Penyimpanan webbing panjang, perahu karet, dan dayung')
ON CONFLICT (nama_lokasi) DO NOTHING;

-- ============================================================================
-- SEED DATA PENGGUNA (ROLE SESUAI FITUR 12)
-- ============================================================================
INSERT INTO users (nia, nama, email, password_hash, no_hp, role) VALUES
('WPL-001-SA', 'Ketua Umum WAPEALA', 'admin@wapeala.or.id', 'admin123', '081234567890', 'super_admin'),
('WPL-012-LOG', 'Koordinator Logistik PH', 'logistik@wapeala.or.id', 'logistik123', '081298765432', 'pengurus_logistik'),
('WPL-045-AGT', 'Abdurrahman Adzka', 'adzka@students.undip.ac.id', 'anggota123', '085712345678', 'anggota')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SEED DATA INVENTARIS ALAT (CHECKLIST PH PERIODE 2026 WAPEALA)
-- ============================================================================
INSERT INTO inventaris_barang (
    kode_inventaris, nama_barang, kategori_id, merk, tipe_model, deskripsi, ciri_ciri,
    jumlah_total, jumlah_tersedia, kondisi, lokasi_id, tahun_pembelian, status, catatan
) VALUES
-- 1. CAVING & ROCK CLIMBING
('WPL-RC-001', 'Tali Karnmantel Statis', 1, 'Beal', 'Statis 90m (SRT)', 'Tali statis untuk Single Rope Technique (SRT) caving dan ascending/descending', 'Panjang 90 meter, 1 unit karantina, 2 ukuran lebih pendek', 4, 3, 'Baik', 2, 2023, 'Tersedia', '1 tidak layak, 1 diperbaiki, 2 lebih pendek (24m & 90m)'),
('WPL-RC-002', 'Tali Karnmantel Dinastat', 1, 'Beal', 'Dinastat 94m', 'Tali friksi semi-statis untuk lintasan tebing', 'Tali friksi 2x94 meter, aman', 2, 2, 'Baik', 2, 2024, 'Tersedia', 'Aman digunakan ke lapangan'),
('WPL-RC-003', 'Tali Karnmantel Dinamis', 1, 'Beal', 'Dinamis 57m', 'Tali dinamis untuk lead climbing pemanjatan tebing', 'Kabel ties hijau 57m, 1 perlu dipotong', 3, 2, 'Rusak Ringan', 2, 2023, 'Tersedia', '1 perlu perbaikan (dipotong)'),
('WPL-RC-004', 'Potongan Tali Cowstail', 1, 'Lokal / Beal', 'Dinamis Cowstail', 'Potongan tali pengaman cowstail di bawah 5 meter', 'Kabel ties oren 12m & 4 fraksi', 11, 11, 'Baik', 2, 2024, 'Tersedia', 'Masih baik dan dapat dibawa ke lapangan'),
('WPL-RC-005', 'Hammer Pemanjatan', 1, 'Camp', 'Rock Hammer', 'Palu pemanjat untuk pemasangan piton dan hanger', 'Agak karatan, tanpa kabel ties', 2, 2, 'Baik', 2, 2023, 'Tersedia', 'Agak karatan tapi kokoh'),
('WPL-RC-006', 'Chock Stopper Set', 1, 'Black Diamond', 'Stopper #1-10', 'Alat pengaman sisip celah batuan', '10 ukuran kawat sling baja', 10, 10, 'Baik', 2, 2023, 'Tersedia', 'Baik agak karatan'),
('WPL-RC-007', 'Chock Hexentric Set', 1, 'Camp', 'Hexentric #1-18', 'Alat pengaman sisip heksagonal', 'Bentuk heksa 18 ukuran', 18, 18, 'Baik', 2, 2023, 'Tersedia', 'Baik agak karatan'),
('WPL-RC-008', 'Friends / Camming Device', 1, 'Camp', 'Friends Active Cam', 'Pengaman sisip aktif dengan pegas', 'Pegas aktif 3 unit', 3, 3, 'Baik', 2, 2023, 'Tersedia', 'Baik agak karatan'),
('WPL-RC-009', 'Piton Baja Tebing', 1, 'Petzl', 'Blade & Angle Piton', 'Paku tebing batuan kapur dan andesit', '10 unit bilah baja', 10, 10, 'Baik', 2, 2022, 'Tersedia', 'Baik agak karatan'),
('WPL-RC-010', 'Hanger Tebing Stainless', 1, 'Lokal', 'Hanger 10mm', 'Plat gantungan baut tebing panjat', 'Stainless steel, dibeli Simjut RC 2026', 21, 21, 'Baik', 2, 2026, 'Tersedia', 'Pengadaan Simjut RC 2026'),
('WPL-RC-011', 'Harness Rock Climbing', 1, 'Beal / Petzl', 'Seat Harness RC', 'Harness pemanjatan tebing dan dinding wall climbing', 'Warna biru dan hitam, 2 butuh perbaikan jahit', 7, 5, 'Baik', 2, 2024, 'Tersedia', '5 layak lapangan, 2 perlu jahit ulang strap'),
('WPL-RC-012', 'Harness Caving', 1, 'Petzl / Aventure', 'Fractio Caving', 'Harness khusus susur goa dengan pelindung PVC', 'Warna oren dan pink, 1 unit baru', 4, 4, 'Baik', 2, 2025, 'Tersedia', '1 baru, sangat nyaman digunakan'),
('WPL-RC-013', 'Carabiner Oval Screw', 1, 'Petzl / Camp', 'Oval Screw Gate', 'Carabiner pengunci ulir simetris serbaguna', 'Alloy oval screw gate', 24, 24, 'Baik', 2, 2025, 'Tersedia', 'Penambahan 2026'),
('WPL-RC-014', 'Carabiner Delta Screw', 1, 'Petzl', 'Delta Screw Gate', 'Carabiner bentuk D pengunci ulir beban tinggi', 'Bentuk asimetris D screw', 17, 17, 'Baik', 2, 2025, 'Tersedia', '3 unit penambahan 2026'),
('WPL-RC-015', 'Carabiner Oval Snap', 1, 'Petzl', 'Oval Snap Gate', 'Carabiner tanpa ulir untuk cantolan cepat', 'Oval non-locking', 3, 3, 'Baik', 2, 2024, 'Tersedia', 'Butuh penambahan 2027'),
('WPL-RC-016', 'Carabiner Delta Snap', 1, 'Petzl / Camp', 'Delta Snap Gate', 'Carabiner snap gate beban tinggi', '23 aktif lapangan, 2 karantina', 23, 23, 'Baik', 2, 2024, 'Tersedia', '2 unit dikarantina (sisa 23)'),
('WPL-RC-017', 'Carabiner Evernew Oval', 1, 'Evernew', 'Oval Steel', 'Carabiner baja tugas berat', 'Bahan baja agak karatan', 4, 4, 'Rusak Ringan', 2, 2020, 'Tersedia', 'Karatan, butuh peremajaan'),
('WPL-RC-018', 'Sling Webbing Tubular', 1, 'WAPEALA', 'Tubular 60-120cm', 'Sling runner jahitan dari pemotongan webbing panjang', 'Sling webbing aneka warna', 13, 13, 'Baik', 2, 2025, 'Tersedia', 'Penambahan hasil pemotongan webbing panjang'),
('WPL-RC-019', 'Chalk Bag Panjat', 1, 'Deuter / Rhino / Eiger', 'Chalk Bag Tepung', 'Kantung tempat serbuk magnesium pemanjat', '3 normal, 7 perlu perbaikan tali dan strap', 10, 3, 'Rusak Ringan', 2, 2023, 'Tersedia', '3 normal, 7 butuh perbaikan jahit strap'),
('WPL-RC-020', 'Rock Shoes Sepatu Panjat', 1, 'La Sportiva / Scarpa / Ocun', 'Climbing Shoes 39-43', 'Sepatu pemanjatan dinding dan tebing', 'Koleksi La Sportiva, Ocun, Evolv, Scarpa', 5, 4, 'Baik', 2, 2024, 'Tersedia', '4 layak lapangan, 1 perlu lem sol'),
('WPL-RC-021', 'Webbing Tubular Panjang', 1, 'WAPEALA', 'Tubular 25mm Roll', 'Pita webbing penambat utama dan instalasi lintasan', '28 roll di wall, 36 roll di rusun', 28, 28, 'Baik', 2, 2024, 'Tersedia', '28 di wall dan 36 di gudang rusunawa'),
('WPL-RC-022', 'Webbing Pendek Penambat', 1, 'WAPEALA', 'Tubular 3-5 meter', 'Webbing potongan pendek untuk penambat anchor', 'Tersimpan di gudang wall climbing', 20, 20, 'Baik', 2, 2024, 'Tersedia', 'Di gudang wall semua'),
('WPL-RC-023', 'Ascender Petzl Croll', 1, 'Petzl', 'Croll Chest Ascender', 'Alat pemanjat tali dada SRT caving', 'Warna oranye-silver Petzl', 5, 5, 'Baik', 2, 2024, 'Tersedia', 'Masih baik dan aman ke lapangan'),
('WPL-RC-024', 'Ascender Petzl Jumar Handled', 1, 'Petzl', 'Handled Ascender Jumar', 'Alat pemanjat tali tangan SRT kanan & kiri', 'Pegangan ergonomis kuning Petzl', 6, 6, 'Baik', 2, 2024, 'Tersedia', 'Masih baik dan siap operasional'),
('WPL-RC-025', 'Descender Autostop', 1, 'Petzl', 'Stop Descender Caving', 'Alat turun tali caving pengereman otomatis', 'Tuas merah, 1 baru, 2 lama', 3, 3, 'Baik', 2, 2025, 'Tersedia', '1 baru, 2 lama berfungsi baik'),
('WPL-RC-026', 'Descender Figure of 8', 1, 'Camp / Kong', 'Figure 8 Alloy', 'Alat turun tali pemanjatan tebing dan evakuasi', 'Alloy anodized warna merah & hitam', 5, 5, 'Baik', 2, 2023, 'Tersedia', '4 baik, 1 agak aus'),
('WPL-RC-027', 'Pulley Katrol Petzl Fixed', 1, 'Petzl', 'Oscillante Fixed Pulley', 'Katrol evakuasi dan pengangkatan beban SRT', 'Warna kuning Petzl', 2, 2, 'Baik', 2, 2024, 'Tersedia', 'Butuh pembaruan di 2026'),
('WPL-RC-028', 'Pulley Tandem Speed', 1, 'Petzl', 'Tandem Cable & Rope', 'Katrol ganda lintasan tyrolean traverse', 'Katrol roda ganda stainless', 1, 1, 'Baik', 2, 2026, 'Tersedia', 'Penambahan periode 2026'),
('WPL-RC-029', 'Prusik Tali Bantu 6mm & 7mm', 1, 'Beal', 'Accessory Cord 6-7mm', 'Tali prusik untuk gesekan dan footloop darurat', '11 unit 6mm dan 3 unit 7mm', 14, 11, 'Baik', 2, 2024, 'Tersedia', '11 baik, 3 karantina'),
('WPL-RC-030', 'Helm Panjat & Caving', 1, 'Camp / Petzl / Simon', 'Armour & Boreo', 'Helm keselamatan benturan batuan dan tebing', 'Camp putih, Camp merah, Simon', 10, 8, 'Baik', 2, 2024, 'Tersedia', '8 baik, 2 butuh perbaikan strap'),
('WPL-RC-031', 'Maillon Rapide (MR) Delta & Oval', 1, 'Peguet', 'MR Delta 10mm Steel', 'Konektor baja segitiga semi-permanen harness caving', 'Baja lapis seng anti-karat', 4, 4, 'Baik', 2, 2024, 'Tersedia', 'Baik dan kokoh'),
('WPL-RC-032', 'Tackle Bag Caving Stalaktit', 1, 'Stalaktit', 'Heavy Duty PVC 35L', 'Tas angkut perlengkapan susur goa anti-air dan gesekan', 'PVC tebal kuning/merah, 5 di wall, 3 di rusun', 6, 6, 'Baik', 2, 2023, 'Tersedia', 'Siap lapangan'),
('WPL-RC-033', 'Sepatu Boots Karet Lapangan', 1, 'Inkayni / Lokal', 'Boots Karet Panjang', 'Sepatu boots susur goa basah dan lumpur', 'Warna hitam ukuran 39-44', 17, 14, 'Baik', 2, 2024, 'Tersedia', '14 sepasang siap lapangan, 3 tidak sepasang'),

-- 2. MOUNTAINEERING (GUNUNG HUTAN)
('WPL-MNT-001', 'Tenda Dome Tendaki Borneo 4', 2, 'Tendaki', 'Borneo 4 Double Layer', 'Tenda kapasitas 4-5 orang tahan cuaca ekstrem', 'Kuning-abu, frame alloy kuat', 4, 4, 'Baik', 1, 2026, 'Tersedia', '3 unit penambahan baru periode 2026'),
('WPL-MNT-002', 'Tenda Dome Great Outdoor Java 4', 2, 'Great Outdoor', 'Java 4 Pro', 'Tenda ekspedisi gunung hutan kapasitas 4 orang', 'Oranye-abu, perlu perbaikan seam seal', 2, 0, 'Rusak Ringan', 1, 2022, 'Perawatan', 'Butuh di-seal dan perbaikan frame'),
('WPL-MNT-003', 'Tenda LWY Compass Dome', 2, 'LWY Compass', 'Compass 4P', 'Tenda lapangan gunung hutan', 'Butuh pelapisan dan perbaikan inner', 2, 0, 'Rusak Ringan', 1, 2023, 'Perawatan', 'Inner hilang sejak 2024'),
('WPL-MNT-004', 'Crampon Salju & Es Camp', 2, 'Camp', '10-Point Crampon', 'Gigi cakar es ekspedisi gunung es', 'Baja 10 titik agak karatan', 3, 3, 'Baik', 1, 2021, 'Tersedia', 'Baik agak karatan'),
('WPL-MNT-005', 'Ice Axe Kapak Es', 2, 'Camp', 'Mountaineering Axe 65cm', 'Kapak es penahan jatuh dan pemotong jalur', 'Alloy shaft dengan pick baja', 3, 3, 'Baik', 1, 2021, 'Tersedia', 'Baik dan kokoh'),
('WPL-MNT-006', 'Kompas Bidik Navigasi Darat', 2, 'Suunto / Lokal', 'Lensatic Military Compass', 'Kompas bidik presisi navigasi darat', 'Casing logam hijau army', 11, 8, 'Baik', 1, 2023, 'Tersedia', '8 baik, 3 rusak jarum'),
('WPL-MNT-007', 'Carrier Eiger 60L Mountaineering', 2, 'Eiger', 'Mountaineering 60L', 'Tas gunung keril ekspedisi kapasitas 60 liter', 'Warna biru, hijau, pink', 5, 3, 'Rusak Ringan', 1, 2022, 'Tersedia', '3 layak, 2 sobek perlu jahit pundak'),
('WPL-MNT-008', 'Carrier Arei & Consina 60L-70L', 2, 'Arei / Consina', 'Trekking 60L-70L', 'Tas keril pendakian kapasitas besar', 'Arei 70L, Consina 60L', 3, 2, 'Rusak Ringan', 1, 2022, 'Tersedia', 'Arei frame keluar perlu servis'),
('WPL-MNT-009', 'Carrier Redman & Exelsior 60L', 2, 'Redman / Exelsior', 'Expedition 60L', 'Tas gunung keril tangguh', 'Kapasitas 60 liter', 2, 2, 'Baik', 1, 2023, 'Tersedia', 'Masih baik dan dapat dibawa ke lapangan'),
('WPL-MNT-010', 'Flysheet Pelindung Hujan 4x6 & 3x4', 2, 'WAPEALA', 'Waterproof Ripstop', 'Atap pelindung bivak dan fly tenda', 'Warna hijau 4x6 & hitam 3x4', 7, 5, 'Baik', 1, 2024, 'Tersedia', '5 baik, 2 butuh perbaikan seal rembes'),
('WPL-MNT-011', 'Golok Tebas Kukri & Tramontina', 2, 'Tramontina / Kukri', 'Machete 18 Inch', 'Golok tebas rintis jalur hutan lebat', 'Baja karbon dengan sarung kulit', 4, 4, 'Baik', 1, 2023, 'Tersedia', 'Aman, perlu diasah berkala'),
('WPL-MNT-012', 'Matras Lapangan Spon Tebal', 2, 'WAPEALA', 'Spon Foil 190x60cm', 'Matras tidur kegiatan gunung dan basecamp', '19 di rusun, 10 di wall climbing', 20, 17, 'Baik', 1, 2024, 'Tersedia', '17 kondisi baik dan siap lapangan'),
('WPL-MNT-013', 'Nesting Kotak Masak TNI AD', 2, 'TNI AD Standard', 'Nesting 3 Susun Alumunium', 'Panci masak lapangan 3 susun alumunium kokoh', 'Alumunium tebal TNI AD', 4, 4, 'Baik', 1, 2023, 'Tersedia', 'Dikasih Mas Alif, siap lapangan'),
('WPL-MNT-014', 'Kompor Gas Portable TNI AD', 2, 'TNI AD Standard', 'Kompor Lapangan Bivak', 'Kompor gas mini kegiatan bivak', 'Logam lipat kokoh', 1, 1, 'Baik', 1, 2023, 'Tersedia', 'Berfungsi baik'),
('WPL-MNT-015', 'GPS Navigasi Handheld', 2, 'Garmin', 'eTrex 22x', 'Perangkat penentu posisi satelit navigasi hutan', 'Layar warna transflektif 2.2 inch', 1, 1, 'Baik', 1, 2023, 'Tersedia', 'Berfungsi baik, butuh baterai AA cadangan'),

-- 3. WATER SPORT (ARUNG JERAM & SELAM)
('WPL-WTR-001', 'Perahu Karet Rafting West Point', 3, 'West Point', '380cm Heavy PVC 0.9mm', 'Perahu karet arung jeram kapasitas 6-8 orang', 'Warna abu-merah dengan tali pengaman samping', 1, 1, 'Baik', 3, 2023, 'Tersedia', 'Siap operasional pengarungan'),
('WPL-WTR-002', 'Perahu Karet Rafting Air Nusantara', 3, 'Air Nusantara', 'Raft 360cm PVC', 'Perahu karet arung jeram sekunder', 'Sudah diservis, siap cadangan', 1, 1, 'Baik', 3, 2023, 'Tersedia', 'Sudah diservis di vendor rekanan'),
('WPL-WTR-003', 'Life Jacket Pelampung Elcamino', 3, 'Elcamino', 'Standard & Skipper 150N', 'Pelampung keselamatan arung jeram daya apung tinggi', 'Warna merah-hitam berpeluit, 5 biasa, 2 skipper', 7, 7, 'Baik', 3, 2024, 'Tersedia', 'Siap lapangan, 5 standar & 2 skipper'),
('WPL-WTR-004', 'Life Jacket Pelampung SAR WAPEALA', 3, 'Lokal SAR', 'Daya Apung Ekstra', 'Pelampung kegiatan pertolongan air', 'Warna oranye terang', 9, 8, 'Baik', 3, 2023, 'Tersedia', '8 siap, 1 daya apung agak berkurang'),
('WPL-WTR-005', 'Helm Rafting Arung Jeram', 3, 'Momentum / Biasa', 'Water Helmet CE EN 1385', 'Pelindung kepala benturan batu sungai berarus deras', 'Warna oranye, merah, dan hitam', 14, 14, 'Baik', 3, 2024, 'Tersedia', '7 Momentum & 7 biasa, busa normal'),
('WPL-WTR-006', 'Dayung Rafting Biasa & Skipper', 3, 'Boogie / Lokal', 'T-Grip Alumunium Shaft', 'Dayung perahu karet bilah polypropelene kuat', '13 biasa dan 3 skipper', 16, 14, 'Baik', 3, 2024, 'Tersedia', '14 siap lapangan, 2 butuh T-grip cadangan'),
('WPL-WTR-007', 'Pompa Perahu Manual Bestway & Paralon', 3, 'Bestway / Custom', 'Double Quick High Output', 'Pompa tabung pengisi udara perahu rafting', '1 manual Bestway, 1 tabung paralon', 3, 2, 'Baik', 3, 2023, 'Tersedia', '2 berfungsi baik, 1 ganti seal tabung'),
('WPL-WTR-008', 'Throw Bag Tali Lempar Arung Jeram', 3, 'Boogie', 'Rescue Rope 20 meter', 'Tali lempar penyelamatan darurat arus deras', 'Kantung apung oranye dengan tali poliester apung', 2, 2, 'Baik', 3, 2024, 'Tersedia', 'Siap operasional'),
('WPL-WTR-009', 'Dry Bag Kantung Anti Air', 3, 'FeelFree / Lokal', 'Dry Bag 10L, 15L, 20L, 40L', 'Kantung kedap air pelindung logistik medis di sungai', 'Aneka ukuran, tersimpan di gudang wall', 6, 6, 'Baik', 3, 2024, 'Tersedia', 'Kondisi mulus kedap air'),
('WPL-WTR-010', 'Fins Kaki Katak Selam & Renang', 3, 'IST / Mares', 'Full Foot & Open Heel', 'Kaki katak kegiatan selam dan pertolongan air', 'Ukuran M & L', 10, 8, 'Baik', 3, 2023, 'Tersedia', '8 baik, 2 butuh perbaikan strap'),
('WPL-WTR-011', 'Regulator Selam SCUBA Set', 3, 'Aqua Lung / Cressi / Mares', '1st & 2nd Stage + Octo', 'Regulator penyuplai oksigen selam bertekanan tinggi', 'Lengkap manometer dan selang inflator', 5, 5, 'Baik', 3, 2025, 'Tersedia', 'Aqua Lung, Cressi, Mares, Tusa & Seac'),
('WPL-WTR-012', 'Tabung Selam SCUBA Alumunium', 3, 'Luxfer', '80 Cuft 3000 PSI', 'Tabung udara kompresi kegiatan selam ilmiah WAPEALA', 'Alumunium silver dengan kran K-valve', 3, 3, 'Baik', 3, 2023, 'Tersedia', 'Kondisi hidrotest normal'),
('WPL-WTR-013', 'Sabuk Pemberat Selam & Timah', 3, 'AMSCUD', 'Weight Belt + Lead 2-3lb', 'Sabuk pemberat nilon dengan timah cor penyelaman', '4 sabuk dan 8 biji timah pemberat', 12, 12, 'Baik', 3, 2024, 'Tersedia', 'Siap operasional'),
('WPL-WTR-014', 'Masker Selam & Snorkel Tempered', 3, 'IST / Problue / Speedo', 'Tempered Glass Low Volume', 'Masker selam kaca tempered anti-pecah dan snorkel', 'Silikon bening dan hitam', 8, 7, 'Baik', 3, 2024, 'Tersedia', '7 siap lapangan, 1 bocor frame'),
('WPL-WTR-015', 'Wetsuit Pakaian Selam 3mm', 3, 'Coonely / Cressi', 'Neoprene 3mm Fullbody', 'Pakaian selam neoprena isolasi suhu air laut', 'Ukuran M dan L', 2, 2, 'Baik', 3, 2024, 'Tersedia', 'Kondisi baik dan elastis'),
('WPL-WTR-016', 'SMB Sosis Penanda Permukaan Laut', 3, 'WAPEALA', 'Surface Marker Buoy 1.5m', 'Sosis penanda lokasi penyelam di laut', '6 unit oranye dan 2 unit merah', 8, 8, 'Baik', 3, 2024, 'Tersedia', 'Aman dari XPDC W3E'),

-- 4. ALAT KOMUNIKASI
('WPL-KOM-001', 'Handy Talky Icom IC-V80 VHF', 4, 'Icom', 'IC-V80 VHF 5.5W', 'Radio komunikasi lapangan VHF daya jangkau tinggi', 'Casing hitam tahan percikan air IP54 + charger', 2, 2, 'Baik', 1, 2024, 'Tersedia', 'Baterai normal, siap lapangan'),
('WPL-KOM-002', 'Handy Talky Firstcom FC-27', 4, 'Firstcom', 'FC-27 Dual Band', 'Radio komunikasi dual band VHF/UHF', 'Layar LCD dengan keypad DTMF', 1, 1, 'Baik', 1, 2023, 'Tersedia', 'Unit normal siap lapangan'),
('WPL-KOM-003', 'Charger Desktop HT Icom & Firstcom', 4, 'Icom / Firstcom', 'Rapid Desktop Charger', 'Dudukan pengisi daya baterai HT cepat', 'Adaptor 12V + mangkok pengisi', 3, 2, 'Baik', 1, 2024, 'Tersedia', '2 baik, 1 rusak karantina'),
('WPL-KOM-004', 'Antena HT BNC Lapangan', 4, 'Nagoya / Diamond', 'VHF Whip BNC', 'Antena penguat sinyal radio HT', 'Konektor BNC fleksibel', 3, 0, 'Karantina', 1, 2023, 'Karantina', 'Karantina butuh solder ulang'),

-- 5. P3K & LOGISTIK UMUM
('WPL-LOG-001', 'Tas Medis Lapangan Emergency', 5, 'WAPEALA Custom', 'Emergency Medical Kit Bag', 'Tas perlengkapan P3K kegiatan ekspedisi lapangan', 'Warna merah dengan logo palang putih', 2, 2, 'Baik', 1, 2023, 'Tersedia', 'Perlu peremajaan resleting kepala'),
('WPL-LOG-002', 'Kotak Peluru Logam Anti-Air', 5, 'TNI AD Standard', 'Ammo Box Pindad 50 Cal', 'Kotak logam kedap air pelindung baterai dan dokumen', 'Logam hijau army kokoh', 2, 2, 'Baik', 1, 2022, 'Tersedia', 'Agak karatan luar, kedap air dalam'),
('WPL-LOG-003', 'Bendera Lapangan WAPEALA', 5, 'WAPEALA Official', 'Poliester 120x80cm', 'Bendera resmi organisasi untuk upacara di puncak tebing/gunung', 'Sutra sablon logo WAPEALA', 2, 2, 'Baik', 1, 2024, 'Tersedia', 'Kondisi bersih dan rapi'),
('WPL-LOG-004', 'Kaos SAR & Wearpack Lapangan Navy', 5, 'WAPEALA', 'Wearpack Katun Drill', 'Seragam kerja bakti pembersihan gua dan tebing', 'Warna navy dan kaos oranye SAR', 7, 7, 'Baik', 1, 2024, 'Tersedia', 'Bersih dan siap pakai'),
('WPL-LOG-005', 'Coverall Lapangan Merah & Biru', 5, 'WAPEALA', 'Coverall Caving', 'Baju pelindung susur goa kotor dan lumpur', 'Warna merah dan biru', 7, 6, 'Baik', 1, 2023, 'Tersedia', '6 baik, 1 lubang kecil masih layak')
ON CONFLICT (kode_inventaris) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- SEED DATA BARANG HABIS PAKAI (Fitur 18)
-- ============================================================================
INSERT INTO barang_habis_pakai (nama_barang, satuan, stok_saat_ini, batas_minimum, lokasi_id) VALUES
('Gas Kaleng Portable (Hi-Cook / Super Cook)', 'Kaleng', 8, 4, 1),
('Baterai Alkaline AA (Cadangan HT & GPS)', 'Pcs', 12, 6, 1),
('Baterai Alkaline AAA (Headlamp & Lampu Bivak)', 'Pcs', 16, 6, 1),
('Plester Gulung & Kasa Steril P3K', 'Roll', 5, 3, 1),
('Obat Antiseptik Betadine & Alkohol 70%', 'Botol', 4, 2, 1),
('Tali Rafia Gulung Besar (Packing & Bivak)', 'Gulung', 2, 2, 1);

-- ============================================================================
-- SEED DATA TRANSAKSI PEMINJAMAN AWAL (UNTUK DASHBOARD & RIWAYAT)
-- ============================================================================
DO $$
DECLARE
    user_agt_id UUID;
    user_log_id UUID;
    pjm1_id UUID;
    pjm2_id UUID;
    pjm3_id UUID;
    alat_karnmantel UUID;
    alat_harness UUID;
    alat_carabiner UUID;
    alat_tenda UUID;
    alat_ht UUID;
BEGIN
    SELECT id INTO user_agt_id FROM users WHERE email = 'adzka@students.undip.ac.id' LIMIT 1;
    SELECT id INTO user_log_id FROM users WHERE email = 'logistik@wapeala.or.id' LIMIT 1;
    SELECT id INTO alat_karnmantel FROM inventaris_barang WHERE kode_inventaris = 'WPL-RC-001' LIMIT 1;
    SELECT id INTO alat_harness FROM inventaris_barang WHERE kode_inventaris = 'WPL-RC-011' LIMIT 1;
    SELECT id INTO alat_carabiner FROM inventaris_barang WHERE kode_inventaris = 'WPL-RC-013' LIMIT 1;
    SELECT id INTO alat_tenda FROM inventaris_barang WHERE kode_inventaris = 'WPL-MNT-001' LIMIT 1;
    SELECT id INTO alat_ht FROM inventaris_barang WHERE kode_inventaris = 'WPL-KOM-001' LIMIT 1;

    -- Peminjaman 1: Sedang Dipinjam
    INSERT INTO peminjaman (
        kode_peminjaman, user_id, nama_kegiatan, tanggal_pinjam, tanggal_kembali_rencana,
        status, approved_by, catatan_peminjam
    ) VALUES (
        'PJM-20261120-001', user_agt_id, 'Simulasi Pemanjatan Tebing Pantai Siung',
        CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days',
        'Dipinjam', user_log_id, 'Latihan penanganan jalur rapelling'
    ) RETURNING id INTO pjm1_id;

    IF alat_karnmantel IS NOT NULL THEN
        INSERT INTO detail_peminjaman (peminjaman_id, barang_id, jumlah, kondisi_awal)
        VALUES (pjm1_id, alat_karnmantel, 1, 'Baik');
    END IF;
    IF alat_harness IS NOT NULL THEN
        INSERT INTO detail_peminjaman (peminjaman_id, barang_id, jumlah, kondisi_awal)
        VALUES (pjm1_id, alat_harness, 2, 'Baik');
    END IF;

    -- Peminjaman 2: Menunggu Persetujuan
    INSERT INTO peminjaman (
        kode_peminjaman, user_id, nama_kegiatan, tanggal_pinjam, tanggal_kembali_rencana,
        status, catatan_peminjam
    ) VALUES (
        'PJM-20261125-002', user_agt_id, 'Diklatsar WAPEALA Angkatan 2026',
        CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '12 days',
        'Menunggu', 'Mohon persetujuan logistik tenda dome'
    ) RETURNING id INTO pjm2_id;

    IF alat_tenda IS NOT NULL THEN
        INSERT INTO detail_peminjaman (peminjaman_id, barang_id, jumlah, kondisi_awal)
        VALUES (pjm2_id, alat_tenda, 2, 'Baik');
    END IF;

    -- Peminjaman 3: Selesai dengan Pengembalian
    INSERT INTO peminjaman (
        kode_peminjaman, user_id, nama_kegiatan, tanggal_pinjam, tanggal_kembali_rencana,
        status, approved_by, catatan_peminjam
    ) VALUES (
        'PJM-20261110-003', user_agt_id, 'Survei Lapangan Goa Luweng Jaran',
        CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days',
        'Selesai', user_log_id, 'Kondisi aman lancar'
    ) RETURNING id INTO pjm3_id;

    IF alat_ht IS NOT NULL THEN
        INSERT INTO detail_peminjaman (peminjaman_id, barang_id, jumlah, kondisi_awal, kondisi_kembali)
        VALUES (pjm3_id, alat_ht, 1, 'Baik', 'Baik');
    END IF;

    INSERT INTO pengembalian (
        peminjaman_id, tanggal_kembali_aktual, hari_terlambat, total_denda, status_denda,
        catatan_kerusakan, diterima_oleh
    ) VALUES (
        pjm3_id, CURRENT_DATE - INTERVAL '10 days', 0, 0, 'Lunas',
        'Semua alat dikembalikan dalam keadaan bersih dan lengkap', user_log_id
    );

    -- Notifikasi Awal
    INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES
    (NULL, 'Selamat Datang di SIPAW WAPEALA', 'Sistem Peminjaman & Inventaris Alat resmi aktif untuk periode 2026.', 'INFO_SISTEM'),
    (NULL, 'Pengajuan Peminjaman Baru', 'Peminjaman PJM-20261125-002 (Diklatsar 2026) menunggu persetujuan pengurus.', 'PENGAJUAN_BARU');

    -- Audit Log Awal
    INSERT INTO audit_log (user_id, nama_user, aksi, modul, detail) VALUES
    (user_log_id, 'Koordinator Logistik PH', 'INISIALISASI_SISTEM', 'Sistem', 'Inisialisasi database SIPAW Periode 2026 berhasil');
END $$;

-- ============================================================================
-- KONFIGURASI ROW LEVEL SECURITY (RLS) - BUKA AKSES UNTUK PROTOTYPING PWA
-- ============================================================================
ALTER TABLE pengaturan_sistem ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasi_penyimpanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventaris_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengembalian ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita_acara ENABLE ROW LEVEL SECURITY;
ALTER TABLE perawatan_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_stock_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_alat ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang_habis_pakai ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_habis_pakai ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (
            'pengaturan_sistem', 'users', 'kategori_barang', 'lokasi_penyimpanan',
            'inventaris_barang', 'peminjaman', 'detail_peminjaman', 'pengembalian',
            'berita_acara', 'perawatan_barang', 'stock_opname', 'detail_stock_opname',
            'booking_alat', 'barang_habis_pakai', 'log_habis_pakai', 'notifikasi', 'audit_log',
            'keepalive_heartbeat'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon all on %I" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow anon all on %I" ON %I FOR ALL TO anon USING (true) WITH CHECK (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated all on %I" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow authenticated all on %I" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- Berikan izin akses tabel (GRANT) untuk role anon & authenticated (Koneksi Supabase PWA)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

