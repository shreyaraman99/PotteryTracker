"use client"

import { useEffect, useState } from "react"
import type { Category } from "@/lib/types"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api"

const presetColors = [
  { name: "Blue", hex: "#007AFF" },
  { name: "Green", hex: "#4CD964" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Red", hex: "#FF3B30" },
  { name: "Teal", hex: "#5AC8FA" },
  { name: "Purple", hex: "#AF52DE" },
  { name: "Pink", hex: "#FF2D55" },
  { name: "Gray", hex: "#8E8E93" },
]

export default function CategoryEditView({
  category,
  onClose,
  onSaved,
}: {
  category?: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !category
  const [name, setName] = useState(category?.name ?? "")
  const [colorHex, setColorHex] = useState(category?.colorHex ?? "#007AFF")

  const save = async () => {
    if (!name.trim()) return
    if (isNew) {
      const all = await getCategories()
      await createCategory({ name: name.trim(), order: all.length, colorHex })
    } else {
      await updateCategory(category!.id!, { name: name.trim(), colorHex })
    }
    onSaved()
  }

  const deleteCat = async () => {
    if (!category?.id) return
    await deleteCategory(category.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <button onClick={onClose} className="text-sm text-zinc-600">
          Cancel
        </button>
        <h2 className="text-lg font-bold">{isNew ? "New Category" : "Edit Category"}</h2>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="text-sm text-blue-600 font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </header>

      <div className="p-4 space-y-6">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name"
            autoFocus
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">
            Header Color
          </label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map(({ name: cName, hex }) => (
              <button
                key={hex}
                onClick={() => setColorHex(hex)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  colorHex === hex ? "scale-125 ring-2 ring-offset-2 ring-blue-500" : ""
                }`}
                style={{ backgroundColor: hex }}
                title={cName}
              />
            ))}
          </div>
        </div>

        {!isNew && (
          <button
            onClick={deleteCat}
            className="w-full py-3 text-sm text-red-600 font-medium"
          >
            Delete Category
          </button>
        )}
      </div>
    </div>
  )
}
