import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ScanFace,
  UsersRound,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Ringkasan absensi',
    icon: LayoutDashboard,
  },
  {
    label: 'Data Pegawai',
    path: '/pegawai',
    description: 'Master data pegawai',
    icon: UsersRound,
  },
  {
    label: 'Registrasi Wajah',
    path: '/registrasi-wajah',
    description: 'Perekaman wajah',
    icon: ScanFace,
  },
  {
    label: 'Laporan Kehadiran',
    path: '/laporan',
    description: 'Rekap kehadiran',
    icon: ClipboardList,
  },
  {
    label: 'Keluar',
    path: '/login',
    description: 'Keluar sistem',
    icon: LogOut,
  },
]
