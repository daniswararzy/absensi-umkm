import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, StatusBadge } from '../components/ui'
import { loginAccounts, prototypeFlow } from '../data/dummyData'

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [errorMessage, setErrorMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!username || !password) {
      setErrorMessage('Silakan isi username dan password')
      return
    }

    const account = loginAccounts.find(
      (item) => item.username === username && item.password === password,
    )

    if (!account) {
      setErrorMessage('Username atau password salah')
      return
    }

    navigate(account.redirectTo)
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <p className="eyebrow">Prototype PI</p>
        <h1>Absensi UMKM berbasis face recognition</h1>
        <p>
          Alur frontend dibuat lengkap dengan dummy data agar bisa diuji dan
          dipresentasikan sebelum integrasi backend.
        </p>
        <ol className="flow-list">
          {prototypeFlow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <Card
        className="login-card"
        description="Silakan masuk untuk mengelola sistem absensi pegawai"
        title="Login Admin"
      >
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-badges">
            {loginAccounts.map((account) => (
              <StatusBadge key={account.role} tone="info">
                {account.label}: {account.username} / {account.password}
              </StatusBadge>
            ))}
          </div>
          <Input
            id="admin-username"
            label="Username"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
          <Input
            id="admin-password"
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {errorMessage ? <p className="form-message error">{errorMessage}</p> : null}
          <Button type="submit">Masuk</Button>
        </form>
      </Card>
    </main>
  )
}

export default LoginPage
