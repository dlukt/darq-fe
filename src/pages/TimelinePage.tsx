import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { Virtuoso } from "react-virtuoso"
import { Link, useParams } from "react-router"
import { fetchHomeTimeline, fetchLocalTimeline, fetchFederatedTimeline, fetchBookmarks, fetchDirectTimeline, fetchListTimeline, fetchList, fetchTagTimeline } from "@/api/endpoints"
import { StatusCard } from "@/components/StatusCard"
import { StatusComposer } from "@/components/StatusComposer"
import { ListAccounts } from "@/components/ListAccounts"
import { ScrollToTopButton } from "@/components/ScrollToTopButton"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Loader2, MessageSquareOff } from "lucide-react"

interface TimelinePageProps {
  type: "home" | "local" | "federated" | "bookmarks" | "direct" | "list" | "tag"
}

export function TimelinePage({ type }: TimelinePageProps) {
  const { user } = useAuthStore()
  const { id } = useParams()

  // Define titles for the UI
  const title = {
    home: "Home Timeline",
    local: "Local Timeline",
    federated: "Federated Timeline",
    bookmarks: "Bookmarks",
    direct: "Direct Messages",
    list: "List Timeline",
    tag: `#${id}`,
  }[type]

  // Check if we should even attempt fetching (e.g. Home requires auth)
  const isAuthRequired = (type === "home" || type === "bookmarks" || type === "direct" || type === "list") && !user

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ["timeline", type, id],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string | number | boolean> = pageParam ? { max_id: pageParam as string } : {}
      switch (type) {
        case "home": return fetchHomeTimeline(params)
        case "local": return fetchLocalTimeline(params)
        case "federated": return fetchFederatedTimeline(params)
        case "bookmarks": return fetchBookmarks(params)
        case "direct": return fetchDirectTimeline(params)
        case "list": return id ? fetchListTimeline(id, params) : Promise.resolve([])
        case "tag": return id ? fetchTagTimeline(id, params) : Promise.resolve([])
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined
      return lastPage[lastPage.length - 1].id
    },
    initialPageParam: undefined as string | undefined,
    retry: false,
    enabled: !isAuthRequired, // Don't fetch if it requires auth but we aren't logged in
  })

  const statuses = data?.pages.flat() || []

  const { data: listData } = useQuery({
    queryKey: ["list", id],
    queryFn: () => fetchList(id!),
    enabled: type === "list" && !!id,
  })

  const displayTitle = type === "list" && listData ? listData.title : title

  useDocumentTitle(displayTitle)

  const showScrollToTop = type === "home" || type === "local" || type === "federated"

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
          <Button render={<Link to="/login" />} nativeButton={false}>
            Log In
          </Button>
        </div>
      )}

      {isLoading && !isAuthRequired && (
        <div className="flex justify-center p-8 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="sr-only">Loading timeline...</span>
        </div>
      )}

      {isError && !isAuthRequired && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-md">
          <p>Failed to load timeline. Ensure the Akkoma backend is running.</p>
          <p className="text-sm mt-1">{error?.message}</p>
        </div>
      )}

      {!isLoading && !isError && !isAuthRequired && statuses.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg border-dashed mt-4 bg-muted/10">
          <MessageSquareOff className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No posts to show right now.</h3>
          <p className="text-sm max-w-md">
            Follow some users or check out the federated timeline to see more content.
          </p>
        </div>
      )}

      {!isAuthRequired && statuses.length > 0 && (
        <div className="mt-4">
          <Virtuoso
            data={statuses}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            useWindowScroll
            overscan={1000}
            itemContent={(_index, status) => (
              <div className="pb-2">
                <StatusCard key={status.id} status={status} />
              </div>
            )}
            components={{
              Footer: () => (
                <div className="py-4 text-center text-muted-foreground">
                  {isFetchingNextPage ? "Loading more..." : !hasNextPage ? "No more posts" : ""}
                </div>
              ),
            }}
          />
        </div>
      )}

      {showScrollToTop && <ScrollToTopButton />}
    </div>
  )
}
