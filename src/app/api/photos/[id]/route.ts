import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sql = db()
  const { id } = await params
  await sql`DELETE FROM photos WHERE id = ${id}`
  return Response.json({ ok: true })
}
