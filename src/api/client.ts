import { useAuthStore } from '../store/auth'

export class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, data: any, message: string) {
    super(message)
    this.status = status
    this.data = data
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>
}

// Ensure you replace this with the actual backend domain or make it configurable.
// When using Vite proxy, it could be an empty string, letting proxy handle it.
const BASE_URL = ''

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options

  const token = useAuthStore.getState().token

  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
  }

  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(`${key}[]`, v))
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = null
    }
    
    // Automatically log out on 401
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }

    throw new ApiError(response.status, errorData, response.statusText)
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
