"use client"

import { Progress } from "@/components/ui/progress"
import type { GenerationJob } from "@/lib/types/video-platform"

export function JobProgress({ jobs }: { jobs: GenerationJob[] }) {
  if (!jobs?.length) return null

  const completed = jobs.filter((j) => j.status === "completed").length
  const total = jobs.length
  const percent = Math.round((completed / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progresso dos jobs</span>
        <span>{completed}/{total} ({percent}%)</span>
      </div>
      <Progress value={percent} />
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {jobs.slice(0, 10).map((job) => (
          <div key={job.id} className="flex justify-between text-xs text-muted-foreground">
            <span>{job.job_type} ({job.provider})</span>
            <span>{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
