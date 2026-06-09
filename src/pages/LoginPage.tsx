import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { ENDPOINTS, verifyCredentials } from "@/api/endpoints"
import { useAuthStore } from "@/store/auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { ensureAppRegistered } from "@/api/auth"

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { clientId, clientSecret } = await ensureAppRegistered()

      // 2. Obtain Token using FormData
      const tokenForm = new FormData()
      tokenForm.append("client_id", clientId)
      tokenForm.append("client_secret", clientSecret)
      tokenForm.append("grant_type", "password")
      tokenForm.append("username", username)
      tokenForm.append("password", password)

      const tokenResponse = await apiClient<{access_token: string}>(ENDPOINTS.oauthToken, {
        method: "POST",
        body: tokenForm,
      })

      // 3. Set token temporarily to fetch user
      const accessToken = tokenResponse.access_token
      setToken(accessToken)

      // 4. Fetch user
      const user = await verifyCredentials()
      setUser(user)

      return user
    },
    onSuccess: () => {
      navigate("/")
    },
    onError: (err: unknown) => {
      setToken(null)
      const error = err as { data?: { error?: string } }
      setError(error?.data?.error || "Invalid username or password")
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm text-muted-foreground w-full">
              Don't have an account?{" "}
              <Link to="/register" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
