import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ScanFace,
  UsersRound,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard Admin',
    path: '/admin/dashboard',
    description: 'Ringkasan absensi pegawai',
    icon: LayoutDashboard,
  },
  {
    label: 'Data Pegawai',
    path: '/admin/pegawai',
    description: 'Master data pegawai',
    icon: UsersRound,
  },
  {
    label: 'Registrasi Wajah',
    path: '/admin/registrasi-wajah',
    description: 'Perekaman wajah',
    icon: ScanFace,
  },
  {
    label: 'Laporan Kehadiran',
    path: '/admin/laporan',
    description: 'Rekap kehadiran',
    icon: ClipboardList,
  },
  {
    label: 'Keluar Admin',
    path: '/admin/login',
    description: 'Akhiri sesi admin',
    icon: LogOut,
  },
]
