-- ============================================================
-- Migration: Tambah kolom geolocation ke tabel absensi
-- Target: Supabase PostgreSQL
-- ============================================================
-- Jalankan di Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

ALTER TABLE absensi
  ADD COLUMN IF NOT EXISTS latitude      NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude     NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_note VARCHAR(100);

-- Opsional: tambahkan index untuk query analitik berdasarkan lokasi
CREATE INDEX IF NOT EXISTS idx_absensi_location ON absensi (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN absensi.latitude      IS 'Latitude pegawai saat absensi (WGS84)';
COMMENT ON COLUMN absensi.longitude     IS 'Longitude pegawai saat absensi (WGS84)';
COMMENT ON COLUMN absensi.location_note IS 'Catatan lokasi, contoh: Dalam radius kantor';
