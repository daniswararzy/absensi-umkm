-- ============================================
-- Cleanup & Setup Production — Absensi UMKM
-- ============================================
-- Jalankan script ini di Supabase SQL Editor.
-- Urutan: password admin → hapus dummy data → verifikasi
-- ============================================

-- ─── 0. UPDATE PASSWORD ADMIN ─────────────────
-- Mengganti password admin dari 'admin' menjadi 'admin123'
-- Hash bcrypt cost 12 untuk: admin123

UPDATE users
SET password = '$2b$12$Po2TTgxcT8rsJJl64nKWmOiux5cST/dBsLMPO3axqFfAejNFbM3RW'
WHERE username = 'admin';

-- Verifikasi user admin ada
SELECT id, username, role, label FROM users WHERE username = 'admin';



-- 1. Hapus data absensi dummy (child dari pegawai)
DELETE FROM absensi
WHERE pegawai_id IN ('PGW-001', 'PGW-002', 'PGW-003', 'PGW-004', 'PGW-005');

-- 2. Hapus data wajah dummy jika ada (child dari pegawai)
DELETE FROM data_wajah
WHERE pegawai_id IN ('PGW-001', 'PGW-002', 'PGW-003', 'PGW-004', 'PGW-005');

-- 3. Hapus data pegawai dummy
DELETE FROM pegawai
WHERE id IN ('PGW-001', 'PGW-002', 'PGW-003', 'PGW-004', 'PGW-005');

-- ============================================
-- Verifikasi — pastikan tabel sudah kosong
-- ============================================
SELECT 'pegawai' AS tabel, COUNT(*) AS jumlah_data FROM pegawai
UNION ALL
SELECT 'absensi', COUNT(*) FROM absensi
UNION ALL
SELECT 'data_wajah', COUNT(*) FROM data_wajah;
