import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { ENDPOINTS, verifyCredentials } from "@/api/endpoints"
import { getClientToken } from "@/api/auth"
import { useAuthStore } from "@/store/auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"

export function RegisterPage() {
  useDocumentTitle('Register')

  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [reason, setReason] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 1. Fetch Captcha on mount
  const { data: captcha } = useQuery({
    queryKey: ["captcha"],
    queryFn: async () => {
      try {
        return await apiClient<{token?: string, url?: string, answer_data?: string}>(ENDPOINTS.captcha)
      } catch {
        // If the endpoint 404s or is disabled, we assume no captcha is needed
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  })

  // 2. Registration Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      // Obtain a Client Token (not a user token) to authorize the registration request
      const clientToken = await getClientToken()

      const form = new FormData()
      form.append("username", username)
      form.append("email", email)
      form.append("password", password)
      form.append("agreement", "true")
      form.append("locale", "en_US")

      if (reason.trim() !== "") {
        form.append("reason", reason)
      }

      if (captcha?.token) {
        form.append("captcha_token", captcha.token)
        form.append("captcha_solution", captchaAnswer)
        if (captcha.answer_data) {
          form.append("captcha_answer_data", captcha.answer_data)
        }
      }

      const response = await apiClient<{access_token?: string}>(ENDPOINTS.register, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientToken}`,
        },
        body: form,
      })

      return response
    },
    onSuccess: async (data) => {
      // If the backend returns an access_token, they are fully registered and logged in
      if (data.access_token) {
        setToken(data.access_token)
        const user = await verifyCredentials()
        setUser(user)
        navigate("/")
      } else {
        // Registration succeeded but no token returned (e.g. approval required / email verification)
        setSuccessMessage("Registration successful! Please check your email for verification instructions, or wait for admin approval.")
      }
    },
    onError: (err: unknown) => {
      const error = err as { data?: { error?: string }, message?: string }
      setError(error?.data?.error || error.message || "An error occurred during registration.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    registerMutation.mutate()
  }

  if (successMessage) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Registration Complete</CardTitle>
            <CardDescription>{successMessage}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" render={<Link to="/login" />} nativeButton={false}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-full py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join the Akkoma instance. Fill out the details below.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for joining (Optional)</Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to join?"
              />
            </div>

            {captcha?.url && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="captchaAnswer">Captcha</Label>
                <div className="flex flex-col gap-2">
                  <img src={captcha.url} alt="Captcha" className="rounded-md border border-border h-16 w-auto object-contain bg-white" />
                  <Input
                    id="captchaAnswer"
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                    placeholder="Enter the text above"
                  />
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
