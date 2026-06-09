import { apiClient } from './client'

export const ENDPOINTS = {
  oauthToken: '/oauth/token',
  registerApp: '/api/v1/apps',
  register: '/api/v1/accounts',
  captcha: '/api/v1/pleroma/captcha',
  verifyCredentials: '/api/v1/accounts/verify_credentials',
  instance: '/api/v1/instance',
  media: '/api/v1/media',
  timelines: {
    public: '/api/v1/timelines/public',
    home: '/api/v1/timelines/home',
    bubble: '/api/v1/timelines/bubble',
  },
  statuses: {
    post: '/api/v1/statuses',
    detail: (id: string) => `/api/v1/statuses/${id}`,
    favourite: (id: string) => `/api/v1/statuses/${id}/favourite`,
    reblog: (id: string) => `/api/v1/statuses/${id}/reblog`,
  },
  polls: {
    vote: (id: string) => `/api/v1/polls/${id}/votes`,
  },
  accounts: {
    detail: (id: string) => `/api/v1/accounts/${id}`,
    statuses: (id: string) => `/api/v1/accounts/${id}/statuses`,
  }
}

export async function verifyCredentials() {
  return apiClient(ENDPOINTS.verifyCredentials)
}

export async function fetchInstanceConfig() {
  return apiClient(ENDPOINTS.instance)
}

export interface PostStatusPayload {
  status: string
  visibility?: "public" | "unlisted" | "private" | "direct"
  spoiler_text?: string
  content_type?: string
  media_ids?: string[]
  poll?: {
    options: string[]
    expires_in: number
    multiple: boolean
  }
  // Local only is often implemented as a custom parameter in Akkoma/Pleroma.
  // Pleroma uses `in_reply_to_id` and custom visibility or boolean.
  // We will pass `local: true` if needed.
  local?: boolean
  language?: string
  in_reply_to_id?: string
  quote_id?: string
}

export async function postStatus(payload: PostStatusPayload) {
  // Strip out any empty strings from payload to avoid API validation errors
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
  )

  return apiClient(ENDPOINTS.statuses.post, {
    method: 'POST',
    body: JSON.stringify(cleanPayload)
  })
}

export async function uploadMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return apiClient(ENDPOINTS.media, {
    method: 'POST',
    body: formData
  })
}

export async function fetchHomeTimeline(params?: Record<string, any>) {
  return apiClient(ENDPOINTS.timelines.home, { params })
}

export async function fetchLocalTimeline(params?: Record<string, any>) {
  return apiClient(ENDPOINTS.timelines.public, { params: { ...params, local: true } })
}

export async function fetchFederatedTimeline(params?: Record<string, any>) {
  return apiClient(ENDPOINTS.timelines.public, { params })
}

export async function voteOnPoll(pollId: string, choices: number[]) {
  return apiClient(ENDPOINTS.polls.vote(pollId), {
    method: 'POST',
    body: JSON.stringify({ choices })
  })
}
