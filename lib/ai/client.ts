"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export type AIProvider = "gemini" | "openrouter" | "cloudflare"

export interface AIResponse<T> {
  data: T | null
  error: string | null
  provider: AIProvider
}

export interface AIClientConfig {
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

function detectProvider(): AIProvider | null {
  if (process.env.GEMINI_API_KEY) return "gemini"
  if (process.env.OPENROUTER_API_KEY) return "openrouter"
  if (process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN) return "cloudflare"
  return null
}

async function callGemini<T>(
  system: string,
  prompt: string,
  config: AIClientConfig,
  schema?: object
): Promise<AIResponse<T>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { data: null, error: "GEMINI_API_KEY not configured", provider: "gemini" }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: config.temperature ?? 0.2,
        maxOutputTokens: config.maxTokens ?? 4096,
        responseMimeType: config.jsonMode ? "application/json" : "text/plain",
        responseSchema: schema ? (schema as any) : undefined,
      },
    })

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${system}\n\n${prompt}` }] },
      ],
    })

    const text = result.response.text()
    if (!text) {
      return { data: null, error: "Empty Gemini response", provider: "gemini" }
    }

    if (config.jsonMode) {
      const parsed = JSON.parse(text)
      return { data: parsed, error: null, provider: "gemini" }
    }

    return { data: text as T, error: null, provider: "gemini" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed"
    return { data: null, error: message, provider: "gemini" }
  }
}

async function callOpenRouter<T>(
  system: string,
  prompt: string,
  config: AIClientConfig
): Promise<AIResponse<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { data: null, error: "OPENROUTER_API_KEY not configured", provider: "openrouter" }
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://midasai.tech",
        "X-Title": "MidasAI Marketplace",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: config.temperature ?? 0.2,
        max_tokens: config.maxTokens ?? 4096,
        response_format: config.jsonMode ? { type: "json_object" } : undefined,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { data: null, error: `OpenRouter ${res.status}: ${text}`, provider: "openrouter" }
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content as string | undefined
    if (!content) {
      return { data: null, error: "Empty OpenRouter response", provider: "openrouter" }
    }

    if (config.jsonMode) {
      const parsed = JSON.parse(content)
      return { data: parsed, error: null, provider: "openrouter" }
    }

    return { data: content as T, error: null, provider: "openrouter" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenRouter request failed"
    return { data: null, error: message, provider: "openrouter" }
  }
}

async function callCloudflare<T>(
  system: string,
  prompt: string,
  config: AIClientConfig
): Promise<AIResponse<T>> {
  const accountId = process.env.CF_ACCOUNT_ID
  const token = process.env.CF_AI_TOKEN
  if (!accountId || !token) {
    return { data: null, error: "Cloudflare AI credentials not configured", provider: "cloudflare" }
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          temperature: config.temperature ?? 0.2,
          max_tokens: config.maxTokens ?? 4096,
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return { data: null, error: `Cloudflare ${res.status}: ${text}`, provider: "cloudflare" }
    }

    const json = await res.json()
    const content = json.result?.response as string | undefined
    if (!content) {
      return { data: null, error: "Empty Cloudflare response", provider: "cloudflare" }
    }

    if (config.jsonMode) {
      const parsed = JSON.parse(content)
      return { data: parsed, error: null, provider: "cloudflare" }
    }

    return { data: content as T, error: null, provider: "cloudflare" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cloudflare request failed"
    return { data: null, error: message, provider: "cloudflare" }
  }
}

export async function generateAI<T>(
  system: string,
  prompt: string,
  config: AIClientConfig = { jsonMode: true, temperature: 0.2, maxTokens: 4096 },
  schema?: object
): Promise<AIResponse<T>> {
  const providers: AIProvider[] = ["gemini", "openrouter", "cloudflare"]
  const preferred = detectProvider()

  // Try preferred provider first, then fall through the others
  const order = preferred
    ? [preferred, ...providers.filter((p) => p !== preferred)]
    : providers

  let lastError = "No AI provider configured"

  for (const provider of order) {
    let result: AIResponse<T>
    switch (provider) {
      case "gemini":
        result = await callGemini<T>(system, prompt, config, schema)
        break
      case "openrouter":
        result = await callOpenRouter<T>(system, prompt, config)
        break
      case "cloudflare":
        result = await callCloudflare<T>(system, prompt, config)
        break
    }

    if (result.data && !result.error) {
      return result
    }

    lastError = `[${provider}] ${result.error}`
    console.warn(`AI provider ${provider} failed: ${result.error}`)
  }

  return { data: null, error: lastError, provider: "gemini" }
}
