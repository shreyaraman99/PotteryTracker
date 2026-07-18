import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET() {
  const sql = db()
  const rows = await sql`SELECT * FROM categories ORDER BY "order" ASC`
  return Response.json(rows)
}

export async function POST(req: Request) {
  const sql = db()
  const body = await req.json()
  const { name, order, colorHex, sortOption } = body
  const result = (await sql`
    INSERT INTO categories (name, "order", color_hex, sort_option)
    VALUES (${name}, ${order}, ${colorHex ?? "#007AFF"}, ${sortOption ?? "recentlyEdited"})
    RETURNING *
  `) as any[]
  return Response.json(result[0], { status: 201 })
}
