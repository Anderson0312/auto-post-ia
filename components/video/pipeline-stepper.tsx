"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

const allSteps = [
  { id: "draft", label: "Rascunho" },
  { id: "scripting", label: "Roteiro" },
  { id: "storyboard", label: "Storyboard" },
  { id: "generating_scenes", label: "Cenas" },
  { id: "rendering", label: "Vídeo" },
  { id: "ready", label: "Pronto" },
]

export function PipelineStepper({
  status,
  videoEnabled = true,
}: {
  status: string
  videoEnabled?: boolean
}) {
  const steps = videoEnabled
    ? allSteps
    : allSteps.filter((s) => s.id !== "rendering").map((s) =>
        s.id === "ready" ? { ...s, label: "Concluído" } : s,
      )

  const statusOrder = steps.map((s) => s.id)
  const normalizedStatus =
    !videoEnabled && (status === "rendering" || status === "ready") ? "ready" : status
  const currentIndex = statusOrder.indexOf(normalizedStatus)
  const isFailed = status === "failed"

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const done = currentIndex > index || normalizedStatus === "ready"
        const active = step.id === normalizedStatus
        const pending = currentIndex < index && !isFailed

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
              done && "border-green-200 bg-green-50 text-green-800",
              active && "border-blue-200 bg-blue-50 text-blue-800",
              pending && "border-gray-200 bg-gray-50 text-gray-500",
              isFailed && active && "border-red-200 bg-red-50 text-red-800",
            )}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : active ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {step.label}
          </div>
        )
      })}
    </div>
  )
}
