# Absensi UMKM - Notes Testing

Catatan ini dipakai untuk menjalankan pengecekan prototype frontend Absensi UMKM.

## Status Testing

Saat ini project belum memiliki automated unit test atau integration test.
Testing yang tersedia masih berupa:

- ESLint untuk cek kualitas kode frontend.
- Build production untuk cek aplikasi bisa dikompilasi.
- Smoke test manual untuk membuka route utama.
- Manual test flow login admin dan pegawai.

## Menjalankan Frontend

Jika posisi terminal masih di root project `absensi_umkm`, masuk dulu ke folder `client`:

```bash
cd client
npm install
npm run dev
```

Alternatif dari root project tanpa pindah folder:

```bash
npm --prefix client install
npm --prefix client run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

## Menjalankan Backend

Jika posisi terminal masih di root project `absensi_umkm`, masuk dulu ke folder `server`:

```bash
cd server
npm install
npm run dev
```

Alternatif dari root project tanpa pindah folder:

```bash
npm --prefix server install
npm --prefix server run dev
```

Backend berjalan di:

```text
http://localhost:5050
```

Cek health endpoint:

```bash
curl -s http://localhost:5050/api/health
```

Response yang diharapkan:

```json
{
  "status": "ok",
  "service": "absensi-umkm-api"
}
```

## Command Testing Frontend

Jika posisi terminal masih di root project `absensi_umkm`, jalankan:

```bash
npm --prefix client run lint
npm --prefix client run build
```

Atau dari folder `client`:

```bash
npm run lint
npm run build
```

Hasil yang diharapkan:

- `npm run lint` selesai tanpa error.
- `npm run build` selesai dan menghasilkan folder `dist`.

## Akun Dummy

Admin:

```text
Username: admin
Password: admin
```

Pegawai:

```text
Username: pegawai
Password: pegawai
```

## Route yang Perlu Dicek

Buka route berikut lewat browser:

```text
/login
/dashboard
/pegawai
/pegawai/tambah
/registrasi-wajah
/laporan
/dashboard-pegawai
/absensi
```

## Checklist Manual Testing

Login Admin:

- Buka `/login`.
- Masukkan `admin` dan `admin`.
- Pastikan masuk ke dashboard admin.

Login Pegawai:

- Buka `/login`.
- Masukkan `pegawai` dan `pegawai`.
- Pastikan masuk ke dashboard pegawai.

Dashboard Admin:

- Pastikan kartu ringkasan tampil.
- Pastikan tabel data absensi hari ini tampil.
- Pastikan tombol cepat tampil.

Data Pegawai:

- Pastikan tabel pegawai tampil.
- Pastikan tombol `Tambah Pegawai`, `Edit`, dan `Hapus` terlihat.
- Pastikan placeholder pencarian menampilkan `Cari nama pegawai...`.

Form Pegawai:

- Buka `/pegawai/tambah`.
- Kosongkan field wajib.
- Klik `Simpan Data`.
- Pastikan pesan validasi muncul.

Registrasi Wajah:

- Buka `/registrasi-wajah`.
- Pastikan area kamera, informasi pegawai, tombol kamera, dan status sistem tampil.

Dashboard Pegawai:

- Buka `/dashboard-pegawai`.
- Pastikan tanggal dan waktu realtime tampil.
- Pastikan identitas pegawai dan status kehadiran tampil.

Absensi Pegawai:

- Buka `/absensi`.
- Pilih `Absensi Masuk` atau `Absensi Pulang`.
- Klik `Mulai Scan`.
- Pastikan status berubah menjadi `Memproses data wajah...`.
- Klik `Ulangi Scan`.
- Pastikan status kembali menjadi `Menunggu pemindaian wajah`.

Laporan Kehadiran:

- Buka `/laporan`.
- Pastikan filter, tombol cetak, tombol ekspor, dan tabel laporan tampil.

## Catatan

Testing ini masih untuk prototype UI dengan dummy data.
Belum ada koneksi database, JWT, validasi backend, atau face recognition sungguhan.
