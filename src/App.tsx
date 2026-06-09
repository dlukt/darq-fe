import { Routes, Route } from "react-router"
import { MainLayout } from "@/layouts/main-layout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { TimelinePage } from "@/pages/TimelinePage"

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}

export default App
