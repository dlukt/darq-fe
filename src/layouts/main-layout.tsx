import { Suspense } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Outlet } from "react-router"

export function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex p-2 items-center">
          <SidebarTrigger />
        </div>
        <div className="p-4">
          <Suspense>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </SidebarProvider>
  )
}
