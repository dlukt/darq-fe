import React from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/store/auth'

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

  const displayFollowing = isOtherUser && user.pleroma?.hide_follows_count
    ? 'Hidden'
    : (!isOtherUser && authUser ? authUser.following_count : user.following_count)

  return (
    <Popover>
      <PopoverTrigger render={<div className="w-full text-left" />}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" side="right" align="start">
        <div className="h-24 w-full bg-muted">
          {user.header && <img src={user.header} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-4 pt-0 relative">
          <Avatar className="h-16 w-16 absolute -top-8 border-4 border-background">
            <AvatarImage src={user.avatar} alt={user.display_name || user.username} />
            <AvatarFallback>{(user.display_name || user.username).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="mt-10 flex flex-col">
            <span className="font-bold" dangerouslySetInnerHTML={{ __html: user.display_name || user.username }} />
            <span className="text-muted-foreground text-sm">@{user.acct}</span>
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
