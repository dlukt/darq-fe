import { useQuery } from "@tanstack/react-query"
import { fetchNotifications } from "@/api/endpoints"

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds to update badges
  })
}
