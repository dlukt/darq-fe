import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-svh p-6 w-full flex-col">
        <SidebarTrigger />
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose mt-4">
          <div>
            <h1 className="font-medium text-2xl mb-2">Akkoma Frontend</h1>
            <p>Welcome to the new frontend for Akkoma.</p>
            <p>The sidebar has been set up along with dark/light mode functionality.</p>
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}

export default App
