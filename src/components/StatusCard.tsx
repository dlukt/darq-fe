import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { voteOnPoll } from "@/api/endpoints"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ImageGallery, type ImageItem } from "@/components/ui/image-gallery"

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
  voted?: boolean
  own_votes?: number[]
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
  const {
    account,
    content,
    created_at,
    spoiler_text,
    sensitive,
    media_attachments,
    poll,
  } = status
  const queryClient = useQueryClient()

  // Very basic fallback if no display name
  const displayName = account.display_name || account.username

  // Format date
  const dateStr = new Date(created_at).toLocaleString()

  const [showContent, setShowContent] = useState(!sensitive && !spoiler_text)
  const [selectedChoices, setSelectedChoices] = useState<number[]>([])

  const voteMutation = useMutation({
    mutationFn: () => voteOnPoll(poll!.id, selectedChoices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const handleVoteSubmit = () => {
    if (selectedChoices.length === 0 || !poll) return
    voteMutation.mutate()
  }

  const toggleChoice = (index: number) => {
    if (poll?.multiple) {
      setSelectedChoices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      )
    } else {
      setSelectedChoices([index])
    }
  }

  const galleryImages: ImageItem[] = media_attachments
    ? media_attachments.map((media) => {
        // Akkoma/Mastodon APIs nest dimensions in meta.original
        // @ts-ignore
        const original = media.meta?.original
        return {
          src: media.url,
          alt: media.description || "Media attachment",
          type: media.type,
          width: original?.width,
          height: original?.height,
        }
      })
    : []

  return (
    <Card className="mb-4 w-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar>
          <AvatarImage src={account.avatar} alt={displayName} />
          <AvatarFallback>
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{displayName}</span>
          <span className="text-sm text-muted-foreground">
            @{account.acct} &middot; {dateStr}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {spoiler_text && (
          <div className="mb-3 flex items-center gap-4 rounded-md border border-border/50 bg-muted/40 p-2">
            <span className="flex-1 text-sm font-medium">{spoiler_text}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowContent(!showContent)}
            >
              {showContent ? "Show less" : "Show more"}
            </Button>
          </div>
        )}

        {!spoiler_text && sensitive && !showContent && (
          <div className="mb-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowContent(true)}
            >
              Show sensitive content
            </Button>
          </div>
        )}

        {showContent && (
          <div className="animate-in duration-300 fade-in">
            {/* We use dangerouslySetInnerHTML because Mastodon API returns HTML for content */}
            <div
              className="prose dark:prose-invert wrap-break-words max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Media Attachments */}
            {galleryImages.length > 0 && (
              <div className="mt-4">
                <ImageGallery images={galleryImages} lazyLoading={true} />
              </div>
            )}

            {/* Poll */}
            {poll && (
              <div className="mt-4 space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                {!poll.expired && !poll.voted ? (
                  // Interactive Voting UI
                  <div className="space-y-3">
                    {poll.multiple ? (
                      <div className="space-y-3">
                        {poll.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                              id={`poll-${poll.id}-opt-${i}`}
                              checked={selectedChoices.includes(i)}
                              onCheckedChange={() => toggleChoice(i)}
                              disabled={voteMutation.isPending}
                            />
                            <label
                              htmlFor={`poll-${poll.id}-opt-${i}`}
                              className="cursor-pointer text-sm leading-none font-medium"
                            >
                              {option.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <RadioGroup
                        value={
                          selectedChoices.length > 0
                            ? selectedChoices[0].toString()
                            : undefined
                        }
                        onValueChange={(val) => toggleChoice(parseInt(val))}
                        disabled={voteMutation.isPending}
                      >
                        {poll.options.map((option, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={i.toString()}
                              id={`poll-${poll.id}-opt-${i}`}
                            />
                            <label
                              htmlFor={`poll-${poll.id}-opt-${i}`}
                              className="cursor-pointer text-sm leading-none font-medium"
                            >
                              {option.title}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        size="sm"
                        onClick={handleVoteSubmit}
                        disabled={
                          selectedChoices.length === 0 || voteMutation.isPending
                        }
                      >
                        {voteMutation.isPending ? "Voting..." : "Vote"}
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {poll.voters_count ||
                            poll.votes_count ||
                            poll.options.reduce(
                              (acc, opt) => acc + opt.votes_count,
                              0
                            )}{" "}
                          votes
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Results UI
                  <div className="space-y-3">
                    {poll.options.map((option, i) => {
                      const totalVotes =
                        poll.voters_count ||
                        poll.votes_count ||
                        poll.options.reduce(
                          (acc, opt) => acc + opt.votes_count,
                          0
                        )
                      const percentage =
                        totalVotes > 0
                          ? Math.round((option.votes_count / totalVotes) * 100)
                          : 0

                      const didVoteForThis = poll.own_votes?.includes(i)

                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span
                              className={`font-medium ${didVoteForThis ? "text-primary" : ""}`}
                            >
                              {option.title} {didVoteForThis && "✓"}
                            </span>
                            <span className="font-semibold text-muted-foreground">
                              {percentage}%{" "}
                              <span className="text-xs font-normal">
                                ({option.votes_count})
                              </span>
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className={`h-2 ${didVoteForThis ? "[&>div]:bg-primary" : ""}`}
                          />
                        </div>
                      )
                    })}
                    <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                      <span>
                        {poll.voters_count ||
                          poll.votes_count ||
                          poll.options.reduce(
                            (acc, opt) => acc + opt.votes_count,
                            0
                          )}{" "}
                        votes
                      </span>
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
