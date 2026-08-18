import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { fetchLists, createList, deleteList, type List } from "@/api/endpoints"
import { useDocumentTitle } from "@/hooks/useDocumentTitle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash, Loader2 } from "lucide-react"

export function ListsPage() {
  useDocumentTitle("Lists")

  const queryClient = useQueryClient()
  const [newListName, setNewListName] = useState("")
  const [exclusive, setExclusive] = useState(false)

  const {
    data: lists,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lists"],
    queryFn: fetchLists,
  })

  const createMutation = useMutation({
    mutationFn: ({ title, exclusive }: { title: string; exclusive: boolean }) =>
      createList(title, exclusive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      setNewListName("")
      setExclusive(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
    },
  })

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault()
    if (newListName.trim()) {
      createMutation.mutate({ title: newListName.trim(), exclusive })
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Your Lists</h1>

      <form
        onSubmit={handleCreateList}
        className="mb-8 flex flex-col gap-3 rounded-lg border bg-card p-4"
      >
        <h2 className="text-lg font-semibold">Create New List</h2>
        <div className="flex gap-2">
          <Input
            placeholder="New list name..."
            aria-label="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            disabled={createMutation.isPending}
            className="max-w-xs"
          />
          <Button
            type="submit"
            disabled={!newListName.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <Checkbox
            id="exclusive"
            checked={exclusive}
            onCheckedChange={(c) => setExclusive(c === true)}
            disabled={createMutation.isPending}
          />
          <label
            htmlFor="exclusive"
            className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remove users on list from home timeline
          </label>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center p-8 text-muted-foreground">
          Loading lists...
        </div>
      )}

      {isError && (
        <div className="mb-4 rounded-md bg-red-100 p-4 text-red-600 dark:bg-red-900/30">
          Failed to load lists.
        </div>
      )}

      {!isLoading && lists?.length === 0 && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          You don't have any lists yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {lists?.map((list: List) => (
          <div
            key={list.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <Link
              to={`/lists/${list.id}`}
              className="text-lg font-medium hover:underline"
            >
              {list.title}
            </Link>
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    title="Delete List"
                    aria-label="Delete list"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete List</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the list "{list.title}"?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <DialogClose
                    render={<Button variant="outline">Cancel</Button>}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(list.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  )
}
