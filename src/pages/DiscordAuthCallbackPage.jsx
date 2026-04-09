import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/authPages.css'

const OAUTH_STATE_KEY = 'zm_discord_oauth_state'
const OAUTH_REDIRECT_KEY = 'zm_discord_oauth_redirect'

function DiscordAuthCallbackPage() {
  const { registerWithDiscordCode } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const callbackError = useMemo(() => searchParams.get('error'), [searchParams])
  const callbackCode = useMemo(() => searchParams.get('code'), [searchParams])
  const callbackState = useMemo(() => searchParams.get('state'), [searchParams])

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      if (callbackError) {
        if (isMounted) {
          setError(`Discord authorization failed: ${callbackError}`)
          setLoading(false)
        }
        return
      }

      if (!callbackCode) {
        if (isMounted) {
          setError('Missing OAuth code from Discord callback.')
          setLoading(false)
        }
        return
      }

      const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
      if (!expectedState || callbackState !== expectedState) {
        if (isMounted) {
          setError('OAuth state validation failed. Please retry Discord login.')
          setLoading(false)
        }
        return
      }

      try {
        await registerWithDiscordCode({
          code: callbackCode,
          state: callbackState,
        })

        const redirectTarget = sessionStorage.getItem(OAUTH_REDIRECT_KEY) || '/profile'
        sessionStorage.removeItem(OAUTH_STATE_KEY)
        sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
        navigate(redirectTarget, { replace: true })
      } catch (requestError) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to finalize Discord auth.')
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      isMounted = false
    }
  }, [callbackCode, callbackError, callbackState, navigate, registerWithDiscordCode])

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Discord Login</h1>
        <p>Finalizing your Discord session...</p>

        {loading ? <div className="auth-success">Connecting your Discord identity...</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}

        {!loading ? (
          <div className="auth-links">
            <Link to="/register" className="auth-link">Back to Register</Link>
            <Link to="/login" className="auth-link">Back to Login</Link>
            <Link to="/" className="auth-link">Back to Home</Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default DiscordAuthCallbackPage
