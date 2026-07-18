import type { Category } from "./types"

export const defaultCategories: Omit<Category, "id">[] = [
  { name: "Cubby (to be bisqued)", order: 0, colorHex: "#FF9500", sortOption: "recentlyEdited" },
  { name: "Bisque Shelf", order: 1, colorHex: "#FFCC00", sortOption: "recentlyEdited" },
  { name: "Cubby (to be glazed)", order: 2, colorHex: "#5AC8FA", sortOption: "recentlyEdited" },
  { name: "Glaze Shelf", order: 3, colorHex: "#007AFF", sortOption: "recentlyEdited" },
  { name: "Home", order: 4, colorHex: "#4CD964", sortOption: "recentlyEdited" },
  { name: "Graveyard", order: 5, colorHex: "#8E8E93", sortOption: "recentlyEdited" },
  { name: "Lost and Found", order: 6, colorHex: "#FF3B30", sortOption: "recentlyEdited" },
]
