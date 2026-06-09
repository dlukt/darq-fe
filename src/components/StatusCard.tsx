import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export interface MediaAttachment {
  id: string
  type: "image" | "video" | "gifv" | "audio" | "unknown"
  url: string
  preview_url: string
  description?: string | null
}

export interface PollOption {
  title: string
  votes_count: number
}

export interface Poll {
  id: string
  expires_at: string | null
  expired: boolean
  multiple: boolean
  options: PollOption[]
  voters_count: number
  votes_count: number
}

export interface Status {
  id: string
  created_at: string
  content: string
  spoiler_text?: string
  sensitive?: boolean
  media_attachments?: MediaAttachment[]
  poll?: Poll
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
  const { account, content, created_at, spoiler_text, sensitive, media_attachments, poll } = status

  // Very basic fallback if no display name
  const displayName = account.display_name || account.username
  
  // Format date
  const dateStr = new Date(created_at).toLocaleString()

  const [showContent, setShowContent] = useState(!sensitive && !spoiler_text)

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
        {spoiler_text && (
          <div className="mb-3 flex items-center gap-4 bg-muted/40 p-2 rounded-md border border-border/50">
            <span className="font-medium text-sm flex-1">{spoiler_text}</span>
            <Button variant="secondary" size="sm" onClick={() => setShowContent(!showContent)}>
              {showContent ? "Show less" : "Show more"}
            </Button>
          </div>
        )}

        {(!spoiler_text && sensitive && !showContent) && (
          <div className="mb-3">
            <Button variant="secondary" size="sm" onClick={() => setShowContent(true)}>
              Show sensitive content
            </Button>
          </div>
        )}

        {showContent && (
          <div className="animate-in fade-in duration-300">
            {/* We use dangerouslySetInnerHTML because Mastodon API returns HTML for content */}
            <div 
              className="prose dark:prose-invert max-w-none text-sm break-words"
              dangerouslySetInnerHTML={{ __html: content }} 
            />

            {/* Media Attachments */}
            {media_attachments && media_attachments.length > 0 && (
              <div className={`grid gap-2 mt-4 ${media_attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1 md:w-3/4'}`}>
                {media_attachments.map(media => (
                  <div key={media.id} className="relative rounded-lg overflow-hidden bg-muted aspect-video border shadow-sm">
                    {media.type === 'video' || media.type === 'gifv' ? (
                      <video src={media.url} poster={media.preview_url} controls className="object-cover w-full h-full" />
                    ) : media.type === 'audio' ? (
                      <audio src={media.url} controls className="w-full mt-auto" />
                    ) : (
                      <img src={media.preview_url || media.url} alt={media.description || "Attachment"} className="object-cover w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Poll */}
            {poll && (
              <div className="mt-4 space-y-3 border rounded-lg p-4 bg-card shadow-sm">
                {poll.options.map((option, i) => {
                  // Mastodon counts votes differently depending on multiple choice.
                  // For a simple bar, we just do option.votes / total_voters
                  const percentage = poll.voters_count > 0 
                    ? Math.round((option.votes_count / poll.voters_count) * 100) 
                    : 0
                  
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{option.title}</span>
                        <span className="font-semibold text-muted-foreground">{percentage}% <span className="font-normal text-xs">({option.votes_count})</span></span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
                <div className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
                  <span>{poll.voters_count} votes</span>
                  {poll.expired && (
                    <>
                      <span>&middot;</span>
                      <span>Final results</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
