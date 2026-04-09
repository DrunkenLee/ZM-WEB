import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import {
  deleteMyUserAvatarRequest,
  fetchMyUserDetailRequest,
  fetchUserDetailStatusesRequest,
  uploadMyUserAvatarRequest,
  upsertMyUserDetailRequest,
} from '../lib/userDetailsApi'
import { buildApiUrl } from '../lib/apiBase'
import '../styles/profileManagement.css'

const DEFAULT_STATUSES = [
  { key: 'idle', label: 'Idle', icon: '🟡' },
  { key: 'raiding', label: 'Raiding', icon: '⚔️' },
  { key: 'chilling', label: 'Chilling', icon: '🍃' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const blockVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const readAvatarUrl = (detail) => {
  const raw = String(detail?.avatarUrl || detail?.avatarPath || '').trim()
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return buildApiUrl(raw)
}

const getInitials = (nameValue) => {
  const parts = String(nameValue || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'ZM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const fileInputRef = useRef(null)

  const [detail, setDetail] = useState(null)
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES)
  const [form, setForm] = useState({
    nickname: '',
    status: 'idle',
    description: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const activeStatus = useMemo(() => (
    statuses.find((status) => status.key === form.status)
    || statuses[0]
    || DEFAULT_STATUSES[0]
  ), [form.status, statuses])

  const avatarUrl = useMemo(() => readAvatarUrl(detail), [detail])
  const avatarInitials = useMemo(() => (
    getInitials(form.nickname || user?.username1 || user?.discordid)
  ), [form.nickname, user?.discordid, user?.username1])

  const syncFormFromDetail = useCallback((nextDetail, availableStatuses) => {
    const fallbackStatus = availableStatuses?.[0]?.key || DEFAULT_STATUSES[0].key
    setForm({
      nickname: nextDetail?.nickname || '',
      status: nextDetail?.status || fallbackStatus,
      description: nextDetail?.description || '',
    })
  }, [])

  const loadProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const [statusesPayload, detailPayload] = await Promise.all([
        fetchUserDetailStatusesRequest(),
        fetchMyUserDetailRequest(token),
      ])

      const nextStatuses = Array.isArray(statusesPayload?.statuses) && statusesPayload.statuses.length
        ? statusesPayload.statuses
        : DEFAULT_STATUSES

      setStatuses(nextStatuses)
      setDetail(detailPayload?.detail || null)
      syncFormFromDetail(detailPayload?.detail || null, nextStatuses)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }, [syncFormFromDetail, token])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleFieldChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!token) return

    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = await upsertMyUserDetailRequest(token, {
        nickname: form.nickname,
        status: form.status,
        description: form.description,
      })
      setDetail(payload?.detail || null)
      setNotice('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarButton = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    if (!token) return
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setNotice('')
    try {
      const payload = await uploadMyUserAvatarRequest(token, file)
      setDetail(payload?.detail || null)
      setNotice('Profile photo uploaded.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Avatar upload failed.')
    } finally {
      setUploading(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!token) return
    setUploading(true)
    setError('')
    setNotice('')
    try {
      const payload = await deleteMyUserAvatarRequest(token)
      setDetail(payload?.detail || null)
      setNotice('Profile photo removed.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to remove avatar.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.main
      className="pm-page"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="pm-shell">
        <motion.section className="pm-hero" variants={blockVariants}>
          <div>
            <p className="pm-kicker">User Profile Management</p>
            <h1>Manage Your Survivor Identity</h1>
            <p className="pm-subtitle">
              Set nickname, upload profile photo, update status icon, and add your description.
            </p>
          </div>
          <div className="pm-hero-actions">
            <Link to="/" className="pm-btn pm-btn-secondary">Dashboard</Link>
            <Link to="/flea-market" className="pm-btn pm-btn-secondary">Flea Market</Link>
            <Link to="/features" className="pm-btn pm-btn-secondary">Features</Link>
            <Link to="/topup-raid-points" className="pm-btn pm-btn-secondary">Top Up RP</Link>
          </div>
        </motion.section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.section
              key="loading"
              className="pm-loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              Loading your profile management data...
            </motion.section>
          ) : (
            <motion.section
              key="content"
              className="pm-layout"
              variants={blockVariants}
              initial="hidden"
              animate="show"
            >
              <motion.article
                className="pm-card pm-identity"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="pm-avatar-wrap">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User avatar" className="pm-avatar" />
                  ) : (
                    <div className="pm-avatar pm-avatar-fallback">{avatarInitials}</div>
                  )}
                  <div className="pm-avatar-actions">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      className="pm-avatar-input"
                    />
                    <motion.button
                      type="button"
                      className="pm-btn pm-btn-primary"
                      onClick={handleAvatarButton}
                      whileTap={{ scale: 0.97 }}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </motion.button>
                    <motion.button
                      type="button"
                      className="pm-btn pm-btn-danger"
                      onClick={handleRemoveAvatar}
                      whileTap={{ scale: 0.97 }}
                      disabled={uploading || !detail?.avatarPath}
                    >
                      Remove Photo
                    </motion.button>
                  </div>
                </div>

                <div className="pm-account-grid">
                  <div className="pm-key">User ID</div>
                  <div className="pm-value">{user?.id ?? user?.userid ?? '-'}</div>

                  <div className="pm-key">Whitelist Username</div>
                  <div className="pm-value">{user?.username1 || '-'}</div>

                  <div className="pm-key">Discord ID</div>
                  <div className="pm-value">{user?.discordid || '-'}</div>

                  <div className="pm-key">Steam ID</div>
                  <div className="pm-value">{user?.steamid || '-'}</div>

                  <div className="pm-key">Current Status</div>
                  <div className="pm-value">
                    <span className="pm-status-preview">
                      <span>{activeStatus?.icon}</span>
                      <span>{activeStatus?.label}</span>
                    </span>
                  </div>
                </div>
              </motion.article>

              <motion.article
                className="pm-card"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSave} className="pm-form">
                  <label htmlFor="pm-nickname">
                    Nickname
                    <input
                      id="pm-nickname"
                      type="text"
                      value={form.nickname}
                      onChange={(event) => handleFieldChange('nickname', event.target.value)}
                      placeholder="Your survivor nickname"
                      maxLength={48}
                    />
                  </label>

                  <fieldset className="pm-status-fieldset">
                    <legend>Status</legend>
                    <div className="pm-status-grid">
                      {statuses.map((statusOption) => {
                        const isActive = form.status === statusOption.key
                        return (
                          <motion.button
                            key={statusOption.key}
                            type="button"
                            className={`pm-status-btn${isActive ? ' is-active' : ''}`}
                            onClick={() => handleFieldChange('status', statusOption.key)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span className="pm-status-icon">{statusOption.icon}</span>
                            <span>{statusOption.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <label htmlFor="pm-description">
                    Description
                    <textarea
                      id="pm-description"
                      value={form.description}
                      onChange={(event) => handleFieldChange('description', event.target.value)}
                      placeholder="Tell other survivors about your playstyle, faction, or goals."
                      maxLength={600}
                      rows={5}
                    />
                  </label>
                  <p className="pm-char-counter">{(form.description || '').length} / 600</p>

                  <AnimatePresence>
                    {error ? (
                      <motion.div
                        className="pm-alert pm-alert-error"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        {error}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {notice ? (
                      <motion.div
                        className="pm-alert pm-alert-success"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        {notice}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="pm-form-actions">
                    <motion.button
                      className="pm-btn pm-btn-primary"
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </motion.button>
                    <motion.button
                      className="pm-btn pm-btn-secondary"
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { void loadProfile() }}
                      disabled={loading || saving}
                    >
                      Refresh
                    </motion.button>
                    <motion.button
                      className="pm-btn pm-btn-danger"
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleLogout}
                    >
                      Logout
                    </motion.button>
                  </div>
                </form>
              </motion.article>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}

export default ProfilePage
