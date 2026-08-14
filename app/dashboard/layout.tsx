import { StudioShell } from "@/components/studio/studio-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>
}
