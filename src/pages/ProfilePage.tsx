import React from 'react'
import { useParams } from 'react-router'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Virtuoso } from 'react-virtuoso'
import { useAuthStore } from '@/store/auth'
import { 
  lookupAccount, 
  fetchAccount, 
  fetchUserStatuses, 
  fetchUserPinnedStatuses,
  fetchUserFollowing, 
  fetchUserFollowers, 
  fetchFavorites,
  followUser,
  unfollowUser,
  fetchFollowedTags,
  followTag,
  unfollowTag
} from '@/api/endpoints'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StatusCard } from '@/components/StatusCard'
import { UserPopover } from '@/components/UserPopover'
import { Skeleton } from '@/components/ui/skeleton'

function ProfileTimeline({ userId, type }: { userId: string, type: 'posts' | 'replies' | 'media' | 'favorites' }) {
  const { data: pinnedStatuses, isLoading: isPinnedLoading } = useQuery({
    queryKey: ['userPinnedTimeline', userId],
    queryFn: () => fetchUserPinnedStatuses(userId),
    enabled: type === 'posts',
    retry: false
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['userTimeline', userId, type],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string | boolean> = pageParam ? { max_id: pageParam as string } : {}
      
      if (type === 'favorites') return fetchFavorites(params)
      
      if (type === 'posts') params.exclude_replies = true
      if (type === 'media') params.only_media = true
      
      return fetchUserStatuses(userId, params)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined
      return lastPage[lastPage.length - 1].id
    },
    initialPageParam: undefined as string | undefined,
    retry: false
  })

  const statuses = data?.pages.flat() || []

  if (isLoading || (type === 'posts' && isPinnedLoading)) return <div className="p-8 text-center text-muted-foreground">Loading statuses...</div>
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load statuses.</div>
  if (statuses.length === 0 && (!pinnedStatuses || pinnedStatuses.length === 0)) {
    return <div className="p-8 text-center text-muted-foreground">No statuses found.</div>
  }

  // Filter out pinned statuses from the main feed so they don't duplicate
  const pinnedIds = new Set(pinnedStatuses?.map(s => s.id) || [])
  const filteredStatuses = statuses.filter(s => !pinnedIds.has(s.id))
  
  // Create a combined array where pinned statuses are at the beginning
  const combinedStatuses = [
    ...(pinnedStatuses?.map(s => ({ ...s, isPinned: true })) || []),
    ...filteredStatuses
  ]

  return (
    <div className="mt-4">
      <Virtuoso
        data={combinedStatuses}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        useWindowScroll
        overscan={1000}
        itemContent={(index, status) => {
          if ('isPinned' in status && status.isPinned) {
            return (
              <div key={`pinned-${status.id}`} className="relative pb-2">
                <div className="absolute top-2 right-4 z-10 flex items-center text-muted-foreground bg-background/80 px-2 py-0.5 rounded text-xs font-semibold">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Pinned
                </div>
                <StatusCard status={status} />
              </div>
            )
          }
          return (
            <div className="pb-2">
              <StatusCard key={status.id} status={status} />
            </div>
          )
        }}
        components={{
          Footer: () => (
            <div className="py-4 text-center text-muted-foreground">
              {isFetchingNextPage ? "Loading more..." : !hasNextPage ? "No more posts" : ""}
            </div>
          ),
        }}
      />
    </div>
  )
}

function ProfileFollowList({ userId, type, isUs }: { userId: string, type: 'following' | 'followers', isUs: boolean }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['userFollowList', userId, type],
    queryFn: ({ pageParam }) => {
      const params = pageParam ? { max_id: pageParam as string } : {}
      return type === 'following' ? fetchUserFollowing(userId, params) : fetchUserFollowers(userId, params)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined
      return lastPage[lastPage.length - 1].id
    },
    initialPageParam: undefined as string | undefined,
    retry: false
  })

  const users = data?.pages.flat() || []

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading users...</div>
  if (isError) {
    if (error instanceof Error && error.message.includes('403')) {
      return <div className="p-8 text-center text-muted-foreground">This list is hidden by the user.</div>
    }
    return <div className="p-8 text-center text-red-500">Failed to load users.</div>
  }
  if (users.length === 0) return <div className="p-8 text-center text-muted-foreground">No users found.</div>

  return (
    <div className="mt-4">
      <Virtuoso
        data={users}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        useWindowScroll
        overscan={1000}
        itemContent={(index, u) => (
          <div className="pb-4">
            <UserPopover key={u.id} user={u}>
              <div className="flex items-center space-x-4 p-4 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors text-left w-full relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={u.avatar} alt={u.display_name || u.username} />
                  <AvatarFallback>{(u.display_name || u.username).charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: u.display_name || u.username }} />
                  <span className="text-muted-foreground text-xs">@{u.acct}</span>
                </div>
                
                {isUs && type === 'following' && (
                  <div 
                    className="ml-auto" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FollowUserToggle userId={u.id} initialFollowing={true} />
                  </div>
                )}
              </div>
            </UserPopover>
          </div>
        )}
        components={{
          Footer: () => (
            <div className="py-4 text-center text-muted-foreground">
              {isFetchingNextPage ? "Loading more..." : ""}
            </div>
          ),
        }}
      />
    </div>
  )
}

function FollowUserToggle({ userId, initialFollowing }: { userId: string, initialFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = React.useState(initialFollowing)
  const [isPending, setIsPending] = React.useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsPending(true)
    try {
      if (checked) {
        await followUser(userId)
      } else {
        await unfollowUser(userId)
      }
      setIsFollowing(checked)
    } catch (error) {
      console.error("Failed to toggle follow status", error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor={`follow-${userId}`} className="text-xs text-muted-foreground cursor-pointer">
        {isFollowing ? 'Following' : 'Follow'}
      </Label>
      <Switch 
        id={`follow-${userId}`}
        checked={isFollowing} 
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  )
}

function ProfileTagList() {
  const { data: tags, isLoading, isError } = useQuery({
    queryKey: ['followedTags'],
    queryFn: fetchFollowedTags,
    retry: false
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading hashtags...</div>
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load hashtags.</div>
  if (!tags || tags.length === 0) return <div className="p-8 text-center text-muted-foreground">No followed hashtags.</div>

  return (
    <div className="flex flex-col gap-4 mt-4">
      {tags.map(tag => (
        <div key={tag.name} className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center space-x-3">
            <span className="text-xl text-primary font-bold">#</span>
            <span className="font-semibold">{tag.name}</span>
          </div>
          <FollowTagToggle tagName={tag.name} initialFollowing={true} />
        </div>
      ))}
    </div>
  )
}

function FollowTagToggle({ tagName, initialFollowing }: { tagName: string, initialFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = React.useState(initialFollowing)
  const [isPending, setIsPending] = React.useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsPending(true)
    try {
      if (checked) {
        await followTag(tagName)
      } else {
        await unfollowTag(tagName)
      }
      setIsFollowing(checked)
    } catch (error) {
      console.error("Failed to toggle follow tag status", error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor={`tag-${tagName}`} className="text-xs text-muted-foreground cursor-pointer">
        {isFollowing ? 'Following' : 'Follow'}
      </Label>
      <Switch 
        id={`tag-${tagName}`}
        checked={isFollowing} 
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
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
              {isUs ? (
                <Tabs defaultValue="users" className="w-full mt-2">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                  </TabsList>
                  <TabsContent value="users">
                    <ProfileFollowList userId={user.id} type="following" isUs={isUs} />
                  </TabsContent>
                  <TabsContent value="hashtags">
                    <ProfileTagList />
                  </TabsContent>
                </Tabs>
              ) : (
                <ProfileFollowList userId={user.id} type="following" isUs={isUs} />
              )}
            </TabsContent>
          )}
          
          {(!user.pleroma?.hide_followers_count || isUs) && (
            <TabsContent value="followers">
              <ProfileFollowList userId={user.id} type="followers" isUs={isUs} />
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
