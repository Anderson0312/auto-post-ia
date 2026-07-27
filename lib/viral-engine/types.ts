import type { ContentObjective } from "@/lib/types/video-platform"

export interface ViralIdea {
  title: string
  hook: string
  angle: string
  format: string
  cta: string
  viralScore: number
  whyItWorks: string
}

export interface GuidedBrief {
  niche: string
  audience: string
  painPoint: string
  desiredOutcome: string
  tone: string
  suggestedPrompt: string
  suggestedTitle: string
  objective: ContentObjective
  platform: string
}

export interface TrendTopic {
  title: string
  format: string
  hook: string
  hashtags: string[]
  whyTrending: string
  difficulty: "easy" | "medium" | "hard"
}

export interface HookOptimization {
  originalHook: string
  improvedHook: string
  alternatives: string[]
  captionSuggestions: string[]
  tips: string[]
}
