"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, PotteryItem, SortOption } from "@/lib/types"
import { db, getCategories, getItemsByCategory } from "@/lib/db"
import ItemDetailView from "./ItemDetailView"
import CategoryEditView from "./CategoryEditView"
import { ChevronRight, PlusIcon, SortIcon, PencilIcon } from "./icons"

export default function BoardView() {
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
  const [sortDropdown, setSortDropdown] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    const cats = await getCategories()
    setCategories(cats)
    const map: Record<string, PotteryItem[]> = {}
    for (const cat of cats) {
      const items = await getItemsByCategory(cat.id!)
      map[cat.id!] = items
    }
    setItemsByCategory(map)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    const item: PotteryItem = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      lastEdited: Date.now(),
      categoryId: newItemCategory.id!,
      notes: "",
    }
    await db.items.add(item)
    await db.history.add({
      id: crypto.randomUUID(),
      itemId: item.id!,
      timestamp: Date.now(),
      message: "Created",
    })
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(newItemCategory.id!)
      return next
    })
    setShowNewItemPrompt(false)
    setNewItemCategory(null)
    loadData()
  }

  const moveItem = async (itemId: string, toCategoryId: string) => {
    const item = await db.items.get(itemId)
    if (!item || item.categoryId === toCategoryId) return
    const oldCat = categories.find((c) => c.id === item.categoryId)
    const newCat = categories.find((c) => c.id === toCategoryId)
    await db.items.update(itemId, { categoryId: toCategoryId, lastEdited: Date.now() })
    await db.history.add({
      id: crypto.randomUUID(),
      itemId,
      timestamp: Date.now(),
      message: `Moved from ${oldCat?.name ?? "Unknown"} to ${newCat?.name ?? "Unknown"}`,
    })
    loadData()
  }

  const handleMoveCategory = async (catId: string, newOrder: number) => {
    await db.categories.update(catId, { order: newOrder })
    loadData()
  }

  const moveCategoryUp = (cat: Category) => {
    if (cat.order === 0) return
    const above = categories.find((c) => c.order === cat.order - 1)
    if (!above) return
    handleMoveCategory(cat.id!, above.order)
    handleMoveCategory(above.id!, cat.order)
  }

  const moveCategoryDown = (cat: Category) => {
    if (cat.order === categories.length - 1) return
    const below = categories.find((c) => c.order === cat.order + 1)
    if (!below) return
    handleMoveCategory(cat.id!, below.order)
    handleMoveCategory(below.id!, cat.order)
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
                    <div className="relative">
                      <button
                        onClick={() => {
                          setSortDropdown((prev) => {
                            const next = new Set(prev)
                            if (next.has(cat.id!)) next.delete(cat.id!)
                            else next.add(cat.id!)
                            return next
                          })
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-700"
                      >
                        <SortIcon />
                      </button>
                      {sortDropdown.has(cat.id!) && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setSortDropdown(new Set())}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20">
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-36">
                              {(["recentlyEdited", "alphabetical"] as SortOption[]).map(
                                (opt) => (
                                  <button
                                    key={opt}
                                    onClick={async () => {
                                      await db.categories.update(cat.id!, {
                                        sortOption: opt,
                                      })
                                      setSortDropdown(new Set())
                                      loadData()
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-zinc-50"
                                  >
                                    <span>{opt === "alphabetical" ? "A-Z" : "Recent"}</span>
                                    {cat.sortOption === opt && (
                                      <span className="text-blue-600">✓</span>
                                    )}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddItem(cat)}
                      className="p-1.5 text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon />
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
