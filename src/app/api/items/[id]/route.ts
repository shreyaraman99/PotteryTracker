import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sql = db()
  const { id } = await params
  const body = await req.json()
  const fields: string[] = []
  const vals: any[] = []
  if (body.name !== undefined) { fields.push(`name = $${vals.length + 1}`); vals.push(body.name) }
  if (body.lastEdited !== undefined) { fields.push(`last_edited = $${vals.length + 1}`); vals.push(body.lastEdited) }
  if (body.categoryId !== undefined) { fields.push(`category_id = $${vals.length + 1}`); vals.push(body.categoryId) }
  if (body.notes !== undefined) { fields.push(`notes = $${vals.length + 1}`); vals.push(body.notes) }
  if (fields.length === 0) return Response.json({ error: "no fields" }, { status: 400 })
  vals.push(id)
  const result = (await sql.query(
    `UPDATE items SET ${fields.join(", ")} WHERE id = $${vals.length} RETURNING *`,
    vals
  )) as any[]
  return Response.json(result[0])
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sql = db()
  const { id } = await params
  await sql`DELETE FROM items WHERE id = ${id}`
  return Response.json({ ok: true })
}
