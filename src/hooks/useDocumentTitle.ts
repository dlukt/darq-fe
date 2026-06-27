import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchInstanceConfig } from "@/api/endpoints"

export function useDocumentTitle(breadcrumb?: string) {
  const { data: instanceConfig } = useQuery({
    queryKey: ["instanceConfig"],
    queryFn: fetchInstanceConfig,
    staleTime: 60 * 60 * 1000,
  })

  useEffect(() => {
    const instanceName = instanceConfig?.title || "darq"
    if (breadcrumb) {
      document.title = `${instanceName} - ${breadcrumb}`
    } else {
      document.title = instanceName
    }
  }, [instanceConfig?.title, breadcrumb])
}
