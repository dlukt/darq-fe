import { type Notification } from "@/api/endpoints"
import { StatusCard } from "@/components/StatusCard"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Repeat, Heart, UserPlus } from "lucide-react"
import { UserPopover } from "@/components/UserPopover"
import { Link } from "react-router"

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const { type, account, status, created_at, pleroma } = notification
  const displayName = account.display_name || account.username
  const dateStr = new Date(created_at).toLocaleString()
  
  const isUnread = pleroma?.is_seen === false
  const unreadIndicator = isUnread ? (
    <div className="absolute top-4 left-1.5 w-2 h-2 rounded-full bg-primary z-10 shadow-sm" title="Unread" />
  ) : null

  if (type === "mention" && status) {
    return (
      <div className="relative mb-4">
        {unreadIndicator}
        <StatusCard status={status} />
      </div>
    )
  }

  if (type === "reblog" && status) {
    return (
      <div className="relative mb-4">
        {unreadIndicator}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 pl-14">
          <Repeat className="h-4 w-4 text-green-500" />
          <UserPopover user={account}>
            <Link to={`/@${account.acct}`} className="font-semibold text-foreground hover:underline">
              {displayName}
            </Link>
          </UserPopover>
          <span>repeated your post</span>
        </div>
        <StatusCard status={status} />
      </div>
    )
  }

  if (type === "favourite" && status) {
    return (
      <div className="relative mb-4">
        {unreadIndicator}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 pl-14">
          <Heart className="h-4 w-4 text-pink-500 fill-current" />
          <UserPopover user={account}>
            <Link to={`/@${account.acct}`} className="font-semibold text-foreground hover:underline">
              {displayName}
            </Link>
          </UserPopover>
          <span>favourited your post</span>
        </div>
        <StatusCard status={status} />
      </div>
    )
  }

  if (type === "follow") {
    return (
      <div className="relative mb-4">
        {unreadIndicator}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2 text-sm text-muted-foreground">
            <UserPlus className="h-4 w-4 text-primary" />
            <UserPopover user={account}>
              <Link to={`/@${account.acct}`} className="font-semibold text-foreground hover:underline">
                {displayName}
              </Link>
            </UserPopover>
            <span>followed you</span>
            <span className="ml-auto text-xs">{dateStr}</span>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <UserPopover user={account}>
              <Link to={`/@${account.acct}`}>
                <Avatar>
                  <AvatarImage src={account.avatar} alt={displayName} />
                  <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </UserPopover>
            <div className="flex flex-col">
              <UserPopover user={account}>
                <Link to={`/@${account.acct}`} className="font-semibold hover:underline">
                  {displayName}
                </Link>
              </UserPopover>
              <Link to={`/@${account.acct}`} className="text-sm text-muted-foreground hover:underline">
                @{account.acct}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback for other notification types
  return (
    <div className="relative mb-4">
      {unreadIndicator}
      <Card>
        <CardHeader className="text-sm">
          <span className="font-semibold">{displayName}</span> interacted with you ({type})
        </CardHeader>
      </Card>
    </div>
  )
}
