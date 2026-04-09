const readString = (value) => (typeof value === 'string' ? value.trim() : '')

export const getApiBaseUrl = () =>
  readString(import.meta.env.VITE_ZM_API_BASE_URL) || window.location.origin

export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl()
  const normalizedEndpoint = readString(endpoint)

  if (!normalizedEndpoint) {
    return baseUrl
  }

  if (normalizedEndpoint.startsWith('http://') || normalizedEndpoint.startsWith('https://')) {
    return normalizedEndpoint
  }

  const safeBase = baseUrl.replace(/\/+$/, '')
  const safeEndpoint = normalizedEndpoint.startsWith('/') ? normalizedEndpoint : `/${normalizedEndpoint}`
  return `${safeBase}${safeEndpoint}`
}
