1.  **UX Finding:** Empty states for lists (no posts, no accounts, etc.) are just plain text strings. The `TimelinePage.tsx` simply renders "No posts to show right now." This violates the UX guidelines: "Always treat empty states as an opportunity to guide users on what to do next. Use actionable guidance and relevant icons to improve the visual experience, rather than just displaying plain text stating that there is no data."
2.  **Proposed Fix:** Update `src/pages/TimelinePage.tsx` empty state. Currently it renders:
    ```tsx
    {!isLoading && !isError && !isAuthRequired && statuses.length === 0 && (
      <div className="text-center p-8 text-muted-foreground">
        No posts to show right now.
      </div>
    )}
    ```
    I will replace this with a more helpful empty state that includes an icon and perhaps a call to action depending on the timeline type (e.g., if home timeline, tell them to follow someone or explore federated timeline).
    Wait, `type` is passed to TimelinePage. We can customize the empty state message based on `type`.
    For example:
    ```tsx
    import { Search, Users, MessageSquareOff } from "lucide-react"

    const emptyStateContent = {
      home: { icon: Users, title: "Your home feed is empty", desc: "Follow more people to see their posts here." },
      local: { icon: MessageSquareOff, title: "No local posts yet", desc: "Be the first to post on this server!" },
      federated: { icon: Search, title: "Nothing to see here", desc: "The federated timeline is currently empty." },
      bookmarks: { icon: Search, title: "No bookmarks yet", desc: "Save posts to read them later." },
      direct: { icon: MessageSquareOff, title: "No direct messages", desc: "You haven't received any direct messages yet." },
      list: { icon: Users, title: "This list is empty", desc: "Add people to this list to see their posts." },
      tag: { icon: Search, title: "No posts for this tag", desc: "Try searching for a different tag." },
    }[type]
    ```
    Then render it nicely using a Card or just a stylized flex column.

Let me test this out.
