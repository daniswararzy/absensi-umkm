# Absensi UMKM

Sistem absensi berbasis **Face Recognition** untuk UMKM (Usaha Mikro, Kecil, dan Menengah). Aplikasi ini dirancang untuk mempermudah pencatatan kehadiran karyawan secara otomatis menggunakan teknologi deteksi wajah.

## 🎯 Fitur Utama

- ✅ **Face Recognition** - Absensi otomatis menggunakan deteksi wajah
- 👥 **Manajemen Karyawan** - Kelola data dan profil karyawan
- 📊 **Dashboard Admin** - Monitoring kehadiran real-time
- 📈 **Laporan Absensi** - Generate laporan kehadiran per karyawan
- 🎓 **Employee Dashboard** - Dashboard personal untuk karyawan
- ⚙️ **Pengaturan Sistem** - Konfigurasi sistem absensi
- 🔐 **Sistem Login** - Autentikasi aman untuk admin dan karyawan

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
- **React** - UI library
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** (assumed) - Web framework

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

Server akan berjalan di `http://localhost:3000`

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
1. Login dengan akun admin
2. Akses dashboard untuk monitoring kehadiran
3. Kelola data karyawan
4. Lihat laporan absensi

### Untuk Karyawan
1. Login dengan akun karyawan
2. Lakukan absensi via face recognition
3. Lihat riwayat kehadiran di dashboard personal

## 🔗 Endpoints API

Dokumentasi API akan ditambahkan di masa depan.

## 📝 Catatan Pengembangan

- Face Recognition module masih dalam tahap placeholder
- Integrasi dengan database masih dalam pengembangan
- Authentikasi belum fully implemented

## 👨‍💻 Author

**Dani Swara Rizky**

## 📞 Support & Contribution

Jika Anda menemukan bug atau ingin berkontribusi, silakan buat issue atau pull request.

## 📄 License

Project ini adalah private repository.

---

**Last Updated:** April 27, 2026
