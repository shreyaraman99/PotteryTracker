import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL environment variable is not set")
    sql = neon(url)
  }
  return sql
}

export async function initDB() {
  const s = getSql()
  await s`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      color_hex TEXT NOT NULL DEFAULT '#007AFF',
      sort_option TEXT NOT NULL DEFAULT 'recentlyEdited'
    );
  `
  await s`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT 'New Piece',
      timestamp BIGINT NOT NULL,
      last_edited BIGINT NOT NULL,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      notes TEXT NOT NULL DEFAULT ''
    );
  `
  await s`
    CREATE TABLE IF NOT EXISTS history_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      timestamp BIGINT NOT NULL,
      message TEXT NOT NULL
    );
  `
  await s`
    CREATE TABLE IF NOT EXISTS photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      timestamp BIGINT NOT NULL,
      image_data TEXT NOT NULL
    );
  `
  await s`
    CREATE TABLE IF NOT EXISTS time_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date TEXT NOT NULL,
      duration REAL NOT NULL
    );
  `
  await s`CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);`
  await s`CREATE INDEX IF NOT EXISTS idx_items_last_edited ON items(last_edited);`
  await s`CREATE INDEX IF NOT EXISTS idx_history_item_id ON history_entries(item_id);`
  await s`CREATE INDEX IF NOT EXISTS idx_photos_item_id ON photos(item_id);`
  await s`CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);`

  const count = (await s`SELECT COUNT(*)::int as count FROM categories;`) as any[]
  if (count[0].count === 0) {
    await s`
      INSERT INTO categories (name, "order", color_hex, sort_option) VALUES
        ('Cubby (to be bisqued)', 0, '#FF9500', 'recentlyEdited'),
        ('Bisque Shelf', 1, '#FFCC00', 'recentlyEdited'),
        ('Cubby (to be glazed)', 2, '#5AC8FA', 'recentlyEdited'),
        ('Glaze Shelf', 3, '#007AFF', 'recentlyEdited'),
        ('Home', 4, '#4CD964', 'recentlyEdited'),
        ('Graveyard', 5, '#8E8E93', 'recentlyEdited'),
        ('Lost and Found', 6, '#FF3B30', 'recentlyEdited');
    `
  }
}

export default function db() {
  return getSql()
}
