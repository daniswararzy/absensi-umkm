-- ============================================
-- Schema Database — Absensi UMKM
-- Target: Supabase PostgreSQL
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- ─── 1. USERS ─────────────────────────────────
-- Akun login untuk admin dan pegawai.
-- Password di-hash dengan bcrypt di backend.

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'pegawai'
                CHECK (role IN ('admin', 'pegawai')),
  label       VARCHAR(50),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── 2. PEGAWAI ───────────────────────────────
-- Data identitas pegawai.
-- user_id opsional: NULL jika pegawai belum punya akun login.

CREATE TABLE IF NOT EXISTS pegawai (
  id          VARCHAR(20)  PRIMARY KEY,
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  nama        VARCHAR(100) NOT NULL,
  jabatan     VARCHAR(50)  NOT NULL,
  telepon     VARCHAR(20),
  alamat      TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'Aktif'
                CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── 3. DATA_WAJAH ────────────────────────────
-- Satu pegawai punya satu data wajah.
-- face_encoding menyimpan vektor/embedding dari model face recognition.

CREATE TABLE IF NOT EXISTS data_wajah (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id    VARCHAR(20) NOT NULL UNIQUE
                  REFERENCES pegawai(id) ON DELETE CASCADE,
  face_encoding TEXT        NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'Terdaftar'
                  CHECK (status IN ('Terdaftar', 'Belum')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. ABSENSI ───────────────────────────────
-- Satu row = satu record absensi per hari per pegawai.

CREATE TABLE IF NOT EXISTS absensi (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id  VARCHAR(20) NOT NULL
                REFERENCES pegawai(id) ON DELETE CASCADE,
  tanggal     DATE        NOT NULL DEFAULT CURRENT_DATE,
  jam_masuk   TIME,
  jam_keluar  TIME,
  status      VARCHAR(20) NOT NULL DEFAULT 'Belum Absen'
                CHECK (status IN ('Hadir', 'Terlambat', 'Izin', 'Cuti', 'Alfa', 'Belum Absen')),
  metode      VARCHAR(30) DEFAULT 'Face Recognition',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (pegawai_id, tanggal)
);

-- ─── INDEXES ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_absensi_tanggal    ON absensi (tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_pegawai    ON absensi (pegawai_id);
CREATE INDEX IF NOT EXISTS idx_pegawai_status     ON pegawai (status);
