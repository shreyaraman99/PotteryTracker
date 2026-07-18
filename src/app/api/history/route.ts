import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const sql = db()
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 })
  const rows = await sql`
    SELECT * FROM history_entries WHERE item_id = ${itemId} ORDER BY timestamp DESC
  `
  return Response.json(rows)
}

export async function POST(req: Request) {
  const sql = db()
  const body = await req.json()
  const { itemId, timestamp, message } = body
  const result = (await sql`
    INSERT INTO history_entries (item_id, timestamp, message)
    VALUES (${itemId}, ${timestamp}, ${message})
    RETURNING *
  `) as any[]
  return Response.json(result[0], { status: 201 })
}
