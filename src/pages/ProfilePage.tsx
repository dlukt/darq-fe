import React from "react"
import { useParams } from "react-router"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { Virtuoso } from "react-virtuoso"
import { useAuthStore } from "@/store/auth"
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
  unfollowTag,
} from "@/api/endpoints"
import { ProfileActions } from "@/components/ProfileActions"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { StatusCard } from "@/components/StatusCard"
import { UserPopover } from "@/components/UserPopover"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import {
  Loader2,
  MessageSquareOff,
  Users,
  Hash,
  ImageOff,
  StarOff,
  MessageCircleOff,
} from "lucide-react"

function ProfileTimeline({
  userId,
  type,
}: {
  userId: string
  type: "posts" | "replies" | "media" | "favorites"
}) {
  const { data: pinnedStatuses, isLoading: isPinnedLoading } = useQuery({
    queryKey: ["userPinnedTimeline", userId],
    queryFn: () => fetchUserPinnedStatuses(userId),
    enabled: type === "posts",
    retry: false,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["userTimeline", userId, type],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string | boolean> = pageParam
        ? { max_id: pageParam as string }
        : {}

      if (type === "favorites") return fetchFavorites(params)

      if (type === "posts") params.exclude_replies = true
      if (type === "media") params.only_media = true

      return fetchUserStatuses(userId, params)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined
      return lastPage[lastPage.length - 1].id
    },
    initialPageParam: undefined as string | undefined,
    retry: false,
  })

  const statuses = data?.pages.flat() || []

  if (isLoading || (type === "posts" && isPinnedLoading))
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">Loading statuses...</span>
      </div>
    )
  if (isError)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load statuses.
      </div>
    )
  if (
    statuses.length === 0 &&
    (!pinnedStatuses || pinnedStatuses.length === 0)
  ) {
    let Icon = MessageSquareOff
    let title = "No posts to show right now."
    let description = "This user hasn't posted anything yet."

    if (type === "replies") {
      Icon = MessageCircleOff
      title = "No replies yet."
      description = "This user hasn't replied to any posts yet."
    } else if (type === "media") {
      Icon = ImageOff
      title = "No media found."
      description = "This user hasn't posted any media yet."
    } else if (type === "favorites") {
      Icon = StarOff
      title = "No favorites yet."
      description = "You haven't favorited any posts yet."
    }

    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
        <Icon className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-sm">{description}</p>
      </div>
    )
  }

  // Filter out pinned statuses from the main feed so they don't duplicate
  const pinnedIds = new Set(pinnedStatuses?.map((s) => s.id) || [])
  const filteredStatuses = statuses.filter((s) => !pinnedIds.has(s.id))

  // Create a combined array where pinned statuses are at the beginning
  const combinedStatuses = [
    ...(pinnedStatuses?.map((s) => ({ ...s, isPinned: true })) || []),
    ...filteredStatuses,
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
        itemContent={(_index, status) => {
          if ("isPinned" in status && status.isPinned) {
            return (
              <div key={`pinned-${status.id}`} className="relative pb-2">
                <div className="absolute top-2 right-4 z-10 flex items-center rounded bg-background/80 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  <svg
                    className="mr-1 h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
              {isFetchingNextPage ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </span>
              ) : !hasNextPage ? (
                "No more posts"
              ) : (
                ""
              )}
            </div>
          ),
        }}
      />
    </div>
  )
}

function ProfileFollowList({
  userId,
  type,
  isUs,
}: {
  userId: string
  type: "following" | "followers"
  isUs: boolean
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["userFollowList", userId, type],
    queryFn: ({ pageParam }) => {
      const params: Record<string, string | number | boolean> = pageParam
        ? { max_id: pageParam as string }
        : {}
      return type === "following"
        ? fetchUserFollowing(userId, params)
        : fetchUserFollowers(userId, params)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined
      return lastPage[lastPage.length - 1].id
    },
    initialPageParam: undefined as string | undefined,
    retry: false,
  })

  const users = data?.pages.flat() || []

  if (isLoading)
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">Loading users...</span>
      </div>
    )
  if (isError) {
    if (error instanceof Error && error.message.includes("403")) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          This list is hidden by the user.
        </div>
      )
    }
    return (
      <div className="p-8 text-center text-red-500">Failed to load users.</div>
    )
  }
  if (users.length === 0)
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
        <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          No users found.
        </h3>
        <p className="max-w-md text-sm">There are no users to display here.</p>
      </div>
    )

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
        itemContent={(_index, u) => (
          <div className="pb-4">
            <UserPopover key={u.id} user={u}>
              <div className="relative flex w-full cursor-pointer items-center space-x-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={u.avatar}
                    alt={u.display_name || u.username}
                  />
                  <AvatarFallback>
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col">
                  <span
                    className="text-sm font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: u.display_name || u.username,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    @{u.acct}
                  </span>
                </div>

                {isUs && type === "following" && (
                  <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
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
              {isFetchingNextPage ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </span>
              ) : (
                ""
              )}
            </div>
          ),
        }}
      />
    </div>
  )
}

function FollowUserToggle({
  userId,
  initialFollowing,
}: {
  userId: string
  initialFollowing: boolean
}) {
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
      <Label
        htmlFor={`follow-${userId}`}
        className="cursor-pointer text-xs text-muted-foreground"
      >
        {isFollowing ? "Following" : "Follow"}
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
  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["followedTags"],
    queryFn: fetchFollowedTags,
    retry: false,
  })

  if (isLoading)
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">Loading hashtags...</span>
      </div>
    )
  if (isError)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load hashtags.
      </div>
    )
  if (!tags || tags.length === 0)
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
        <Hash className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          No followed hashtags.
        </h3>
        <p className="max-w-md text-sm">
          You aren't following any hashtags yet.
        </p>
      </div>
    )

  return (
    <div className="mt-4 flex flex-col gap-4">
      {tags.map((tag) => (
        <div
          key={tag.name}
          className="flex items-center justify-between rounded-lg border bg-card p-4"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-primary">#</span>
            <span className="font-semibold">{tag.name}</span>
          </div>
          <FollowTagToggle tagName={tag.name} initialFollowing={true} />
        </div>
      ))}
    </div>
  )
}

function FollowTagToggle({
  tagName,
  initialFollowing,
}: {
  tagName: string
  initialFollowing: boolean
}) {
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
      <Label
        htmlFor={`tag-${tagName}`}
        className="cursor-pointer text-xs text-muted-foreground"
      >
        {isFollowing ? "Following" : "Follow"}
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
  const authUser = useAuthStore((state) => state.user)

  // React Router v7 doesn't support partial dynamic segments like `/@:username`,
  // so we use `/:handle` and strip the leading `@` here if it exists.
  const username = handle?.startsWith("@") ? handle.slice(1) : handle

  useDocumentTitle(username ? `@${username}` : "Profile")

  // First, lookup the account by username/acct to get the ID
  const { data: accountLookup, isLoading: isLookupLoading } = useQuery({
    queryKey: ["lookupAccount", username],
    queryFn: () => lookupAccount(username!),
    enabled: !!username,
  })

  // Then fetch the full profile using the ID
  const { data: user, isLoading: isProfileLoading } = useQuery({
    queryKey: ["fetchAccount", accountLookup?.id],
    queryFn: () => fetchAccount(accountLookup!.id),
    enabled: !!accountLookup?.id,
  })

  const isLoading = isLookupLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <Skeleton className="-mt-12 ml-4 h-24 w-24 rounded-full border-4 border-background" />
        <div className="mt-4 space-y-2 px-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <p className="mt-2 text-muted-foreground">
          The user @{username} does not exist or is unavailable.
        </p>
      </div>
    )
  }

  const isUs = authUser?.id === user.id

  const displayFollowers = isUs
    ? user.followers_count
    : user.pleroma?.hide_followers_count
      ? "Hidden"
      : user.followers_count
  const displayFollowing = isUs
    ? user.following_count
    : user.pleroma?.hide_follows_count
      ? "Hidden"
      : user.following_count

  const daysSinceCreation = Math.max(
    1,
    Math.ceil(
      (new Date().getTime() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
  const postsPerDay = Math.round(user.statuses_count / daysSinceCreation)
  const isAdmin = user.pleroma?.is_admin
  const isMod = user.pleroma?.is_moderator

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative h-48 w-full bg-muted">
          {user.header && (
            <img
              src={user.header}
              alt="Banner"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="relative px-6 pb-6">
          <Avatar className="absolute -top-12 h-24 w-24 border-4 border-background bg-muted">
            <AvatarImage
              src={user.avatar}
              alt={user.display_name || user.username}
            />
            <AvatarFallback className="text-2xl">
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-4 pt-14 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl font-bold"
                  dangerouslySetInnerHTML={{
                    __html: user.display_name || user.username,
                  }}
                />
                {isAdmin && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
                    Admin
                  </span>
                )}
                {isMod && !isAdmin && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Moderator
                  </span>
                )}
              </div>
              <span className="text-muted-foreground">@{user.acct}</span>
            </div>
            <ProfileActions user={user} />
          </div>

          {user.note && (
            <div
              className="prose prose-sm mt-4 max-w-none break-words dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: user.note }}
            />
          )}

          {user.fields && user.fields.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 rounded-lg bg-muted/30 p-4">
              {user.fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex flex-col border-b border-border/50 py-1 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span
                    className="font-semibold text-muted-foreground sm:w-1/3"
                    dangerouslySetInnerHTML={{ __html: field.name }}
                  />
                  <div className="mt-1 flex items-center justify-end sm:mt-0 sm:w-2/3">
                    <span
                      className="break-all text-foreground"
                      dangerouslySetInnerHTML={{ __html: field.value }}
                    />
                    {field.verified_at && (
                      <svg
                        className="ml-2 h-4 w-4 shrink-0 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{user.statuses_count}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{postsPerDay}</span>
              <span className="text-muted-foreground">Posts per day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{displayFollowing}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex items-center gap-1.5">
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
            {(!user.pleroma?.hide_follows_count || isUs) && (
              <TabsTrigger value="following">Following</TabsTrigger>
            )}
            {(!user.pleroma?.hide_followers_count || isUs) && (
              <TabsTrigger value="followers">Followers</TabsTrigger>
            )}
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
                <Tabs defaultValue="users" className="mt-2 w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                  </TabsList>
                  <TabsContent value="users">
                    <ProfileFollowList
                      userId={user.id}
                      type="following"
                      isUs={isUs}
                    />
                  </TabsContent>
                  <TabsContent value="hashtags">
                    <ProfileTagList />
                  </TabsContent>
                </Tabs>
              ) : (
                <ProfileFollowList
                  userId={user.id}
                  type="following"
                  isUs={isUs}
                />
              )}
            </TabsContent>
          )}

          {(!user.pleroma?.hide_followers_count || isUs) && (
            <TabsContent value="followers">
              <ProfileFollowList
                userId={user.id}
                type="followers"
                isUs={isUs}
              />
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
