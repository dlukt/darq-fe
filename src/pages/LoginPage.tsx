import { useState } from "react"
import { useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { ENDPOINTS, verifyCredentials } from "@/api/endpoints"
import { useAuthStore } from "@/store/auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: async () => {
      // 1. Obtain Token
      const tokenResponse = await apiClient(ENDPOINTS.oauthToken, {
        method: "POST",
        body: JSON.stringify({
          client_id: "test", // Typically you would register an app and get a real client_id/secret
          client_secret: "test",
          grant_type: "password",
          username,
          password,
        }),
      })

      // 2. Set token temporarily to fetch user
      const accessToken = tokenResponse.access_token
      setToken(accessToken)

      // 3. Fetch user
      const user = await verifyCredentials()
      setUser(user)

      return user
    },
    onSuccess: () => {
      navigate("/")
    },
    onError: (err: any) => {
      setToken(null)
      setError(err?.data?.error || "Invalid username or password")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    loginMutation.mutate()
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your username and password to log in to your Akkoma account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
