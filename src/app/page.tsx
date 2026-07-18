"use client"

import { useEffect, useState } from "react"
import { TabBar } from "@/components/TabBar"
import BoardView from "@/components/BoardView"
import StopwatchView from "@/components/StopwatchView"
import CalendarView from "@/components/CalendarView"
import { initDB } from "@/lib/api"

type Tab = "board" | "stopwatch" | "calendar"

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("board")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initDB().then(() => setReady(true)).catch(() => setReady(true))
  }, [])

  if (!ready) return <div className="h-dvh flex items-center justify-center text-zinc-400">Loading...</div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 ${activeTab === "board" ? "" : "hidden"}`}>
          <BoardView isActive={activeTab === "board"} />
        </div>
        <div className={`absolute inset-0 ${activeTab === "stopwatch" ? "" : "hidden"}`}>
          <StopwatchView />
        </div>
        <div className={`absolute inset-0 ${activeTab === "calendar" ? "" : "hidden"}`}>
          <CalendarView isActive={activeTab === "calendar"} />
        </div>
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
