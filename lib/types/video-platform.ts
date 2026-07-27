export type ContentObjective =
  | "views"
  | "followers"
  | "engagement"
  | "sales"
  | "leads"
  | "branding"
  | "education"
  | "motivation"
  | "entertainment"
  | "institutional"

export type CreationMode = "free_prompt" | "guided" | "trends"

export type ProjectStatus =
  | "draft"
  | "scripting"
  | "storyboard"
  | "generating_scenes"
  | "rendering"
  | "ready"
  | "failed"

export type JobStatus = "pending" | "processing" | "completed" | "failed"
export type JobType =
  | "script"
  | "storyboard"
  | "scene_image"
  | "video"
  | "avatar_identity"
  | "render"
  | "narration"
  | "subtitles"
export type AIProvider = "openai" | "gemini" | "kling"
export type AvatarAssetType = "reference" | "variation" | "imported" | "generated"

export interface VirtualAvatar {
  id: string
  user_id: string
  name: string
  description?: string
  apparent_age?: number
  gender?: string
  nationality?: string
  language?: string
  voice_tone?: string
  personality?: string
  niche?: string
  visual_style?: string
  default_clothing?: string
  default_expressions?: string
  master_prompt?: string
  main_image_url?: string
  status?: string
  created_at?: string
  updated_at?: string
  avatar_assets?: AvatarAsset[]
}

export interface AvatarAsset {
  id: string
  avatar_id: string
  user_id: string
  asset_type: AvatarAssetType
  storage_path: string
  public_url?: string
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface ContentProject {
  id: string
  user_id: string
  avatar_id?: string
  title: string
  prompt?: string
  objective: ContentObjective
  target_platform: string
  duration_seconds: number
  creation_mode: CreationMode
  status: ProjectStatus
  thumbnail_url?: string
  final_video_url?: string
  config?: Record<string, unknown>
  error_message?: string
  created_at?: string
  updated_at?: string
  virtual_avatars?: VirtualAvatar
  project_scripts?: ProjectScript[]
  project_scenes?: ProjectScene[]
  generation_jobs?: GenerationJob[]
}

export interface ProjectScript {
  id: string
  project_id: string
  version: number
  hook?: string
  body?: string
  cta?: string
  full_script?: string
  structure?: Record<string, unknown>
  created_at?: string
}

export interface ProjectScene {
  id: string
  project_id: string
  scene_order: number
  title?: string
  description?: string
  visual_prompt?: string
  duration_seconds: number
  provider?: AIProvider
  image_url?: string
  video_url?: string
  status: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface GenerationJob {
  id: string
  user_id: string
  project_id?: string
  scene_id?: string
  avatar_id?: string
  provider: AIProvider
  job_type: JobType
  status: JobStatus
  external_job_id?: string
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  error_message?: string
  attempts?: number
  max_attempts?: number
  created_at?: string
  updated_at?: string
  completed_at?: string
}

export interface VideoGenerationInput {
  prompt: string
  imageUrl?: string
  durationSeconds?: number
  aspectRatio?: string
  avatarMasterPrompt?: string
  realisticHuman?: boolean
}

export interface GenerationJobResult {
  externalJobId?: string
  status: JobStatus
  outputUrl?: string
  outputData?: Record<string, unknown>
  errorMessage?: string
}
