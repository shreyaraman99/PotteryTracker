"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getTimeLogsForMonth, getTimeLogs, addTimeLog, deleteTimeLog } from "@/lib/api"

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function formatDuration(t: number) {
  t = Math.round(t / 60) * 60
  const hours = Math.floor(t / 3600)
  const minutes = Math.floor((t % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatHoursOnly(t: number) {
  t = Math.round(t / 60) * 60
  const hours = Math.floor(t / 3600)
  const minutes = Math.floor((t % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isToday(year: number, month: number, day: number) {
  const today = new Date()
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
}

function isFuture(year: number, month: number, day: number) {
  const date = new Date(year, month, day)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

export default function CalendarView({ isActive }: { isActive?: boolean }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [timeData, setTimeData] = useState<Record<string, number>>({})
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showTimeEntry, setShowTimeEntry] = useState(false)

  const loadMonthData = useCallback(async () => {
    const logs = await getTimeLogsForMonth(year, month)
    const map: Record<string, number> = {}
    for (const log of logs) {
      map[log.date] = (map[log.date] ?? 0) + log.duration
    }
    setTimeData(map)
  }, [year, month])

  useEffect(() => {
    loadMonthData()
  }, [loadMonthData])

  useEffect(() => {
    if (isActive) loadMonthData()
  }, [isActive])

  const monthlyTotal = useMemo(() => {
    return Object.values(timeData).reduce((s, v) => s + v, 0)
  }, [timeData])

  const sessionDays = useMemo(() => {
    return Object.keys(timeData).length
  }, [timeData])

  const avgPerSession = useMemo(() => {
    if (sessionDays === 0) return 0
    return monthlyTotal / sessionDays
  }, [monthlyTotal, sessionDays])

  const longestSession = useMemo(() => {
    const vals = Object.values(timeData)
    return vals.length > 0 ? Math.max(...vals) : 0
  }, [timeData])

  const longestStreak = useMemo(() => {
    const dates = Object.keys(timeData).sort()
    if (dates.length === 0) return 0
    let maxStreak = 1
    let current = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        current++
        maxStreak = Math.max(maxStreak, current)
      } else {
        current = 1
      }
    }
    return maxStreak
  }, [timeData])

  const busiestDay = useMemo(() => {
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]
    for (const [dateStr, total] of Object.entries(timeData)) {
      const day = new Date(dateStr + "T12:00:00").getDay()
      dayTotals[day] += total
    }
    const max = Math.max(...dayTotals)
    if (max === 0) return ""
    return FULL_DAYS[dayTotals.indexOf(max)]
  }, [timeData])

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 0) {
      newMonth = 11
      newYear--
    } else if (newMonth > 11) {
      newMonth = 0
      newYear++
    }
    setMonth(newMonth)
    setYear(newYear)
  }

  const days = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setShowTimeEntry(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-zinc-200 px-4 pt-8 pb-1">
        <div className="flex items-center justify-between mb-1 relative">
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-1.5 text-blue-600 font-bold text-sm">
              ←
            </button>
          </div>
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
          >
            <span className="text-base font-bold">{MONTHS[month]} {year}</span>
            <span className="text-zinc-500 text-xs">▼</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const today = new Date()
                setMonth(today.getMonth())
                setYear(today.getFullYear())
              }}
              className="text-xs text-blue-600 font-medium"
            >
              Today
            </button>
            <button onClick={() => changeMonth(1)} className="p-1.5 text-blue-600 font-bold text-sm">
              →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-zinc-200">
        <div className="flex">
          {WEEKDAYS.map((d) => (
            <div key={d} className="flex-1 text-center text-[10px] font-bold text-zinc-500 py-1.5">
              {d}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white min-h-0">
        <div className="grid grid-cols-7 auto-rows-[minmax(0,85px)]">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="" />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const total = timeData[dateStr] ?? 0
            const today = isToday(year, month, day)
            const future = isFuture(year, month, day)
            const cellIndex = firstDay + day - 1
            const col = cellIndex % 7
            const row = Math.floor(cellIndex / 7)

            return (
              <button
                key={day}
                onClick={() => !future && handleDayClick(day)}
                disabled={future}
                className={`border-b border-r border-zinc-100 flex flex-col items-start p-1 relative ${
                  future ? "opacity-30" : ""
                } ${total > 0 ? "bg-green-50" : ""} ${today ? "bg-blue-50" : ""} ${
                  col === 0 || (day === 1 && firstDay > 0) ? "border-l" : ""
                } ${row === 0 || (row === 1 && col < firstDay) ? "border-t" : ""}`}
              >
                <span
                  className={`text-xs font-bold ${
                    today ? "text-blue-600" : "text-zinc-800"
                  }`}
                >
                  {day}
                </span>
                {total > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-600 leading-tight pointer-events-none">
                    {formatDuration(total)}
                  </span>
                )}
              </button>
            )
          })}
          {Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 - firstDay - days }).map((_, i) => (
            <div key={`trailing-${i}`} className="" />
          ))}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center">
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Time</p>
              <p className="text-sm font-bold">{formatHoursOnly(monthlyTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Sessions</p>
              <p className="text-sm font-bold">{sessionDays} days</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Average Time</p>
              <p className="text-sm font-bold">{sessionDays > 0 ? formatDuration(avgPerSession) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Longest Day</p>
              <p className="text-sm font-bold">{longestSession > 0 ? formatDuration(longestSession) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Longest Streak</p>
              <p className="text-sm font-bold">{longestStreak > 0 ? `${longestStreak} days` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Busiest Day</p>
              <p className="text-sm font-bold">{busiestDay || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {showMonthPicker && (
        <MonthPicker
          year={year}
          month={month}
          onSelect={(y, m) => {
            setYear(y)
            setMonth(m)
            setShowMonthPicker(false)
          }}
          onClose={() => setShowMonthPicker(false)}
        />
      )}

      {showTimeEntry && selectedDate && (
        <ManualTimeEntry
          dateStr={selectedDate}
          existingTime={timeData[selectedDate] ?? 0}
          onClose={() => {
            setShowTimeEntry(false)
            setSelectedDate(null)
          }}
          onSaved={() => {
            setShowTimeEntry(false)
            setSelectedDate(null)
            loadMonthData()
          }}
        />
      )}
    </div>
  )
}

function MonthPicker({
  year,
  month,
  onSelect,
  onClose,
}: {
  year: number
  month: number
  onSelect: (year: number, month: number) => void
  onClose: () => void
}) {
  const [y, setY] = useState(year)
  const [m, setM] = useState(month)
  const years = Array.from({ length: 21 }, (_, i) => 2020 + i)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-t-2xl p-6 pb-12">
        <h2 className="text-lg font-bold text-center mb-4">Select Month</h2>
        <div className="flex gap-4 mb-6">
          <select
            value={m}
            onChange={(e) => setM(parseInt(e.target.value))}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
          >
            {MONTHS.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
          <select
            value={y}
            onChange={(e) => setY(parseInt(e.target.value))}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
          >
            {years.map((yearVal) => (
              <option key={yearVal} value={yearVal}>{yearVal}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(y, m)}
            className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold"
          >
            Go to Date
          </button>
        </div>
      </div>
    </div>
  )
}

function ManualTimeEntry({
  dateStr,
  existingTime,
  onClose,
  onSaved,
}: {
  dateStr: string
  existingTime: number
  onClose: () => void
  onSaved: () => void
}) {
  const [hours, setHours] = useState(Math.floor(existingTime / 3600))
  const [minutes, setMinutes] = useState(Math.floor((existingTime % 3600) / 60))

  useEffect(() => {
    setHours(Math.floor(existingTime / 3600))
    setMinutes(Math.floor((existingTime % 3600) / 60))
  }, [existingTime])

  const save = async () => {
    const existing = await getTimeLogs(dateStr)
    for (const log of existing) await deleteTimeLog(log.id!)
    const totalSeconds = hours * 3600 + minutes * 60
    if (totalSeconds > 0) {
      await addTimeLog({ date: dateStr, duration: totalSeconds })
    }
    onSaved()
  }

  const clearEntry = async () => {
    const existing = await getTimeLogs(dateStr)
    for (const log of existing) await deleteTimeLog(log.id!)
    onSaved()
  }

  const date = new Date(dateStr + "T12:00:00")
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-t-2xl p-6 pb-12">
        <h2 className="text-lg font-bold text-center mb-1">Log Time</h2>
        <p className="text-sm text-zinc-500 text-center mb-6">{formatted}</p>

        <div className="flex gap-4 mb-6">
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i} hr</option>
            ))}
          </select>
          <select
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value))}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{i} min</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <button
            onClick={save}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm"
          >
            Save Time
          </button>
          {existingTime > 0 && (
            <button
              onClick={clearEntry}
              className="w-full py-2.5 text-red-600 text-sm font-medium"
            >
              Clear Entry
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-zinc-600 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
