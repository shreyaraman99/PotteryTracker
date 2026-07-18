"use client"

import { BoardIcon, StopwatchIcon, CalendarIcon } from "./icons"

type Tab = "board" | "stopwatch" | "calendar"

export function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1">
        {(
          [
            { id: "board" as const, label: "Board", Icon: BoardIcon },
            { id: "stopwatch" as const, label: "Stopwatch", Icon: StopwatchIcon },
            { id: "calendar" as const, label: "Calendar", Icon: CalendarIcon },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
              activeTab === id
                ? "text-blue-600"
                : "text-zinc-500"
            }`}
          >
            <Icon active={activeTab === id} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
