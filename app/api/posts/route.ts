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
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam))) : 50

    const posts = await DatabaseService.getPosts(userId, limit)
    return NextResponse.json(posts)
  } catch (error: any) {
    console.error("GET /api/posts error:", error?.message || error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const {
      social_account_id,
      content,
      image_url,
      scheduled_for,
      ai_theme_id,
      ai_prompt,
    } = body || {}

    if (!social_account_id || !content || !scheduled_for) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 })
    }

    const postData = {
      user_id: userId,
      social_account_id,
      content,
      image_url,
      scheduled_for,
      ai_theme_id,
      ai_prompt,
    }

    const created = await DatabaseService.createPost(postData)
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/posts error:", error?.message || error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}