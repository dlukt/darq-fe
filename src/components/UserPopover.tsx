import React from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/store/auth'
import { Link } from 'react-router'

import { ProfileActions } from '@/components/ProfileActions'


interface UserPopoverProps {
  user: User
  children: React.ReactNode
}

export function UserPopover({ user, children }: UserPopoverProps) {
  const authUser = useAuthStore((state) => state.user)
  const isOtherUser = user.id !== authUser?.id

  const displayFollowers = isOtherUser && user.pleroma?.hide_followers_count
    ? 'Hidden'
    : (!isOtherUser && authUser ? authUser.followers_count : user.followers_count)


  const daysSinceCreation = Math.max(1, Math.ceil((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)))
  const postsPerDay = Math.round(user.statuses_count / daysSinceCreation)
  const isAdmin = user.pleroma?.is_admin
  const isMod = user.pleroma?.is_moderator
  const displayFollowing = isOtherUser && user.pleroma?.hide_follows_count
    ? 'Hidden'
    : (!isOtherUser && authUser ? authUser.following_count : user.following_count)

  return (
    <Popover>
      <PopoverTrigger nativeButton={false} render={React.isValidElement(children) ? children : <span className="inline-block">{children}</span>} />
      <PopoverContent className="w-96 p-0 overflow-hidden" side="right" align="start">
        <div className="h-24 w-full bg-muted">
          {user.header && <img src={user.header} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-4 pt-0 relative">
          <Avatar className="h-16 w-16 absolute -top-8 border-4 border-background">
            <AvatarImage src={user.avatar} alt={user.display_name || user.username} />
            <AvatarFallback>{(user.display_name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="mt-10 flex flex-col">
            
            <div className="flex items-center gap-2">
              <span className="font-bold" dangerouslySetInnerHTML={{ __html: user.display_name || user.username }} />
              {isAdmin && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Admin</span>}
              {isMod && !isAdmin && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Moderator</span>}
            </div>

            <Link to={`/@${user.acct}`} className="text-muted-foreground text-sm hover:underline">@{user.acct}</Link>
          </div>

          <div className="mt-4">
            <ProfileActions user={user} />
          </div>
          {user.note && (
            <div 
              className="mt-4 text-sm break-words prose dark:prose-invert prose-sm line-clamp-4" 
              dangerouslySetInnerHTML={{ __html: user.note }} 
            />
          )}
          <div className="mt-4 flex space-x-4 text-sm">
            <div className="flex flex-col">
              <span className="font-bold">{user.statuses_count}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>

            <div className="flex flex-col">
              <span className="font-bold">{postsPerDay}</span>
              <span className="text-muted-foreground">Posts/day</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">{displayFollowing}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">{displayFollowers}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
