import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const sql = db()
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 })
  const rows = await sql`
    SELECT * FROM photos WHERE item_id = ${itemId} ORDER BY timestamp DESC
  `
  return Response.json(rows)
}

export async function POST(req: Request) {
  const sql = db()
  const body = await req.json()
  const { itemId, timestamp, imageData } = body
  const result = (await sql`
    INSERT INTO photos (item_id, timestamp, image_data)
    VALUES (${itemId}, ${timestamp}, ${imageData})
    RETURNING *
  `) as any[]
  return Response.json(result[0], { status: 201 })
}
