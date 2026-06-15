import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { markNotificationsAsRead, type Notification } from "@/api/endpoints"
import { NotificationCard } from "@/components/NotificationCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/useNotifications"

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications, isLoading, refetch } = useNotifications()
  const [isMarkingRead, setIsMarkingRead] = useState(false)

  const handleReadAll = async () => {
    try {
      if (!notifications || notifications.length === 0) return;
      setIsMarkingRead(true)
      const maxId = notifications[0].id;
      await markNotificationsAsRead(maxId)
      // Optimistically clear the unread status
      queryClient.setQueryData(["notifications", "all"], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData
        return oldData.map((n: Notification) => ({
          ...n,
          pleroma: { ...n.pleroma, is_seen: true }
        }))
      })
      await refetch()
    } catch (err) {
      console.error("Failed to mark notifications as read", err)
    } finally {
      setIsMarkingRead(false)
    }
  }

  const mentions = notifications?.filter(n => n.type === "mention") || []
  const interactions = notifications?.filter(n => n.type === "reblog" || n.type === "favourite") || []
  const follows = notifications?.filter(n => n.type === "follow") || []

  const unreadMentions = mentions.filter(n => n.pleroma?.is_seen === false).length
  const unreadInteractions = interactions.filter(n => n.pleroma?.is_seen === false).length
  const unreadFollows = follows.filter(n => n.pleroma?.is_seen === false).length

  return (
    <div className="mx-auto max-w-2xl w-full p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Catch up on your recent interactions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReadAll} disabled={isMarkingRead}>
          {isMarkingRead ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Read all
        </Button>
      </div>

      <Tabs defaultValue="mentions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1">
          <TabsTrigger value="mentions" className="flex items-center gap-2 py-2">
            Mentions
            {unreadMentions > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadMentions > 99 ? '99+' : unreadMentions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2 py-2">
            <span className="truncate">Repeats & Favorites</span>
            {unreadInteractions > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadInteractions > 99 ? '99+' : unreadInteractions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="follows" className="flex items-center gap-2 py-2">
            <span className="truncate">New Follows</span>
            {unreadFollows > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadFollows > 99 ? '99+' : unreadFollows}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mentions.length > 0 ? (
            mentions.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
              No mentions yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="interactions" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : interactions.length > 0 ? (
            interactions.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
              No repeats or favorites yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="follows" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : follows.length > 0 ? (
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
