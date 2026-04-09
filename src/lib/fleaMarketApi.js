const DEFAULT_ENDPOINT = '/api/flea-market/listings'

const readString = (value) => (typeof value === 'string' ? value.trim() : '')

const joinUrl = (baseUrl, endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }

  const safeBase = baseUrl.replace(/\/+$/, '')
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${safeBase}${safeEndpoint}`
}

const isListingsEndpoint = (url) => /\/listings(?:\/|$|\?)/.test(url)

const tryParseNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '')
    if (!normalized) return null
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

const normalizeTimestamp = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (/^\d+$/.test(trimmed)) {
      const unixNumber = Number(trimmed)
      if (Number.isFinite(unixNumber)) {
        const ms = unixNumber < 1_000_000_000_000 ? unixNumber * 1000 : unixNumber
        const date = new Date(ms)
        if (!Number.isNaN(date.getTime())) return date.toISOString()
      }
    }
  }

  return value
}

const readField = (record, keys) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key]
    }
  }

  return null
}

const normalizeItem = (record, index) => {
  const price = tryParseNumber(readField(record, [
    'price',
    'listing_price',
    'item_price',
    'value',
    'cost',
    'amount',
  ]))

  const quantity = readField(record, ['quantity', 'qty', 'stock', 'count', 'amount'])

  return {
    id: readField(record, ['id', 'listing_id', 'listingId', 'uuid']) ?? `row-${index}`,
    name: String(readField(record, ['name', 'displayName', 'item_name', 'itemName', 'title', 'item', 'itemType']) ?? 'Unnamed Item'),
    seller: String(readField(record, ['seller', 'seller_name', 'sellerName', 'username', 'player_name']) ?? 'Unknown Seller'),
    category: String(readField(record, ['category', 'type', 'group', 'itemType', 'status']) ?? 'Uncategorized'),
    quantity: quantity === null ? '-' : quantity,
    price,
    currency: String(readField(record, ['currency', 'currency_code']) ?? ''),
    updatedAt: normalizeTimestamp(readField(record, [
      'updated_at',
      'updatedAt',
      'created_at',
      'createdAt',
      'updatedAtUnix',
      'createdAtUnix',
      'soldAtUnix',
      'lastBuyAtUnix',
    ])),
  }
}

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  const topLevelCandidates = ['items', 'data', 'results', 'rows', 'listings', 'market']
  for (const key of topLevelCandidates) {
    if (Array.isArray(payload[key])) return payload[key]
  }

  const nestedCandidates = ['data', 'result', 'payload']
  for (const key of nestedCandidates) {
    const nested = payload[key]
    if (!nested || typeof nested !== 'object') continue

    for (const nestedKey of topLevelCandidates) {
      if (Array.isArray(nested[nestedKey])) return nested[nestedKey]
    }
  }

  return []
}

const extractMeta = (payload, normalizedItems) => {
  if (!payload || typeof payload !== 'object') {
    return {
      total: normalizedItems.length,
      updatedAt: null,
    }
  }

  const maybeTotal = tryParseNumber(
    readField(payload, ['total', 'count', 'total_items', 'totalItems']),
  )

  const paginationTotal = tryParseNumber(payload.pagination?.total ?? payload.meta?.total)

  return {
    total: maybeTotal ?? paginationTotal ?? normalizedItems.length,
    updatedAt: readField(payload, ['updated_at', 'updatedAt', 'last_updated', 'lastUpdated']) ?? null,
  }
}

const parseJsonResponse = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Flea Market API returned non-JSON response.')
  }
}

const fetchJson = async (url, signal) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    const compactBody = errorBody ? ` ${errorBody.slice(0, 180)}` : ''
    throw new Error(`Flea Market request failed (${response.status}).${compactBody}`.trim())
  }

  return parseJsonResponse(response)
}

export const getFleaMarketConfig = () => {
  const apiBaseUrl = readString(import.meta.env.VITE_ZM_API_BASE_URL) || window.location.origin
  const endpoint = readString(import.meta.env.VITE_ZM_FLEA_MARKET_ENDPOINT) || DEFAULT_ENDPOINT

  return {
    apiBaseUrl,
    endpoint,
    endpointUrl: joinUrl(apiBaseUrl, endpoint),
  }
}

export const fetchFleaMarketListings = async (signal) => {
  const { endpointUrl } = getFleaMarketConfig()

  const payload = await fetchJson(endpointUrl, signal)
  let itemsPayload = payload
  let rawItems = extractItems(payload)

  // If user points to the service root (/api/flea-market), auto-request /listings.
  if (
    !rawItems.length
    && payload
    && typeof payload === 'object'
    && payload.routes?.listings
    && !isListingsEndpoint(endpointUrl)
  ) {
    const fallbackUrl = `${endpointUrl.replace(/\/+$/, '')}/listings`
    const fallbackPayload = await fetchJson(fallbackUrl, signal)
    const fallbackItems = extractItems(fallbackPayload)

    if (fallbackItems.length) {
      itemsPayload = fallbackPayload
      rawItems = fallbackItems
    }
  }

  const normalizedItems = rawItems
    .filter((record) => record && typeof record === 'object')
    .map((record, index) => normalizeItem(record, index))

  return {
    items: normalizedItems,
    meta: extractMeta(itemsPayload, normalizedItems),
    raw: itemsPayload,
  }
}
