import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import DogProfilePage from './pages/DogProfilePage'
import AgendaPage from './pages/AgendaPage'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="perro/:id" element={<DogProfilePage />} />
            <Route path="agenda" element={<AgendaPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
