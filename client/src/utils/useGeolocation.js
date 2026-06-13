/**
 * useGeolocation.js — Custom hook untuk mengambil lokasi GPS pengguna.
 *
 * Status:
 *   'idle'        → belum diminta
 *   'requesting'  → sedang meminta izin / mengambil lokasi
 *   'granted'     → berhasil mendapat koordinat
 *   'denied'      → izin ditolak pengguna
 *   'unavailable' → browser tidak mendukung / error lain
 */

import { useCallback, useState } from 'react'

const GEO_TIMEOUT_MS = 15_000
const GEO_MAX_AGE_MS = 30_000

/**
 * @typedef {{ status: string, latitude: number|null, longitude: number|null, accuracy: number|null, error: string|null }} GeoState
 */

const initialState = {
  status: 'idle',
  latitude: null,
  longitude: null,
  accuracy: null,
  error: null,
}

/**
 * Menerjemahkan error GeolocationPositionError ke pesan Bahasa Indonesia.
 * @param {GeolocationPositionError} err
 * @returns {string}
 */
function getGeoErrorMessage(err) {
  if (!err) return 'Lokasi tidak dapat diakses.'

  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser, lalu muat ulang halaman.'
    case 2: // POSITION_UNAVAILABLE
      return 'Lokasi tidak tersedia. Pastikan GPS aktif atau coba di tempat yang memiliki sinyal lebih baik.'
    case 3: // TIMEOUT
      return 'Pengambilan lokasi timeout. Pastikan GPS aktif dan coba lagi.'
    default:
      return err.message || 'Lokasi tidak dapat diakses.'
  }
}

/**
 * Hook untuk mengakses geolocation browser.
 *
 * @returns {{ geoState: GeoState, requestLocation: () => void, resetGeo: () => void }}
 */
export function useGeolocation() {
  const [geoState, setGeoState] = useState(initialState)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState({
        status: 'unavailable',
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Browser ini tidak mendukung geolocation. Gunakan browser modern seperti Chrome atau Firefox.',
      })
      return
    }

    setGeoState((prev) => ({ ...prev, status: 'requesting', error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          status: 'granted',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
        })
      },
      (err) => {
        const isDenied = err.code === 1

        setGeoState({
          status: isDenied ? 'denied' : 'unavailable',
          latitude: null,
          longitude: null,
          accuracy: null,
          error: getGeoErrorMessage(err),
        })
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: GEO_MAX_AGE_MS,
      },
    )
  }, [])

  const resetGeo = useCallback(() => {
    setGeoState(initialState)
  }, [])

  return { geoState, requestLocation, resetGeo }
}
