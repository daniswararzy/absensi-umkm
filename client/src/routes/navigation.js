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
    icon: LayoutDashboard,
  },
  {
    label: 'Data Pegawai',
    path: '/admin/pegawai',
    icon: UsersRound,
  },
  {
    label: 'Registrasi Wajah',
    path: '/admin/registrasi-wajah',
    icon: ScanFace,
  },
  {
    label: 'Laporan Kehadiran',
    path: '/admin/laporan',
    icon: ClipboardList,
  },
  {
    label: 'Keluar Admin',
    path: '/admin/login',
    icon: LogOut,
  },
]
