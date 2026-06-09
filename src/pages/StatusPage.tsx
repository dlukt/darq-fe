import { useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { fetchStatus, fetchStatusContext } from "@/api/endpoints"
import { StatusCard } from "@/components/StatusCard"
import { Button } from "@/components/ui/button"

export function StatusPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useQuery({
    queryKey: ["status", id],
    queryFn: () => fetchStatus(id!),
    enabled: !!id,
  })

  const {
    data: context,
    isLoading: isContextLoading,
  } = useQuery({
    queryKey: ["statusContext", id],
    queryFn: () => fetchStatusContext(id!),
    enabled: !!id,
  })

  if (isStatusLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading status...</p>
      </div>
    )
  }

  if (isStatusError || !status) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive mb-4">Error loading status.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    )
  }

  const ancestors = context?.ancestors || []
  const descendants = context?.descendants || []

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20 pt-4">
      <div className="mb-4 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-2 text-lg font-bold">Thread</h1>
      </div>

      <div className="flex flex-col w-full">
        {ancestors.map((ancestorStatus) => (
          <StatusCard key={ancestorStatus.id} status={ancestorStatus} isAncestor />
        ))}

        <div className="scroll-mt-16" id={`status-${status.id}`}>
          <StatusCard status={status} isDetailed />
        </div>

        {isContextLoading ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading replies...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {descendants.map((descendantStatus) => (
              <StatusCard key={descendantStatus.id} status={descendantStatus} isDescendant />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
