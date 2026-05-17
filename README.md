# Absensi UMKM

Sistem absensi berbasis **Face Recognition** untuk UMKM (Usaha Mikro, Kecil, dan Menengah). Aplikasi ini dirancang untuk mempermudah pencatatan kehadiran pegawai secara otomatis menggunakan teknologi deteksi wajah.

## 🎯 Fitur Utama

- **Face Recognition** - Absensi otomatis menggunakan deteksi wajah
- **Manajemen Pegawai** - Kelola data dan profil pegawai
- **Dashboard Admin** - Monitoring kehadiran real-time
- **Laporan Absensi** - Generate laporan kehadiran per pegawai
- **Absensi Pegawai Langsung** - Pegawai membuka `/absensi` dan scan wajah tanpa login
- **Portal Admin** - Admin login melalui `/admin/login` untuk mengelola sistem

## 📁 Struktur Project

```
absensi_umkm/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Halaman-halaman aplikasi
│   │   ├── services/         # API client
│   │   ├── styles/           # CSS files
│   │   ├── data/             # Dummy data
│   │   ├── routes/           # Routing configuration
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── vite.config.js
│
└── server/                    # Backend Node.js
    ├── index.js              # Main server file
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool & dev server
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 4** - Styling
- **face-api.js** - Deteksi dan descriptor wajah

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **Supabase JS v2 / PostgreSQL** - Database layer
- **JWT + bcrypt** - Autentikasi admin

## 🚀 Cara Setup

### Prerequisites
- Node.js v14+ 
- npm atau yarn
- Git

### 1. Clone Repository
```bash
git clone https://github.com/daniswararzy/absensi-umkm.git
cd absensi_umkm
```

### 2. Setup Backend Server
```bash
cd server
npm install
npm start
```

Server akan berjalan di `http://localhost:5050`

### 3. Setup Frontend Client
Buka terminal baru:
```bash
cd client
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 📖 Penggunaan

### Untuk Admin
1. Buka `/admin/login`
2. Login dengan akun admin
3. Akses dashboard untuk monitoring kehadiran
4. Kelola data pegawai
5. Lihat laporan absensi

### Untuk Pegawai
1. Buka aplikasi atau halaman `/absensi` tanpa login
2. Pilih absensi masuk atau pulang
3. Lakukan scan wajah untuk mencatat kehadiran

## Route Utama

- `/absensi` - halaman absensi pegawai, public, tanpa login
- `/admin/login` - login admin
- `/admin/dashboard` - dashboard admin, protected
- `/admin/pegawai` - data pegawai, protected
- `/admin/registrasi-wajah` - registrasi wajah, protected
- `/admin/laporan` - laporan absensi, protected

Legacy redirect:

- `/` ke `/absensi`
- `/login` ke `/admin/login`
- `/dashboard` ke `/admin/dashboard`
- `/pegawai` ke `/admin/pegawai`
- `/registrasi-wajah` ke `/admin/registrasi-wajah`
- `/laporan` ke `/admin/laporan`
