import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import UserNavbar from '../components/UserNavbar'
import '../styles/topUpRaidPoints.css'

const DONATION_TICKET_URL = 'https://discord.com/channels/1341572597271236618/1348472318002724977'
const IDR_PER_RAID_POINT = 2000
const IDR_PER_USD = 16500
const QUICK_PACKS = [10, 25, 50, 100, 250, 500]

const formatIdr = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value)

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value)

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const blockVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
}

function TopUpRaidPointsPage() {
  const [raidPoints, setRaidPoints] = useState(25)

  const totals = useMemo(() => {
    const totalIdr = raidPoints * IDR_PER_RAID_POINT
    const totalUsd = totalIdr / IDR_PER_USD
    return {
      totalIdr,
      totalUsd,
    }
  }, [raidPoints])

  const handleRaidPointsChange = (nextValue) => {
    const numericValue = Number.parseInt(String(nextValue || '0'), 10)
    if (Number.isNaN(numericValue)) {
      setRaidPoints(1)
      return
    }
    setRaidPoints(Math.max(1, numericValue))
  }

  return (
    <motion.main
      className="rtp-page"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <UserNavbar />
      <div className="rtp-shell">
        <motion.section className="rtp-hero" variants={blockVariants}>
          <div>
            <p className="rtp-kicker">Zona Merah Premium</p>
            <h1>Top Up Raid Points</h1>
            <p className="rtp-subtitle">
              Raid Points adalah currency premium in-game. Harga dasar: <strong>1 RP = Rp2.000</strong>.
            </p>
          </div>
          <div className="rtp-hero-actions">
            <Link to="/" className="rtp-btn rtp-btn-secondary">Back to Dashboard</Link>
            <Link to="/profile" className="rtp-btn rtp-btn-secondary">Profile</Link>
          </div>
        </motion.section>

        <motion.section className="rtp-grid" variants={blockVariants}>
          <motion.article
            className="rtp-card"
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h2>Top Up Calculator</h2>
            <p className="rtp-muted">Pilih jumlah Raid Points yang ingin dibeli.</p>

            <div className="rtp-input-group">
              <label htmlFor="raid-points-input">Raid Points</label>
              <div className="rtp-number-wrap">
                <motion.button
                  type="button"
                  className="rtp-icon-btn"
                  onClick={() => handleRaidPointsChange(raidPoints - 1)}
                  whileTap={{ scale: 0.95 }}
                >
                  -
                </motion.button>
                <input
                  id="raid-points-input"
                  type="number"
                  min={1}
                  value={raidPoints}
                  onChange={(event) => handleRaidPointsChange(event.target.value)}
                />
                <motion.button
                  type="button"
                  className="rtp-icon-btn"
                  onClick={() => handleRaidPointsChange(raidPoints + 1)}
                  whileTap={{ scale: 0.95 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            <div className="rtp-pack-grid">
              {QUICK_PACKS.map((pack) => (
                <motion.button
                  key={pack}
                  type="button"
                  className={`rtp-pack-btn${pack === raidPoints ? ' is-active' : ''}`}
                  onClick={() => handleRaidPointsChange(pack)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {pack} RP
                </motion.button>
              ))}
            </div>

            <div className="rtp-totals">
              <div>
                <p className="rtp-total-label">Total (IDR)</p>
                <strong className="rtp-total-main">{formatIdr(totals.totalIdr)}</strong>
              </div>
              <div>
                <p className="rtp-total-label">Approx (USD)</p>
                <strong className="rtp-total-usd">{formatUsd(totals.totalUsd)}</strong>
              </div>
            </div>
          </motion.article>

          <motion.article
            className="rtp-card"
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h2>Manual Donation via Discord Ticket</h2>
            <p className="rtp-muted">
              Untuk saat ini top up diproses manual oleh admin. Klik tombol di bawah untuk buka channel ticket donasi.
            </p>

            <div className="rtp-summary-list">
              <div className="rtp-summary-row">
                <span>Selected Raid Points</span>
                <strong>{raidPoints} RP</strong>
              </div>
              <div className="rtp-summary-row">
                <span>Pay in Rupiah</span>
                <strong>{formatIdr(totals.totalIdr)}</strong>
              </div>
              <div className="rtp-summary-row">
                <span>Approx USD</span>
                <strong>{formatUsd(totals.totalUsd)}</strong>
              </div>
              <div className="rtp-summary-row">
                <span>Rate Used</span>
                <strong>1 USD = {new Intl.NumberFormat('id-ID').format(IDR_PER_USD)} IDR</strong>
              </div>
            </div>

            <motion.a
              href={DONATION_TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rtp-btn rtp-btn-primary"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Open Discord Donation Ticket
            </motion.a>

            <p className="rtp-note">
              Sertakan username survivor kamu dan jumlah RP saat buka ticket agar proses lebih cepat.
            </p>
          </motion.article>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default TopUpRaidPointsPage
