import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../components/UserNavbar'
import { fetchFleaMarketListings, getFleaMarketConfig } from '../lib/fleaMarketApi'
import '../styles/fleaMarket.css'

const formatPrice = (value, currency) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'

  const numberText = new Intl.NumberFormat('en-US').format(value)
  if (!currency) return numberText
  return `${currency} ${numberText}`
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function FleaMarketPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [listings, setListings] = useState([])
  const [meta, setMeta] = useState({ total: 0, updatedAt: null })
  const [lastSync, setLastSync] = useState(null)
  const config = getFleaMarketConfig()

  const loadListings = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchFleaMarketListings(signal)
      if (signal?.aborted) return

      setListings(response.items)
      setMeta(response.meta)
      setLastSync(new Date())
    } catch (requestError) {
      if (signal?.aborted) return
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Flea Market data.')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadListings(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadListings])

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return listings

    return listings.filter((listing) => (
      listing.name.toLowerCase().includes(normalizedQuery)
      || listing.seller.toLowerCase().includes(normalizedQuery)
      || listing.category.toLowerCase().includes(normalizedQuery)
    ))
  }, [listings, query])

  const averagePrice = useMemo(() => {
    const pricedListings = filteredListings.filter((listing) => typeof listing.price === 'number')
    if (!pricedListings.length) return null

    const totalPrice = pricedListings.reduce((total, listing) => total + listing.price, 0)
    return totalPrice / pricedListings.length
  }, [filteredListings])

  const headerUpdatedAt = meta.updatedAt ? formatDate(meta.updatedAt) : formatDate(lastSync)

  return (
    <div className="zmfm-page">
      <UserNavbar />
      <div className="zmfm-shell">
        <header className="zmfm-hero">
          <div>
            <p className="zmfm-kicker">Zona Merah Trade Hub</p>
            <h1>ZM Flea Market</h1>
            <p className="zmfm-subtitle">
              Live listing sync from your backend API for Project Zomboid community trading.
            </p>
          </div>
          <div className="zmfm-hero-actions">
            <button
              type="button"
              className="zmfm-btn zmfm-btn-primary"
              onClick={() => {
                void loadListings()
              }}
              disabled={loading}
            >
              {loading ? 'Syncing...' : 'Refresh Listings'}
            </button>
            <Link to="/profile" className="zmfm-btn zmfm-btn-secondary">Profile</Link>
            <Link to="/" className="zmfm-btn zmfm-btn-secondary">Back to Dashboard</Link>
          </div>
        </header>

        <section className="zmfm-stats">
          <article className="zmfm-stat-card">
            <p>Total Listings</p>
            <strong>{meta.total || listings.length}</strong>
          </article>
          <article className="zmfm-stat-card">
            <p>Visible Listings</p>
            <strong>{filteredListings.length}</strong>
          </article>
          <article className="zmfm-stat-card">
            <p>Average Price</p>
            <strong>{averagePrice === null ? '-' : formatPrice(averagePrice)}</strong>
          </article>
          <article className="zmfm-stat-card">
            <p>Last Update</p>
            <strong>{headerUpdatedAt || '-'}</strong>
          </article>
        </section>

        <section className="zmfm-panel">
          <div className="zmfm-toolbar">
            <div className="zmfm-search">
              <label htmlFor="market-search">Search listing</label>
              <input
                id="market-search"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Item, seller, or category..."
              />
            </div>
          </div>

          {error ? (
            <div className="zmfm-alert" role="alert">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="zmfm-loading">Loading Flea Market data...</div>
          ) : null}

          {!loading && !error && filteredListings.length === 0 ? (
            <div className="zmfm-empty">
              No listings found. Adjust your search or verify the API response shape.
            </div>
          ) : null}

          {!loading && !error && filteredListings.length > 0 ? (
            <div className="zmfm-table-wrap">
              <table className="zmfm-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Seller</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id}>
                      <td>{listing.name}</td>
                      <td>{listing.category}</td>
                      <td>{formatPrice(listing.price, listing.currency)}</td>
                      <td>{listing.quantity}</td>
                      <td>{listing.seller}</td>
                      <td>{formatDate(listing.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default FleaMarketPage
