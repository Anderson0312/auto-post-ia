import { ScriptGenerator } from "@/lib/pipeline/script-generator"
import { StoryboardGenerator } from "@/lib/pipeline/storyboard-generator"
import { VideoPipelineService } from "@/lib/pipeline/video-pipeline-service"
import { AvatarService } from "@/lib/avatars/avatar-service"
import { enqueuePipelineJob, QUEUE_NAMES } from "@/lib/queue/index"

export async function enqueueScriptGeneration(projectId: string, userId: string) {
  return enqueuePipelineJob(
    QUEUE_NAMES.SCRIPT,
    { projectId, userId },
    async (job) => ScriptGenerator.generate(job.data.projectId, job.data.userId),
  )
}

export async function enqueueStoryboardGeneration(projectId: string, userId: string) {
  return enqueuePipelineJob(
    QUEUE_NAMES.STORYBOARD,
    { projectId, userId },
    async (job) => StoryboardGenerator.generate(job.data.projectId, job.data.userId),
  )
}

export async function enqueueVideoGeneration(projectId: string, userId: string) {
  return enqueuePipelineJob(
    QUEUE_NAMES.VIDEO,
    { projectId, userId },
    async (job) => VideoPipelineService.runFullVideoGeneration(job.data.projectId, job.data.userId),
  )
}

export async function enqueueAvatarCreation(userId: string, avatarId: string) {
  return enqueuePipelineJob(
    QUEUE_NAMES.AVATAR,
    { userId, avatarId, mode: "create" },
    async (job) => AvatarService.processAvatarCreation(job),
  )
}
