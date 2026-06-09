import { apiClient } from './client'

export const ENDPOINTS = {
  oauthToken: '/oauth/token',
  registerApp: '/api/v1/apps',
  register: '/api/v1/accounts',
  captcha: '/api/v1/pleroma/captcha',
  verifyCredentials: '/api/v1/accounts/verify_credentials',
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
  accounts: {
    detail: (id: string) => `/api/v1/accounts/${id}`,
    statuses: (id: string) => `/api/v1/accounts/${id}/statuses`,
  }
}

export async function verifyCredentials() {
  return apiClient(ENDPOINTS.verifyCredentials)
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
