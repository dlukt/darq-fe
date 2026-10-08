const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

const relativeFormat = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
})

const fullFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "medium",
})

// "now", "5 minutes ago", "yesterday", "3 weeks ago", ... in the browser locale.
export function formatRelativeTime(date: Date, now: number): string {
  const seconds = (date.getTime() - now) / 1000

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.trunc(seconds / size), unit)
    }
  }

  return relativeFormat.format(0, "second")
}

export function formatFullDateTime(date: Date): string {
  return fullFormat.format(date)
}
