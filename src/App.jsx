import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import FleaMarketPage from './pages/FleaMarketPage'
import DiscordAuthCallbackPage from './pages/DiscordAuthCallbackPage'
import FeaturesPage from './pages/FeaturesPage'
import HomePage from './pages/HomePage'
import InGameRulesPage from './pages/InGameRulesPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import TopUpRaidPointsPage from './pages/TopUpRaidPointsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/in-game-rules" element={<InGameRulesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/topup-raid-points" element={<TopUpRaidPointsPage />} />
          <Route path="/auth/discord/callback" element={<DiscordAuthCallbackPage />} />

          <Route
            path="/flea-market"
            element={(
              <ProtectedRoute>
                <FleaMarketPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/zm-flea-market" element={<Navigate to="/flea-market" replace />} />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            )}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
