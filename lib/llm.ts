import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { envFirst } from "@/lib/env"

export type TextLlmProvider = "gemini" | "openai"

function geminiKey() {
  return envFirst("GEMINI_API_KEY", "gemini_api_key", "GOOGLE_GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY")
}

function geminiModels() {
  const preferred = process.env.GEMINI_TEXT_MODEL?.trim()
  const defaults = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]
  return [...new Set(preferred ? [preferred, ...defaults] : defaults)]
}

/** Gemini Flash tem faixa gratuita. OpenAI só entra se Gemini não estiver configurado ou TEXT_LLM_PROVIDER=openai. */
export function getTextProviderName(): TextLlmProvider {
  const forced = (process.env.TEXT_LLM_PROVIDER || "").toLowerCase()
  const hasGemini = Boolean(geminiKey())
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY)

  if (forced === "openai" && hasOpenAI) return "openai"
  if (forced === "gemini" && hasGemini) return "gemini"
  if (hasGemini) return "gemini"
  if (hasOpenAI) return "openai"
  throw new Error(
    "Nenhum provedor de texto configurado. Crie uma chave grátis em aistudio.google.com/apikey e defina GEMINI_API_KEY.",
  )
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "```").replace(/```/g, "").trim()
  const objectMatch = cleaned.match(/\{[\s\S]*\}/)
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  const raw = objectMatch?.[0] || arrayMatch?.[0]
  if (!raw) throw new Error("A IA não retornou JSON")
  return JSON.parse(raw)
}

function wrapIfArray(parsed: unknown, schema: z.ZodType): unknown {
  if (!Array.isArray(parsed)) return parsed
  const def = (schema as z.ZodObject<z.ZodRawShape>)._def
  if (def?.typeName !== "ZodObject") return parsed
  const keys = Object.keys((schema as z.ZodObject<z.ZodRawShape>).shape || {})
  if (keys.length === 1) return { [keys[0]]: parsed }
  return parsed
}

async function geminiGenerateText(prompt: string, json = false): Promise<string> {
  const apiKey = geminiKey()
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada")

  let lastError: Error | null = null

  for (const model of geminiModels()) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: json ? { responseMimeType: "application/json" } : undefined,
        }),
      },
    )

    const data = await response.json()
    if (!response.ok) {
      lastError = new Error(data?.error?.message || `Gemini ${model} HTTP ${response.status}`)
      if (response.status === 404 || /not found|not supported/i.test(lastError.message)) continue
      throw lastError
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      ?.trim()

    if (!text) {
      lastError = new Error(`Gemini ${model} não retornou texto`)
      continue
    }

    return text
  }

  throw lastError || new Error("Gemini não retornou texto")
}

export async function llmGenerateText(prompt: string): Promise<string> {
  if (getTextProviderName() === "gemini") {
    return geminiGenerateText(prompt)
  }

  const result = await generateText({
    model: openai(process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini"),
    prompt,
  })
  return result.text
}

export async function llmGenerateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const parse = (text: string) => schema.parse(wrapIfArray(extractJson(text), schema))

  if (getTextProviderName() === "gemini") {
    const text = await geminiGenerateText(`${prompt}\n\nResponda APENAS com JSON válido.`, true)
    return parse(text)
  }

  try {
    const result = await generateObject({
      model: openai(process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini"),
      prompt,
      schema,
    })
    return result.object
  } catch {
    const fallback = await generateText({
      model: openai(process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini"),
      prompt: `${prompt}\nResponda em JSON válido.`,
    })
    return parse(fallback.text)
  }
}
