import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { EMOJI_CATEGORIES } from "@/lib/emojis"

interface EmojiPickerProps {
  children: React.ReactNode
  onEmojiSelect: (emoji: string) => void
  closeOnSelect?: boolean
  align?: "center" | "start" | "end"
}

export function EmojiPicker({ children, onEmojiSelect, closeOnSelect = false, align = "start" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji)
    if (closeOnSelect) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children as React.ReactElement} />
      <PopoverContent 
        className="w-[320px] min-w-[320px] h-[300px] min-h-[250px] p-2 flex flex-col resize-y overflow-hidden shadow-lg" 
        align={align}
        sideOffset={8}
      >
        <Tabs defaultValue={EMOJI_CATEGORIES[0].name} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="w-full whitespace-nowrap mb-1">
            <TabsList className="w-full justify-start h-auto flex-nowrap pb-1 no-scrollbar bg-transparent">
              {EMOJI_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.name} value={cat.name} className="text-xs px-2 py-1 shrink-0">
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
          {EMOJI_CATEGORIES.map(cat => (
            <TabsContent key={cat.name} value={cat.name} className="mt-0 flex-1 min-h-0 data-[state=active]:flex">
              <ScrollArea className="h-full w-full pr-3">
                <div className="grid grid-cols-8 gap-1 pb-4">
                  {cat.emojis.map((emoji, i) => (
                    <Button 
                      type="button"
                      key={i} 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-xl" 
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
