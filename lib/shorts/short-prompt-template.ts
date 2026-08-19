export interface ShortEditableParams {
  publico_alvo: string
  categoria: string
  formato_visual: string
  estilo_visual: string
  tom: string
  linguagem: string
  ritmo: string
  narracao: string
  duracao: string
  quantidade_angulos: string
  cta: string
}

export interface ShortPromptConfig {
  PARAMETROS_EDITAVEIS: ShortEditableParams
  PROMPT: string
  PUBLICO: Record<string, string>
  VISUAL: Record<string, string>
  NARRATIVA: Record<string, string>
  RESTRICOES: string[]
  REALISMO: string[]
  PROMPT_NEGATIVO: string[]
}

export const DEFAULT_SHORT_PARAMS: ShortEditableParams = {
  publico_alvo: "adulto",
  categoria: "curiosidades",
  formato_visual: "cenas relacionadas ao tema",
  estilo_visual: "fotorrealista cinematográfico",
  tom: "educativo e leve",
  linguagem: "simples e clara",
  ritmo: "rápido",
  narracao: "voz off com texto na tela",
  duracao: "21 segundos",
  quantidade_angulos: "3",
  cta: "seguir",
}

export const SHORT_ANGLE_COUNTS = ["1", "2", "3", "4", "5"] as const

const BASE_PROMPT =
  "Crie um short vertical 9:16 utilizando EXATAMENTE as características definidas em PARAMETROS_EDITAVEIS. O vídeo deve ser específico para o público-alvo, categoria e formato visual escolhidos. Se o formato NÃO for personagem na câmera, NÃO mostre um avatar ou apresentador; mostre cenas, objetos, lugares, analogias visuais ou animação relacionados ao tema."

const AVATAR_FORMATS = ["personagem na câmera (avatar)", "mix: cenas + personagem"]

export const ADULT_SENSUAL_CATEGORY = "+18 conteúdo sexual para adultos"
export const MINOR_AUDIENCES = ["criança", "pré-adolescente", "adolescente"] as const
export const ADULT_AUDIENCES = ["jovem adulto", "adulto"] as const

export function isAdultSensualCategory(categoria?: string): boolean {
  const value = (categoria || "").toLowerCase()
  return value.includes("+18") || value.includes("sensual")
}

export function isMinorAudience(publico?: string): boolean {
  return MINOR_AUDIENCES.includes((publico || "") as (typeof MINOR_AUDIENCES)[number])
}

export function normalizeShortParams(params: Partial<ShortEditableParams> = {}): ShortEditableParams {
  const merged = { ...DEFAULT_SHORT_PARAMS, ...params }

  if (isAdultSensualCategory(merged.categoria)) {
    if (isMinorAudience(merged.publico_alvo) || merged.publico_alvo === "todos os públicos") {
      merged.publico_alvo = "adulto"
    }
    if (merged.linguagem === "adequada para crianças") {
      merged.linguagem = "adulta e direta"
    }
    if (merged.tom === "educativo e leve") {
      merged.tom = "sensual"
    }
  }

  return merged
}

export function shortUsesAvatar(params: Partial<ShortEditableParams> | undefined): boolean {
  const formato = params?.formato_visual || DEFAULT_SHORT_PARAMS.formato_visual
  return AVATAR_FORMATS.includes(formato)
}

export function parseAngleCount(value?: string): number {
  const n = Number.parseInt(value || DEFAULT_SHORT_PARAMS.quantidade_angulos, 10)
  if (Number.isNaN(n)) return 3
  return Math.min(5, Math.max(1, n))
}

export function parseDurationSeconds(duracao?: string): number {
  const match = (duracao || DEFAULT_SHORT_PARAMS.duracao).match(/\d+/)
  const n = match ? Number.parseInt(match[0], 10) : 21
  return Math.min(60, Math.max(8, n))
}

function audienceRestrictions(params: ShortEditableParams): string[] {
  const base = [
    "sem texto ilegível na imagem",
    "sem watermark",
    "sem logotipo de terceiros",
  ]

  if (isAdultSensualCategory(params.categoria)) {
    return [
      ...base,
      "somente pessoas adultas com aparência claramente 18+",
      "conteúdo sensual, sugestivo e +18",
      "clima de desejo, charme e intimidade cinematográfica",
      "sem genitália visível",
      "sem menores, sem aparência adolescente",
    ]
  }

  if (params.publico_alvo === "criança") {
    return [
      ...base,
      "conteúdo 100% seguro para crianças",
      "sem violência",
      "sem medo excessivo",
      "sem temas adultos",
      "sem sexualização",
      "sem palavrão",
      "linguagem positiva e educativa",
    ]
  }

  if (params.publico_alvo === "pré-adolescente" || params.publico_alvo === "adolescente") {
    return [
      ...base,
      "adequado à faixa etária",
      "sem conteúdo sexual",
      "sem violência gráfica",
      "sem substâncias ilícitas",
      "sem linguagem ofensiva pesada",
    ]
  }

  return [...base, "respeitar o público informado"]
}

function fillAudienceBlock(params: ShortEditableParams): ShortPromptConfig["PUBLICO"] {
  const sensual = isAdultSensualCategory(params.categoria)
  return {
    faixa: params.publico_alvo,
    categoria: params.categoria,
    linguagem: params.linguagem,
    tom: params.tom,
    adequacao: sensual
      ? "conteúdo +18 sensual para adultos"
      : params.publico_alvo === "criança"
        ? "conteúdo infantil, seguro, claro e positivo"
        : `adequado para ${params.publico_alvo}`,
  }
}

function fillVisualBlock(params: ShortEditableParams): ShortPromptConfig["VISUAL"] {
  const withAvatar = shortUsesAvatar(params)
  const sensual = isAdultSensualCategory(params.categoria)

  if (sensual) {
    return {
      formato: params.formato_visual,
      estilo: params.estilo_visual.includes("sensual") ? params.estilo_visual : "sensual cinematográfico",
      enquadramento: "vertical 9:16, close-ups íntimos, luz quente, atmosfera sedutora",
      personagem: withAvatar
        ? "mostrar o avatar adulto em poses e expressões sensuais, olhar confiante, linguagem corporal de desejo"
        : "cenas atmosféricas sensuais: silhuetas adultas, tecidos, luz baixa, detalhes do corpo com sugestão — sem apresentador falando para a câmera",
      cenas: withAvatar
        ? "planos do personagem adulto: olhar para câmera, pescoço, ombros, cintura, movimento lento, lingerie ou roupa justa sugestiva, ambiente íntimo"
        : "B-roll sensual: lençóis, luz de abajur, silhueta no espelho, mãos, boca, perfume, tecido escorrendo — sempre adultos 18+",
    }
  }

  return {
    formato: params.formato_visual,
    estilo: params.estilo_visual,
    enquadramento: "vertical 9:16, vídeo curto para TikTok / Shorts / Reels",
    personagem: withAvatar
      ? "pode mostrar o avatar/personagem escolhido"
      : "NÃO mostrar apresentador, avatar, selfie ou pessoa falando para a câmera",
    cenas: withAvatar
      ? "planos do personagem intercalados com o tema, se fizer sentido"
      : "cenas ilustrativas do tema: objetos, lugares, analogias, recortes, animação ou B-roll",
  }
}

function fillNarrativeBlock(params: ShortEditableParams): ShortPromptConfig["NARRATIVA"] {
  const sensual = isAdultSensualCategory(params.categoria)
  return {
    ritmo: sensual && params.ritmo === "rápido" ? "médio" : params.ritmo,
    narracao: params.narracao,
    duracao: params.duracao,
    cta: params.cta,
    estrutura: sensual
      ? "hook visual sensual nos 1–3s, tensão crescente, corte íntimo, CTA sutil no final"
      : "hook 1–3s, desenvolvimento rápido, CTA no final, possível loop",
  }
}

const SENSUAL_PROMPT =
  "Este short é +18 SENSUAL: clima de sedução, desejo e charme para adultos. Toda pessoa na imagem deve parecer claramente 21 anos ou mais. Mostre linguagem corporal, olhar, pele, roupa justa ou lingerie de forma sugestiva e cinematográfica. NÃO mostre sexo explícito, atos sexuais, genitália, pornografia ou nudez frontal explícita."

function negativePrompts(params: ShortEditableParams): string[] {
  const base = [
    "avatar ou apresentador quando o formato não pede personagem",
    "ensaio fotográfico profissional",
    "texto enorme cobrindo a cena",
    "watermark",
    "logotipo",
    "baixa resolução",
    "anatomia distorcida",
    "conteúdo inadequado para o público",
    "anime involuntário",
    "CGI barato",
  ]

  if (isAdultSensualCategory(params.categoria)) {
    return [
      ...base,
      "sexo explícito",
      "ato sexual",
      "pornografia",
      "genitália",
      "nudez frontal explícita",
      "menor de idade",
      "adolescente",
      "apariência teen",
      "criança",
      "uniforme escolar",
    ]
  }

  return base
}

export function buildShortPromptConfig(params: Partial<ShortEditableParams> = {}): ShortPromptConfig {
  const merged = normalizeShortParams(params)
  const sensual = isAdultSensualCategory(merged.categoria)

  return {
    PARAMETROS_EDITAVEIS: merged,
    PROMPT: sensual ? `${BASE_PROMPT} ${SENSUAL_PROMPT}` : BASE_PROMPT,
    PUBLICO: fillAudienceBlock(merged),
    VISUAL: fillVisualBlock(merged),
    NARRATIVA: fillNarrativeBlock(merged),
    RESTRICOES: audienceRestrictions(merged),
    REALISMO: sensual
      ? [
          "fotorrealismo sensual cinematográfico",
          "pele real, poros e luz quente na pele",
          "atmosfera íntima e coerente",
          "close-ups com profundidade",
          "movimento lento e corpo adulto natural",
        ]
      : [
          "alta qualidade visual",
          "coerência entre cenas",
          "iluminação física convincente",
          "movimento e cortes de short",
          "sem aparência genérica de stock barato",
        ],
    PROMPT_NEGATIVO: negativePrompts(merged),
  }
}

export function buildShortScriptContext(config: ShortPromptConfig): string {
  const p = config.PARAMETROS_EDITAVEIS
  return [
    `Parâmetros do short — Público: ${p.publico_alvo}; Categoria: ${p.categoria}; Formato: ${p.formato_visual}; Estilo: ${p.estilo_visual}; Tom: ${p.tom}; Linguagem: ${p.linguagem}; Ritmo: ${p.ritmo}; Narração: ${p.narracao}; CTA: ${p.cta}.`,
    `Regra visual: ${config.VISUAL.personagem}. ${config.VISUAL.cenas}.`,
    `Restrições: ${config.RESTRICOES.join("; ")}.`,
  ].join("\n")
}

export function buildShortScriptBrief(config: ShortPromptConfig, idea: string): string {
  const p = config.PARAMETROS_EDITAVEIS
  const visual = config.VISUAL

  return [
    `Ideia do short: ${idea}`,
    `Público-alvo: ${p.publico_alvo}. Categoria: ${p.categoria}.`,
    `Tom: ${p.tom}. Linguagem: ${p.linguagem}. Ritmo: ${p.ritmo}.`,
    `Formato visual: ${p.formato_visual}. Estilo: ${p.estilo_visual}.`,
    `Narração: ${p.narracao}. Duração: ${p.duracao}. CTA: ${p.cta}.`,
    `Regra visual: ${visual.personagem}. ${visual.cenas}.`,
    `Restrições: ${config.RESTRICOES.join("; ")}.`,
    config.PROMPT,
  ].join("\n")
}

export function buildShortStoryboardInstructions(config: ShortPromptConfig, hasAvatar: boolean): string {
  const p = config.PARAMETROS_EDITAVEIS
  const useAvatar = hasAvatar && shortUsesAvatar(p)
  const sensual = isAdultSensualCategory(p.categoria)

  if (sensual && useAvatar) {
    return [
      "Storyboard +18 SENSUAL com o mesmo avatar adulto (aparência 18+) em todas as cenas.",
      "Poses sedutoras, olhar para a câmera, close no pescoço/ombros/cintura, lingerie ou roupa justa, luz quente íntima.",
      "Sugestivo, nunca explícito: sem genitália, sem pornografia explicita.",
      `Estilo: ${p.estilo_visual}. ${config.VISUAL.cenas}`,
    ].join(" ")
  }

  if (sensual) {
    return [
      "Storyboard +18 SENSUAL sem talking-head.",
      "Cenas atmosféricas de desejo: silhuetas adultas, tecidos, luz baixa, detalhes do corpo com sugestão.",
      "Todas as pessoas 18+. Sem genitália, sem menores.",
      `Estilo: ${p.estilo_visual}. ${config.VISUAL.cenas}`,
    ].join(" ")
  }

  if (useAvatar) {
    return [
      "Storyboard COM personagem.",
      "Mantenha o mesmo avatar em todas as cenas em que ele aparece.",
      "Pode intercalá-lo com B-roll do tema se o formato for mix.",
      `Estilo visual: ${p.estilo_visual}. Público: ${p.publico_alvo}.`,
    ].join(" ")
  }

  return [
    "Storyboard SEM avatar e SEM apresentador na câmera.",
    `Formato: ${p.formato_visual}. Estilo: ${p.estilo_visual}.`,
    "Cada visualPrompt deve descrever uma cena concreta do tema (objeto, lugar, analogia, recorte, infográfico ou animação).",
    "NÃO descreva uma pessoa selfie, influencer ou talking-head.",
    `Adequado para ${p.publico_alvo}. Categoria: ${p.categoria}.`,
    `Evitar: ${config.PROMPT_NEGATIVO.slice(0, 8).join(", ")}.`,
  ].join(" ")
}

export function buildShortSceneVisualPrompt(params: {
  sceneDescription: string
  visualStyle?: string
  formatoVisual?: string
  publicoAlvo?: string
  categoria?: string
}): string {
  const scene = params.sceneDescription.trim()
  const formato = params.formatoVisual || DEFAULT_SHORT_PARAMS.formato_visual
  const noPerson = !shortUsesAvatar({ formato_visual: formato })
  const sensual = isAdultSensualCategory(params.categoria)

  return [
    "Vertical 9:16 social media short frame.",
    `Visual style: ${sensual ? "sensual cinematic, warm intimate lighting" : params.visualStyle || DEFAULT_SHORT_PARAMS.estilo_visual}.`,
    `Format: ${formato}.`,
    sensual
      ? "Adults only, clearly 18+. Sensual, suggestive, alluring. Tasteful lingerie or fitted clothing allowed. NO genitals, NO pornography, NO minors."
      : params.publicoAlvo
        ? `Audience-safe for: ${params.publicoAlvo}.`
        : "",
    noPerson && !sensual
      ? "Do NOT show a presenter, influencer, selfie, or talking-head. Show topical scenes, objects, places, analogies, or animation."
      : "",
    noPerson && sensual
      ? "No talking-head presenter. Show sensual atmosphere, adult silhouettes, fabric, skin highlights, intimate details."
      : "",
    `Scene: ${scene}`,
    "No text overlay, no watermark, no logo, high quality, cinematic lighting.",
  ]
    .filter(Boolean)
    .join(" ")
}

export const SHORT_PARAM_FIELDS: Array<{
  key: keyof ShortEditableParams
  label: string
  type?: "select" | "text"
  options?: string[]
}> = [
  {
    key: "publico_alvo",
    label: "Público-alvo",
    type: "select",
    options: ["criança", "pré-adolescente", "adolescente", "jovem adulto", "adulto", "todos os públicos"],
  },
  {
    key: "categoria",
    label: "Categoria",
    type: "select",
    options: [
      "curiosidades",
      "educação",
      "entretenimento",
      "tutorial prático",
      "mitos e verdades",
      "storytelling",
      "humor",
      "ciência",
      "história",
      "lifestyle",
      "saúde",
      "finanças",
      "+18 conteúdo sexual para adultos",
    ],
  },
  {
    key: "formato_visual",
    label: "Formato visual",
    type: "select",
    options: [
      "cenas relacionadas ao tema",
      "animação",
      "motion graphics e texto",
      "personagem na câmera (avatar)",
      "mix: cenas + personagem",
    ],
  },
  {
    key: "estilo_visual",
    label: "Estilo visual",
    type: "select",
    options: [
      "fotorrealista cinematográfico",
      "sensual cinematográfico",
      "documental espontâneo",
      "ilustração 2D",
      "3D estilizado",
      "colagem dinâmica",
    ],
  },
  {
    key: "tom",
    label: "Tom",
    type: "select",
    options: ["educativo e leve", "casual", "energético", "calmo", "dramático", "humorístico", "sensual"],
  },
  {
    key: "linguagem",
    label: "Linguagem",
    type: "select",
    options: ["simples e clara", "coloquial", "adequada para crianças", "técnica acessível", "adulta e direta"],
  },
  {
    key: "ritmo",
    label: "Ritmo",
    type: "select",
    options: ["rápido", "médio", "calmo"],
  },
  {
    key: "narracao",
    label: "Narração",
    type: "select",
    options: ["voz off com texto na tela", "só texto na tela", "personagem fala na câmera", "mix"],
  },
  {
    key: "duracao",
    label: "Duração",
    type: "select",
    options: ["15 segundos", "21 segundos", "30 segundos", "45 segundos", "60 segundos"],
  },
  {
    key: "quantidade_angulos",
    label: "Quantidade de ângulos",
    type: "select",
    options: [...SHORT_ANGLE_COUNTS],
  },
  {
    key: "cta",
    label: "CTA",
    type: "select",
    options: ["seguir", "comentar", "salvar", "link na bio", "nenhum"],
  },
]
