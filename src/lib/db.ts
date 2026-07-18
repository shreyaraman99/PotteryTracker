import Dexie, { type Table } from "dexie"
import type { Category, PotteryItem, HistoryEntry, PotteryPhoto, TimeLog } from "./types"
import { defaultCategories } from "./defaults"

class PotteryDB extends Dexie {
  categories!: Table<Category, string>
  items!: Table<PotteryItem, string>
  history!: Table<HistoryEntry, string>
  photos!: Table<PotteryPhoto, string>
  timeLogs!: Table<TimeLog, string>

  constructor() {
    super("PotteryTracker")
    this.version(1).stores({
      categories: "id, order",
      items: "id, categoryId, lastEdited",
      history: "id, itemId, timestamp",
      photos: "id, itemId, timestamp",
      timeLogs: "id, date",
    })
  }
}

export const db = new PotteryDB()

export async function ensureDefaultCategories() {
  const count = await db.categories.count()
  if (count > 0) return
  await db.categories.bulkAdd(
    defaultCategories.map((c) => ({ id: crypto.randomUUID(), ...c }))
  )
}

export async function getCategories() {
  return db.categories.orderBy("order").toArray()
}

export async function getItemsByCategory(categoryId: string) {
  return db.items.where("categoryId").equals(categoryId).toArray()
}

export async function getAllItems() {
  return db.items.toArray()
}

export async function getHistoryForItem(itemId: string) {
  return db.history.where("itemId").equals(itemId).reverse().sortBy("timestamp")
}

export async function getPhotosForItem(itemId: string) {
  return db.photos.where("itemId").equals(itemId).reverse().sortBy("timestamp")
}

export async function getTimeLogsForDate(date: string) {
  return db.timeLogs.where("date").equals(date).toArray()
}

export async function getTimeLogsForMonth(year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`
  return db.timeLogs.filter((t) => t.date.startsWith(prefix)).toArray()
}

export async function getTotalTimeForDate(date: string) {
  const logs = await getTimeLogsForDate(date)
  return logs.reduce((sum, l) => sum + l.duration, 0)
}
