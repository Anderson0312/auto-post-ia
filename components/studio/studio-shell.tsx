"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Flame, Home, User, Film, Share2, Settings, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/user-menu"
import { ObjectiveSwitcher } from "@/components/studio/objective-switcher"

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/dashboard/projects/new", label: "Criar", icon: Plus },
  { href: "/dashboard/grow/copy-channel", label: "Copiar", icon: Copy },
  { href: "/dashboard/grow/trending", label: "Em alta", icon: Flame },
  { href: "/dashboard/avatars", label: "Avatares", icon: User },
  { href: "/dashboard/projects", label: "Vídeos", icon: Film },
  { href: "/dashboard/social-accounts", label: "Redes", icon: Share2 },
]

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col">
        <Link href="/dashboard" className="px-5 py-6 text-lg font-semibold tracking-tight">
          AutoPost<span className="text-fuchsia-400">IA</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/dashboard/projects"
                  ? pathname === "/dashboard/projects" ||
                    /^\/dashboard\/projects\/[0-9a-f-]{36}$/i.test(pathname)
                  : pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <Link href="/dashboard/settings" className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300">
          <Settings className="h-4 w-4" />
          Config avançado
        </Link>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
          <ObjectiveSwitcher />
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/projects/new"
              className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-400"
            >
              Criar short
            </Link>
            <UserMenu />
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 px-2 py-2 md:hidden">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-3 py-1 text-xs text-zinc-400">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
