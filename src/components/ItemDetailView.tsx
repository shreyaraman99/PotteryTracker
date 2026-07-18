"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Category, HistoryEntry, PotteryItem, PotteryPhoto } from "@/lib/types"
import { db } from "@/lib/db"
import { PencilIcon } from "./icons"

export default function ItemDetailView({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: PotteryItem
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(item.name)
  const [notes, setNotes] = useState(item.notes)
  const [categoryId, setCategoryId] = useState(item.categoryId)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [photos, setPhotos] = useState<PotteryPhoto[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<PotteryPhoto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const loadData = useCallback(async () => {
    const h = await db.history.where("itemId").equals(item.id!).reverse().sortBy("timestamp")
    setHistory(h)
    const p = await db.photos.where("itemId").equals(item.id!).reverse().sortBy("timestamp")
    setPhotos(p)
  }, [item.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const save = async () => {
    await db.items.update(item.id!, { name, notes, categoryId, lastEdited: Date.now() })
    if (categoryId !== item.categoryId) {
      const oldCat = categories.find((c) => c.id === item.categoryId)
      const newCat = categories.find((c) => c.id === categoryId)
      await db.history.add({
        id: crypto.randomUUID(),
        itemId: item.id!,
        timestamp: Date.now(),
        message: `Moved to ${newCat?.name ?? "Unknown"}`,
      })
    }
    onSaved()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      await db.photos.add({
        id: crypto.randomUUID(),
        itemId: item.id!,
        timestamp: Date.now(),
        imageData: dataUrl,
      })
      await db.items.update(item.id!, { lastEdited: Date.now() })
      loadData()
    }
    reader.readAsDataURL(file)
  }

  const deletePhoto = async (photo: PotteryPhoto) => {
    await db.photos.delete(photo.id!)
    await db.items.update(item.id!, { lastEdited: Date.now() })
    loadData()
  }

  const deleteItem = async () => {
    const itemPhotos = await db.photos.where("itemId").equals(item.id!).toArray()
    for (const p of itemPhotos) await db.photos.delete(p.id!)
    const itemHistory = await db.history.where("itemId").equals(item.id!).toArray()
    for (const h of itemHistory) await db.history.delete(h.id!)
    await db.items.delete(item.id!)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-bold">Edit Piece</h2>
        <button onClick={save} className="text-blue-600 font-semibold text-sm">
          Done
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Information</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Photos</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 text-xs"
              >
                <PlusIconSmall />
                <span className="mt-1">Add Photo</span>
              </button>
              {photos.map((photo) => (
                <div key={photo.id} className="shrink-0 relative">
                  <img
                    src={photo.imageData}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <button
                    onClick={() => deletePhoto(photo)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              rows={5}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">History</h3>
            <div className="space-y-1">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between py-1.5">
                  <div>
                    <p className="text-sm">{entry.message}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await db.history.delete(entry.id!)
                      loadData()
                    }}
                    className="text-zinc-400 hover:text-red-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            {deleteConfirm ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-red-600">Delete this piece?</p>
                <button
                  onClick={deleteItem}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full py-3 text-sm text-red-600 font-medium"
              >
                Delete Piece
              </button>
            )}
          </section>
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto.imageData}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}

function PlusIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
