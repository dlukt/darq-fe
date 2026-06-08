import { useQuery } from "@tanstack/react-query"
import { fetchPublicTimeline } from "@/api/endpoints"
import { StatusCard, type Status } from "@/components/StatusCard"

export function TimelinePage() {
  const { data: statuses, isLoading, isError, error } = useQuery({
    queryKey: ["timeline", "public"],
    queryFn: () => fetchPublicTimeline(),
    // We can enable it always, or only if logged in. For public timeline, it might be open.
    // However, without a backend, it will just fail.
    retry: false, 
  })

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">Public Timeline</h1>

      {isLoading && (
        <div className="flex justify-center p-8 text-muted-foreground">
          Loading timeline...
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-md">
          <p>Failed to load timeline. Ensure the Akkoma backend is running.</p>
          <p className="text-sm mt-1">{error?.message}</p>
        </div>
      )}

      {!isLoading && !isError && statuses?.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No posts to show right now.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {statuses?.map((status: Status) => (
          <StatusCard key={status.id} status={status} />
        ))}
      </div>
    </div>
  )
}
