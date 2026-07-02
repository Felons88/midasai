"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Sparkles, Brain, FileText, Shield, Check,
  X, Download, Loader2, AlertTriangle, Send,
  Target, Zap, Lock, Eye, BarChart3, ChevronRight,
  Activity, Cpu, Layers,
  Orbit, Gauge, CheckCircle, Code, Rocket, HelpCircle
} from "lucide-react"

interface Suggestion {
  id: string
  title: string
  description: string
  target_file: string
  priority: "critical" | "high" | "medium"
  category: string
  applied?: boolean
  applying?: boolean
}

interface ChatMessage {
  id: string
  role: "ai" | "user" | "system"
  content: string
  score?: number
  suggestions?: Suggestion[]
  quick_actions?: { id: string; label: string; guidance: string; icon: string }[]
  appliedFile?: string
  round?: number
  timestamp?: string
}

interface AnalysisContext {
  initial_score: number
  analysis_summary: string
  tech_stack_detected: string[]
  strengths: string[]
  weaknesses: string[]
  architecture_pattern: string
  readiness_level: string
  contextual_questions: string[]
}

interface ExpandOverlayProps {
  workflowId: string
  workflowTitle: string
  onClose: () => void
  onComplete: () => void
}

const CATEGORY_ICONS: Record<string, typeof Brain> = {
  architecture: Brain,
  security: Lock,
  scaling: Zap,
  documentation: FileText,
  ai_orchestration: Sparkles,
  observability: Eye,
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", glow: "rgba(239,68,68,0.15)" },
  high: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "rgba(245,158,11,0.15)" },
  medium: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "rgba(96,165,250,0.15)" },
}

// ─── Animated Neural Canvas ───
function NeuralCanvas({ score, analyzing, fileCount, round }: { score: number; analyzing: boolean; fileCount: number; round: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number; hue: number; pulse: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()

    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const nodeCount = Math.min(fileCount + 8, 40)

    if (nodesRef.current.length < nodeCount) {
      for (let i = nodesRef.current.length; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 2 + Math.random() * 3,
          hue: Math.random() > 0.5 ? 45 : 270,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    let animId: number
    const draw = () => {
      frameRef.current++
      const t = frameRef.current * 0.01
      ctx.clearRect(0, 0, W, H)

      const nodes = nodesRef.current

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx * (analyzing ? 2 : 1)
        n.y += n.vy * (analyzing ? 2 : 1)
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        n.pulse += 0.02
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = analyzing ? 120 : 90
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (analyzing ? 0.25 : 0.12)
            ctx.strokeStyle = nodes[i].hue === 45
              ? `rgba(202,138,4,${alpha})`
              : `rgba(168,85,247,${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const glow = Math.sin(n.pulse) * 0.3 + 0.7
        const color = n.hue === 45
          ? `rgba(202,138,4,${glow * 0.8})`
          : `rgba(168,85,247,${glow * 0.7})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        if (analyzing) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = color.replace(/[\d.]+\)$/, `${glow * 0.08})`)
          ctx.fill()
        }
      }

      // Scanning line when analyzing
      if (analyzing) {
        const scanY = (Math.sin(t * 2) * 0.5 + 0.5) * H
        const gradient = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2)
        gradient.addColorStop(0, "rgba(202,138,4,0)")
        gradient.addColorStop(0.5, "rgba(202,138,4,0.3)")
        gradient.addColorStop(1, "rgba(202,138,4,0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, scanY - 20, W, 40)
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [analyzing, fileCount, round])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ─── Hexagonal Score Display ───
function HexScore({ score, analyzing }: { score: number; analyzing: boolean }) {
  const segments = 6
  const filled = Math.round((score / 100) * segments)
  const color = score >= 90 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171"
  const glowColor = score >= 90 ? "rgba(74,222,128," : score >= 60 ? "rgba(251,191,36," : "rgba(248,113,113,"

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="absolute inset-0">
        {/* Background hex */}
        <polygon
          points="64,4 118,34 118,94 64,124 10,94 10,34"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
        {/* Animated hex segments */}
        {Array.from({ length: segments }).map((_, i) => {
          const angle1 = (i * 60 - 90) * (Math.PI / 180)
          const angle2 = ((i + 1) * 60 - 90) * (Math.PI / 180)
          const r = 56
          const cx = 64, cy = 64
          const x1 = cx + r * Math.cos(angle1)
          const y1 = cy + r * Math.sin(angle1)
          const x2 = cx + r * Math.cos(angle2)
          const y2 = cy + r * Math.sin(angle2)
          const isFilled = i < filled
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isFilled ? color : "rgba(255,255,255,0.04)"}
              strokeWidth={isFilled ? "3" : "1.5"}
              strokeLinecap="round"
              style={{
                filter: isFilled ? `drop-shadow(0 0 6px ${glowColor}0.5))` : "none",
                transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                transitionDelay: `${i * 0.1}s`,
              }}
            />
          )
        })}
        {/* Inner pulse ring */}
        <circle
          cx="64" cy="64" r="36"
          fill="none"
          stroke={`${glowColor}${analyzing ? "0.15" : "0.06"})`}
          strokeWidth="1"
          style={{
            animation: analyzing ? "wf-running-pulse 1.5s ease-in-out infinite" : "none",
          }}
        />
      </svg>
      {/* Score number */}
      <div className="relative flex flex-col items-center z-10">
        <span
          className="text-3xl font-black tabular-nums"
          style={{
            color,
            textShadow: `0 0 20px ${glowColor}0.4)`,
            transition: "all 0.8s ease",
          }}
        >
          {score}
        </span>
        <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
          Quality
        </span>
      </div>
    </div>
  )
}

// ─── Round indicator dots ───
function RoundTracker({ round, maxRounds }: { round: number; maxRounds: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxRounds }).map((_, i) => (
        <div
          key={i}
          className="transition-all duration-500"
          style={{
            width: i < round ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: i < round
              ? "linear-gradient(90deg, #CA8A04, #EAB308)"
              : i === round
              ? "rgba(202,138,4,0.4)"
              : "rgba(255,255,255,0.06)",
            boxShadow: i < round ? "0 0 8px rgba(202,138,4,0.3)" : "none",
          }}
        />
      ))}
    </div>
  )
}

// ─── Stat pill ───
function StatPill({ icon: Icon, label, value, color }: {
  icon: typeof Brain; label: string; value: string | number; color: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div>
        <div className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</div>
        <div className="text-[11px] font-bold text-zinc-300">{value}</div>
      </div>
    </div>
  )
}

export function ExpandOverlay({
  workflowId,
  workflowTitle,
  onClose,
  onComplete,
}: ExpandOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [guidance, setGuidance] = useState("")
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileCount, setFileCount] = useState(0)
  const [finalFiles, setFinalFiles] = useState<string[]>([])
  const [genProgress, setGenProgress] = useState<{ completed: number; total: number; current: string } | null>(null)
  const [appliedCount, setAppliedCount] = useState(0)
  const [analysisCtx, setAnalysisCtx] = useState<AnalysisContext | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 100)
  }, [])

  // Load analysis context first, then start interactive round
  useEffect(() => {
    loadAnalysisContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId])

  const loadAnalysisContext = async () => {
    setLoadingAnalysis(true)
    setError(null)
    try {
      const res = await fetch(`/api/workflows/${workflowId}/analyze`)
      if (res.ok) {
        const data = await res.json()
        const ctx: AnalysisContext = {
          initial_score: data.initial_score || 0,
          analysis_summary: data.analysis_summary || "",
          tech_stack_detected: data.tech_stack_detected || [],
          strengths: [],
          weaknesses: [],
          architecture_pattern: "",
          readiness_level: "",
          contextual_questions: [],
        }
        // Full context is stored in expansion_config, fetch workflow detail
        const wfRes = await fetch(`/api/workflows/${workflowId}`)
        let savedMessages: any[] = []
        if (wfRes.ok) {
          const wfData = await wfRes.json()
          const config = wfData.workflow?.expansion_config
          if (config) {
            ctx.strengths = config.strengths || []
            ctx.weaknesses = config.weaknesses || []
            ctx.architecture_pattern = config.architecture_pattern || ""
            ctx.readiness_level = config.readiness_level || ""
            ctx.contextual_questions = config.contextual_questions || []

            // Load saved chat messages
            savedMessages = Array.isArray(config.chat_messages) ? config.chat_messages : []
            if (savedMessages.length > 0) {
              // Restore messages from history
              const restoredMessages: ChatMessage[] = savedMessages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                score: msg.score,
                suggestions: msg.suggestions?.map((s: any) => ({
                  ...s,
                  applied: false,
                  applying: false,
                })) || [],
              }))
              setMessages(restoredMessages)

              // Set round and score from last message
              const lastMsg = restoredMessages[restoredMessages.length - 1]
              if (lastMsg.round) setRound(lastMsg.round)
              if (lastMsg.score) setScore(lastMsg.score)
              if (config.rounds_completed) setRound(config.rounds_completed)
              if (config.last_score) setScore(config.last_score)

              // Set file count from analysis
              if (config.file_count_at_start) setFileCount(config.file_count_at_start)
            }
          }
        }
        setAnalysisCtx(ctx)
        setScore(ctx.initial_score)

        // Only show welcome message if no saved messages
        if (savedMessages.length === 0 && data.analysis_summary) {
          const welcomeMsg: ChatMessage = {
            id: `analysis-welcome-${Date.now()}`,
            role: "ai",
            content: ctx.analysis_summary,
            score: ctx.initial_score,
          }
          setMessages([welcomeMsg])
        }

        setLoadingAnalysis(false)
        scrollToBottom()
        return
      }
      // If response not OK, throw error to trigger fallback
      const errorText = await res.text().catch(() => "Unknown error")
      let errorMsg = `HTTP ${res.status}`
      try { errorMsg = JSON.parse(errorText).error || errorMsg } catch { /* fallback */ }
      throw new Error(errorMsg)
    } catch (e) {
      console.error("Failed to load analysis:", e)
      setError(e instanceof Error ? e.message : String(e))
    }
    // Fallback: no analysis context, run first round directly
    setLoadingAnalysis(false)
    runAnalysis()
  }

  const runAnalysis = async (userMsg?: string) => {
    setAnalyzing(true)
    setError(null)

    if (userMsg) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: userMsg },
      ])
      scrollToBottom()
    }

    try {
      const res = await fetch(`/api/workflows/${workflowId}/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidance: userMsg || "", round }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setScore(data.score)
      setRound(data.round)
      setFileCount(data.fileCount)

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: data.analysis,
        score: data.score,
        suggestions: data.suggestions?.map((s: Suggestion) => ({
          ...s, applied: false, applying: false,
        })),
      }

      setMessages((prev) => [...prev, aiMsg])
      scrollToBottom()

      // Persist conversation history to backend
      try {
        await fetch(`/api/workflows/${workflowId}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_history: [...(messages || []), aiMsg],
            last_round: data.round || (messages?.length > 0 ? messages.length + 1 : 1),
            total_interactions: (messages?.length || 0) + 2  // account for both user and AI messages added
          })
        }).catch(console.error)
      } catch (saveError) {
        console.error("Failed to save conversation history:", saveError)
      }

      if (data.isComplete) {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-complete-${Date.now()}`,
            role: "system",
            content: "Quality threshold reached. Ready to generate your 72-file intelligence package.",
          },
        ])
        scrollToBottom()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  const applySuggestion = async (msgId: string, suggestion: Suggestion) => {
    setApplying(suggestion.id)
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, suggestions: m.suggestions?.map((s) => s.id === suggestion.id ? { ...s, applying: true } : s) }
          : m
      )
    )

    try {
      const res = await fetch(`/api/workflows/${workflowId}/expand`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, suggestions: m.suggestions?.map((s) => s.id === suggestion.id ? { ...s, applied: true, applying: false } : s) }
            : m
        )
      )

      setFileCount(data.totalFiles)
      setAppliedCount((c) => c + 1)

      setMessages((prev) => [
        ...prev,
        {
          id: `applied-${Date.now()}`,
          role: "system",
          content: `✦ Applied: "${suggestion.title}" → ${data.filename} (${data.wordCount} words)`,
          appliedFile: data.filename,
        },
      ])
      scrollToBottom()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, suggestions: m.suggestions?.map((s) => s.id === suggestion.id ? { ...s, applying: false } : s) }
            : m
        )
      )
    } finally {
      setApplying(null)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setGenProgress({ completed: 0, total: 72, current: "Starting..." })
    setMessages((prev) => [
      ...prev,
      { id: `finalizing-${Date.now()}`, role: "system", content: "Generating 72-file Project Intelligence Upgrade Package across 12 categories..." },
    ])
    scrollToBottom()

    // Timeout to prevent hanging if AI is slow or stream stalls
    const timeoutMs = 30000 // 30 seconds
    let timeoutId: NodeJS.Timeout | null = null
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
    let streamCompleted = false

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Generation timed out after 30 seconds. The AI generation may be slow or may have encountered an issue. Please try again or contact support if this persists."))
      }, timeoutMs)
    })

    try {
      const res = await fetch(`/api/workflows/${workflowId}/expand`, { method: "PATCH" })
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error")
        let errorMsg = `HTTP ${res.status}`
        try { errorMsg = JSON.parse(text).error || errorMsg } catch { /* fallback */ }
        throw new Error(errorMsg)
      }
      if (!res.body) throw new Error("No response stream")

      reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let lastFiles: string[] = []

      // Race between stream completion and timeout
      await Promise.race([
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader!.read()
              if (done) {
                streamCompleted = true
                break
              }

              if (value && value.length > 0) {
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() ?? ""

                for (const line of lines) {
                  if (!line.trim()) continue
                  try {
                    const event = JSON.parse(line)
                    if (event.type === "start") setGenProgress({ completed: 0, total: event.total, current: "Starting..." })
                    if (event.type === "file_start") setGenProgress((p) => ({ completed: p?.completed || 0, total: p?.total || 72, current: event.filename }))
                    if (event.type === "file_complete") {
                      setGenProgress({ completed: event.completed, total: event.total, current: event.filename })
                      if (event.completed % 6 === 0 || event.completed === event.total) {
                        setMessages((prev) => [...prev, { id: `gen-${Date.now()}-${event.completed}`, role: "system", content: `Generated ${event.completed}/${event.total} files (${event.progress}%)` }])
                        scrollToBottom()
                      }
                    }
                    if (event.type === "complete") {
                      lastFiles = event.files || []
                      setIsComplete(true)
                      setFinalFiles(lastFiles)
                      setFileCount(event.totalFiles)
                      setGenProgress(null)
                      setMessages((prev) => [...prev, { id: `done-${Date.now()}`, role: "system", content: `Expansion complete! ${event.totalFiles} files generated across 12 categories.` }])
                      scrollToBottom()
                      onComplete()
                      return // exit loop on complete
                    }
                    if (event.type === "error") throw new Error(event.error)
                  } catch (parseErr) {
                    if (parseErr instanceof Error && parseErr.message && !line.startsWith("{")) { /* skip */ }
                    else if (parseErr instanceof Error && parseErr.message) throw parseErr
                  }
                }
              }
            }
          } catch (err) {
            throw err
          } finally {
            // Ensure reader is closed if stream completed naturally
            if (!streamCompleted && reader) {
              try {
                await reader.cancel("Stream completed without explicit completion")
              } catch (cancelErr) {
                // Cancel errors are expected, ignore them
                console.log("Stream cancel (expected):", cancelErr)
              }
            }
          }

          // If stream ends without explicit complete, treat last files as complete
          if (!isComplete && lastFiles.length > 0) {
            setIsComplete(true)
            setFinalFiles(lastFiles)
            setGenProgress(null)
            onComplete()
          }
        })(),
        timeoutPromise,
      ])
    } catch (e) {
      // Handle timeout specifically for better user feedback
      if (e instanceof Error && e.message.includes("timed out")) {
        setError(e.message)
        setMessages((prev) => [...prev, { id: `timeout-${Date.now()}`, role: "system", content: `⏱️ Generation timed out after 30 seconds. This often indicates a slow AI response. You can: 1) Contact support if this persists, 2) Try again with a simpler request, 3) Check back in a few minutes.` }])
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
      setGenProgress(null)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      // Ensure stream reader is always cleaned up
      if (reader && !streamCompleted) {
        try {
          await reader.cancel("Component cleanup")
        } catch (cancelErr) {
          console.log("Stream cleanup (expected):", cancelErr)
        }
      }
      setFinalizing(false)
    }
  }

  const handleSendGuidance = () => {
    if (!guidance.trim() || analyzing) return
    const msg = guidance.trim()
    setGuidance("")
    runAnalysis(msg)
  }

  const handleDownloadAll = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}`)
      if (!res.ok) return
      const data = await res.json()
      const files = data.workflow?.generated_files || {}
      const { zipSync, strToU8 } = await import("fflate")
      const zipFiles: Record<string, Uint8Array> = {}
      for (const [name, content] of Object.entries(files)) {
        zipFiles[name] = strToU8(content as string)
      }
      const zipped = zipSync(zipFiles, { level: 6 })
      const blob = new Blob([zipped], { type: "application/zip" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${workflowTitle.toLowerCase().replace(/\s+/g, "-")}-expanded.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Download failed:", e)
    }
  }

  const scoreColor = score >= 90 ? "text-green-400" : score >= 60 ? "text-amber-400" : "text-red-400"
  const allSuggestionsApplied = messages.flatMap((m) => m.suggestions || []).filter((s) => !s.applied).length === 0 && messages.some((m) => m.suggestions?.length)

  return (
    <div className="fixed inset-0 z-[100] wf-overlay-enter">
      {/* Full-screen backdrop with neural canvas */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl">
        {/* Global neural canvas covering entire overlay */}
        <div className="absolute inset-0 opacity-40">
          <NeuralCanvas score={score} analyzing={analyzing} fileCount={fileCount} round={round} />
        </div>
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-amber-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05)_0%,transparent_70%)]" />
        {/* Animated scan lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.3) 3px, transparent 3px)",
              animation: "scan 8s linear infinite",
              backgroundSize: "100% 200%",
              backgroundPosition: "0% 0%",
            }}
          />
        </div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-500/20 rounded-full animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-amber-500/20 rounded-full animate-pulse" style={{ animationDuration: "4s", animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-500/20 rounded-full animate-pulse" style={{ animationDuration: "5s", animationDelay: "2s" }} />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-500/10 rounded-full animate-pulse" style={{ animationDuration: "6s", animationDelay: "0.5s" }} />
        </div>
      </div>

      {/* ═══ 3-COLUMN LAYOUT ═══ */}
      <div className="relative z-10 flex h-full">

        {/* ─── LEFT PANEL: HUD ─── */}
        <div className="w-72 flex-shrink-0 border-r border-white/[0.04] flex flex-col relative overflow-hidden bg-black/40">
          <div className="relative z-10 flex flex-col h-full p-5">
            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(202,138,4,0.3), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(202,138,4,0.3)",
                    boxShadow: "0 0 12px rgba(202,138,4,0.15)",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500/80">Expansion Engine</span>
              </div>
              <h2 className="text-sm font-bold text-white leading-snug">{workflowTitle}</h2>
            </div>

            {/* Hex score */}
            <div className="flex justify-center mb-4">
              <HexScore score={score} analyzing={analyzing} />
            </div>

            {/* Round tracker */}
            <div className="mb-5">
              <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600 mb-2 font-bold">Round Progress</div>
              <RoundTracker round={round} maxRounds={10} />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <StatPill icon={FileText} label="Files" value={fileCount} color="text-amber-400" />
              <StatPill icon={Activity} label="Applied" value={appliedCount} color="text-green-400" />
              <StatPill icon={Cpu} label="Round" value={round} color="text-purple-400" />
              <StatPill icon={Gauge} label="Score" value={`${score}%`} color={scoreColor} />
            </div>

            {/* Status beacon */}
            <div className="mt-auto">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="relative">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: analyzing ? "#fbbf24" : isComplete ? "#4ade80" : error ? "#f87171" : "#a855f7",
                      boxShadow: `0 0 8px ${analyzing ? "rgba(251,191,36,0.5)" : isComplete ? "rgba(74,222,128,0.5)" : error ? "rgba(248,113,113,0.5)" : "rgba(168,85,247,0.5)"}`,
                    }}
                  />
                  {analyzing && (
                    <div
                      className="absolute inset-0 w-2.5 h-2.5 rounded-full"
                      style={{ background: "#fbbf24", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">
                  {analyzing ? "Scanning architecture..." : finalizing ? "Generating files..." : isComplete ? "Expansion complete" : error ? "Error occurred" : "Awaiting input"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CENTER PANEL: CONVERSATION ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top chrome */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/[0.04]"
            style={{ background: "rgba(9,9,11,0.8)" }}>
            <div className="flex items-center gap-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-zinc-300">Midas AI Expansion</span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[10px] text-zinc-600 font-mono">v2.0</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 scrollbar-architect">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Loading analysis state */}
              {loadingAnalysis && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(168,85,247,0.1))", border: "1px solid rgba(6,182,212,0.2)" }}>
                      <Brain className="w-7 h-7 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white mb-1">Loading Analysis Results</p>
                    <p className="text-[11px] text-zinc-500">Preparing your project intelligence report...</p>
                  </div>
                </div>
              )}

              {/* Analysis context cards — strengths/weaknesses */}
              {analysisCtx && !loadingAnalysis && round === 0 && (
                <div className="space-y-4" style={{ animation: "wf-msg-enter 0.5s ease-out both" }}>
                  {/* Tech stack + pattern */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {analysisCtx.tech_stack_detected.slice(0, 8).map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-purple-500/10 border border-purple-500/15 text-purple-300">
                        {t}
                      </span>
                    ))}
                    {analysisCtx.architecture_pattern && (
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-cyan-500/10 border border-cyan-500/15 text-cyan-300">
                        {analysisCtx.architecture_pattern}
                      </span>
                    )}
                    {analysisCtx.readiness_level && (
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-amber-500/10 border border-amber-500/15 text-amber-300">
                        {analysisCtx.readiness_level}
                      </span>
                    )}
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 bg-green-500/[0.03] border border-green-500/10">
                      <div className="text-[9px] font-bold text-green-400 uppercase tracking-wider mb-2">Strengths</div>
                      {analysisCtx.strengths.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1.5">
                          <Check className="w-3 h-3 text-green-400/60 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] text-green-300/80 leading-snug">{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-3 bg-red-500/[0.03] border border-red-500/10">
                      <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-2">Areas to Improve</div>
                      {analysisCtx.weaknesses.slice(0, 4).map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-400/60 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] text-red-300/80 leading-snug">{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contextual Questions */}
                  {analysisCtx.contextual_questions && analysisCtx.contextual_questions.length > 0 && (
                    <div className="rounded-xl p-3 bg-purple-500/[0.03] border border-purple-500/10">
                      <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-2">AI Discovered</div>
                      {analysisCtx.contextual_questions.slice(0, 3).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setGuidance(q)
                            setTimeout(() => handleSendGuidance(), 100)
                          }}
                          className="flex items-start gap-2 mb-1.5 text-left w-full group/question"
                        >
                          <HelpCircle className="w-3 h-3 text-purple-400/60 mt-0.5 flex-shrink-0" />
                          <span className="text-[10px] text-purple-300/80 leading-snug group-hover/question:text-purple-200 transition-colors">{q}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, idx) => {
                if (msg.role === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center" style={{ animation: `wf-msg-enter 0.4s ease-out ${idx * 0.05}s both` }}>
                      <div className="px-4 py-2 rounded-full text-[10px] text-zinc-500 flex items-center gap-2"
                        style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        {msg.appliedFile ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : msg.content.includes("Generating") ? (
                          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                        ) : msg.content.includes("complete") || msg.content.includes("Complete") ? (
                          <Sparkles className="w-3 h-3 text-green-400" />
                        ) : (
                          <BarChart3 className="w-3 h-3 text-amber-400" />
                        )}
                        {msg.content}
                      </div>
                    </div>
                  )
                }

                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end" style={{ animation: "wf-msg-enter 0.3s ease-out both" }}>
                      <div className="max-w-md px-4 py-3 rounded-2xl rounded-br-sm"
                        style={{
                          background: "linear-gradient(135deg, rgba(202,138,4,0.12), rgba(202,138,4,0.06))",
                          border: "1px solid rgba(202,138,4,0.15)",
                        }}>
                        <p className="text-xs text-amber-200/90">{msg.content}</p>
                      </div>
                    </div>
                  )
                }

                // AI message with suggestions
                return (
                  <div key={msg.id} className="space-y-4" style={{ animation: "wf-msg-enter 0.5s ease-out both" }}>
                    {/* Analysis */}
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))",
                          border: "1px solid rgba(168,85,247,0.2)",
                          boxShadow: "0 0 16px rgba(168,85,247,0.08)",
                        }}>
                        <Brain className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Midas AI</span>
                          {msg.score !== undefined && (
                            <div
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                              style={{
                                background: msg.score >= 90 ? "rgba(74,222,128,0.1)" : msg.score >= 60 ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
                                color: msg.score >= 90 ? "#4ade80" : msg.score >= 60 ? "#fbbf24" : "#f87171",
                                border: `1px solid ${msg.score >= 90 ? "rgba(74,222,128,0.2)" : msg.score >= 60 ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)"}`,
                              }}
                            >
                              {msg.score}%
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 leading-relaxed"
                          style={{ maxWidth: "100%" }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>

                    {/* Suggestion cards — holographic style */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="ml-12 space-y-3">
                        {msg.suggestions.map((s, sIdx) => {
                          const CatIcon = CATEGORY_ICONS[s.category] || Target
                          const pCfg = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.medium
                          const isApplied = s.applied
                          const isApplying = s.applying

                          return (
                            <div
                              key={s.id}
                              className="group relative rounded-2xl overflow-hidden transition-all duration-500"
                              style={{
                                animation: `wf-card-reveal 0.5s ease-out ${sIdx * 0.12}s both`,
                                border: isApplied
                                  ? "1px solid rgba(74,222,128,0.25)"
                                  : isApplying
                                  ? "1px solid rgba(202,138,4,0.3)"
                                  : "1px solid rgba(255,255,255,0.06)",
                                background: isApplied
                                  ? "linear-gradient(135deg, rgba(74,222,128,0.04), rgba(74,222,128,0.01))"
                                  : isApplying
                                  ? "linear-gradient(135deg, rgba(202,138,4,0.06), rgba(202,138,4,0.02))"
                                  : "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))",
                              }}
                            >
                              {/* Holographic shimmer on hover */}
                              {!isApplied && !isApplying && (
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                  style={{
                                    background: "linear-gradient(105deg, transparent 40%, rgba(202,138,4,0.06) 45%, rgba(168,85,247,0.04) 50%, transparent 55%)",
                                    backgroundSize: "300% 100%",
                                    animation: "wf-holo-sweep 3s ease-in-out infinite",
                                  }}
                                />
                              )}

                              <div className="relative p-4">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{
                                        background: isApplied ? "rgba(74,222,128,0.1)" : `${pCfg.glow.replace("0.15", "0.1")}`,
                                        border: `1px solid ${isApplied ? "rgba(74,222,128,0.2)" : pCfg.glow.replace("0.15", "0.2")}`,
                                      }}
                                    >
                                      <CatIcon className={`w-3.5 h-3.5 ${isApplied ? "text-green-400" : pCfg.text}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className={`text-xs font-semibold leading-snug ${isApplied ? "text-green-300" : "text-white"}`}>
                                        {s.title}
                                      </h4>
                                      <span className="text-[9px] text-zinc-600 font-mono">
                                        {s.target_file.startsWith("NEW_FILE:") ? `+ ${s.target_file.replace("NEW_FILE:", "")}` : s.target_file}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className="text-[8px] font-black uppercase px-2 py-1 rounded-md flex-shrink-0"
                                    style={{
                                      background: pCfg.glow.replace("0.15", "0.08"),
                                      color: pCfg.text.replace("text-", "").includes("red") ? "#f87171"
                                        : pCfg.text.includes("amber") ? "#fbbf24" : "#60a5fa",
                                      border: `1px solid ${pCfg.glow.replace("0.15", "0.15")}`,
                                      letterSpacing: "0.1em",
                                    }}
                                  >
                                    {s.priority}
                                  </span>
                                </div>

                                {/* Description */}
                                <p className="text-[11px] text-zinc-500 leading-relaxed mb-3 pl-[38px]">
                                  {s.description}
                                </p>

                                {/* Action row */}
                                <div className="flex items-center justify-end">
                                  {isApplied ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-semibold">
                                      <div className="w-4 h-4 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5" />
                                      </div>
                                      Applied
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => applySuggestion(msg.id, s)}
                                      disabled={!!applying}
                                      className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold text-black transition-all disabled:opacity-40 overflow-hidden group/btn"
                                      style={{
                                        background: "linear-gradient(135deg, #CA8A04, #EAB308)",
                                        boxShadow: "0 2px 12px rgba(202,138,4,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                                      }}
                                    >
                                      <div
                                        className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                        style={{
                                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                          animation: "wf-btn-shimmer 2s linear infinite",
                                          backgroundSize: "200% 100%",
                                        }}
                                      />
                                      {isApplying ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5 relative z-10" />
                                      )}
                                      <span className="relative z-10">{isApplying ? "Applying..." : "Apply Fix"}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Analyzing state */}
              {analyzing && (
                <div className="flex gap-3" style={{ animation: "wf-msg-enter 0.3s ease-out both" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }}>
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-1 h-4 rounded-full bg-purple-400/60"
                            style={{
                              animation: `wf-bar-pulse 1.2s ease-in-out ${i * 0.1}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-zinc-500">Scanning architecture deep structure...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation progress */}
              {genProgress && (
                <div className="rounded-2xl overflow-hidden" style={{ animation: "wf-msg-enter 0.3s ease-out both", border: "1px solid rgba(202,138,4,0.15)", background: "rgba(202,138,4,0.03)" }}>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                          <div className="absolute inset-0 w-5 h-5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                        </div>
                        <span className="text-xs font-bold text-amber-300">Generating Intelligence Package</span>
                      </div>
                      <span className="text-sm font-black text-amber-400 tabular-nums">
                        {Math.round((genProgress.completed / genProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.round((genProgress.completed / genProgress.total) * 100)}%`,
                          background: "linear-gradient(90deg, #92400e, #CA8A04, #EAB308, #FBBF24)",
                        }}
                      />
                      <div className="absolute inset-0 wf-progress-wave" style={{ opacity: 0.3 }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400/40" />
                      <span className="text-[10px] text-zinc-500 font-mono truncate">{genProgress.current}</span>
                      <span className="ml-auto text-[10px] text-zinc-600 font-mono">{genProgress.completed}/{genProgress.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-5 py-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-red-300">Error</span>
                  </div>
                  <p className="text-[11px] text-red-400/80 font-mono">{error}</p>
                </div>
              )}

              {/* Final files */}
              {isComplete && finalFiles.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ animation: "wf-msg-enter 0.5s ease-out both", border: "1px solid rgba(74,222,128,0.15)", background: "linear-gradient(135deg, rgba(74,222,128,0.04), rgba(74,222,128,0.01))" }}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-green-300">Project Intelligence Package</span>
                      </div>
                      <span className="text-[10px] font-mono text-green-500 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/15">
                        {finalFiles.length} files
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto scrollbar-architect">
                      {finalFiles.map((f, i) => (
                        <div
                          key={f}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all hover:bg-green-500/5"
                          style={{ animation: `wf-msg-enter 0.3s ease-out ${i * 0.02}s both` }}
                        >
                          <FileText className="w-3 h-3 text-green-400/70 flex-shrink-0" />
                          <span className="text-[9px] font-mono text-green-300/80 truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Bottom input bar ─── */}
          <div className="flex-shrink-0 border-t border-white/[0.04] px-6 py-4" style={{ background: "rgba(9,9,11,0.9)" }}>
            <div className="max-w-2xl mx-auto">
              {isComplete ? (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all"
                    style={{
                      background: "linear-gradient(135deg, #CA8A04, #EAB308)",
                      boxShadow: "0 2px 20px rgba(202,138,4,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download All ({fileCount} files)
                  </button>
                </div>
              ) : score >= 90 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-green-400">
                    <div className="w-5 h-5 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Score reached 90%+ — ready to finalize</span>
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      boxShadow: "0 2px 20px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }}
                  >
                    {finalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {finalizing ? `Generating ${genProgress ? `${genProgress.completed}/` : ""}72 files...` : "Finalize — Generate 72 Files"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Quick action buttons */}
                  {(() => {
                    const lastMessage = messages[messages.length - 1]
                    const quickActions = lastMessage?.quick_actions
                    return quickActions && quickActions.length > 0
                  })() && (
                    <div className="flex flex-wrap gap-2">
                      {messages[messages.length - 1]?.quick_actions?.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => {
                            setGuidance(action.guidance)
                            setTimeout(() => handleSendGuidance(), 100)
                          }}
                          disabled={analyzing || finalizing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-zinc-300 hover:text-white transition-all disabled:opacity-40"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {action.icon === "docs" && <FileText className="w-3 h-3" />}
                          {action.icon === "test" && <CheckCircle className="w-3 h-3" />}
                          {action.icon === "code" && <Code className="w-3 h-3" />}
                          {action.icon === "security" && <Shield className="w-3 h-3" />}
                          {action.icon === "perf" && <Zap className="w-3 h-3" />}
                          {action.icon === "deploy" && <Rocket className="w-3 h-3" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={guidance}
                        onChange={(e) => setGuidance(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendGuidance()}
                        placeholder={allSuggestionsApplied ? "Guide the next round or press Enter to continue..." : "Guide the AI analysis focus..."}
                        disabled={analyzing || finalizing}
                        className="w-full pl-4 pr-12 py-3 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all disabled:opacity-40"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      />
                      <button
                        onClick={handleSendGuidance}
                        disabled={analyzing || finalizing}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: guidance.trim() ? "rgba(202,138,4,0.15)" : "transparent" }}
                      >
                        <Send className="w-4 h-4 text-amber-400" />
                      </button>
                    </div>
                    {allSuggestionsApplied && !analyzing && (
                      <button
                        onClick={() => runAnalysis()}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-amber-300 transition-all flex-shrink-0 group/next"
                        style={{
                          background: "rgba(202,138,4,0.06)",
                          border: "1px solid rgba(202,138,4,0.15)",
                        }}
                      >
                        <ChevronRight className="w-3.5 h-3.5 group-hover/next:translate-x-0.5 transition-transform" />
                        Next Round
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL: File Constellation ─── */}
        <div className="w-64 flex-shrink-0 border-l border-white/[0.04] flex flex-col relative overflow-hidden" style={{ background: "rgba(9,9,11,0.6)" }}>
          <div className="p-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Map</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scrollbar-architect">
            <div className="space-y-1">
              {messages
                .flatMap((m) => m.suggestions || [])
                .filter((s) => s.applied)
                .map((s, i) => (
                  <div
                    key={`${s.id}-${i}`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                    style={{
                      background: "rgba(74,222,128,0.03)",
                      border: "1px solid rgba(74,222,128,0.08)",
                      animation: `wf-msg-enter 0.3s ease-out both`,
                    }}
                  >
                    <Check className="w-3 h-3 text-green-400/60 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono text-green-300/70 truncate">
                        {s.target_file.replace("NEW_FILE:", "")}
                      </div>
                      <div className="text-[8px] text-zinc-600 truncate">{s.title}</div>
                    </div>
                  </div>
                ))}

              {finalFiles.length > 0 && (
                <>
                  <div className="my-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/[0.04]" />
                    <span className="text-[8px] text-zinc-600 uppercase">Final Package</span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  {finalFiles.map((f, i) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.02] transition-all"
                      style={{ animation: `wf-msg-enter 0.2s ease-out ${i * 0.015}s both` }}
                    >
                      <FileText className="w-2.5 h-2.5 text-amber-400/40 flex-shrink-0" />
                      <span className="text-[8px] font-mono text-zinc-500 truncate">{f}</span>
                    </div>
                  ))}
                </>
              )}

              {messages.flatMap((m) => m.suggestions || []).filter((s) => s.applied).length === 0 && finalFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Orbit className="w-8 h-8 text-zinc-800 mb-3" />
                  <span className="text-[10px] text-zinc-700">Files will appear here as improvements are applied</span>
                </div>
              )}
            </div>
          </div>

          {/* File count badge */}
          <div className="p-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
              <span className="text-[9px] text-zinc-600">Total Files</span>
              <span className="text-xs font-bold text-zinc-400 tabular-nums">{fileCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
