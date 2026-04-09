import { buildApiUrl } from './apiBase'

const USER_DETAIL_ME_ENDPOINT = import.meta.env.VITE_ZM_USER_DETAIL_ME_ENDPOINT || '/api/user-details/me'
const USER_DETAIL_AVATAR_ENDPOINT = import.meta.env.VITE_ZM_USER_DETAIL_AVATAR_ENDPOINT || '/api/user-details/me/avatar'
const USER_DETAIL_STATUSES_ENDPOINT = import.meta.env.VITE_ZM_USER_DETAIL_STATUSES_ENDPOINT || '/api/user-details/statuses'
const USER_DETAIL_SYNC_GAME_STATUS_ENDPOINT = import.meta.env.VITE_ZM_USER_DETAIL_SYNC_GAME_STATUS_ENDPOINT || '/api/user-details/me/sync-game-status'

const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { error: 'Server returned non-JSON response.' }
  }
}

const requestJson = async ({ url, method, token, body }) => {
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
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }

  return payload
}

const requestFormData = async ({ url, method, token, formData }) => {
  const headers = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  })

  const payload = await parseJson(response)
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }

  return payload
}

export const fetchUserDetailStatusesRequest = async () =>
  requestJson({
    url: buildApiUrl(USER_DETAIL_STATUSES_ENDPOINT),
    method: 'GET',
  })

export const fetchMyUserDetailRequest = async (token) =>
  requestJson({
    url: buildApiUrl(USER_DETAIL_ME_ENDPOINT),
    method: 'GET',
    token,
  })

export const upsertMyUserDetailRequest = async (token, body) =>
  requestJson({
    url: buildApiUrl(USER_DETAIL_ME_ENDPOINT),
    method: 'PUT',
    token,
    body,
  })

export const uploadMyUserAvatarRequest = async (token, file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  return requestFormData({
    url: buildApiUrl(USER_DETAIL_AVATAR_ENDPOINT),
    method: 'POST',
    token,
    formData,
  })
}

export const deleteMyUserAvatarRequest = async (token) =>
  requestJson({
    url: buildApiUrl(USER_DETAIL_AVATAR_ENDPOINT),
    method: 'DELETE',
    token,
  })

export const syncMyIngameStatusRequest = async (token) =>
  requestJson({
    url: buildApiUrl(USER_DETAIL_SYNC_GAME_STATUS_ENDPOINT),
    method: 'POST',
    token,
  })
