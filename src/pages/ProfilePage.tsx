import React from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { 
  lookupAccount, 
  fetchAccount, 
  fetchUserStatuses, 
  fetchUserFollowing, 
  fetchUserFollowers, 
  fetchFavorites 
} from '@/api/endpoints'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusCard } from '@/components/StatusCard'
import { UserPopover } from '@/components/UserPopover'
import { Skeleton } from '@/components/ui/skeleton'

function ProfileTimeline({ userId, type }: { userId: string, type: 'posts' | 'replies' | 'media' | 'favorites' }) {
  const { data: statuses, isLoading, isError } = useQuery({
    queryKey: ['userTimeline', userId, type],
    queryFn: () => {
      if (type === 'favorites') return fetchFavorites()
      
      const params: Record<string, string | boolean> = {}
      if (type === 'posts') params.exclude_replies = true
      if (type === 'media') params.only_media = true
      
      return fetchUserStatuses(userId, params)
    }
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading statuses...</div>
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load statuses.</div>
  if (!statuses || statuses.length === 0) return <div className="p-8 text-center text-muted-foreground">No statuses found.</div>

  return (
    <div className="flex flex-col gap-2 mt-4">
      {statuses.map(status => (
        <StatusCard key={status.id} status={status} />
      ))}
    </div>
  )
}

function ProfileFollowList({ userId, type }: { userId: string, type: 'following' | 'followers' }) {
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['userFollowList', userId, type],
    queryFn: () => type === 'following' ? fetchUserFollowing(userId) : fetchUserFollowers(userId),
    retry: false
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading users...</div>
  if (isError) {
    // If the error is a 403 Forbidden, it means the list is hidden
    if (error instanceof Error && error.message.includes('403')) {
      return <div className="p-8 text-center text-muted-foreground">This list is hidden by the user.</div>
    }
    return <div className="p-8 text-center text-red-500">Failed to load users.</div>
  }
  if (!users || users.length === 0) return <div className="p-8 text-center text-muted-foreground">No users found.</div>

  return (
    <div className="flex flex-col gap-4 mt-4">
      {users.map(u => (
        <UserPopover key={u.id} user={u}>
          <div className="flex items-center space-x-4 p-4 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors text-left w-full">
            <Avatar className="h-12 w-12">
              <AvatarImage src={u.avatar} alt={u.display_name || u.username} />
              <AvatarFallback>{(u.display_name || u.username).charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1">
              <span className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: u.display_name || u.username }} />
              <span className="text-muted-foreground text-xs">@{u.acct}</span>
            </div>
          </div>
        </UserPopover>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const { handle } = useParams()
  const authUser = useAuthStore(state => state.user)

  // React Router v7 doesn't support partial dynamic segments like `/@:username`, 
  // so we use `/:handle` and strip the leading `@` here if it exists.
  const username = handle?.startsWith('@') ? handle.slice(1) : handle

  // First, lookup the account by username/acct to get the ID
  const { data: accountLookup, isLoading: isLookupLoading } = useQuery({
    queryKey: ['lookupAccount', username],
    queryFn: () => lookupAccount(username!),
    enabled: !!username
  })

  // Then fetch the full profile using the ID
  const { data: user, isLoading: isProfileLoading } = useQuery({
    queryKey: ['fetchAccount', accountLookup?.id],
    queryFn: () => fetchAccount(accountLookup!.id),
    enabled: !!accountLookup?.id
  })

  const isLoading = isLookupLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <Skeleton className="h-24 w-24 rounded-full -mt-12 ml-4 border-4 border-background" />
        <div className="space-y-2 mt-4 px-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <p className="text-muted-foreground mt-2">The user @{username} does not exist or is unavailable.</p>
      </div>
    )
  }

  const isUs = authUser?.id === user.id

  const displayFollowers = isUs ? user.followers_count : (user.pleroma?.hide_followers_count ? 'Hidden' : user.followers_count)
  const displayFollowing = isUs ? user.following_count : (user.pleroma?.hide_follows_count ? 'Hidden' : user.following_count)

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="h-48 w-full bg-muted relative">
          {user.header && <img src={user.header} alt="Banner" className="w-full h-full object-cover" />}
        </div>
        
        <div className="px-6 relative pb-6">
          <Avatar className="h-24 w-24 absolute -top-12 border-4 border-background bg-muted">
            <AvatarImage src={user.avatar} alt={user.display_name || user.username} />
            <AvatarFallback className="text-2xl">{(user.display_name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="pt-14 flex flex-col">
            <h1 className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: user.display_name || user.username }} />
            <span className="text-muted-foreground">@{user.acct}</span>
          </div>

          {user.note && (
            <div 
              className="mt-4 prose dark:prose-invert prose-sm max-w-none break-words" 
              dangerouslySetInnerHTML={{ __html: user.note }} 
            />
          )}

          {user.fields && user.fields.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 bg-muted/30 p-4 rounded-lg">
              {user.fields.map((field, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-1 border-b last:border-0 border-border/50">
                  <span className="font-semibold text-muted-foreground sm:w-1/3" dangerouslySetInnerHTML={{ __html: field.name }} />
                  <div className="flex items-center sm:w-2/3 justify-end mt-1 sm:mt-0">
                    <span className="text-foreground break-all" dangerouslySetInnerHTML={{ __html: field.value }} />
                    {field.verified_at && (
                      <svg className="w-4 h-4 text-green-500 ml-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-6 text-sm">
            <div className="flex gap-1.5 items-center">
              <span className="font-bold">{user.statuses_count}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="font-bold">{displayFollowing}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="font-bold">{displayFollowers}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="replies">Posts and replies</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            {(!user.pleroma?.hide_follows_count || isUs) && <TabsTrigger value="following">Following</TabsTrigger>}
            {(!user.pleroma?.hide_followers_count || isUs) && <TabsTrigger value="followers">Followers</TabsTrigger>}
            {isUs && <TabsTrigger value="favorites">Favorites</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="posts">
            <ProfileTimeline userId={user.id} type="posts" />
          </TabsContent>
          <TabsContent value="replies">
            <ProfileTimeline userId={user.id} type="replies" />
          </TabsContent>
          <TabsContent value="media">
            <ProfileTimeline userId={user.id} type="media" />
          </TabsContent>
          
          {(!user.pleroma?.hide_follows_count || isUs) && (
            <TabsContent value="following">
              <ProfileFollowList userId={user.id} type="following" />
            </TabsContent>
          )}
          
          {(!user.pleroma?.hide_followers_count || isUs) && (
            <TabsContent value="followers">
              <ProfileFollowList userId={user.id} type="followers" />
            </TabsContent>
          )}

          {isUs && (
            <TabsContent value="favorites">
              <ProfileTimeline userId={user.id} type="favorites" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
