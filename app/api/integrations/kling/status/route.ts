import { NextResponse } from "next/server"
import { getKlingAccountStatus } from "@/lib/providers/kling-account"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const status = await getKlingAccountStatus()
  return NextResponse.json(status)
}
