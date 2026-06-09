import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchInstanceConfig, postStatus, uploadMedia, type PostStatusPayload } from "@/api/endpoints"
import { useAuthStore } from "@/store/auth"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import iso6391 from "iso-639-1"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Unlock, Globe, Users, Upload, Smile, BarChart, EyeOff, X, Plus, Quote } from "lucide-react"
import { EmojiPicker } from "@/components/ui/emoji-picker"

type Visibility = "public" | "unlisted" | "private" | "direct"

interface Attachment {
  id?: string
  file: File
  preview: string
  progress: number
  error?: boolean
}

const formSchema = z.object({
  content: z.string(),
  visibility: z.enum(["public", "unlisted", "private", "direct"]),
  localOnly: z.boolean(),
  contentType: z.string(),
  language: z.string(),
  showCW: z.boolean(),
  contentWarning: z.string(),
  poll: z.object({
    show: z.boolean(),
    options: z.array(z.object({ value: z.string() })),
    expiresIn: z.string(),
    multiple: z.boolean()
  })
})

type FormValues = z.infer<typeof formSchema>

const contentTypes = [
  { value: "text/plain", label: "Plain Text" },
  { value: "text/html", label: "HTML" },
  { value: "text/markdown", label: "Markdown" },
  { value: "text/bbcode", label: "BBCode" },
  { value: "text/mfm", label: "MFM" }
]

const languages = iso6391.getAllCodes().map(code => ({
  value: code,
  label: iso6391.getNativeName(code) || iso6391.getName(code)
}))

export interface StatusComposerProps {
  inReplyToId?: string;
  quoteId?: string;
  initialContent?: string;
  onSuccess?: () => void;
  className?: string;
}

export function StatusComposer({ inReplyToId, quoteId, initialContent = "", onSuccess, className = "mb-6" }: StatusComposerProps = {}) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachments, setAttachments] = useState<Attachment[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: initialContent,
      visibility: "public",
      localOnly: false,
      contentType: "text/plain",
      language: "en",
      showCW: false,
      contentWarning: "",
      poll: {
        show: false,
        options: [{ value: "" }, { value: "" }],
        expiresIn: "86400",
        multiple: false
      }
    }
  })

  const { control, handleSubmit, watch, setValue } = form
  const { fields: pollOptions, append: appendPollOption, remove: removePollOption } = useFieldArray({
    control,
    name: "poll.options"
  })

  const { data: instanceConfig } = useQuery({
    queryKey: ["instance"],
    queryFn: fetchInstanceConfig,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const currentContent = watch("content")
  const showCW = watch("showCW")
  const currentVisibility = watch("visibility")
  const currentLocalOnly = watch("localOnly")
  const currentPollShow = watch("poll.show")

  const maxChars = instanceConfig?.max_toot_chars || 5000
  const remainingChars = maxChars - currentContent.length
  const isOverLimit = remainingChars < 0
  const isUploading = attachments.some(a => a.progress < 100 && !a.error)
  const isEmpty = currentContent.trim().length === 0 && attachments.length === 0

  const submitMutation = useMutation({
    mutationFn: postStatus,
    onSuccess: () => {
      form.reset({ content: initialContent })
      setAttachments([])
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
      if (onSuccess) onSuccess()
    },
    onError: (err) => {
      console.error("Failed to post status", err)
    }
  })

  const onSubmit = (values: FormValues) => {
    if (isEmpty || isOverLimit || isUploading) return
    
    const payload: PostStatusPayload = {
      status: values.content,
      visibility: values.visibility,
      content_type: values.contentType,
      local: values.localOnly,
      language: values.language,
      in_reply_to_id: inReplyToId,
      quote_id: quoteId
    }
    
    if (values.showCW && values.contentWarning.trim()) {
      payload.spoiler_text = values.contentWarning
    }
    
    if (attachments.length > 0) {
      payload.media_ids = attachments.map(a => a.id).filter(Boolean) as string[]
    }
    
    if (values.poll.show) {
      const validOptions = values.poll.options.map(o => o.value).filter(o => o.trim().length > 0)
      if (validOptions.length > 1) {
        payload.poll = {
          options: validOptions,
          expires_in: parseInt(values.poll.expiresIn),
          multiple: values.poll.multiple
        }
      }
    }
    
    submitMutation.mutate(payload)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }
  
  const handleEmojiClick = (emoji: string) => {
    setValue("content", currentContent + emoji, { shouldValidate: true })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const files = Array.from(e.target.files)
    
    const newAttachments: Attachment[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0
    }))
    
    setAttachments(prev => [...prev, ...newAttachments])
    
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
    
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  
  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => {
      const remaining = prev.filter(a => a.file !== fileToRemove)
      const removed = prev.find(a => a.file === fileToRemove)
      if (removed) URL.revokeObjectURL(removed.preview)
      return remaining
    })
  }

  if (!user) return null

  const displayName = user.display_name || user.username

  const VisibilityIcon = ({ value, icon: Icon, label }: { value: Visibility, icon: React.ElementType, label: string }) => (
    <Tooltip>
      <TooltipTrigger render={
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className={`h-8 w-8 ${currentVisibility === value ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setValue("visibility", value)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      } />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <Card className={`w-full border-2 border-primary/10 shadow-sm transition-all focus-within:border-primary/30 ${className}`}>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar} alt={displayName} />
            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3 min-w-0">
            {quoteId && (
              <div className="px-3 py-2 bg-muted/50 border-l-4 border-l-primary/50 text-xs text-muted-foreground rounded-r-md flex items-center gap-2">
                <Quote className="h-3 w-3" />
                <span>Quoting status</span>
              </div>
            )}
            {showCW && (
              <Controller
                name="contentWarning"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field}
                    placeholder="Content Warning (optional)" 
                    className="bg-muted/50 border-dashed"
                  />
                )}
              />
            )}
          
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder={showCW ? "Type your hidden message here..." : "What's on your mind?"}
                  className="resize-none min-h-[100px] text-base border-0 focus-visible:ring-0 p-0"
                  onKeyDown={handleKeyDown}
                  disabled={submitMutation.isPending}
                />
              )}
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
                      type="button"
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
            {currentPollShow && (
              <div className="p-3 border rounded-md bg-muted/30 space-y-3">
                <div className="space-y-2">
                  {pollOptions.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Controller
                        name={`poll.options.${i}.value`}
                        control={control}
                        render={({ field }) => (
                          <Input 
                            {...field}
                            placeholder={`Choice ${i + 1}`}
                            className="bg-background"
                          />
                        )}
                      />
                      {pollOptions.length > 2 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removePollOption(i)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground w-full justify-start border border-dashed"
                      onClick={() => appendPollOption({ value: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add option
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Controller
                    name="poll.expiresIn"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={v => v && field.onChange(v)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                          {field.value === "300" ? "5 Minutes" : 
                           field.value === "1800" ? "30 Minutes" :
                           field.value === "3600" ? "1 Hour" :
                           field.value === "86400" ? "1 Day" :
                           field.value === "604800" ? "1 Week" : "Duration"}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">5 Minutes</SelectItem>
                          <SelectItem value="1800">30 Minutes</SelectItem>
                          <SelectItem value="3600">1 Hour</SelectItem>
                          <SelectItem value="86400">1 Day</SelectItem>
                          <SelectItem value="604800">1 Week</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  
                  <Controller
                    name="poll.multiple"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="multiple" 
                          checked={field.value}
                          onCheckedChange={c => field.onChange(!!c)}
                        />
                        <label htmlFor="multiple" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Multiple choice
                        </label>
                      </div>
                    )}
                  />
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
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${currentLocalOnly ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setValue("localOnly", !currentLocalOnly)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    } />
                    <TooltipContent>Local Only (Do not federate)</TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={v => v && field.onChange(v)}>
                        <SelectTrigger className="h-8 w-[100px] text-xs">
                          <span className="truncate">
                            {languages.find(l => l.value === field.value)?.label || "Language"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectScrollUpButton />
                          {languages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                          <SelectScrollDownButton />
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <Controller
                    name="contentType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={v => v && field.onChange(v)}>
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          {contentTypes.find(c => c.value === field.value)?.label || "Format"}
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </TooltipProvider>

            {/* Toolbar row 2: Actions & Submit */}
            <TooltipProvider>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-1">
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
                      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-5 w-5" />
                      </Button>
                    } />
                    <TooltipContent>Upload Media</TooltipContent>
                  </Tooltip>

                  <EmojiPicker onEmojiSelect={handleEmojiClick} closeOnSelect={false}>
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" title="Insert Emoji">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </EmojiPicker>

                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className={`text-muted-foreground ${currentPollShow ? 'bg-muted' : ''}`}
                        onClick={() => setValue("poll.show", !currentPollShow)}
                      >
                        <BarChart className="h-5 w-5" />
                      </Button>
                    } />
                    <TooltipContent>Add Poll</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className={`text-muted-foreground ${showCW ? 'bg-muted' : ''}`}
                        onClick={() => setValue("showCW", !showCW)}
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
                    type="submit"
                    disabled={isEmpty || isOverLimit || submitMutation.isPending || isUploading}
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
        </form>
      </CardContent>
    </Card>
  )
}
