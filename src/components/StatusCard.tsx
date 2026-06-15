import { useState } from "react"
import { useNavigate } from "react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { voteOnPoll, toggleReblogStatus, toggleFavouriteStatus, toggleBookmarkStatus, toggleReaction } from "@/api/endpoints"

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ImageGallery, type ImageItem } from "@/components/ui/image-gallery"
import { StatusComposer } from "@/components/StatusComposer"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth"
import { deleteStatus, toggleMuteConversation } from "@/api/endpoints"

import { 
  MessageCircle, 
  Repeat, 
  Heart, 
  SmilePlus, 
  MoreHorizontal,
  Quote,
  Bookmark
} from "lucide-react"

export interface MediaAttachment {
  id: string
  type: "image" | "video" | "gifv" | "audio" | "unknown"
  url: string
  preview_url: string
  description?: string | null
  meta?: {
    original?: {
      width?: number
      height?: number
    }
  }
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

export interface PreviewCard {
  url: string
  title: string
  description: string
  type: "link" | "photo" | "video" | "rich"
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  html?: string
  width?: number
  height?: number
  image?: string | null
  embed_url?: string
  blurhash?: string
}

export interface Status {
  id: string
  created_at: string
  content: string
  spoiler_text?: string
  sensitive?: boolean
  media_attachments?: MediaAttachment[]
  card?: PreviewCard | null
  poll?: Poll
  replies_count?: number
  reblogs_count?: number
  favourites_count?: number
  favourited?: boolean
  reblogged?: boolean
  bookmarked?: boolean
  muted?: boolean
  url?: string
  uri?: string
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
  isDetailed?: boolean
  isAncestor?: boolean
  isDescendant?: boolean
}

export function StatusCard({ status, isDetailed, isAncestor, isDescendant }: StatusCardProps) {
  const {
    account,
    content,
    created_at,
    spoiler_text,
    sensitive,
    media_attachments,
    card,
    poll,
    replies_count = 0,
    reblogs_count = 0,
    favourites_count = 0,
    favourited = false,
    reblogged = false,
    bookmarked = false,
    muted = false,
    url,
    uri,
  } = status
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const displayName = account.display_name || account.username

  // Check if current user can delete
  const canDelete = user?.id === account.id || 
                    user?.pleroma?.is_admin || 
                    user?.pleroma?.is_moderator || 
                    user?.role?.name?.toLowerCase() === 'admin' || 
                    user?.role?.name?.toLowerCase() === 'moderator'

  // Format date
  const dateStr = new Date(created_at).toLocaleString()

  const [isHidden, setIsHidden] = useState(false)
  const [showContent, setShowContent] = useState(!sensitive && !spoiler_text)
  const [selectedChoices, setSelectedChoices] = useState<number[]>([])
  const [isReplying, setIsReplying] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)

  const voteMutation = useMutation({
    mutationFn: () => voteOnPoll(poll!.id, selectedChoices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const reblogMutation = useMutation({
    mutationFn: () => toggleReblogStatus(status.id, reblogged),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const favouriteMutation = useMutation({
    mutationFn: () => toggleFavouriteStatus(status.id, favourited),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmarkStatus(status.id, bookmarked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const reactionMutation = useMutation({
    mutationFn: ({ emoji, isReacted }: { emoji: string; isReacted: boolean }) => 
      toggleReaction(status.id, emoji, isReacted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const muteMutation = useMutation({
    mutationFn: () => toggleMuteConversation(status.id, muted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteStatus(status.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const handleReaction = (emoji: string) => {
    // Check if we already reacted with this emoji
    // @ts-expect-error - Pleroma specific extension
    const reactions = status.pleroma?.emoji_reactions || []
    const existing = reactions.find((r: { name: string; count: number; me: boolean }) => r.name === emoji)
    reactionMutation.mutate({ emoji, isReacted: !!existing?.me })
  }

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    
    if (anchor) {
      if (anchor.classList.contains('hashtag')) {
        e.preventDefault()
        e.stopPropagation()
        const url = new URL(anchor.href, window.location.origin)
        const tag = url.pathname.split('/').pop()
        if (tag) navigate(`/tags/${tag}`)
      } else if (anchor.classList.contains('mention')) {
        e.preventDefault()
        e.stopPropagation()
        const mentionText = anchor.textContent?.trim()
        if (mentionText && mentionText.startsWith('@')) {
          navigate(`/${mentionText}`)
        } else {
          // Fallback if text doesn't start with @
          const url = new URL(anchor.href, window.location.origin)
          const handle = url.pathname.split('/').pop()
          if (handle) navigate(`/${handle}`)
        }
      }
    }
  }

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

  if (isHidden) {
    return (
      <div className={`mb-4 w-full ${isDescendant ? "pl-8" : ""}`}>
        <Card className="w-full bg-muted/30">
          <CardContent className="p-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Post hidden</span>
            <Button variant="ghost" size="sm" onClick={() => setIsHidden(false)}>
              Undo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`mb-4 w-full ${isDescendant ? "pl-8 relative before:absolute before:left-4 before:top-0 before:-bottom-8 before:w-0.5 before:bg-border last:before:hidden" : ""}`}>
      <Card 
        className={`w-full transition-colors ${!isDetailed ? "cursor-pointer hover:bg-muted/20" : ""} ${isAncestor ? "rounded-b-none border-b-0 mb-0" : ""} ${isDescendant ? "rounded-t-none border-t-0 mt-0" : ""}`}
        onClick={(e) => {
          if (isDetailed) return
          const target = e.target as HTMLElement
          if (target.closest('a, button, img, video, [role="button"], [data-src]')) return
          navigate(`/status/${status.id}`)
        }}
      >
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
      <CardContent className="pb-2">
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
              onClick={handleContentClick}
            />

            {/* Media Attachments */}
            {galleryImages.length > 0 && (
              <div className="mt-4">
                <ImageGallery images={galleryImages} lazyLoading={true} />
              </div>
            )}

            {/* Card (Link Preview or Rich Media) */}
            {card && (
              <div className="mt-4 overflow-hidden rounded-lg border bg-card">
                {card.html ? (
                  <div 
                    className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full"
                    dangerouslySetInnerHTML={{ __html: card.html }}
                  />
                ) : (
                  <a 
                    href={card.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block transition-colors hover:bg-muted/50"
                  >
                    {card.image && (
                      <div className="aspect-[1.91/1] w-full bg-muted relative">
                        <img 
                          src={card.image} 
                          alt={card.title} 
                          className="h-full w-full object-cover" 
                          loading="lazy" 
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-semibold">{card.title}</h3>
                      {card.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{card.description}</p>
                      )}
                      {(card.provider_name || card.author_name) && (
                        <p className="mt-2 text-xs text-muted-foreground truncate">
                          {card.provider_name} {card.provider_name && card.author_name ? "·" : ""} {card.author_name}
                        </p>
                      )}
                    </div>
                  </a>
                )}
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
        
        {/* Existing Reactions */}
        {/* @ts-expect-error - Pleroma specific extension */}
        {status.pleroma?.emoji_reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {/* @ts-expect-error - Pleroma specific extension */}
            {status.pleroma.emoji_reactions.map((reaction: { name: string; count: number; me: boolean }, i: number) => (
              <Button
                key={i}
                variant={reaction.me ? "secondary" : "outline"}
                size="sm"
                className={`h-7 px-2 text-xs flex items-center gap-1 cursor-pointer transition-colors ${reaction.me ? "border-primary/50 bg-primary/10 hover:bg-primary/20" : ""}`}
                onClick={() => handleReaction(reaction.name)}
                disabled={reactionMutation.isPending}
              >
                <span>{reaction.name}</span>
                <span className="text-muted-foreground ml-0.5">{reaction.count}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Interaction Buttons */}
      <CardFooter className="flex flex-row flex-wrap items-center justify-between text-muted-foreground pt-0 mt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 hover:text-foreground ${isReplying ? "text-foreground bg-muted" : "text-muted-foreground"}`}
          onClick={() => setIsReplying(!isReplying)}
        >
          <MessageCircle className="h-4 w-4" />
          {replies_count > 0 && <span className="text-xs">{replies_count}</span>}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 hover:text-green-500 ${reblogged ? "text-green-500" : "text-muted-foreground"}`}
          onClick={() => reblogMutation.mutate()}
          disabled={reblogMutation.isPending}
        >
          <Repeat className={`h-4 w-4 ${reblogMutation.isPending ? "animate-spin" : ""}`} />
          {reblogs_count > 0 && <span className="text-xs">{reblogs_count}</span>}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 hover:text-foreground ${isQuoting ? "text-foreground bg-muted" : "text-muted-foreground"}`}
          onClick={() => setIsQuoting(!isQuoting)}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 hover:text-pink-500 ${favourited ? "text-pink-500 fill-current" : "text-muted-foreground"}`}
          onClick={() => favouriteMutation.mutate()}
          disabled={favouriteMutation.isPending}
        >
          <Heart className={`h-4 w-4 ${favourited ? "fill-current" : ""} ${favouriteMutation.isPending ? "animate-pulse" : ""}`} />
          {favourites_count > 0 && <span className="text-xs">{favourites_count}</span>}
        </Button>
        <EmojiPicker onEmojiSelect={handleReaction} closeOnSelect={true}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <SmilePlus className={`h-4 w-4 ${reactionMutation.isPending ? "animate-pulse" : ""}`} />
          </Button>
        </EmojiPicker>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-1.5 hover:text-primary ${bookmarked ? "text-primary" : "text-muted-foreground"}`}
          onClick={() => bookmarkMutation.mutate()}
          disabled={bookmarkMutation.isPending}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              muteMutation.mutate()
            }}>
              {muted ? "Unmute conversation" : "Mute conversation"}
            </DropdownMenuItem>
            {(url || uri) && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                const link = url || uri
                if (link) {
                  navigator.clipboard.writeText(link)
                }
              }}>
                Copy link to post
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              setIsHidden(true)
            }}>
              Hide for me
            </DropdownMenuItem>
            
            {(url || uri) && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                window.open(url || uri, '_blank', 'noopener,noreferrer')
              }}>
                External source
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {canDelete && (
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteMutation.mutate()
                }}
              >
                Delete post
              </DropdownMenuItem>
            )}
            {!canDelete && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                console.log('Report post clicked')
              }}>
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
    
    {isReplying && (
      <div className="mt-2 pl-4 md:pl-12">
        <StatusComposer 
          inReplyToId={status.id} 
          initialContent={`@${account.acct} `} 
          onSuccess={() => setIsReplying(false)}
          className="mb-0 border-l-4 border-l-primary/30"
        />
      </div>
    )}
    
    {isQuoting && (
      <div className="mt-2 pl-4 md:pl-12">
        <StatusComposer 
          quoteId={status.id} 
          onSuccess={() => setIsQuoting(false)}
          className="mb-0 border-l-4 border-l-primary/30"
        />
      </div>
    )}
    </div>
  )
}
