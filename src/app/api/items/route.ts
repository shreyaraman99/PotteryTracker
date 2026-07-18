import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const sql = db()
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  if (categoryId) {
    const rows = await sql`SELECT * FROM items WHERE category_id = ${categoryId} ORDER BY last_edited DESC`
    return Response.json(rows)
  }
  const rows = await sql`SELECT * FROM items ORDER BY last_edited DESC`
  return Response.json(rows)
}

export async function POST(req: Request) {
  const sql = db()
  const body = await req.json()
  const { name, timestamp, lastEdited, categoryId, notes } = body
  const result = (await sql`
    INSERT INTO items (name, timestamp, last_edited, category_id, notes)
    VALUES (${name ?? "New Piece"}, ${timestamp}, ${lastEdited ?? timestamp}, ${categoryId}, ${notes ?? ""})
    RETURNING *
  `) as any[]
  return Response.json(result[0], { status: 201 })
}
