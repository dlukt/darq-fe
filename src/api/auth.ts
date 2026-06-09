import { apiClient } from "./client"
import { ENDPOINTS } from "./endpoints"
import { useAuthStore } from "@/store/auth"

export async function ensureAppRegistered() {
  let { clientId, clientSecret } = useAuthStore.getState()
  const { instanceUrl } = useAuthStore.getState()
  const currentEnvUrl = (import.meta.env.VITE_BASE_URL || 'default').replace(/\/$/, '')

  // If the stored instanceUrl doesn't match the current configured URL, clear the stale credentials.
  // This automatically happens if a developer switches their backend instance in .env
  if (instanceUrl !== currentEnvUrl) {
    useAuthStore.getState().setClientData(null, null, null)
    useAuthStore.getState().logout()
    clientId = null
    clientSecret = null
  }

  if (!clientId || !clientSecret) {
    const appForm = new FormData()
    appForm.append("client_name", `DarqFE_${new Date().toISOString()}`)
    appForm.append("redirect_uris", `${window.location.origin}/oauth-callback`)
    appForm.append("scopes", "read write follow push admin")

    const appResponse = await apiClient<{client_id: string, client_secret: string}>(ENDPOINTS.registerApp, {
      method: "POST",
      body: appForm,
    })

    clientId = appResponse.client_id
    clientSecret = appResponse.client_secret

    if (clientId && clientSecret) {
      useAuthStore.getState().setClientData(clientId, clientSecret, currentEnvUrl)
    } else {
      throw new Error("Failed to register application with backend")
    }
  }

  return { clientId, clientSecret }
}

export async function getClientToken() {
  const { clientId, clientSecret } = await ensureAppRegistered()

  const form = new FormData()
  form.append("client_id", clientId)
  form.append("client_secret", clientSecret)
  form.append("grant_type", "client_credentials")
  form.append("redirect_uri", `${window.location.origin}/oauth-callback`)

  const response = await apiClient<{access_token: string}>(ENDPOINTS.oauthToken, {
    method: "POST",
    body: form,
  })

  return response.access_token
}
