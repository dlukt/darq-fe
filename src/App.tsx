import { Routes, Route, Navigate } from "react-router"
import { useAuthStore } from "@/store/auth"
import { MainLayout } from "@/layouts/main-layout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { TimelinePage } from "@/pages/TimelinePage"
import { StatusPage } from "@/pages/StatusPage"

function App() {
  const { user } = useAuthStore()

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to={user ? "/home" : "/local"} replace />} />
        <Route path="/home" element={<TimelinePage type="home" />} />
        <Route path="/local" element={<TimelinePage type="local" />} />
        <Route path="/federated" element={<TimelinePage type="federated" />} />
        <Route path="/bookmarks" element={<TimelinePage type="bookmarks" />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}

export default App
