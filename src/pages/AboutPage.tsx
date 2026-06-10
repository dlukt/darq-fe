import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchInstanceConfig, fetchNodeInfo, fetchTOS, lookupAccount } from '@/api/endpoints'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StaffMemberCard({ username }: { username: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['account', username],
    queryFn: () => lookupAccount(username),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-4 border rounded-lg">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar} alt={user.display_name || user.username} />
        <AvatarFallback>{(user.display_name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: user.display_name || user.username }} />
        <span className="text-muted-foreground text-xs">@{user.acct}</span>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const { data: instance, isLoading: isInstanceLoading } = useQuery({
    queryKey: ['instanceConfig'],
    queryFn: fetchInstanceConfig,
    staleTime: 60 * 60 * 1000,
  })

  const { data: nodeInfo, isLoading: isNodeInfoLoading } = useQuery({
    queryKey: ['nodeInfo'],
    queryFn: fetchNodeInfo,
    staleTime: 60 * 60 * 1000,
  })

  const { data: tos, isLoading: isTosLoading } = useQuery({
    queryKey: ['tos'],
    queryFn: fetchTOS,
    staleTime: 60 * 60 * 1000,
  })

  const staffUrls: string[] = nodeInfo?.metadata?.staffAccounts || []
  const staffUsernames = staffUrls.map((url) => {
    const parts = url.split('/')
    return parts[parts.length - 1]
  })

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MiB`
  }

  if (isInstanceLoading || isNodeInfoLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground">Information about this instance and its features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Instance configuration and limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Text Limit</span>
              <span className="text-muted-foreground">{instance?.max_toot_chars || 'Unknown'} characters</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Upload Limit</span>
              <span className="text-muted-foreground">{formatBytes(nodeInfo?.metadata?.uploadLimits?.general)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
            <CardDescription>The people managing this instance.</CardDescription>
          </CardHeader>
          <CardContent>
            {staffUsernames.length > 0 ? (
              <div className="flex flex-col space-y-4">
                {staffUsernames.map((username) => (
                  <StaffMemberCard key={username} username={username} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staff information available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          {isTosLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          ) : tos ? (
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: tos }} />
          ) : (
            <p className="text-sm text-muted-foreground">Terms of Service are not available for this instance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
