import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDiscordOAuthUrlRequest } from '../lib/authApi'
import '../styles/authPages.css'

const OAUTH_STATE_KEY = 'zm_discord_oauth_state'
const OAUTH_REDIRECT_KEY = 'zm_discord_oauth_redirect'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTarget = location.state?.from || '/flea-market'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ username, password })
      navigate(redirectTarget, { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscordLogin = async () => {
    setError('')
    setDiscordLoading(true)
    try {
      const state = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      sessionStorage.setItem(OAUTH_STATE_KEY, state)
      sessionStorage.setItem(OAUTH_REDIRECT_KEY, redirectTarget)

      const payload = await getDiscordOAuthUrlRequest(state)
      if (!payload?.url) {
        throw new Error('Missing Discord OAuth URL from API.')
      }

      window.location.assign(payload.url)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to start Discord OAuth.')
      setDiscordLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Login</h1>
        <p>Use your Project Zomboid whitelist username and password.</p>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={handleDiscordLogin}
          disabled={discordLoading}
        >
          {discordLoading ? 'Redirecting to Discord...' : 'One-click Login with Discord'}
        </button>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-username">
            Username
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. SurvivorName"
              autoComplete="username"
              required
            />
          </label>

          <label htmlFor="login-password">
            Password
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your whitelist password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register" className="auth-link">Need an account? Register</Link>
          <Link to="/" className="auth-link">Back to Home</Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
