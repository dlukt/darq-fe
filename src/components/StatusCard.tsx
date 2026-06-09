import { useState, useEffect, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { voteOnPoll } from "@/api/endpoints"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

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
  const { account, content, created_at, spoiler_text, sensitive, media_attachments, poll } = status
  const queryClient = useQueryClient()

  // Very basic fallback if no display name
  const displayName = account.display_name || account.username
  
  // Format date
  const dateStr = new Date(created_at).toLocaleString()

  const [showContent, setShowContent] = useState(!sensitive && !spoiler_text)
  const [selectedChoices, setSelectedChoices] = useState<number[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const voteMutation = useMutation({
    mutationFn: () => voteOnPoll(poll!.id, selectedChoices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    }
  })

  const handleVoteSubmit = () => {
    if (selectedChoices.length === 0 || !poll) return
    voteMutation.mutate()
  }

  const toggleChoice = (index: number) => {
    if (poll?.multiple) {
      setSelectedChoices(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      )
    } else {
      setSelectedChoices([index])
    }
  }

  const handleNextMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!media_attachments) return
    setLightboxIndex(prev => 
      prev !== null && prev < media_attachments.length - 1 ? prev + 1 : prev
    )
  }, [media_attachments])

  const handlePrevMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!media_attachments) return
    setLightboxIndex(prev => 
      prev !== null && prev > 0 ? prev - 1 : prev
    )
  }, [media_attachments])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextMedia()
      if (e.key === "ArrowLeft") handlePrevMedia()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxIndex, handleNextMedia, handlePrevMedia])

  return (
    <>
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
                  {media_attachments.map((media, i) => (
                    <div 
                      key={media.id} 
                      className={`relative rounded-lg overflow-hidden bg-muted border shadow-sm ${media.type === 'audio' ? '' : 'aspect-video cursor-pointer hover:opacity-90 transition-opacity'}`}
                      onClick={() => {
                        if (media.type !== 'audio') setLightboxIndex(i)
                      }}
                    >
                      {media.type === 'video' || media.type === 'gifv' ? (
                        <video src={media.url} poster={media.preview_url} className="object-cover w-full h-full pointer-events-none" />
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
                              <label htmlFor={`poll-${poll.id}-opt-${i}`} className="text-sm font-medium leading-none cursor-pointer">
                                {option.title}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <RadioGroup 
                          value={selectedChoices.length > 0 ? selectedChoices[0].toString() : undefined} 
                          onValueChange={(val) => toggleChoice(parseInt(val))}
                          disabled={voteMutation.isPending}
                        >
                          {poll.options.map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroupItem value={i.toString()} id={`poll-${poll.id}-opt-${i}`} />
                              <label htmlFor={`poll-${poll.id}-opt-${i}`} className="text-sm font-medium leading-none cursor-pointer">
                                {option.title}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      
                      <div className="pt-2 flex items-center justify-between">
                        <Button 
                          size="sm" 
                          onClick={handleVoteSubmit} 
                          disabled={selectedChoices.length === 0 || voteMutation.isPending}
                        >
                          {voteMutation.isPending ? "Voting..." : "Vote"}
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{poll.voters_count || poll.votes_count || poll.options.reduce((acc, opt) => acc + opt.votes_count, 0)} votes</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Results UI
                    <div className="space-y-3">
                      {poll.options.map((option, i) => {
                        const totalVotes = poll.voters_count || poll.votes_count || poll.options.reduce((acc, opt) => acc + opt.votes_count, 0)
                        const percentage = totalVotes > 0 
                          ? Math.round((option.votes_count / totalVotes) * 100) 
                          : 0
                        
                        const didVoteForThis = poll.own_votes?.includes(i)

                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${didVoteForThis ? 'text-primary' : ''}`}>
                                {option.title} {didVoteForThis && '✓'}
                              </span>
                              <span className="font-semibold text-muted-foreground">
                                {percentage}% <span className="font-normal text-xs">({option.votes_count})</span>
                              </span>
                            </div>
                            <Progress value={percentage} className={`h-2 ${didVoteForThis ? '[&>div]:bg-primary' : ''}`} />
                          </div>
                        )
                      })}
                      <div className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
                        <span>{poll.voters_count || poll.votes_count || poll.options.reduce((acc, opt) => acc + opt.votes_count, 0)} votes</span>
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

      {/* Lightbox Dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-[100vw] h-[100dvh] w-full border-0 p-0 m-0 bg-black/95 flex flex-col justify-center items-center [&>button]:hidden">
          <DialogTitle className="sr-only">Media Viewer</DialogTitle>
          
          {/* Custom Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 rounded-full"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-6 h-6" />
          </Button>

          {media_attachments && lightboxIndex !== null && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Previous Button */}
              {lightboxIndex > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={handlePrevMedia}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {/* Media Content */}
              <div className="w-full h-full p-4 flex items-center justify-center">
                {media_attachments[lightboxIndex].type === 'video' || media_attachments[lightboxIndex].type === 'gifv' ? (
                  <video 
                    src={media_attachments[lightboxIndex].url} 
                    poster={media_attachments[lightboxIndex].preview_url} 
                    controls 
                    autoPlay
                    loop={media_attachments[lightboxIndex].type === 'gifv'}
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : (
                  <img 
                    src={media_attachments[lightboxIndex].url} 
                    alt={media_attachments[lightboxIndex].description || "Fullscreen attachment"} 
                    className="max-w-full max-h-full object-contain" 
                  />
                )}
              </div>

              {/* Next Button */}
              {lightboxIndex < media_attachments.length - 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={handleNextMedia}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
