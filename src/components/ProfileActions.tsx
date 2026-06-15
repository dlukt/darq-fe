import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { fetchRelationship, muteUser, unmuteUser, followUser, unfollowUser } from '@/api/endpoints'
import { ModerationMenu } from '@/components/ModerationMenu'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, VolumeX, Volume2, AtSign } from 'lucide-react'
import { Link } from 'react-router'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/store/auth'

export function ProfileActions({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const authUser = useAuthStore(state => state.user)
  
  const { data: relationship } = useQuery({
    queryKey: ['relationship', user.id],
    queryFn: () => fetchRelationship(user.id),
    enabled: !!authUser && authUser.id !== user.id
  })

  const followMutation = useMutation({
    mutationFn: () => relationship?.following ? unfollowUser(user.id) : followUser(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['relationship', user.id] })
  })

  const muteMutation = useMutation({
    mutationFn: () => relationship?.muting ? unmuteUser(user.id) : muteUser(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['relationship', user.id] })
  })

  if (!authUser || authUser.id === user.id) return null

  const isAdminOrMod = authUser.pleroma?.is_admin || authUser.pleroma?.is_moderator

  return (
    <div className="flex flex-wrap gap-2 items-center mt-4 sm:mt-0">
      <Button 
        variant={relationship?.following ? "outline" : "default"} 
        onClick={() => followMutation.mutate()}
        disabled={followMutation.isPending || !relationship}
        size="sm"
      >
        {relationship?.following ? <><UserMinus className="w-4 h-4 mr-2"/> Unfollow</> : <><UserPlus className="w-4 h-4 mr-2"/> Follow</>}
      </Button>
      <Button 
        variant={relationship?.muting ? "destructive" : "outline"} 
        onClick={() => muteMutation.mutate()}
        disabled={muteMutation.isPending || !relationship}
        size="sm"
      >
        {relationship?.muting ? <><Volume2 className="w-4 h-4 mr-2"/> Unmute</> : <><VolumeX className="w-4 h-4 mr-2"/> Mute</>}
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/?compose=true&mention=${user.acct}`}>
          <AtSign className="w-4 h-4 mr-2" /> Mention
        </Link>
      </Button>
      {isAdminOrMod && <ModerationMenu user={user} />}
    </div>
  )
}
