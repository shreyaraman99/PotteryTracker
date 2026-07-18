"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, PotteryItem, SortOption } from "@/lib/types"
import { getCategories, getItems, createItem, updateItem, updateCategory, deleteCategory, addHistoryEntry } from "@/lib/api"
import ItemDetailView from "./ItemDetailView"
import CategoryEditView from "./CategoryEditView"
import { ChevronRight, PlusIcon, SortArrows, PencilIcon } from "./icons"

export default function BoardView({ isActive }: { isActive?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, PotteryItem[]>>({})
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [savedCollapsed, setSavedCollapsed] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<PotteryItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newItemCategory, setNewItemCategory] = useState<Category | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [showNewItemPrompt, setShowNewItemPrompt] = useState(false)

  const loadData = useCallback(async () => {
    const cats = await getCategories()
    setCategories(cats)
    const map: Record<string, PotteryItem[]> = {}
    for (const cat of cats) {
      const items = await getItems(cat.id)
      map[cat.id!] = items
    }
    setItemsByCategory(map)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (isActive) loadData()
  }, [isActive])

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEditModeToggle = () => {
    if (!editMode) {
      setSavedCollapsed(new Set(collapsed))
      setCollapsed(new Set(categories.map((c) => c.id!)))
    } else {
      setCollapsed(savedCollapsed)
    }
    setEditMode(!editMode)
  }

  const handleAddItem = (category: Category) => {
    setNewItemCategory(category)
    setNewItemName("")
    setShowNewItemPrompt(true)
  }

  const createNewItem = async () => {
    if (!newItemCategory) return
    const name = newItemName.trim() || "New Piece"
    const now = Date.now()
    const item = await createItem({
      name,
      timestamp: now,
      lastEdited: now,
      categoryId: newItemCategory.id!,
    })
    await addHistoryEntry({ itemId: item.id!, timestamp: now, message: "Created" })
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(newItemCategory.id!)
      return next
    })
    setShowNewItemPrompt(false)
    setNewItemCategory(null)
    loadData()
  }

  const moveCategoryUp = (cat: Category) => {
    if (cat.order === 0) return
    const above = categories.find((c) => c.order === cat.order - 1)
    if (!above) return
    updateCategory(cat.id!, { order: above.order })
    updateCategory(above.id!, { order: cat.order })
    loadData()
  }

  const moveCategoryDown = (cat: Category) => {
    if (cat.order === categories.length - 1) return
    const below = categories.find((c) => c.order === cat.order + 1)
    if (!below) return
    updateCategory(cat.id!, { order: below.order })
    updateCategory(below.id!, { order: cat.order })
    loadData()
  }

  const filteredItems = useMemo(() => {
    if (!search) return itemsByCategory
    const result: Record<string, PotteryItem[]> = {}
    for (const [catId, items] of Object.entries(itemsByCategory)) {
      const match = items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
      if (match.length > 0) result[catId] = match
    }
    return result
  }, [search, itemsByCategory])

  return (
    <div className="flex flex-col h-full bg-zinc-100">
      <header className="border-b border-zinc-300 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-zinc-900">Pottery Board</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleEditModeToggle}
              className={`p-2 rounded-full transition-colors ${
                editMode ? "text-orange-500" : "text-blue-600"
              }`}
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => setShowNewCategory(true)}
              className="p-2 rounded-full text-blue-600"
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search pieces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        {categories.map((cat) => {
          const items = filteredItems[cat.id!] ?? []
          const isCollapsed = collapsed.has(cat.id!)

          const sortedItems = [...items].sort((a, b) => {
            if (cat.sortOption === "alphabetical") {
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            }
            return b.lastEdited - a.lastEdited
          })

          return (
            <div key={cat.id} className="mx-3 mt-3 rounded-xl overflow-hidden shadow-sm border border-zinc-200 bg-white">
              <div
                className="flex items-center gap-3 px-4 py-4"
                style={{ backgroundColor: cat.colorHex + "18", borderLeft: `4px solid ${cat.colorHex}` }}
              >
                {editMode ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveCategoryUp(cat)}
                      className="p-1.5 text-zinc-600 disabled:opacity-30 text-xs"
                      disabled={cat.order === 0}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveCategoryDown(cat)}
                      className="p-1.5 text-zinc-600 disabled:opacity-30 text-xs"
                      disabled={cat.order === categories.length - 1}
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleCollapse(cat.id!)}
                    className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  >
                    <ChevronRight />
                  </button>
                )}
                <button
                  onClick={() => !editMode && toggleCollapse(cat.id!)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="font-bold text-sm">{cat.name}</span>
                  <span className="text-xs text-zinc-500 font-medium">({items.length})</span>
                </button>
                {editMode ? (
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="p-1.5 text-zinc-500 hover:text-orange-500"
                  >
                    <PencilIcon />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAddItem(cat)}
                      className="p-1.5 text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon />
                    </button>
                    <button
                      onClick={async () => {
                        const next = cat.sortOption === "alphabetical" ? "recentlyEdited" : "alphabetical"
                        await updateCategory(cat.id!, { sortOption: next })
                        loadData()
                      }}
                      className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-700 text-xs"
                      title={`Sort: ${cat.sortOption === "alphabetical" ? "A-Z" : "Recent"}`}
                    >
                      <SortArrows />
                    </button>
                  </>
                )}
              </div>
              {!isCollapsed && (
                <div className="px-3 py-3 space-y-2">
                  {sortedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="flex items-center justify-between w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-left active:bg-zinc-100 hover:border-zinc-300 transition-colors"
                    >
                      <span className="text-sm font-semibold text-zinc-800">{item.name}</span>
                      <ChevronRight />
                    </button>
                  ))}
                  {sortedItems.length === 0 && (
                    <p className="text-xs text-zinc-400 text-center py-3 italic">No pieces yet</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showNewItemPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-3">New Piece</h2>
            <p className="text-sm text-zinc-500 mb-4">Enter a name for your new piece.</p>
            <input
              autoFocus
              type="text"
              placeholder="Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewItem()}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewItemPrompt(false)}
                className="px-4 py-2 text-sm text-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={createNewItem}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCategory && (
        <CategoryEditView
          onClose={() => setShowNewCategory(false)}
          onSaved={() => {
            setShowNewCategory(false)
            loadData()
          }}
        />
      )}

      {editingCategory && (
        <CategoryEditView
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null)
            loadData()
          }}
        />
      )}

      {selectedItem && (
        <ItemDetailView
          item={selectedItem}
          categories={categories}
          onClose={() => setSelectedItem(null)}
          onSaved={() => {
            setSelectedItem(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
