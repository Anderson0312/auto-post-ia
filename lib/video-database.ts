import { supabaseAdmin } from "@/lib/database"
import type {
  AIProvider,
  AvatarAssetType,
  ContentObjective,
  CreationMode,
  JobStatus,
  JobType,
  ProjectStatus,
} from "@/lib/types/video-platform"

export class VideoDatabaseService {
  // Avatars
  static async createAvatar(userId: string, data: Record<string, unknown>) {
    const { data: avatar, error } = await supabaseAdmin
      .from("virtual_avatars")
      .insert([{ user_id: userId, ...data }])
      .select()
      .single()
    if (error) throw error
    return avatar
  }

  static async getAvatars(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("virtual_avatars")
      .select("*, avatar_assets(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
  }

  static async getAvatarById(userId: string, avatarId: string) {
    const { data, error } = await supabaseAdmin
      .from("virtual_avatars")
      .select("*, avatar_assets(*)")
      .eq("id", avatarId)
      .eq("user_id", userId)
      .single()
    if (error) throw error
    return data
  }

  static async updateAvatar(userId: string, avatarId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("virtual_avatars")
      .update(updates)
      .eq("id", avatarId)
      .eq("user_id", userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async createAvatarAsset(data: {
    avatar_id: string
    user_id: string
    asset_type: AvatarAssetType
    storage_path: string
    public_url?: string
    metadata?: Record<string, unknown>
  }) {
    const { data: asset, error } = await supabaseAdmin.from("avatar_assets").insert([data]).select().single()
    if (error) throw error
    return asset
  }

  // Projects
  static async createProject(
    userId: string,
    data: {
      title: string
      prompt?: string
      avatar_id?: string
      objective?: ContentObjective
      target_platform?: string
      duration_seconds?: number
      creation_mode?: CreationMode
      config?: Record<string, unknown>
    },
  ) {
    const { data: project, error } = await supabaseAdmin
      .from("content_projects")
      .insert([{ user_id: userId, ...data }])
      .select()
      .single()
    if (error) throw error
    return project
  }

  static async getProjects(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("content_projects")
      .select("*, virtual_avatars(id, name, main_image_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
  }

  static async getProjectById(userId: string, projectId: string) {
    const { data, error } = await supabaseAdmin
      .from("content_projects")
      .select(`
        *,
        virtual_avatars(*, avatar_assets(*)),
        project_scripts(*),
        project_scenes(*),
        generation_jobs(*)
      `)
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Projeto não encontrado")
    if (data?.project_scenes) {
      data.project_scenes.sort((a: { scene_order: number }, b: { scene_order: number }) => a.scene_order - b.scene_order)
    }
    return data
  }

  static async updateProject(userId: string, projectId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("content_projects")
      .update(updates)
      .eq("id", projectId)
      .eq("user_id", userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async createProjectScript(data: {
    project_id: string
    hook?: string
    body?: string
    cta?: string
    full_script?: string
    structure?: Record<string, unknown>
    version?: number
  }) {
    const { data: script, error } = await supabaseAdmin.from("project_scripts").insert([data]).select().single()
    if (error) throw error
    return script
  }

  static async getLatestScript(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from("project_scripts")
      .select("*")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  }

  static async createScenes(scenes: Array<Record<string, unknown>>) {
    const { data, error } = await supabaseAdmin.from("project_scenes").insert(scenes).select()
    if (error) throw error
    return data || []
  }

  static async updateScene(sceneId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("project_scenes")
      .update(updates)
      .eq("id", sceneId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getScenesByProject(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from("project_scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("scene_order", { ascending: true })
    if (error) throw error
    return data || []
  }

  static async deleteScenesByProject(projectId: string) {
    const { error } = await supabaseAdmin.from("project_scenes").delete().eq("project_id", projectId)
    if (error) throw error
  }

  static async createMediaAsset(data: Record<string, unknown>) {
    const { data: asset, error } = await supabaseAdmin.from("media_assets").insert([data]).select().single()
    if (error) throw error
    return asset
  }

  static async createGenerationJob(data: {
    user_id: string
    project_id?: string
    scene_id?: string
    avatar_id?: string
    provider: AIProvider
    job_type: JobType
    status?: JobStatus
    input_data?: Record<string, unknown>
  }) {
    const { data: job, error } = await supabaseAdmin.from("generation_jobs").insert([data]).select().single()
    if (error) throw error
    return job
  }

  static async updateGenerationJob(jobId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("generation_jobs")
      .update(updates)
      .eq("id", jobId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getGenerationJob(jobId: string) {
    const { data, error } = await supabaseAdmin.from("generation_jobs").select("*").eq("id", jobId).single()
    if (error) throw error
    return data
  }

  static async getProjectJobs(projectId: string) {
    const { data, error } = await supabaseAdmin
      .from("generation_jobs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
  }
}
