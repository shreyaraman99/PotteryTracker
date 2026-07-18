export type SortOption = "alphabetical" | "recentlyEdited"

export interface Category {
  id?: string
  name: string
  order: number
  colorHex: string
  sortOption: SortOption
}

export interface PotteryItem {
  id?: string
  name: string
  timestamp: number
  lastEdited: number
  categoryId: string
  notes: string
}

export interface HistoryEntry {
  id?: string
  itemId: string
  timestamp: number
  message: string
}

export interface PotteryPhoto {
  id?: string
  itemId: string
  timestamp: number
  imageData: string
}

export interface TimeLog {
  id?: string
  date: string
  duration: number
}
