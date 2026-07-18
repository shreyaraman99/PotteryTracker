import { initDB } from "@/lib/db-server"

export const runtime = "nodejs"

export async function GET() {
  try {
    await initDB()
    return Response.json({ ok: true })
  } catch (err) {
    console.error("init error", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
