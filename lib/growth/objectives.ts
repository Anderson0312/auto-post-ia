import type { ContentObjective } from "@/lib/types/video-platform"

export const GROWTH_OBJECTIVES: { id: ContentObjective; label: string; hint: string }[] = [
  { id: "engagement", label: "Engajamento", hint: "Comentários, saves e retenção" },
  { id: "followers", label: "Seguidores", hint: "Crescer a conta" },
  { id: "views", label: "Views", hint: "Alcance e viralização" },
  { id: "sales", label: "Vendas", hint: "Produto e oferta" },
  { id: "leads", label: "Leads", hint: "Captura na bio / DM" },
  { id: "education", label: "Educativo", hint: "Ensinar rápido" },
  { id: "motivation", label: "Motivacional", hint: "Energia e história" },
  { id: "branding", label: "Marca", hint: "Autoridade e lembrança" },
]

export function objectiveLabel(id?: string) {
  return GROWTH_OBJECTIVES.find((o) => o.id === id)?.label || "Engajamento"
}
