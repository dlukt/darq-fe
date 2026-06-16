
import { ShieldAlert } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tagUser, untagUser, deactivateUser, activateUser, deleteAdminUser } from "@/api/endpoints"
import type { User } from "@/store/auth"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ModerationMenuProps {
  user: User
}

const MRF_TAGS = {
  FORCE_NSFW: "mrf_tag:media-force-nsfw",
  STRIP_MEDIA: "mrf_tag:media-strip",
  FORCE_UNLISTED: "mrf_tag:force-unlisted",
  SANDBOX: "mrf_tag:sandbox",
}

export function ModerationMenu({ user }: ModerationMenuProps) {
  const queryClient = useQueryClient()
  const nickname = user.acct

  // Helper to check if user has a tag
  const hasTag = (tag: string) => user.pleroma?.tags?.includes(tag) ?? false

  const toggleTagMutation = useMutation({
    mutationFn: async ({ tag, active }: { tag: string; active: boolean }) => {
      if (active) {
        await tagUser(nickname, tag)
      } else {
        await untagUser(nickname, tag)
      }
    },
    onSuccess: () => {
      // Invalidate both the ID and username lookups just in case
      queryClient.invalidateQueries({ queryKey: ["fetchAccount", user.id] })
      queryClient.invalidateQueries({ queryKey: ["lookupAccount", user.username] })
    }
  })

  const toggleActivationMutation = useMutation({
    mutationFn: async (currentlyActive: boolean) => {
      if (currentlyActive) {
        await deactivateUser(nickname)
      } else {
        await activateUser(nickname)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fetchAccount", user.id] })
      queryClient.invalidateQueries({ queryKey: ["lookupAccount", user.username] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteAdminUser(nickname)
    },
    onSuccess: () => {
      window.history.back()
    }
  })

  const handleToggleTag = (tag: string, checked: boolean) => {
    // Prevent default to keep dropdown open, handled automatically by CheckboxItem usually,
    // but we can just fire mutation
    toggleTagMutation.mutate({ tag, active: checked })
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to completely delete the account for @${nickname}? This action is irreversible.`)) {
      deleteMutation.mutate()
    }
  }

  // user.pleroma.is_active might not be explicitly populated, sometimes deactivated users have `is_active: false`
  // We'll default to true if it's undefined
  const isActive = user.pleroma?.is_active ?? true

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="icon">
          <ShieldAlert className="h-4 w-4" />
          <span className="sr-only">Moderation actions</span>
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => toggleActivationMutation.mutate(isActive)}
            disabled={toggleActivationMutation.isPending}
          >
            {isActive ? "Deactivate account" : "Activate account"}
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-500 focus:text-red-500"
            disabled={deleteMutation.isPending}
          >
            Delete account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>MRF Tags</DropdownMenuLabel>
          
          <DropdownMenuCheckboxItem
            checked={hasTag(MRF_TAGS.FORCE_NSFW)}
            onCheckedChange={(checked) => handleToggleTag(MRF_TAGS.FORCE_NSFW, checked)}
            disabled={toggleTagMutation.isPending}
          >
            Mark all posts as NSFW
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={hasTag(MRF_TAGS.STRIP_MEDIA)}
            onCheckedChange={(checked) => handleToggleTag(MRF_TAGS.STRIP_MEDIA, checked)}
            disabled={toggleTagMutation.isPending}
          >
            Remove media from posts
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={hasTag(MRF_TAGS.FORCE_UNLISTED)}
            onCheckedChange={(checked) => handleToggleTag(MRF_TAGS.FORCE_UNLISTED, checked)}
            disabled={toggleTagMutation.isPending}
          >
            Force posts to be unlisted
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={hasTag(MRF_TAGS.SANDBOX)}
            onCheckedChange={(checked) => handleToggleTag(MRF_TAGS.SANDBOX, checked)}
            disabled={toggleTagMutation.isPending}
          >
            Force posts to be followers-only
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
