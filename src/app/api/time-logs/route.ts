import db from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const sql = db()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const month = searchParams.get("month")
  if (date) {
    const rows = await sql`SELECT * FROM time_logs WHERE date = ${date}`
    return Response.json(rows)
  }
  if (month) {
    const rows = await sql`SELECT * FROM time_logs WHERE date LIKE ${month + "%"}`
    return Response.json(rows)
  }
  const rows = await sql`SELECT * FROM time_logs ORDER BY date DESC`
  return Response.json(rows)
}

export async function POST(req: Request) {
  const sql = db()
  const body = await req.json()
  const { date, duration } = body
  const result = (await sql`
    INSERT INTO time_logs (date, duration) VALUES (${date}, ${duration}) RETURNING *
  `) as any[]
  return Response.json(result[0], { status: 201 })
}
