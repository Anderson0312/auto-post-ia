"use client"

import { Button } from "@/components/ui/button"

export function ShortsOAuthButtons({ intent = "login" }: { intent?: "login" | "connect" }) {
  const go = (platform: "tiktok" | "youtube") => {
    window.location.href = `/api/auth/${platform}?intent=${intent}`
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button type="button" variant="outline" className="w-full" onClick={() => go("tiktok")}>
        TikTok
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => go("youtube")}>
        YouTube Shorts
      </Button>
    </div>
  )
}
