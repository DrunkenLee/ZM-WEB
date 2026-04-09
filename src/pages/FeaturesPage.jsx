import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import UserNavbar from '../components/UserNavbar'
import '../styles/featuresPage.css'

const CURRENT_FEATURES = [
  {
    id: 'extraction-zone',
    title: 'Zona Merah Extraction Zone',
    cadence: 'Every 20 minutes',
    summary: 'Fast extraction cycle with King of the Hill pressure and high-value loot runs.',
    status: 'Live',
    image: '/img/features/feature-extraction.jpg',
    videoUrl: '',
  },
  {
    id: 'npc-lore',
    title: 'Unique NPC Lore & Stories',
    cadence: 'Always active',
    summary: 'NPC-driven lore events, hidden interactions, and story-based rewards.',
    status: 'Live',
    image: '/img/features/feature-npc-lore.jpg',
    videoUrl: '',
  },
  {
    id: 'admin-raid-night',
    title: 'Admin Raid Night',
    cadence: 'Every Wednesday',
    summary: 'Rotating mission cards, boss zombies, and tactical extraction objectives.',
    status: 'Live',
    image: '/img/features/feature-admin-raid.jpg',
    videoUrl: '',
  },
]

const UPCOMING_FEATURES = [
  {
    id: 'territory-control',
    title: 'Faction Territory Control',
    cadence: 'Upcoming',
    summary: 'Faction zones with weekly ownership scoring, upkeep costs, and map influence bonuses.',
    status: 'Upcoming',
    image: '/img/features/feature-extraction.jpg',
    videoUrl: '',
  },
  {
    id: 'dynamic-trader',
    title: 'Dynamic Trader Caravan',
    cadence: 'Upcoming',
    summary: 'Moving black-market trader convoy with limited-time stock and ambush risk.',
    status: 'Upcoming',
    image: '/img/features/feature-npc-lore.jpg',
    videoUrl: '',
  },
  {
    id: 'player-bounties',
    title: 'Player Bounties Board',
    cadence: 'Upcoming',
    summary: 'Contract-based hunting system with optional PvP bounty targets and ranking rewards.',
    status: 'Upcoming',
    image: '/img/features/feature-admin-raid.jpg',
    videoUrl: '',
  },
]

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const blockVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: 'easeOut',
    },
  },
}

const toYoutubeEmbedUrl = (url) => {
  const value = String(url || '').trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (!id) return null
      return `https://www.youtube.com/embed/${id}`
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (!id) return null
      return `https://www.youtube.com/embed/${id}`
    }
  } catch {
    return null
  }

  return null
}

function FeatureCard({ feature }) {
  const attachedVideoUrl = String(feature.videoUrl || '').trim()

  const embedVideoUrl = useMemo(
    () => toYoutubeEmbedUrl(attachedVideoUrl),
    [attachedVideoUrl],
  )

  const isUpcoming = feature.status.toLowerCase() === 'upcoming'

  return (
    <motion.article
      className="feat-card"
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="feat-media-wrap">
        <img src={feature.image} alt={feature.title} className="feat-media" />
        <span className={`feat-status${isUpcoming ? ' is-upcoming' : ' is-live'}`}>
          {feature.status}
        </span>
      </div>

      <div className="feat-body">
        <h3>{feature.title}</h3>
        <p className="feat-cadence">{feature.cadence}</p>
        <p className="feat-summary">{feature.summary}</p>

        <p className="feat-video-label">Video Guide</p>

        {attachedVideoUrl ? (
          <div className="feat-video-actions">
            <a
              href={attachedVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="feat-btn feat-btn-primary"
            >
              Watch Video
            </a>
          </div>
        ) : (
          <p className="feat-video-empty">No video guide set yet.</p>
        )}

        {embedVideoUrl ? (
          <div className="feat-video-frame-wrap">
            <iframe
              className="feat-video-frame"
              src={embedVideoUrl}
              title={`${feature.title} preview video`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : null}
      </div>
    </motion.article>
  )
}

function FeaturesPage() {
  return (
    <motion.main
      className="feat-page"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <UserNavbar />
      <div className="feat-shell">
        <motion.section className="feat-hero" variants={blockVariants}>
          <div>
            <p className="feat-kicker">Zona Merah Roadmap Board</p>
            <h1>Features & Upcoming Features</h1>
            <p className="feat-subtitle">
              Each feature has its own card. Video guides are controlled from source code only.
            </p>
          </div>
          <div className="feat-hero-actions">
            <Link to="/" className="feat-btn feat-btn-secondary">Dashboard</Link>
            <Link to="/flea-market" className="feat-btn feat-btn-secondary">Flea Market</Link>
          </div>
        </motion.section>

        <motion.section className="feat-section" variants={blockVariants}>
          <div className="feat-section-header">
            <h2>Current Features</h2>
            <p>Live systems available now on Zona Merah.</p>
          </div>
          <div className="feat-grid">
            {CURRENT_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </motion.section>

        <motion.section className="feat-section" variants={blockVariants}>
          <div className="feat-section-header">
            <h2>Upcoming Features</h2>
            <p>Planned additions currently in design, balancing, or testing phase.</p>
          </div>
          <div className="feat-grid">
            {UPCOMING_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default FeaturesPage
