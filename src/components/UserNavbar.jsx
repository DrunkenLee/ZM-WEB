import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buildApiUrl } from '../lib/apiBase'
import { fetchMyUserDetailRequest, syncMyIngameStatusRequest } from '../lib/userDetailsApi'
import '../styles/userNavbar.css'

const DISCORD_INVITE_URL = 'https://discord.gg/4CSsdS44Gq'

const getInitials = (value) => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'ZM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const resolveAvatarUrl = (detail) => {
  const avatarUrl = String(detail?.avatarUrl || '').trim()
  if (avatarUrl) return avatarUrl

  const avatarPath = String(detail?.avatarPath || '').trim()
  if (!avatarPath) return null
  return buildApiUrl(avatarPath)
}

function UserNavbar() {
  const { user, token, isAuthenticated } = useAuth()
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [gamePresence, setGamePresence] = useState({
    state: 'not_synced',
    checkedAt: null,
    matchedUsername: null,
  })
  const [showWhitelistPopup, setShowWhitelistPopup] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadDetail = async () => {
      if (!isAuthenticated || !token) return
      setDetailLoading(true)

      try {
        const payload = await fetchMyUserDetailRequest(token)
        if (!isMounted) return
        setDetail(payload?.detail || null)
      } catch {
        if (!isMounted) return
        setDetail(null)
      } finally {
        if (isMounted) {
          setDetailLoading(false)
        }
      }
    }

    void loadDetail()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, token])

  const displayName = useMemo(() => (
    detail?.nickname
    || user?.username1
    || user?.discordid
    || 'Survivor'
  ), [detail?.nickname, user?.discordid, user?.username1])

  const avatarUrl = useMemo(() => resolveAvatarUrl(detail), [detail])
  const userStatusLabel = useMemo(() => {
    const icon = detail?.statusIcon || '🟡'
    const label = detail?.statusLabel || 'Idle'
    return `${icon} ${label}`
  }, [detail?.statusIcon, detail?.statusLabel])

  const gamePresenceLabel = useMemo(() => {
    if (gamePresence.state === 'online') return 'Online'
    if (gamePresence.state === 'offline') return 'Offline'
    return 'Not Synced'
  }, [gamePresence.state])

  const syncIngameStatus = async () => {
    if (!token) return

    setSyncing(true)
    setSyncError('')
    try {
      const payload = await syncMyIngameStatusRequest(token)
      setDetail(payload?.detail || detail)
      setGamePresence({
        state: payload?.gamePresence?.state || 'offline',
        checkedAt: payload?.checkedAt || new Date().toISOString(),
        matchedUsername: payload?.gamePresence?.matchedUsername || null,
      })

      if (payload?.whitelist && payload.whitelist.isWhitelisted === false) {
        setShowWhitelistPopup(true)
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Failed to sync game status.')
    } finally {
      setSyncing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <motion.nav
        className="usernav"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="usernav-content">
          <div className="usernav-identity">
            <div className="usernav-avatar usernav-avatar-fallback">ZM</div>
            <div>
              <p className="usernav-name">Guest Survivor</p>
              <p className="usernav-sub">Login to sync in-game status</p>
            </div>
          </div>
          <div className="usernav-actions">
            <Link to="/features" className="usernav-btn usernav-btn-secondary">Features</Link>
            <Link to="/in-game-rules" className="usernav-btn usernav-btn-secondary">Rules</Link>
            <Link to="/login" className="usernav-btn usernav-btn-secondary">Login</Link>
            <Link to="/register" className="usernav-btn usernav-btn-primary">Register</Link>
          </div>
        </div>
      </motion.nav>
    )
  }

  return (
    <>
      <motion.nav
        className="usernav"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="usernav-content">
          <div className="usernav-identity">
            {avatarUrl ? (
              <img className="usernav-avatar" src={avatarUrl} alt="User profile avatar" />
            ) : (
              <div className="usernav-avatar usernav-avatar-fallback">{getInitials(displayName)}</div>
            )}
            <div>
              <p className="usernav-name">{displayName}</p>
              <p className="usernav-sub">
                {detailLoading ? 'Loading profile...' : userStatusLabel}
              </p>
            </div>
          </div>

          <div className="usernav-status-wrap">
            <span className={`usernav-game-status is-${gamePresence.state}`}>
              {gamePresence.state === 'online' ? '🟢' : gamePresence.state === 'offline' ? '🔴' : '⚪'} {gamePresenceLabel}
            </span>
            {gamePresence.checkedAt ? (
              <span className="usernav-check-time">
                {new Date(gamePresence.checkedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </div>

          <div className="usernav-actions">
            <motion.button
              type="button"
              className="usernav-btn usernav-btn-primary"
              onClick={syncIngameStatus}
              whileTap={{ scale: 0.97 }}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Ingame Status'}
            </motion.button>
            <Link to="/features" className="usernav-btn usernav-btn-secondary">Features</Link>
            <Link to="/in-game-rules" className="usernav-btn usernav-btn-secondary">Rules</Link>
            <Link to="/profile" className="usernav-btn usernav-btn-secondary">Profile</Link>
          </div>
        </div>
        {syncError ? <div className="usernav-error">{syncError}</div> : null}
      </motion.nav>

      <AnimatePresence>
        {showWhitelistPopup ? (
          <motion.div
            className="usernav-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="usernav-modal"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h3>You Are Not Whitelisted Yet</h3>
              <p>
                Join Discord and run <code>!whitelistme</code> while online in-game to get whitelisted,
                unlock all integrated website features, and claim your <strong>20k server points bonus</strong>.
              </p>
              <div className="usernav-modal-actions">
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="usernav-btn usernav-btn-primary"
                >
                  Join Discord
                </a>
                <motion.button
                  type="button"
                  className="usernav-btn usernav-btn-secondary"
                  onClick={() => setShowWhitelistPopup(false)}
                  whileTap={{ scale: 0.97 }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default UserNavbar
