import { useEffect } from 'react'
import { useAnimate } from 'motion/react'
import UserNavbar from '../components/UserNavbar'
import { useAuth } from '../context/AuthContext'
import homeTemplate from '../template/homeTemplate.html?raw'

const copyText = async (value) => {
  if (!value) return false

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Falls back to legacy copy API below.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  let didCopy = false
  try {
    didCopy = document.execCommand('copy')
  } catch {
    didCopy = false
  }

  textArea.remove()
  return didCopy
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const WIPE_WEEKDAY = 5 // Friday (0=Sunday)
const WIPE_HOUR_WIB = 19

const buildFirstFridayTargetUtcMs = (year, month) => {
  const monthStartUtcMs = Date.UTC(year, month, 1, 0, 0, 0, 0) - WIB_OFFSET_MS
  const monthStartWib = new Date(monthStartUtcMs + WIB_OFFSET_MS)
  const monthStartWeekday = monthStartWib.getUTCDay()
  const dayOffset = (WIPE_WEEKDAY - monthStartWeekday + 7) % 7
  return monthStartUtcMs + (dayOffset * 24 * 60 * 60 * 1000) + (WIPE_HOUR_WIB * 60 * 60 * 1000)
}

const getNextWipeTargetUtcMs = (fromUtcMs = Date.now()) => {
  const nowWib = new Date(fromUtcMs + WIB_OFFSET_MS)
  let year = nowWib.getUTCFullYear()
  let month = nowWib.getUTCMonth()

  let targetUtcMs = buildFirstFridayTargetUtcMs(year, month)
  if (targetUtcMs <= fromUtcMs) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    targetUtcMs = buildFirstFridayTargetUtcMs(year, month)
  }

  return targetUtcMs
}

const formatWipeTargetLabel = (targetUtcMs) => {
  const text = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(targetUtcMs))

  return `${text} WIB`
}

function HomePage() {
  const [scope, animate] = useAnimate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handleCopyClick = async (event) => {
      if (!(event.target instanceof Element)) return
      const targetButton = event.target.closest('[data-copy-text]')
      if (!targetButton) return

      event.preventDefault()

      const value = targetButton.getAttribute('data-copy-text')
      const defaultLabel = targetButton.getAttribute('data-default-label') || 'Copy'
      const copiedLabel = targetButton.getAttribute('data-copied-label') || 'Copied!'
      const failedLabel = targetButton.getAttribute('data-failed-label') || 'Try Again'
      const labelElement = targetButton.querySelector('[data-copy-label]')

      const didCopy = await copyText(value)
      if (labelElement) {
        labelElement.textContent = didCopy ? copiedLabel : failedLabel
      }

      window.setTimeout(() => {
        if (labelElement) {
          labelElement.textContent = defaultLabel
        }
      }, 1400)
    }

    document.addEventListener('click', handleCopyClick)
    return () => {
      document.removeEventListener('click', handleCopyClick)
    }
  }, [])

  useEffect(() => {
    const runDashboardAnimations = async () => {
      await animate(
        '.cms-sidebar',
        { opacity: [0, 1], x: [-24, 0] },
        { duration: 0.45, ease: 'easeOut' },
      )

      await animate(
        '#overview .cms-card',
        { opacity: [0, 1], y: [26, 0] },
        { duration: 0.5, ease: 'easeOut' },
      )

      const sections = Array.from(
        scope.current?.querySelectorAll('main section') || [],
      )
      sections.forEach((section, index) => {
        void animate(
          section,
          { opacity: [0, 1], y: [22, 0] },
          { duration: 0.45, delay: 0.08 * index, ease: 'easeOut' },
        )
      })

      const cards = Array.from(
        scope.current?.querySelectorAll('.cms-card') || [],
      )
      cards.forEach((card, index) => {
        void animate(
          card,
          { opacity: [0.9, 1], scale: [0.985, 1] },
          { duration: 0.36, delay: 0.02 * index, ease: 'easeOut' },
        )
      })

      const galleryThumbs = Array.from(
        scope.current?.querySelectorAll('.gallery-thumb') || [],
      )
      galleryThumbs.forEach((thumb, index) => {
        void animate(
          thumb,
          { opacity: [0.85, 1], y: [14, 0] },
          { duration: 0.35, delay: 0.03 * index, ease: 'easeOut' },
        )
      })
    }

    void runDashboardAnimations()
  }, [animate, scope])

  useEffect(() => {
    const root = scope.current
    if (!root) return undefined

    const hoverTargets = root.querySelectorAll(
      '.cms-card, .copy-button, .gallery-thumb, .btn, .nav-link',
    )
    const cleanups = []

    for (const target of hoverTargets) {
      if (!(target instanceof HTMLElement)) continue

      const handlePointerEnter = () => {
        void animate(
          target,
          { scale: 1.015, y: -2 },
          { duration: 0.2, ease: 'easeOut' },
        )
      }

      const handlePointerLeave = () => {
        void animate(
          target,
          { scale: 1, y: 0 },
          { duration: 0.2, ease: 'easeOut' },
        )
      }

      target.addEventListener('pointerenter', handlePointerEnter)
      target.addEventListener('pointerleave', handlePointerLeave)
      cleanups.push(() => {
        target.removeEventListener('pointerenter', handlePointerEnter)
        target.removeEventListener('pointerleave', handlePointerLeave)
      })
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [animate, scope])

  useEffect(() => {
    const root = scope.current
    if (!root) return

    const guestOnlyLinks = root.querySelectorAll('[data-nav-guest-only]')
    guestOnlyLinks.forEach((linkElement) => {
      if (isAuthenticated) {
        linkElement.setAttribute('hidden', '')
        linkElement.setAttribute('aria-hidden', 'true')
        linkElement.setAttribute('tabindex', '-1')
      } else {
        linkElement.removeAttribute('hidden')
        linkElement.removeAttribute('aria-hidden')
        linkElement.removeAttribute('tabindex')
      }
    })
  }, [isAuthenticated, scope])

  useEffect(() => {
    const root = scope.current
    if (!root) return undefined

    const targetElement = root.querySelector('[data-countdown-target]')
    const unitElements = {
      days: root.querySelector('[data-countdown-days]'),
      hours: root.querySelector('[data-countdown-hours]'),
      minutes: root.querySelector('[data-countdown-minutes]'),
      seconds: root.querySelector('[data-countdown-seconds]'),
    }

    if (!targetElement || !unitElements.days || !unitElements.hours || !unitElements.minutes || !unitElements.seconds) {
      return undefined
    }

    let targetUtcMs = getNextWipeTargetUtcMs(Date.now())
    targetElement.textContent = formatWipeTargetLabel(targetUtcMs)

    const previousValue = {
      days: null,
      hours: null,
      minutes: null,
      seconds: null,
    }

    const updateCountdown = () => {
      const nowUtcMs = Date.now()
      if (nowUtcMs >= targetUtcMs) {
        targetUtcMs = getNextWipeTargetUtcMs(nowUtcMs + 1000)
        targetElement.textContent = formatWipeTargetLabel(targetUtcMs)
      }

      const remainingSeconds = Math.max(0, Math.floor((targetUtcMs - nowUtcMs) / 1000))
      const nextValue = {
        days: Math.floor(remainingSeconds / 86400),
        hours: Math.floor((remainingSeconds % 86400) / 3600),
        minutes: Math.floor((remainingSeconds % 3600) / 60),
        seconds: remainingSeconds % 60,
      }

      for (const [unit, rawValue] of Object.entries(nextValue)) {
        const element = unitElements[unit]
        if (!element) continue

        const formattedValue = unit === 'days'
          ? String(rawValue)
          : String(rawValue).padStart(2, '0')

        if (element.textContent !== formattedValue) {
          element.textContent = formattedValue
        }

        if (previousValue[unit] !== null && previousValue[unit] !== rawValue) {
          void animate(
            element,
            { scale: [1.15, 1], opacity: [0.45, 1] },
            { duration: 0.32, ease: 'easeOut' },
          )
        }

        previousValue[unit] = rawValue
      }
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [animate, scope])

  return (
    <>
      <UserNavbar />
      <div
        ref={scope}
        dangerouslySetInnerHTML={{ __html: homeTemplate }}
        suppressHydrationWarning
      />
    </>
  )
}

export default HomePage
