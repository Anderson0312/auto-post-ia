export interface AvatarEditableParams {
  idade: string
  genero: string
  etnia: string
  tom_de_pele: string
  cor_dos_olhos: string
  cor_do_cabelo: string
  comprimento_do_cabelo: string
  tipo_de_cabelo: string
  tipo_de_corpo: string
  formato_do_corpo: string
  tracos_faciais: string
  maquiagem: string
  roupa: string
  acessorios: string
  local: string
  iluminacao: string
  expressao: string
}

export interface AvatarPromptConfig {
  PARAMETROS_EDITAVEIS: AvatarEditableParams
  PROMPT: string
  MODELO: Record<string, string>
  SELFIE: Record<string, string>
  CENARIO: Record<string, string>
  EXPRESSAO: string
  REALISMO: string[]
  PROMPT_NEGATIVO: string[]
}

export const DEFAULT_AVATAR_PARAMS: AvatarEditableParams = {
  idade: "24 anos",
  genero: "mulher",
  etnia: "brasileira latina",
  tom_de_pele: "morena clara com subtom quente",
  cor_dos_olhos: "castanho",
  cor_do_cabelo: "castanho escuro",
  comprimento_do_cabelo: "longo",
  tipo_de_cabelo: "ondulado natural",
  tipo_de_corpo: "atlético",
  formato_do_corpo: "proporções naturais, cintura levemente definida",
  tracos_faciais: "rosto delicado, sobrancelhas naturais e bem definidas, lábios proporcionais e traços faciais harmoniosos",
  maquiagem: "maquiagem leve e natural",
  roupa: "regata preta básica",
  acessorios: "pequenos brincos dourados",
  local: "quarto moderno e organizado",
  iluminacao: "luz natural suave entrando pela janela",
  expressao: "expressão natural e confiante",
}

const BASE_PROMPT =
  "Crie uma fotografia extremamente realista de uma pessoa adulta utilizando EXATAMENTE as características definidas em PARAMETROS_EDITAVEIS. A pessoa está tirando uma selfie casual com a câmera frontal de um smartphone, como uma fotografia espontânea publicada em uma rede social. A imagem deve transmitir naturalidade e autenticidade, sem aparência de ensaio fotográfico profissional."

const SELFIE_BLOCK: AvatarPromptConfig["SELFIE"] = {
  tipo: "selfie autêntica feita com smartphone",
  camera: "câmera frontal de smartphone moderno",
  angulo: "ângulo natural de selfie, levemente acima da linha dos olhos",
  enquadramento: "retrato vertical mostrando rosto, ombros e parte superior do corpo",
  distancia: "distância natural de uma selfie segurando o celular com uma mão",
  composicao: "enquadramento espontâneo e levemente imperfeito",
  lente: "lente grande angular típica de smartphone",
  perspectiva: "perspectiva realista de câmera frontal",
}

const REALISMO_BLOCK = [
  "fotorrealismo extremo",
  "textura de pele humana real",
  "poros naturais visíveis",
  "pequenas imperfeições naturais da pele",
  "fios de cabelo individuais",
  "assimetria facial natural",
  "anatomia humana correta",
  "proporções corporais naturais",
  "textura realista das roupas",
  "iluminação fisicamente coerente",
  "sombras naturais",
  "reflexos realistas",
  "leve distorção óptica de smartphone",
  "aparência de fotografia real",
  "sem aparência de imagem gerada por IA",
]

const PROMPT_NEGATIVO_BLOCK = [
  "anime",
  "cartoon",
  "ilustração",
  "3D",
  "CGI",
  "renderização",
  "boneca",
  "pele de plástico",
  "pele excessivamente lisa",
  "rosto artificial",
  "rosto deformado",
  "olhos artificiais",
  "corpo desproporcional",
  "mãos deformadas",
  "dedos extras",
  "membros extras",
  "pele excessivamente perfeita",
  "maquiagem exagerada",
  "aparência de modelo de estúdio",
  "ensaio fotográfico profissional",
  "luz de estúdio artificial",
  "baixa resolução",
  "blur excessivo",
  "watermark",
  "texto",
  "logotipo",
]

function fillModelBlock(params: AvatarEditableParams): AvatarPromptConfig["MODELO"] {
  return {
    idade: params.idade,
    genero: params.genero,
    etnia: params.etnia,
    pele: params.tom_de_pele,
    olhos: params.cor_dos_olhos,
    cabelo: `${params.cor_do_cabelo}, ${params.comprimento_do_cabelo}, ${params.tipo_de_cabelo}`,
    corpo: `${params.tipo_de_corpo}, ${params.formato_do_corpo}`,
    rosto: params.tracos_faciais,
    maquiagem: params.maquiagem,
    roupa: params.roupa,
    acessorios: params.acessorios,
  }
}

function fillScenarioBlock(params: AvatarEditableParams): AvatarPromptConfig["CENARIO"] {
  return {
    local: params.local,
    iluminacao: params.iluminacao,
    ambiente: "ambiente cotidiano realista, com profundidade natural e pequenas imperfeições",
    fundo: "fundo coerente com o ambiente, levemente desfocado de forma natural",
  }
}

export function buildAvatarPromptConfig(params: Partial<AvatarEditableParams> = {}): AvatarPromptConfig {
  const merged = { ...DEFAULT_AVATAR_PARAMS, ...params }

  return {
    PARAMETROS_EDITAVEIS: merged,
    PROMPT: BASE_PROMPT,
    MODELO: fillModelBlock(merged),
    SELFIE: SELFIE_BLOCK,
    CENARIO: fillScenarioBlock(merged),
    EXPRESSAO: merged.expressao,
    REALISMO: REALISMO_BLOCK,
    PROMPT_NEGATIVO: PROMPT_NEGATIVO_BLOCK,
  }
}

export function serializeAvatarPromptConfig(config: AvatarPromptConfig): string {
  return JSON.stringify(config)
}

export function parseAvatarPromptConfig(raw: string | null | undefined): AvatarPromptConfig | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as AvatarPromptConfig
    if (parsed.PARAMETROS_EDITAVEIS && parsed.MODELO) return parsed
  } catch {
    return null
  }
  return null
}

export function buildAvatarDescription(params: AvatarEditableParams, name?: string): string {
  const prefix = name ? `${name}: ` : ""
  return `${prefix}${params.genero}, ${params.idade}, ${params.etnia}, ${params.tom_de_pele}. ${params.tracos_faciais}.`
}

export function parseApparentAge(idade: string): number | undefined {
  const match = idade.match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : undefined
}

export function buildAvatarImagePrompt(config: AvatarPromptConfig): string {
  const p = config.PARAMETROS_EDITAVEIS
  const model = config.MODELO

  const lines = [
    "Extremely photorealistic smartphone front-camera selfie of an adult person.",
    `Age: ${model.idade}. Gender: ${model.genero}. Ethnicity: ${model.etnia}.`,
    `Skin: ${model.pele}. Eyes: ${model.olhos}. Hair: ${model.cabelo}.`,
    `Body: ${model.corpo}. Face: ${model.rosto}. Makeup: ${model.maquiagem}.`,
    `Outfit: ${model.roupa}. Accessories: ${model.acessorios}.`,
    `Setting: ${config.CENARIO.local}. Lighting: ${config.CENARIO.iluminacao}.`,
    `Expression: ${config.EXPRESSAO}.`,
    "Authentic casual selfie taken with a modern smartphone front camera.",
    "Natural spontaneous social media photo, slightly above eye level, vertical 9:16 portrait.",
    "Shows face, shoulders and upper body. Slight wide-angle lens distortion.",
    "Everyday realistic environment with natural depth and subtle imperfections.",
    "Extreme photorealism: visible skin pores, natural skin texture, individual hair strands.",
    "Natural facial asymmetry, physically coherent lighting, realistic shadows and reflections.",
    "Must look like a real photograph, not AI-generated.",
    `Avoid: ${config.PROMPT_NEGATIVO.slice(0, 12).join(", ")}.`,
  ]

  return lines.join(" ")
}

export function getMasterPromptIdentitySummary(masterPrompt: string | null | undefined, avatarName?: string): string {
  const config = parseAvatarPromptConfig(masterPrompt)
  if (config) {
    const m = config.MODELO
    return [
      avatarName,
      m.genero,
      m.idade,
      m.etnia,
      m.pele,
      m.olhos,
      `hair ${m.cabelo}`,
      m.rosto,
    ]
      .filter(Boolean)
      .join(", ")
  }
  return masterPrompt?.trim() || avatarName?.trim() || "the selected avatar"
}

export const AVATAR_PARAM_FIELDS: Array<{
  key: keyof AvatarEditableParams
  label: string
  placeholder?: string
  type?: "select" | "text" | "textarea"
  options?: string[]
}> = [
  { key: "idade", label: "Idade", placeholder: "Ex: 24 anos", type: "select", options: ["18 anos", "20 anos", "24 anos", "28 anos", "32 anos", "35 anos", "40 anos"] },
  { key: "genero", label: "Gênero", type: "select", options: ["mulher", "homem", "pessoa não-binária"] },
  { key: "etnia", label: "Etnia", placeholder: "Ex: brasileira latina", type: "text" },
  { key: "tom_de_pele", label: "Tom de pele", placeholder: "Ex: morena clara com subtom quente", type: "select", options: ["branca clara", "morena clara com subtom quente", "morena média", "negra", "parda", "asiática clara", "asiática média"] },
  { key: "cor_dos_olhos", label: "Cor dos olhos", type: "select", options: ["castanho", "castanho escuro", "verde", "azul", "mel", "preto"] },
  { key: "cor_do_cabelo", label: "Cor do cabelo", type: "select", options: ["castanho escuro", "castanho claro", "preto", "loiro", "ruivo", "grisalho"] },
  { key: "comprimento_do_cabelo", label: "Comprimento do cabelo", type: "select", options: ["curto", "médio", "longo", "muito longo"] },
  { key: "tipo_de_cabelo", label: "Tipo de cabelo", type: "select", options: ["liso", "ondulado natural", "cacheado", "crespo", "trançado"] },
  { key: "tipo_de_corpo", label: "Tipo de corpo", type: "select", options: ["magro", "atlético", "médio", "curvilíneo", "robusto"] },
  { key: "formato_do_corpo", label: "Formato do corpo", placeholder: "Ex: proporções naturais, cintura levemente definida", type: "textarea" },
  { key: "tracos_faciais", label: "Traços faciais", placeholder: "Ex: rosto delicado, sobrancelhas naturais...", type: "textarea" },
  { key: "maquiagem", label: "Maquiagem", type: "select", options: ["sem maquiagem", "maquiagem leve e natural", "maquiagem moderada", "maquiagem glam"] },
  { key: "roupa", label: "Roupa", placeholder: "Ex: regata preta básica", type: "text" },
  { key: "acessorios", label: "Acessórios", placeholder: "Ex: pequenos brincos dourados", type: "text" },
  { key: "local", label: "Local", placeholder: "Ex: quarto moderno e organizado", type: "select", options: ["quarto moderno e organizado", "sala de estar aconchegante", "escritório em casa", "café urbano", "parque ao ar livre", "cozinha iluminada"] },
  { key: "iluminacao", label: "Iluminação", type: "select", options: ["luz natural suave entrando pela janela", "luz do dia difusa", "luz quente de fim de tarde", "luz interna suave e quente"] },
  { key: "expressao", label: "Expressão", type: "select", options: ["expressão natural e confiante", "sorriso leve e autêntico", "expressão séria e pensativa", "expressão animada e energética", "expressão calma e acolhedora"] },
]
