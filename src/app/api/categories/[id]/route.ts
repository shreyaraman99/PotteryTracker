import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sql = db()
  const { id } = await params
  const body = await req.json()
  const fields: string[] = []
  const vals: any[] = []
  if (body.name !== undefined) { fields.push(`name = $${vals.length + 1}`); vals.push(body.name) }
  if (body.order !== undefined) { fields.push(`"order" = $${vals.length + 1}`); vals.push(body.order) }
  if (body.colorHex !== undefined) { fields.push(`color_hex = $${vals.length + 1}`); vals.push(body.colorHex) }
  if (body.sortOption !== undefined) { fields.push(`sort_option = $${vals.length + 1}`); vals.push(body.sortOption) }
  if (fields.length === 0) return Response.json({ error: "no fields" }, { status: 400 })
  vals.push(id)
  const result = (await sql.query(
    `UPDATE categories SET ${fields.join(", ")} WHERE id = $${vals.length} RETURNING *`,
    vals
  )) as any[]
  return Response.json(result[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sql = db()
  const { id } = await params
  await sql`DELETE FROM categories WHERE id = ${id}`
  return Response.json({ ok: true })
}
