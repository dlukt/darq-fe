import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchNotifications, markNotificationsAsRead } from "@/api/endpoints"
import { NotificationCard } from "@/components/NotificationCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function NotificationsPage() {
  useEffect(() => {
    // Automatically mark notifications as read when the user visits the page
    markNotificationsAsRead().catch(console.error)
  }, [])

  const { data: mentions, isLoading: mentionsLoading } = useQuery({
    queryKey: ["notifications", "mentions"],
    queryFn: () => fetchNotifications(["mention"])
  })

  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ["notifications", "interactions"],
    queryFn: () => fetchNotifications(["reblog", "favourite"])
  })

  const { data: follows, isLoading: followsLoading } = useQuery({
    queryKey: ["notifications", "follows"],
    queryFn: () => fetchNotifications(["follow"])
  })

  return (
    <div className="mx-auto max-w-2xl w-full p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Catch up on your recent interactions.</p>
      </div>

      <Tabs defaultValue="mentions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="interactions">Repeats & Favorites</TabsTrigger>
          <TabsTrigger value="follows">New Follows</TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="mt-0">
          {mentionsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mentions && mentions.length > 0 ? (
            mentions.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
              No mentions yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="interactions" className="mt-0">
          {interactionsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : interactions && interactions.length > 0 ? (
            interactions.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
              No repeats or favorites yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="follows" className="mt-0">
          {followsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : follows && follows.length > 0 ? (
            follows.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
              No new follows yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
