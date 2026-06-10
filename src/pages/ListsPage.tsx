import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { fetchLists, createList, deleteList, type List } from "@/api/endpoints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash, Loader2 } from "lucide-react"

export function ListsPage() {
  const queryClient = useQueryClient()
  const [newListName, setNewListName] = useState("")

  const { data: lists, isLoading, isError } = useQuery({
    queryKey: ["lists"],
    queryFn: fetchLists,
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => createList(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      setNewListName("")
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
      createMutation.mutate(newListName.trim())
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">Your Lists</h1>

      <form onSubmit={handleCreateList} className="flex gap-2 mb-8">
        <Input
          placeholder="New list name..."
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          disabled={createMutation.isPending}
          className="max-w-xs"
        />
        <Button type="submit" disabled={!newListName.trim() || createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center p-8 text-muted-foreground">
          Loading lists...
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-md mb-4">
          Failed to load lists.
        </div>
      )}

      {!isLoading && lists?.length === 0 && (
        <div className="text-center p-8 text-muted-foreground border rounded-md">
          You don't have any lists yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {lists?.map((list: List) => (
          <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <Link to={`/lists/${list.id}`} className="font-medium hover:underline text-lg">
              {list.title}
            </Link>
            <Button
              variant="destructive"
              size="icon"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm(`Are you sure you want to delete the list "${list.title}"?`)) {
                  deleteMutation.mutate(list.id)
                }
              }}
              title="Delete List"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
