import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import UserNavbar from '../components/UserNavbar'
import '../styles/inGameRules.css'

const DISCORD_INVITE_URL = 'https://discord.gg/4CSsdS44Gq'
const REPORT_CHANNEL_URL = 'https://discord.com/channels/1341572597271236618/1359894239768612964'

const GENERAL_RULES = [
  'No killing outside of PvP zones (Extraction Area).',
  'Do not grief, pick up, destroy, or build in non-residential buildings. This blocks loot respawn.',
  "Do not mess with other players' claimed vehicles (no damage, stealing, or salvaging).",
  'Do not claim non-residential buildings as your safehouse.',
  'If you leave a vehicle at CC, park it properly. Admins may tow vehicles blocking access.',
  "Respect other players' safehouses in the PvE zone. No griefing.",
  'Griefing actions in Community Center facilities will be fined accordingly.',
  'Do not claim a safehouse inside ZM Isolation Zone (soft wipe happens gradually every week).',
  'Attaching to vehicles or moving Airdrop Crates (or similar crates) is not allowed.',
]

const STABILITY_RULES = [
  {
    id: '10.1',
    title: 'Vehicle Limit',
    body: 'Maximum 8 vehicles per safehouse area (including trailers).',
    followUp: 'Please sell or salvage unused vehicles before 31 Jan 2026.',
  },
  {
    id: '10.2',
    title: 'Animal Limit',
    body: 'Maximum 10 animals per safehouse area (including baby chickens).',
    followUp: 'Please sell or cook extra animals to keep the population under control.',
  },
]

const PVP_RULES = [
  'Do not bring claimed vehicles into the Extraction Zone.',
  'Do not shoot from inside a vehicle.',
  'Do not claim safehouses inside the Extraction Zone.',
  'Do not get in vehicles or take cover inside vehicles while in combat vs other players inside the Extraction Zone.',
]

const SPECIAL_NOTES = [
  "Don't drop your items on the ground, even inside your safehouse.",
  'The server automatically deletes floor items over time to improve performance.',
]

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
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: 'easeOut',
    },
  },
}

function InGameRulesPage() {
  return (
    <motion.main
      className="igr-page"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <UserNavbar />
      <div className="igr-shell">
        <motion.section className="igr-hero" variants={blockVariants}>
          <div>
            <p className="igr-kicker">Zona Merah Community Guide</p>
            <h1>In Game Rules</h1>
            <p className="igr-subtitle">
              Apocalypse or not, we still need fair play. These rules keep Zona Merah fun, stable, and fair for everyone.
            </p>
          </div>
          <div className="igr-hero-actions">
            <Link to="/" className="igr-btn igr-btn-secondary">Back to Dashboard</Link>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="igr-btn igr-btn-primary">Join Discord</a>
          </div>
        </motion.section>

        <motion.section className="igr-card" variants={blockVariants}>
          <h2>General Rules (PvE Zone)</h2>
          <ol className="igr-list igr-ordered-list">
            {GENERAL_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </motion.section>

        <motion.section className="igr-card" variants={blockVariants}>
          <h2>New Due To 42.13 - Server Stability And Community Consent</h2>
          <p className="igr-muted">
            Vehicle rendering can impact chunk stability in crowded areas. Because of that, these temporary limits apply:
          </p>
          <ol className="igr-list igr-ordered-list">
            {STABILITY_RULES.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.id}. {rule.title}:</strong> {rule.body}
                <br />
                <span className="igr-muted">{rule.followUp}</span>
              </li>
            ))}
          </ol>
          <p className="igr-muted">
            These rules may be adjusted, shifted, or removed as Project Zomboid beta builds continue to update.
          </p>
          <div className="igr-penalty-box">
            <h3>Auto Fine (After Due Date)</h3>
            <p className="igr-muted">
              Any violation after the due date (31 Jan 2026) is fined automatically to the related faction or safehouse members:
            </p>
            <ul className="igr-list">
              <li><strong>10,000 Serverpoints</strong> per excessive vehicle, per day.</li>
              <li><strong>5,000 Serverpoints</strong> per excessive animal, per day.</li>
            </ul>
          </div>
        </motion.section>

        <motion.section className="igr-card" variants={blockVariants}>
          <h2>PvP Rules (Extraction / KOS Zone)</h2>
          <ol className="igr-list igr-ordered-list">
            {PVP_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </motion.section>

        <motion.section className="igr-card" variants={blockVariants}>
          <h2>Special Notes</h2>
          <ul className="igr-list">
            {SPECIAL_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="igr-tip">
            Tip: Always store your items in containers to keep them safe.
          </p>
        </motion.section>

        <motion.section className="igr-card" variants={blockVariants}>
          <h2>Why These Rules Exist</h2>
          <p className="igr-muted">
            So admins spend less time reviewing logs and more time improving the server. We do not want to ban anyone.
            Keep the community strong and fair for all survivors.
          </p>
          <div className="igr-actions-row">
            <a href={REPORT_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="igr-btn igr-btn-secondary">
              Report Violations
            </a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="igr-btn igr-btn-primary">
              Open Discord
            </a>
          </div>
        </motion.section>
      </div>
    </motion.main>
  )
}

export default InGameRulesPage
