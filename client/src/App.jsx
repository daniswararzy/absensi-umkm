import { AuthProvider } from './contexts'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
