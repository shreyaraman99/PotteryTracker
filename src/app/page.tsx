"use client"

import { useCallback, useEffect, useState } from "react"
import { TabBar } from "@/components/TabBar"
import BoardView from "@/components/BoardView"
import StopwatchView from "@/components/StopwatchView"
import CalendarView from "@/components/CalendarView"
import { ensureDefaultCategories } from "@/lib/db"

type Tab = "board" | "stopwatch" | "calendar"

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("board")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureDefaultCategories().then(() => setReady(true))
  }, [])

  const renderTab = useCallback(() => {
    if (!ready) return <div className="flex-1 flex items-center justify-center text-zinc-400">Loading...</div>
    switch (activeTab) {
      case "board":
        return <BoardView />
      case "stopwatch":
        return <StopwatchView />
      case "calendar":
        return <CalendarView />
    }
  }, [activeTab, ready])

  return (
    <>
      <div className="flex-1 overflow-hidden">
        {renderTab()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}
