import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { fetchHomeTimeline, fetchLocalTimeline, fetchFederatedTimeline, fetchBookmarks, fetchDirectTimeline, fetchListTimeline, fetchList } from "@/api/endpoints"
import { StatusCard, type Status } from "@/components/StatusCard"
import { StatusComposer } from "@/components/StatusComposer"
import { ListAccounts } from "@/components/ListAccounts"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"

interface TimelinePageProps {
  type: "home" | "local" | "federated" | "bookmarks" | "direct" | "list"
}

export function TimelinePage({ type }: TimelinePageProps) {
  const { user } = useAuthStore()
  const { id } = useParams()

  // Select the appropriate fetcher
  const queryFn = () => {
    switch (type) {
      case "home": return fetchHomeTimeline()
      case "local": return fetchLocalTimeline()
      case "federated": return fetchFederatedTimeline()
      case "bookmarks": return fetchBookmarks()
      case "direct": return fetchDirectTimeline()
      case "list": return id ? fetchListTimeline(id) : Promise.resolve([])
    }
  }

  // Define titles for the UI
  const title = {
    home: "Home Timeline",
    local: "Local Timeline",
    federated: "Federated Timeline",
    bookmarks: "Bookmarks",
    direct: "Direct Messages",
    list: "List Timeline",
  }[type]

  // Check if we should even attempt fetching (e.g. Home requires auth)
  const isAuthRequired = (type === "home" || type === "bookmarks" || type === "direct" || type === "list") && !user

  const { data: statuses, isLoading, isError, error } = useQuery({
    queryKey: ["timeline", type, id],
    queryFn,
    retry: false,
    enabled: !isAuthRequired, // Don't fetch if it requires auth but we aren't logged in
  })

  const { data: listData } = useQuery({
    queryKey: ["list", id],
    queryFn: () => fetchList(id!),
    enabled: type === "list" && !!id,
  })

  const displayTitle = type === "list" && listData ? listData.title : title

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{displayTitle}</h1>
        {type === "list" && id && <ListAccounts listId={id} />}
      </div>

      {user && <StatusComposer />}

      {isAuthRequired && (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card">
          <p className="text-lg font-semibold mb-2">You must be logged in</p>
          <p className="text-muted-foreground mb-6">Log in to view your personalized home feed.</p>
          <Button render={<Link to="/login" />}>
            Log In
          </Button>
        </div>
      )}

      {isLoading && !isAuthRequired && (
        <div className="flex justify-center p-8 text-muted-foreground">
          Loading timeline...
        </div>
      )}

      {isError && !isAuthRequired && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-md">
          <p>Failed to load timeline. Ensure the Akkoma backend is running.</p>
          <p className="text-sm mt-1">{error?.message}</p>
        </div>
      )}

      {!isLoading && !isError && !isAuthRequired && statuses?.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No posts to show right now.
        </div>
      )}

      {!isAuthRequired && (
        <div className="flex flex-col gap-2">
          {statuses?.map((status: Status) => (
            <StatusCard key={status.id} status={status} />
          ))}
        </div>
      )}
    </div>
  )
}
