const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050'

export async function getHealthStatus() {
  const response = await fetch(`${API_BASE_URL}/api/health`)

  if (!response.ok) {
    throw new Error('Gagal memeriksa status API')
  }

  return response.json()
}

export { API_BASE_URL }
