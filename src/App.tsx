import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './screens/LoginPage'
import { DashboardPage } from './screens/DashboardPage'
import { TicketListPage } from './screens/TicketListPage'
import { TicketDetailPage } from './screens/TicketDetailPage'
import { NewTicketPage } from './screens/NewTicketPage'
import { InboxTriagemPage } from './screens/InboxTriagemPage'
import { ReadyGalleryPage } from './screens/ReadyGalleryPage'
import { ReportsPage } from './screens/ReportsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/demandas"
            element={
              <ProtectedRoute>
                <TicketListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/demandas/nova"
            element={
              <ProtectedRoute>
                <NewTicketPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/demandas/:id"
            element={
              <ProtectedRoute>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/triagem"
            element={
              <ProtectedRoute>
                <InboxTriagemPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/prontos"
            element={
              <ProtectedRoute>
                <ReadyGalleryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
