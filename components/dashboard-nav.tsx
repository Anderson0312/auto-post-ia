"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bot, Clapperboard, Home, Share2, Settings, UserCircle2 } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/dashboard/avatars", label: "Avatares", icon: UserCircle2 },
  { href: "/dashboard/projects", label: "Projetos", icon: Clapperboard },
  { href: "/dashboard/social-accounts", label: "Redes", icon: Share2 },
  { href: "/dashboard/automation", label: "Automação", icon: Bot },
  { href: "/dashboard/settings", label: "Config", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-blue-100 text-blue-800"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
