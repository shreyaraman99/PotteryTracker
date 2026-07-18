import type { Category, PotteryItem, HistoryEntry, PotteryPhoto, TimeLog } from "./types"

const BASE = "/api"

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Init
export async function initDB() {
  return fetcher<{ ok: boolean }>("/init")
}

// Categories
export async function getCategories() {
  const rows = await fetcher<any[]>("/categories")
  return rows.map(mapCategory)
}

export async function createCategory(data: { name: string; order: number; colorHex?: string; sortOption?: string }) {
  const row = await fetcher<any>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return mapCategory(row)
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const body: Record<string, any> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.order !== undefined) body.order = data.order
  if (data.colorHex !== undefined) body.colorHex = data.colorHex
  if (data.sortOption !== undefined) body.sortOption = data.sortOption
  return fetcher<any>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export async function deleteCategory(id: string) {
  return fetcher<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" })
}

// Items
export async function getItems(categoryId?: string) {
  const query = categoryId ? `?categoryId=${categoryId}` : ""
  const rows = await fetcher<any[]>(`/items${query}`)
  return rows.map(mapItem)
}

export async function createItem(data: { name?: string; timestamp: number; lastEdited?: number; categoryId: string; notes?: string }) {
  const row = await fetcher<any>("/items", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return mapItem(row)
}

export async function updateItem(id: string, data: Partial<PotteryItem>) {
  const body: Record<string, any> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.lastEdited !== undefined) body.lastEdited = data.lastEdited
  if (data.categoryId !== undefined) body.categoryId = data.categoryId
  if (data.notes !== undefined) body.notes = data.notes
  return fetcher<any>(`/items/${id}`, { method: "PUT", body: JSON.stringify(body) })
}

export async function deleteItem(id: string) {
  return fetcher<{ ok: boolean }>(`/items/${id}`, { method: "DELETE" })
}

// History
export async function getHistory(itemId: string) {
  const rows = await fetcher<any[]>(`/history?itemId=${itemId}`)
  return rows.map(mapHistoryEntry)
}

export async function addHistoryEntry(data: { itemId: string; timestamp: number; message: string }) {
  return fetcher<any>("/history", { method: "POST", body: JSON.stringify(data) })
}

export async function deleteHistoryEntry(id: string) {
  return fetcher<{ ok: boolean }>(`/history/${id}`, { method: "DELETE" })
}

// Photos
export async function getPhotos(itemId: string) {
  const rows = await fetcher<any[]>(`/photos?itemId=${itemId}`)
  return rows.map(mapPhoto)
}

export async function addPhoto(data: { itemId: string; timestamp: number; imageData: string }) {
  return fetcher<any>("/photos", { method: "POST", body: JSON.stringify(data) })
}

export async function deletePhoto(id: string) {
  return fetcher<{ ok: boolean }>(`/photos/${id}`, { method: "DELETE" })
}

// Time Logs
export async function getTimeLogs(date?: string, month?: string) {
  let query = ""
  if (date) query = `?date=${date}`
  else if (month) query = `?month=${month}`
  const rows = await fetcher<any[]>(`/time-logs${query}`)
  return rows.map(mapTimeLog)
}

export async function addTimeLog(data: { date: string; duration: number }) {
  return fetcher<any>("/time-logs", { method: "POST", body: JSON.stringify(data) })
}

export async function deleteTimeLog(id: string) {
  return fetcher<{ ok: boolean }>(`/time-logs/${id}`, { method: "DELETE" })
}

// Mappers (snake_case DB → camelCase client)
function mapCategory(row: any): Category {
  return { id: row.id, name: row.name, order: row.order, colorHex: row.color_hex, sortOption: row.sort_option }
}

function mapItem(row: any): PotteryItem {
  return { id: row.id, name: row.name, timestamp: Number(row.timestamp), lastEdited: Number(row.last_edited), categoryId: row.category_id, notes: row.notes }
}

function mapHistoryEntry(row: any): HistoryEntry {
  return { id: row.id, itemId: row.item_id, timestamp: Number(row.timestamp), message: row.message }
}

function mapPhoto(row: any): PotteryPhoto {
  return { id: row.id, itemId: row.item_id, timestamp: Number(row.timestamp), imageData: row.image_data }
}

function mapTimeLog(row: any): TimeLog {
  return { id: row.id, date: row.date, duration: row.duration }
}

// Convenience
export async function getTotalTimeForDate(date: string) {
  const logs = await getTimeLogs(date)
  return logs.reduce((sum, l) => sum + l.duration, 0)
}

export async function getTimeLogsForMonth(year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`
  return getTimeLogs(undefined, prefix)
}
