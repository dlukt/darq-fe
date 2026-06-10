import { Routes, Route, Navigate } from "react-router"
import { useAuthStore } from "@/store/auth"
import { MainLayout } from "@/layouts/main-layout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { TimelinePage } from "@/pages/TimelinePage"
import { StatusPage } from "@/pages/StatusPage"
import { ListsPage } from "@/pages/ListsPage"
import NotificationsPage from "@/pages/NotificationsPage"
import AboutPage from "@/pages/AboutPage"

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
        <Route path="/direct" element={<TimelinePage type="direct" />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:id" element={<TimelinePage type="list" />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}

export default App
