import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNow } from "@/hooks/useNow"
import { formatFullDateTime, formatRelativeTime } from "@/lib/time"
import { cn } from "@/lib/utils"

interface RelativeTimeProps {
  dateTime: string
  className?: string
}

// Humanized timestamp; the full date and time shows on hover or tap.
export function RelativeTime({ dateTime, className }: RelativeTimeProps) {
  const now = useNow()
  const date = new Date(dateTime)

  if (Number.isNaN(date.getTime())) return null

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={200}
        nativeButton={false}
        render={
          <time
            dateTime={date.toISOString()}
            className={cn("cursor-default hover:underline", className)}
          />
        }
      >
        {formatRelativeTime(date, now)}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto gap-0 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-none ring-0"
      >
        {formatFullDateTime(date)}
      </PopoverContent>
    </Popover>
  )
}
