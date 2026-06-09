import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchInstanceConfig, postStatus, uploadMedia, type PostStatusPayload } from "@/api/endpoints"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Unlock, Globe, Users, Upload, Smile, BarChart, EyeOff, X, Plus } from "lucide-react"

// A custom lightweight emoji grid
const COMMON_EMOJIS = ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😮‍💨","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","👍","👎","👏","🙌","🫶","❤️","💔","🔥","✨","🌟","💯"]

type Visibility = "public" | "unlisted" | "private" | "direct"

interface Attachment {
  id?: string
  file: File
  preview: string
  progress: number
  error?: boolean
}

interface PollState {
  show: boolean
  options: string[]
  expiresIn: string // "300" (5m), "3600" (1h), "86400" (1d)
  multiple: boolean
}

export function StatusComposer() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Core content
  const [content, setContent] = useState("")
  
  // Settings & Visibility
  const [visibility, setVisibility] = useState<Visibility>("public")
  const [localOnly, setLocalOnly] = useState(false)
  const [contentType, setContentType] = useState("text/plain")
  const [language, setLanguage] = useState("en")
  
  // Content Warning
  const [showCW, setShowCW] = useState(false)
  const [contentWarning, setContentWarning] = useState("")
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  
  // Polls
  const [poll, setPoll] = useState<PollState>({
    show: false,
    options: ["", ""],
    expiresIn: "86400",
    multiple: false
  })

  const { data: instanceConfig } = useQuery({
    queryKey: ["instance"],
    queryFn: fetchInstanceConfig,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const maxChars = instanceConfig?.max_toot_chars || 5000
  const remainingChars = maxChars - content.length
  const isOverLimit = remainingChars < 0
  const isUploading = attachments.some(a => a.progress < 100 && !a.error)
  const isEmpty = content.trim().length === 0 && attachments.length === 0

  const submitMutation = useMutation({
    mutationFn: postStatus,
    onSuccess: () => {
      // Reset state
      setContent("")
      setContentWarning("")
      setShowCW(false)
      setAttachments([])
      setPoll({ show: false, options: ["", ""], expiresIn: "86400", multiple: false })
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
    onError: (err) => {
      console.error("Failed to post status", err)
    }
  })

  const handleSubmit = () => {
    if (isEmpty || isOverLimit || isUploading) return
    
    const payload: PostStatusPayload = {
      status: content,
      visibility,
      content_type: contentType,
      local: localOnly
    }
    
    if (showCW && contentWarning.trim()) {
      payload.spoiler_text = contentWarning
    }
    
    if (attachments.length > 0) {
      payload.media_ids = attachments.map(a => a.id).filter(Boolean) as string[]
    }
    
    if (poll.show) {
      const validOptions = poll.options.filter(o => o.trim().length > 0)
      if (validOptions.length > 1) {
        payload.poll = {
          options: validOptions,
          expires_in: parseInt(poll.expiresIn),
          multiple: poll.multiple
        }
      }
    }
    
    submitMutation.mutate(payload)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const handleEmojiClick = (emoji: string) => {
    setContent(prev => prev + emoji)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const files = Array.from(e.target.files)
    
    // Create local previews instantly
    const newAttachments: Attachment[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0
    }))
    
    setAttachments(prev => [...prev, ...newAttachments])
    
    // Simulate upload progress & call API
    // (In a real scenario with Axios we could use onUploadProgress, 
    // but with fetch we'll simulate progress while awaiting response)
    for (const newAtt of newAttachments) {
      let simulatedProgress = 10
      const interval = setInterval(() => {
        simulatedProgress = Math.min(simulatedProgress + 10, 90)
        setAttachments(prev => prev.map(a => a.file === newAtt.file ? { ...a, progress: simulatedProgress } : a))
      }, 200)

      try {
        const response = await uploadMedia(newAtt.file)
        clearInterval(interval)
        setAttachments(prev => prev.map(a => a.file === newAtt.file ? { ...a, progress: 100, id: response.id } : a))
      } catch (err) {
        console.error("Upload failed", err)
        clearInterval(interval)
        setAttachments(prev => prev.map(a => a.file === newAtt.file ? { ...a, progress: 100, error: true } : a))
      }
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  
  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => {
      const remaining = prev.filter(a => a.file !== fileToRemove)
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(a => a.file === fileToRemove)
      if (removed) URL.revokeObjectURL(removed.preview)
      return remaining
    })
  }

  if (!user) return null

  const displayName = user.display_name || user.username

  const VisibilityIcon = ({ value, icon: Icon, label }: { value: Visibility, icon: any, label: string }) => (
    <Tooltip>
      <TooltipTrigger render={
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-8 w-8 ${visibility === value ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setVisibility(value)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      } />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <Card className="w-full mb-6 border-2 border-primary/10 shadow-sm transition-all focus-within:border-primary/30">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar} alt={displayName} />
            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3 min-w-0">
            {showCW && (
              <Input 
                placeholder="Content Warning (optional)" 
                value={contentWarning}
                onChange={e => setContentWarning(e.target.value)}
                className="bg-muted/50 border-dashed"
              />
            )}
          
            <Textarea
              placeholder={showCW ? "Type your hidden message here..." : "What's on your mind?"}
              className="resize-none min-h-[100px] text-base border-0 focus-visible:ring-0 p-0"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitMutation.isPending}
            />
            
            {/* Attachments Preview Area */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {attachments.map((att, i) => (
                  <div key={i} className="relative group rounded-md overflow-hidden bg-muted aspect-video flex items-center justify-center">
                    <img src={att.preview} alt="Upload preview" className="object-cover w-full h-full opacity-90" />
                    
                    {att.progress < 100 && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center p-2">
                        <Progress value={att.progress} className="w-full" />
                      </div>
                    )}
                    
                    {att.error && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm">
                        Failed
                      </div>
                    )}

                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity scale-90"
                      onClick={() => removeAttachment(att.file)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Poll Creation Area */}
            {poll.show && (
              <div className="p-3 border rounded-md bg-muted/30 space-y-3">
                <div className="space-y-2">
                  {poll.options.map((opt, i) => (
                    <Input 
                      key={i}
                      placeholder={`Choice ${i + 1}`}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...poll.options]
                        newOpts[i] = e.target.value
                        setPoll(p => ({ ...p, options: newOpts }))
                      }}
                      className="bg-background"
                    />
                  ))}
                  {poll.options.length < 4 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground w-full justify-start border border-dashed"
                      onClick={() => setPoll(p => ({ ...p, options: [...p.options, ""] }))}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add option
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Select value={poll.expiresIn} onValueChange={(v) => v && setPoll(p => ({ ...p, expiresIn: v }))}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">5 Minutes</SelectItem>
                      <SelectItem value="1800">30 Minutes</SelectItem>
                      <SelectItem value="3600">1 Hour</SelectItem>
                      <SelectItem value="86400">1 Day</SelectItem>
                      <SelectItem value="604800">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="multiple" 
                      checked={poll.multiple}
                      onCheckedChange={c => setPoll(p => ({ ...p, multiple: !!c }))}
                    />
                    <label htmlFor="multiple" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Multiple choice
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar row 1: Visibility & Formats */}
            <TooltipProvider>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-1">
                  <VisibilityIcon value="direct" icon={Mail} label="Direct (Mentioned only)" />
                  <VisibilityIcon value="private" icon={Lock} label="Followers only" />
                  <VisibilityIcon value="unlisted" icon={Unlock} label="Unlisted" />
                  <VisibilityIcon value="public" icon={Globe} label="Public" />
                  <div className="w-px h-4 bg-border mx-1" />
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${localOnly ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setLocalOnly(!localOnly)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    } />
                    <TooltipContent>Local Only (Do not federate)</TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                    <SelectTrigger className="h-8 w-[70px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">EN</SelectItem>
                      <SelectItem value="es">ES</SelectItem>
                      <SelectItem value="fr">FR</SelectItem>
                      <SelectItem value="de">DE</SelectItem>
                      <SelectItem value="ja">JA</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={contentType} onValueChange={(v) => v && setContentType(v)}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text/plain">Plain Text</SelectItem>
                      <SelectItem value="text/html">HTML</SelectItem>
                      <SelectItem value="text/markdown">Markdown</SelectItem>
                      <SelectItem value="text/bbcode">BBCode</SelectItem>
                      <SelectItem value="text/mfm">MFM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TooltipProvider>

            {/* Toolbar row 2: Actions & Submit */}
            <TooltipProvider>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1">
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*"
                  />
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-5 w-5" />
                      </Button>
                    } />
                    <TooltipContent>Upload Media</TooltipContent>
                  </Tooltip>

                  {/* Drop Tooltip around Emoji Button to avoid nested render triggers */}
                  <Popover>
                    <PopoverTrigger render={
                      <Button variant="ghost" size="icon" className="text-muted-foreground" title="Insert Emoji">
                        <Smile className="h-5 w-5" />
                      </Button>
                    } />
                    <PopoverContent className="w-[320px] p-2" align="start">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground px-1">Common Emojis</div>
                      <ScrollArea className="h-64">
                        <div className="grid grid-cols-8 gap-1">
                          {COMMON_EMOJIS.map((emoji, i) => (
                            <Button 
                              key={i} 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-xl" 
                              onClick={() => handleEmojiClick(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`text-muted-foreground ${poll.show ? 'bg-muted' : ''}`}
                        onClick={() => setPoll(p => ({ ...p, show: !p.show }))}
                      >
                        <BarChart className="h-5 w-5" />
                      </Button>
                    } />
                    <TooltipContent>Add Poll</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`text-muted-foreground ${showCW ? 'bg-muted' : ''}`}
                        onClick={() => setShowCW(!showCW)}
                      >
                        <EyeOff className="h-5 w-5" />
                      </Button>
                    } />
                    <TooltipContent>Toggle Content Warning</TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`text-xs font-medium ${isOverLimit ? 'text-red-500' : 'text-muted-foreground/60'}`}>
                    {remainingChars}
                  </span>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isEmpty || isOverLimit || submitMutation.isPending || isUploading}
                    className="px-6 rounded-full font-bold shadow-sm"
                  >
                    {submitMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </TooltipProvider>

            {submitMutation.isError && (
              <p className="text-sm text-red-500 font-medium">Failed to post status. Please try again.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
