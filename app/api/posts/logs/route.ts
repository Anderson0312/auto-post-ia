import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const status = searchParams.get("status") || undefined
    const platform = searchParams.get("platform") || undefined
    const postId = searchParams.get("postId") || undefined
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam))) : 50

    const logs = await DatabaseService.getPostLogs(userId, { limit, status, platform, postId })
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error("GET /api/posts/logs error:", error?.message || error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}