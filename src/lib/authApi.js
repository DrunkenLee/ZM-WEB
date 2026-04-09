import { buildApiUrl } from './apiBase'

const LOGIN_ENDPOINT = import.meta.env.VITE_ZM_AUTH_LOGIN_ENDPOINT || '/api/auth/login'
const REGISTER_ENDPOINT = import.meta.env.VITE_ZM_AUTH_REGISTER_ENDPOINT || '/api/auth/register'
const ME_ENDPOINT = import.meta.env.VITE_ZM_AUTH_ME_ENDPOINT || '/api/auth/me'
const DISCORD_URL_ENDPOINT = import.meta.env.VITE_ZM_AUTH_DISCORD_URL_ENDPOINT || '/api/auth/discord/url'
const DISCORD_EXCHANGE_ENDPOINT = import.meta.env.VITE_ZM_AUTH_DISCORD_EXCHANGE_ENDPOINT || '/api/auth/discord/exchange'
const DISCORD_REGISTER_ENDPOINT = import.meta.env.VITE_ZM_AUTH_DISCORD_REGISTER_ENDPOINT || '/api/auth/discord/register'

const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { error: 'Server returned non-JSON response.' }
  }
}

const requestJson = async ({ url, method, body, token }) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parseJson(response)
  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

export const loginRequest = async ({ username, password }) =>
  requestJson({
    url: buildApiUrl(LOGIN_ENDPOINT),
    method: 'POST',
    body: { username, password },
  })

export const registerRequest = async ({ username, password, discordId, discordTag }) =>
  requestJson({
    url: buildApiUrl(REGISTER_ENDPOINT),
    method: 'POST',
    body: { username, password, discordId, discordTag },
  })

export const meRequest = async (token) =>
  requestJson({
    url: buildApiUrl(ME_ENDPOINT),
    method: 'GET',
    token,
  })

export const getDiscordOAuthUrlRequest = async (state) => {
  const url = new URL(buildApiUrl(DISCORD_URL_ENDPOINT))
  if (state) {
    url.searchParams.set('state', state)
  }

  return requestJson({
    url: url.toString(),
    method: 'GET',
  })
}

export const exchangeDiscordCodeRequest = async ({ code, state }) =>
  requestJson({
    url: buildApiUrl(DISCORD_EXCHANGE_ENDPOINT),
    method: 'POST',
    body: { code, state },
  })

export const registerWithDiscordCodeRequest = async ({ code, state }) =>
  requestJson({
    url: buildApiUrl(DISCORD_REGISTER_ENDPOINT),
    method: 'POST',
    body: { code, state },
  })
