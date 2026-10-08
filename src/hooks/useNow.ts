import { useSyncExternalStore } from "react"

const TICK_MS = 30_000

const listeners = new Set<() => void>()
let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (timer === undefined) {
    now = Date.now()
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

function getSnapshot() {
  return now
}

// Current time in milliseconds. All subscribers share one timer, so a
// timeline full of timestamps re-renders together every 30 seconds.
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
