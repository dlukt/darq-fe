import { apiClient } from "./client"
import { ENDPOINTS } from "./endpoints"
import { useAuthStore } from "@/store/auth"

export async function ensureAppRegistered() {
  let { clientId, clientSecret } = useAuthStore.getState()

  if (!clientId || !clientSecret) {
    const appForm = new FormData()
    appForm.append("client_name", `DarqFE_${new Date().toISOString()}`)
    appForm.append("redirect_uris", `${window.location.origin}/oauth-callback`)
    appForm.append("scopes", "read write follow push admin")

    const appResponse = await apiClient(ENDPOINTS.registerApp, {
      method: "POST",
      body: appForm,
    })

    clientId = appResponse.client_id
    clientSecret = appResponse.client_secret

    if (clientId && clientSecret) {
      useAuthStore.getState().setClientData(clientId, clientSecret)
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

  const response = await apiClient(ENDPOINTS.oauthToken, {
    method: "POST",
    body: form,
  })

  return response.access_token
}
