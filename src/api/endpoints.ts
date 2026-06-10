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
    single: (id: string) => `/api/v1/statuses/${id}`,
    context: (id: string) => `/api/v1/statuses/${id}/context`,
    reply: () => `/api/v1/statuses`,
    quote: () => `/api/v1/statuses`,
    reblog: (id: string) => `/api/v1/statuses/${id}/reblog`,
    unreblog: (id: string) => `/api/v1/statuses/${id}/unreblog`,
    favourite: (id: string) => `/api/v1/statuses/${id}/favourite`,
    unfavourite: (id: string) => `/api/v1/statuses/${id}/unfavourite`,
    bookmark: (id: string) => `/api/v1/statuses/${id}/bookmark`,
    unbookmark: (id: string) => `/api/v1/statuses/${id}/unbookmark`,
    mute: (id: string) => `/api/v1/statuses/${id}/mute`,
    unmute: (id: string) => `/api/v1/statuses/${id}/unmute`,
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
  },
  bookmarks: '/api/v1/bookmarks',
  lists: {
    base: '/api/v1/lists',
    single: (id: string) => `/api/v1/lists/${id}`,
    accounts: (id: string) => `/api/v1/lists/${id}/accounts`,
    timeline: (id: string) => `/api/v1/timelines/list/${id}`,
  },
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
  local?: boolean
  language?: string
  in_reply_to_id?: string
  quote_id?: string
}

export async function postStatus(payload: PostStatusPayload) {
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

export async function toggleMuteConversation(id: string, isMuted: boolean) {
  return apiClient(isMuted ? ENDPOINTS.statuses.unmute(id) : ENDPOINTS.statuses.mute(id), {
    method: 'POST'
  })
}

export async function deleteStatus(id: string) {
  return apiClient(ENDPOINTS.statuses.single(id), {
    method: 'DELETE'
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

export async function fetchBookmarks(params?: Record<string, string | number | boolean>) {
  return apiClient<Status[]>(ENDPOINTS.bookmarks, { params })
}

export interface Conversation {
  id: string
  unread: boolean
  last_status?: Status | null
}

export async function fetchDirectTimeline(params?: Record<string, string | number | boolean>) {
  return apiClient<Conversation[]>('/api/v1/conversations', { params })
    .then(conversations => 
      conversations
        .map(c => c.last_status)
        .filter((s): s is Status => s !== null && s !== undefined)
    )
}

export async function voteOnPoll(pollId: string, choices: number[]) {
  return apiClient(ENDPOINTS.polls.vote(pollId), {
    method: 'POST',
    body: JSON.stringify({ choices })
  })
}

export async function fetchStatus(id: string) {
  return apiClient<Status>(ENDPOINTS.statuses.single(id))
}

export interface StatusContext {
  ancestors: Status[]
  descendants: Status[]
}

export async function fetchStatusContext(id: string) {
  return apiClient<StatusContext>(ENDPOINTS.statuses.context(id))
}

export interface List {
  id: string
  title: string
  replies_policy: string
  exclusive?: boolean
}

export async function fetchLists() {
  return apiClient<List[]>(ENDPOINTS.lists.base)
}

export async function fetchList(id: string) {
  return apiClient<List>(ENDPOINTS.lists.single(id))
}

export async function createList(title: string, exclusive?: boolean) {
  const body: Record<string, string | boolean> = { title }
  if (exclusive !== undefined) {
    body.exclusive = exclusive
  }
  return apiClient<List>(ENDPOINTS.lists.base, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function deleteList(id: string) {
  return apiClient(ENDPOINTS.lists.single(id), {
    method: 'DELETE'
  })
}

export async function fetchListTimeline(id: string, params?: Record<string, string | number | boolean>) {
  return apiClient<Status[]>(ENDPOINTS.lists.timeline(id), { params })
}

export async function fetchListAccounts(id: string) {
  return apiClient<User[]>(ENDPOINTS.lists.accounts(id))
}

export async function searchAccounts(query: string, followingOnly?: boolean) {
  const params: Record<string, string | boolean> = { q: query, resolve: true }
  if (followingOnly) {
    params.following = true
  }
  return apiClient<User[]>('/api/v1/accounts/search', { params })
}

export async function addAccountsToList(id: string, accountIds: string[]) {
  return apiClient(ENDPOINTS.lists.accounts(id), {
    method: 'POST',
    body: JSON.stringify({ account_ids: accountIds })
  })
}

export async function removeAccountsFromList(id: string, accountIds: string[]) {
  return apiClient(ENDPOINTS.lists.accounts(id), {
    method: 'DELETE',
    body: JSON.stringify({ account_ids: accountIds })
  })
}

// Notifications
export interface Notification {
  id: string
  type: 'mention' | 'status' | 'reblog' | 'follow' | 'follow_request' | 'favourite' | 'poll' | 'update' | 'admin.sign_up' | 'admin.report'
  created_at: string
  account: User
  status?: Status
}

export async function fetchNotifications(types?: string[]) {
  const params: Record<string, string | string[]> = {}
  if (types && types.length > 0) {
    params['include_types[]'] = types
  }
  return apiClient<Notification[]>('/api/v1/notifications', { params })
}

export async function markNotificationsAsRead() {
  return apiClient('/api/v1/pleroma/notifications/read', {
    method: 'POST'
  })
}
