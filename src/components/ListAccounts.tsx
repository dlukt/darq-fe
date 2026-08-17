import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchListAccounts, searchAccounts, addAccountsToList, removeAccountsFromList } from "@/api/endpoints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, UserMinus, Settings, Loader2 } from "lucide-react"

interface ListAccountsProps {
  listId: string
}

export function ListAccounts({ listId }: ListAccountsProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [followingOnly, setFollowingOnly] = useState(false)
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null)

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["listAccounts", listId],
    queryFn: () => fetchListAccounts(listId),
  })

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["searchAccounts", searchQuery, followingOnly],
    queryFn: () => searchAccounts(searchQuery, followingOnly),
    enabled: searchQuery.length > 2,
  })

  const addMutation = useMutation({
    mutationFn: (accountId: string) => addAccountsToList(listId, [accountId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAccounts", listId] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (accountId: string) => removeAccountsFromList(listId, [accountId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listAccounts", listId] })
      setAccountToRemove(null)
    },
  })

  const isAccountInList = (accountId: string) => {
    return accounts?.some((a) => a.id === accountId)
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Settings className="h-4 w-4" />
        Manage Accounts
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage List Accounts</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Search and Add */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Add new accounts</h4>
            <Input
              placeholder="Search for accounts..."
              aria-label="Search for accounts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Checkbox id="following-only" checked={followingOnly} onCheckedChange={(c) => setFollowingOnly(c === true)} />
              <label htmlFor="following-only" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground">
                Limit to Following
              </label>
            </div>
            {searchLoading && <div className="text-center text-sm text-muted-foreground">Searching...</div>}
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2 border rounded-md p-2 max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.acct}</p>
                      </div>
                    </div>
                    <Button
                      variant={isAccountInList(user.id) ? "secondary" : "default"}
                      size="sm"
                      disabled={isAccountInList(user.id) || addMutation.isPending}
                      onClick={() => addMutation.mutate(user.id)}
                      aria-label={isAccountInList(user.id) ? `Already added ${user.display_name || user.username}` : `Add ${user.display_name || user.username} to list`}
                      title={isAccountInList(user.id) ? "Already added" : "Add to list"}
                    >
                      {addMutation.isPending && addMutation.variables === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isAccountInList(user.id) ? (
                        "Added"
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {searchResults && searchResults.length === 0 && searchQuery.length > 2 && !searchLoading && (
              <div className="text-center text-sm text-muted-foreground">No accounts found.</div>
            )}
          </div>

          {/* Current Accounts */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Current accounts ({accounts?.length || 0})</h4>
            {accountsLoading ? (
              <div className="text-center text-sm text-muted-foreground">Loading accounts...</div>
            ) : (
              <div className="space-y-2">
                {accounts?.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4 border rounded-md">
                    No accounts in this list yet.
                  </div>
                )}
                {accounts?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-md bg-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.acct}</p>
                      </div>
                    </div>
                    {accountToRemove === user.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAccountToRemove(null)}
                          disabled={removeMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMutation.mutate(user.id)}
                          disabled={removeMutation.isPending}
                        >
                          {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Confirm"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="destructive"
                        size="icon"
                        disabled={removeMutation.isPending}
                        onClick={() => setAccountToRemove(user.id)}
                        title="Remove from list"
                        aria-label="Remove from list"
                      >
                        {removeMutation.isPending && removeMutation.variables === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
