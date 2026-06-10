import { type Notification } from "@/api/endpoints"
import { StatusCard } from "@/components/StatusCard"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Repeat, Heart, UserPlus } from "lucide-react"

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const { type, account, status, created_at } = notification
  const displayName = account.display_name || account.username
  const dateStr = new Date(created_at).toLocaleString()

  if (type === "mention" && status) {
    return <StatusCard status={status} />
  }

  if (type === "reblog" && status) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 pl-14">
          <Repeat className="h-4 w-4 text-green-500" />
          <span className="font-semibold text-foreground">{displayName}</span>
          <span>repeated your post</span>
        </div>
        <StatusCard status={status} />
      </div>
    )
  }

  if (type === "favourite" && status) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 pl-14">
          <Heart className="h-4 w-4 text-pink-500 fill-current" />
          <span className="font-semibold text-foreground">{displayName}</span>
          <span>favourited your post</span>
        </div>
        <StatusCard status={status} />
      </div>
    )
  }

  if (type === "follow") {
    return (
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center gap-2 pb-2 text-sm text-muted-foreground">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{displayName}</span>
          <span>followed you</span>
          <span className="ml-auto text-xs">{dateStr}</span>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={account.avatar} alt={displayName} />
            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{displayName}</span>
            <span className="text-sm text-muted-foreground">@{account.acct}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback for other notification types
  return (
    <Card className="mb-4">
      <CardHeader className="text-sm">
        <span className="font-semibold">{displayName}</span> interacted with you ({type})
      </CardHeader>
    </Card>
  )
}
