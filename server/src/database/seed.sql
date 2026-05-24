-- ============================================
-- Seed Data — Absensi UMKM
-- ============================================
-- Jalankan SETELAH schema.sql.
-- Password: bcrypt hash dari string yang tertera di komentar.
-- Untuk development, gunakan hash yang sudah disiapkan.
-- ============================================

-- ─── USERS ────────────────────────────────────
-- admin/admin
-- Hash dibuat dengan bcrypt cost 10.
-- Ganti hash ini di production!

INSERT INTO users (username, password, role, label) VALUES
  ('admin', '$2b$10$YW124t5ty36N1QYv5zxdYO3MWOZHMwm.w6WZpJdhEAGzLsZJ4Bv/6', 'admin', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- ─── PEGAWAI ──────────────────────────────────

INSERT INTO pegawai (id, nama, jabatan, telepon, alamat, status) VALUES
  ('PGW-001', 'Sari Lestari',    'Kasir',      '0812-4410-1123', 'Jl. Mawar No. 12',   'Aktif'),
  ('PGW-002', 'Rizky Pratama',   'Barista',    '0813-7788-2901', 'Jl. Melati No. 8',   'Aktif'),
  ('PGW-003', 'Dewi Anggraini',  'Admin Stok', '0821-9012-4556', 'Jl. Kenanga No. 21', 'Aktif'),
  ('PGW-004', 'Fajar Nugroho',   'Kurir',      '0857-2266-1100', 'Jl. Anggrek No. 17', 'Nonaktif'),
  ('PGW-005', 'Maya Safitri',    'Produksi',   '0819-4455-6677', 'Jl. Cempaka No. 5',  'Aktif')
ON CONFLICT (id) DO NOTHING;

-- ─── DATA_WAJAH ───────────────────────────────
-- Tidak ada seed data_wajah mock.
-- face_encoding harus berasal dari registrasi wajah nyata
-- dan disimpan sebagai JSON array berisi 128 angka.

-- ─── ABSENSI (hari ini) ──────────────────────
-- Aturan default: masuk normal sampai 08:00 dengan toleransi 15 menit.
-- Karena itu 08:01 masih Hadir, sedangkan 08:18 sudah Terlambat.

INSERT INTO absensi (pegawai_id, tanggal, jam_masuk, jam_keluar, status, metode) VALUES
  ('PGW-001', CURRENT_DATE, '07:56', '16:03', 'Hadir',      'Face Recognition'),
  ('PGW-002', CURRENT_DATE, '08:18',  NULL,   'Terlambat',  'Face Recognition'),
  ('PGW-005', CURRENT_DATE, '08:01',  NULL,   'Hadir',      'Face Recognition')
ON CONFLICT (pegawai_id, tanggal) DO NOTHING;
