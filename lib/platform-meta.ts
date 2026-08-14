import { Facebook, Instagram, Linkedin, Twitter, Users, Youtube } from "lucide-react"

export function getPlatformMeta(platform: string) {
  const key = String(platform || "").toLowerCase()
  switch (key) {
    case "tiktok":
      return { icon: Users, color: "text-gray-900", bgColor: "bg-gray-50", label: "TikTok" }
    case "youtube":
      return { icon: Youtube, color: "text-red-600", bgColor: "bg-red-50", label: "YouTube Shorts" }
    case "instagram":
      return { icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50", label: "Instagram" }
    case "linkedin":
      return { icon: Linkedin, color: "text-blue-600", bgColor: "bg-blue-50", label: "LinkedIn" }
    case "facebook":
      return { icon: Facebook, color: "text-blue-700", bgColor: "bg-blue-50", label: "Facebook" }
    case "twitter":
      return { icon: Twitter, color: "text-black", bgColor: "bg-gray-50", label: "Twitter" }
    default:
      return { icon: Users, color: "text-gray-700", bgColor: "bg-gray-50", label: platform || "—" }
  }
}
