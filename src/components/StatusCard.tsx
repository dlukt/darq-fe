import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface Status {
  id: string
  created_at: string
  content: string
  account: {
    id: string
    username: string
    acct: string
    display_name: string
    avatar: string
  }
}

interface StatusCardProps {
  status: Status
}

export function StatusCard({ status }: StatusCardProps) {
  const { account, content, created_at } = status

  // Very basic fallback if no display name
  const displayName = account.display_name || account.username
  
  // Format date
  const dateStr = new Date(created_at).toLocaleString()

  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={account.avatar} alt={displayName} />
          <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{displayName}</span>
          <span className="text-sm text-muted-foreground">@{account.acct} &middot; {dateStr}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* We use dangerouslySetInnerHTML because Mastodon API returns HTML for content */}
        <div 
          className="prose dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </CardContent>
    </Card>
  )
}
