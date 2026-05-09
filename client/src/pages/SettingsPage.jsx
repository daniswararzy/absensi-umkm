import PageHeader from '../components/ui/PageHeader'
import PlaceholderPanel from '../components/ui/PlaceholderPanel'

const settingScope = [
  'Profil UMKM',
  'Jam kerja dan toleransi keterlambatan',
  'Role admin',
  'Konfigurasi API dan kamera',
]

function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Pengaturan sistem disiapkan agar konfigurasi aplikasi tidak bercampur dengan halaman fitur."
        status="Route aktif"
        title="Pengaturan aplikasi"
      />
      <PlaceholderPanel
        description="Opsi konfigurasi akan dipetakan setelah kebutuhan operasional UMKM final."
        items={settingScope}
        title="Ruang lingkup pengaturan"
      />
    </>
  )
}

export default SettingsPage
