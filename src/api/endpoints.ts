import { apiClient } from './client'
import type { Status } from '@/components/StatusCard'
import type { User } from '@/store/auth'

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
    unfavourite: (id: string) => `/api/v1/statuses/${id}/unfavourite`,
    reblog: (id: string) => `/api/v1/statuses/${id}/reblog`,
    unreblog: (id: string) => `/api/v1/statuses/${id}/unreblog`,
    bookmark: (id: string) => `/api/v1/statuses/${id}/bookmark`,
    unbookmark: (id: string) => `/api/v1/statuses/${id}/unbookmark`,
  },
  reactions: {
    add: (id: string, emoji: string) => `/api/v1/pleroma/statuses/${id}/reactions/${emoji}`,
    remove: (id: string, emoji: string) => `/api/v1/pleroma/statuses/${id}/reactions/${emoji}`,
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
  return apiClient<User>(ENDPOINTS.verifyCredentials)
}

export async function fetchInstanceConfig() {
  return apiClient<{max_toot_chars?: number}>(ENDPOINTS.instance)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(payload).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
  )

  return apiClient(ENDPOINTS.statuses.post, {
    method: 'POST',
    body: JSON.stringify(cleanPayload)
  })
}

export async function toggleReblogStatus(id: string, isReblogged: boolean) {
  return apiClient(isReblogged ? ENDPOINTS.statuses.unreblog(id) : ENDPOINTS.statuses.reblog(id), {
    method: 'POST'
  })
}

export async function toggleFavouriteStatus(id: string, isFavourited: boolean) {
  return apiClient(isFavourited ? ENDPOINTS.statuses.unfavourite(id) : ENDPOINTS.statuses.favourite(id), {
    method: 'POST'
  })
}

export async function toggleBookmarkStatus(id: string, isBookmarked: boolean) {
  return apiClient(isBookmarked ? ENDPOINTS.statuses.unbookmark(id) : ENDPOINTS.statuses.bookmark(id), {
    method: 'POST'
  })
}

export async function toggleReaction(id: string, emoji: string, isReacted: boolean) {
  return apiClient(isReacted ? ENDPOINTS.reactions.remove(id, emoji) : ENDPOINTS.reactions.add(id, emoji), {
    method: isReacted ? 'DELETE' : 'PUT'
  })
}

export async function uploadMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return apiClient<{id: string}>(ENDPOINTS.media, {
    method: 'POST',
    body: formData
  })
}

export async function fetchHomeTimeline(params?: Record<string, string | number | boolean>) {
  return apiClient<Status[]>(ENDPOINTS.timelines.home, { params })
}

export async function fetchLocalTimeline(params?: Record<string, string | number | boolean>) {
  return apiClient<Status[]>(ENDPOINTS.timelines.public, { params: { ...params, local: true } })
}

export async function fetchFederatedTimeline(params?: Record<string, string | number | boolean>) {
  return apiClient<Status[]>(ENDPOINTS.timelines.public, { params })
}

export async function voteOnPoll(pollId: string, choices: number[]) {
  return apiClient(ENDPOINTS.polls.vote(pollId), {
    method: 'POST',
    body: JSON.stringify({ choices })
  })
}
