"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { GROWTH_OBJECTIVES } from "@/lib/growth/objectives"

export function ObjectiveSwitcher() {
  const [objective, setObjective] = useState("engagement")

  useEffect(() => {
    apiClient
      .getGrowthObjective()
      .then((r) => setObjective(r.objective || "engagement"))
      .catch(() => setObjective("engagement"))
  }, [])

  return (
    <label className="flex items-center gap-2 text-xs text-zinc-400">
      Objetivo
      <select
        id="growth-objective"
        value={objective}
        onChange={async (e) => {
          const value = e.target.value
          setObjective(value)
          try {
            await apiClient.setGrowthObjective(value)
          } catch {
            /* ignore */
          }
        }}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
      >
        {GROWTH_OBJECTIVES.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
