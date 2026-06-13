-- ============================================
-- Seed Data — Absensi UMKM
-- ============================================
-- Jalankan SETELAH schema.sql.
-- Hanya berisi akun admin. Data pegawai diisi
-- langsung melalui fitur "Tambah Pegawai" di aplikasi.
-- ============================================

-- ─── USERS ────────────────────────────────────
-- Akun admin untuk login ke dashboard.
-- Password: admin123 (bcrypt cost 12)
--
-- Untuk mengubah password, jalankan di Supabase SQL Editor:
--   node -e "const b=require('bcrypt');b.hash('PasswordBaru',12).then(console.log)"
-- lalu UPDATE users SET password='<hash>' WHERE username='admin';

INSERT INTO users (username, password, role, label) VALUES
  ('admin', '$2b$12$Po2TTgxcT8rsJJl64nKWmOiux5cST/dBsLMPO3axqFfAejNFbM3RW', 'admin', 'Admin')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;

-- ─── PEGAWAI ──────────────────────────────────
-- Tidak ada data dummy. Tambahkan pegawai nyata melalui
-- Dashboard → Data Pegawai → Tambah Pegawai.

-- ─── DATA_WAJAH ───────────────────────────────
-- Tidak ada seed data wajah.
-- Lakukan registrasi wajah melalui
-- Dashboard → Registrasi Wajah setelah pegawai ditambahkan.

-- ─── ABSENSI ──────────────────────────────────
-- Tidak ada seed absensi. Data absensi akan terisi
-- otomatis saat pegawai melakukan scan wajah di halaman /absensi.
