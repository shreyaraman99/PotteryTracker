"use client"

import { useEffect, useRef, useState } from "react"
import { addTimeLog } from "@/lib/api"

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatTime(t: number) {
  const minutes = Math.floor(t / 60)
  const seconds = Math.floor(t % 60)
  const centiseconds = Math.floor((t % 1) * 100)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`
}

export default function StopwatchView() {
  const [running, setRunning] = useState(false)
  const [displayTime, setDisplayTime] = useState(0)
  const [accumulated, setAccumulated] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("stopwatch_accumulated")
    if (stored) setAccumulated(parseFloat(stored))
    const lapsStored = localStorage.getItem("stopwatch_laps")
    if (lapsStored) setLaps(JSON.parse(lapsStored))
    const wasRunning = localStorage.getItem("stopwatch_running") === "true"
    if (wasRunning) {
      const savedStart = parseFloat(localStorage.getItem("stopwatch_start") || "0")
      startTimeRef.current = savedStart
      const elapsed = Date.now() - savedStart
      const savedAcc = parseFloat(localStorage.getItem("stopwatch_accumulated") || "0")
      setAccumulated(savedAcc)
      setDisplayTime(savedAcc + elapsed / 1000)
      setRunning(true)
    }
  }, [])

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now()
      localStorage.setItem("stopwatch_running", "true")
      localStorage.setItem("stopwatch_start", String(startTimeRef.current))
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDisplayTime(accumulated + elapsed)
      }, 10)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      localStorage.setItem("stopwatch_running", "false")
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, accumulated])

  const start = () => {
    setRunning(true)
  }

  const stop = async () => {
    setRunning(false)
    const now = Date.now()
    const sessionDuration = (now - startTimeRef.current) / 1000
    const newAccumulated = accumulated + sessionDuration
    setAccumulated(newAccumulated)
    setDisplayTime(newAccumulated)
    localStorage.setItem("stopwatch_accumulated", String(newAccumulated))

    const today = localDate()
    await addTimeLog({ date: today, duration: sessionDuration })
  }

  const reset = () => {
    setRunning(false)
    setDisplayTime(0)
    setAccumulated(0)
    setLaps([])
    localStorage.setItem("stopwatch_accumulated", "0")
    localStorage.setItem("stopwatch_laps", "[]")
    localStorage.setItem("stopwatch_running", "false")
  }

  const lap = () => {
    setLaps((prev) => {
      const next = [...prev, displayTime]
      localStorage.setItem("stopwatch_laps", JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex-[1] flex flex-col items-center justify-end pb-16">
        <div className="text-[5.5rem] font-thin tabular-nums tracking-tight leading-none mb-10" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTime(displayTime)}
        </div>

        <div className="flex items-center gap-16">
          <button
            onClick={running ? lap : reset}
            disabled={!running && displayTime === 0}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-sm transition-opacity ${
              !running && displayTime === 0 ? "opacity-40" : "opacity-100"
            }`}
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {running ? "Lap" : "Reset"}
          </button>

          <button
            onClick={running ? stop : start}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-sm ${
              running ? "text-red-500" : "text-green-500"
            }`}
            style={{ backgroundColor: running ? "rgba(255,0,0,0.2)" : "rgba(0,255,0,0.2)" }}
          >
            {running ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 mx-4" />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {[...laps].reverse().map((lapTime, i) => {
          const realIndex = laps.length - 1 - i
          const prevLap = realIndex > 0 ? laps[realIndex - 1] : 0
          const lapDuration = lapTime - prevLap
          return (
            <div
              key={realIndex}
              className="flex items-center justify-between py-2 border-b border-zinc-800"
            >
              <span className="text-zinc-300">Lap {realIndex + 1}</span>
              <span className="tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatTime(lapDuration)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
