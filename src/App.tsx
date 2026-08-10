import { lazy } from "react"
import { Routes, Route, Navigate } from "react-router"
import { useAuthStore } from "@/store/auth"
import { MainLayout } from "@/layouts/main-layout"

const TimelinePage = lazy(() =>
  import("@/pages/TimelinePage").then((m) => ({ default: m.TimelinePage })),
)
const StatusPage = lazy(() =>
  import("@/pages/StatusPage").then((m) => ({ default: m.StatusPage })),
)
const ListsPage = lazy(() =>
  import("@/pages/ListsPage").then((m) => ({ default: m.ListsPage })),
)
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"))
const AboutPage = lazy(() => import("@/pages/AboutPage"))
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
)
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
)
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
)

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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/tags/:id" element={<TimelinePage type="tag" />} />
        <Route path="/lists/:id" element={<TimelinePage type="list" />} />
        <Route path="/status/:id" element={<StatusPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/:handle" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
