import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDiscordOAuthUrlRequest } from '../lib/authApi'
import '../styles/authPages.css'

const OAUTH_STATE_KEY = 'zm_discord_oauth_state'
const OAUTH_REDIRECT_KEY = 'zm_discord_oauth_redirect'

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [discordLoading, setDiscordLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleDiscordLogin = async () => {
    setError('')
    setDiscordLoading(true)
    try {
      const state = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

      sessionStorage.setItem(OAUTH_STATE_KEY, state)
      sessionStorage.setItem(OAUTH_REDIRECT_KEY, '/profile')
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
        <h1>Register</h1>
        <p>
          Registration now uses Discord OAuth only. Continue with Discord to create or sign in to your account.
        </p>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={handleDiscordLogin}
          disabled={discordLoading}
        >
          {discordLoading ? 'Redirecting to Discord...' : 'Continue with Discord'}
        </button>

        {error ? <div className="auth-error">{error}</div> : null}

        <div className="auth-links">
          <Link to="/login" className="auth-link">Use username/password login</Link>
          <Link to="/" className="auth-link">Back to Home</Link>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage
