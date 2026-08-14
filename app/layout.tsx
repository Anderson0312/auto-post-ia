import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AutoPostIA — estúdio de crescimento para shorts",
  description:
    "Cresça no TikTok, YouTube Shorts e Reels. Ideia, canal ou tendência vira um short 9:16 com o seu avatar.",
  generator: "v0.dev",
  other: {
    "tiktok-developers-site-verification": "9G9KzGz1YMnd4hE0d0Hbb6mwoGHxP6oz",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
