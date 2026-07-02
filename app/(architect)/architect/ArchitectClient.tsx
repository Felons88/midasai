"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArchitectJobStore } from "@/lib/architect/job-store"
import {
  Send, Sparkles, Copy, Check,
  Bot, User, Layers, Zap, FileText, RefreshCw, ArrowRight,
  Brain, Code2, Shield, BookOpen, Archive, GitBranch,
  Database, Cpu, Network, Lock, TestTube, Rocket,
  ChevronRight, Activity, Folder, Settings, History, Clock, FolderOpen,
  AlertTriangle, Hammer
} from "lucide-react"

type Phase = "idle" | "discovering" | "ready" | "creating" | "done"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  confidence?: number
  phase?: string
  summary?: ProjectSummary | null
}

interface ProjectSummary {
  projectName: string
  goal: string
  agents: { name: string; role: string; responsibilities: string }[]
  skills: { name: string; reason: string }[]
  workflows: string[]
  filesToGenerate: string[]
}

interface GeneratedFiles {
  [filename: string]: string
}

interface SessionSummary {
  id: string
  session_name: string | null
  phase: string
  confidence: number
  file_count: number
  created_at: string
  updated_at: string
  completed_at: string | null
  summary: ProjectSummary | null
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Welcome to **Midas Architect**.\n\nI'm here to help you design a complete AI project — agents, workflows, skills, and all the documentation your team needs to build and ship.\n\nTell me about your idea. What are you trying to build?",
  confidence: 0,
  phase: "discovering",
  summary: null,
}

const STATUS_STEPS = [
  { icon: Brain, label: "Analyzing your project", color: "text-amber-400" },
  { icon: Layers, label: "Designing architecture", color: "text-blue-400" },
  { icon: Bot, label: "Assigning agents", color: "text-purple-400" },
  { icon: GitBranch, label: "Mapping workflows", color: "text-green-400" },
  { icon: Sparkles, label: "Recommending skills", color: "text-pink-400" },
  { icon: FileText, label: "Scanning marketplace skills", color: "text-amber-400" },
]

// Workflow node graph shown during file creation
const WORKFLOW_NODES = [
  { id: "context",  icon: Brain,     label: "CONTEXT.md",      x: 50,  y: 20,  color: "#f59e0b" },
  { id: "agents",   icon: Bot,       label: "AGENTS.md",       x: 20,  y: 50,  color: "#a78bfa" },
  { id: "arch",     icon: Cpu,       label: "ARCHITECTURE.md", x: 80,  y: 50,  color: "#60a5fa" },
  { id: "skills",   icon: Zap,       label: "SKILLS.md",       x: 35,  y: 80,  color: "#34d399" },
  { id: "workflows",icon: GitBranch, label: "WORKFLOWS.md",    x: 65,  y: 80,  color: "#f472b6" },
  { id: "readme",   icon: BookOpen,  label: "README.md",       x: 50,  y: 50,  color: "#fbbf24" },
  { id: "security", icon: Lock,      label: "SECURITY.md",     x: 10,  y: 80,  color: "#ef4444" },
  { id: "testing",  icon: TestTube,  label: "TESTING.md",      x: 90,  y: 80,  color: "#06b6d4" },
  { id: "deploy",   icon: Rocket,    label: "DEPLOYMENT.md",   x: 50,  y: 95,  color: "#10b981" },
  { id: "database", icon: Database,  label: "DATABASE.md",     x: 25,  y: 15,  color: "#f97316" },
  { id: "api",      icon: Network,   label: "API.md",           x: 75,  y: 15,  color: "#8b5cf6" },
]

const GENERATE_STEPS = [
  { icon: Brain,     label: "Reading project context" },
  { icon: Layers,    label: "Designing file structure" },
  { icon: Code2,     label: "Writing README.md" },
  { icon: Bot,       label: "Writing AGENTS.md" },
  { icon: GitBranch, label: "Writing WORKFLOWS.md" },
  { icon: Shield,    label: "Writing CONTEXT.md" },
  { icon: BookOpen,  label: "Finalizing documentation" },
  { icon: Rocket,    label: "Project ready" },
]

function ConfidenceRing({ value }: { value: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference
  const color = value < 40 ? "#f59e0b" : value < 70 ? "#3b82f6" : "#10b981"

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg width="56" height="56" className="-rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={radius} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">{value}%</span>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-amber-400/60"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function renderMarkdown(content: string): React.ReactNode[] {
  return content.split("\n").map((line, idx) => {
    // H2 header
    if (line.startsWith("## ")) {
      return <h3 key={idx} className="text-amber-400 font-semibold text-sm mt-3 mb-1">{line.slice(3)}</h3>
    }
    // H3 header
    if (line.startsWith("### ")) {
      return <h4 key={idx} className="text-blue-400 font-medium text-xs mt-2 mb-0.5">{line.slice(4)}</h4>
    }
    // Bullet
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const inner = line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`(.*?)`/g, "<code class='bg-white/10 px-1 rounded text-amber-300 text-xs'>$1</code>")
      return <li key={idx} className="text-zinc-300 text-sm ml-3 list-disc leading-relaxed" dangerouslySetInnerHTML={{ __html: inner }} />
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const inner = line.replace(/^\d+\.\s/, "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`(.*?)`/g, "<code class='bg-white/10 px-1 rounded text-amber-300 text-xs'>$1</code>")
      return <li key={idx} className="text-zinc-300 text-sm ml-3 list-decimal leading-relaxed" dangerouslySetInnerHTML={{ __html: inner }} />
    }
    // Empty line
    if (line.trim() === "") return <div key={idx} className="h-1" />
    // Regular paragraph with bold/code
    const html = line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>").replace(/`(.*?)`/g, "<code class='bg-white/10 px-1 rounded text-amber-300 text-xs'>$1</code>")
    return <p key={idx} className="text-zinc-200 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user"
  const isReady = msg.phase === "ready"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={isUser ? { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" } : {}}>
        {isUser
          ? <User className="w-4 h-4 text-amber-400" />
          : <img src="/architect.png" alt="Midas Architect" className="w-full h-full object-cover" />}
      </div>

      <div className={`${isReady ? "max-w-[92%]" : "max-w-[78%]"} ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-amber-500/15 border border-amber-500/20 text-white rounded-tr-sm"
            : isReady
            ? "bg-gradient-to-br from-amber-500/8 to-purple-500/8 border border-amber-500/20 text-zinc-100 rounded-tl-sm"
            : "bg-white/5 border border-white/8 text-zinc-100 rounded-tl-sm"
        }`}>
          {isReady
            ? <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
            : <div className="space-y-0.5">{msg.content.split("\n").map((line, idx) => {
                const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                return <p key={idx} className={`leading-relaxed ${line === "" ? "mt-2" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
              })}</div>
          }
        </div>

        {!isUser && msg.confidence !== undefined && msg.confidence > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="text-xs text-zinc-500">Confidence</div>
            <div className="flex-1 h-1 bg-white/5 rounded-full w-20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${msg.confidence}%`,
                  background: msg.confidence < 40
                    ? "linear-gradient(90deg, #f59e0b, #d97706)"
                    : msg.confidence < 70
                    ? "linear-gradient(90deg, #3b82f6, #6366f1)"
                    : "linear-gradient(90deg, #10b981, #059669)",
                }}
              />
            </div>
            <div className="text-xs font-medium text-zinc-400">{msg.confidence}%</div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ summary, onGenerate, generating }: {
  summary: ProjectSummary
  onGenerate: () => void
  generating: boolean
}) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-purple-500/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{summary.projectName}</div>
            <div className="text-xs text-zinc-400">Architecture ready</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Ready</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{summary.goal}</p>

          {summary.agents.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bot className="w-3 h-3" /> Agents
              </div>
              <div className="space-y-2">
                {summary.agents.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{a.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{a.responsibilities}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.skills.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Recommended Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-300">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.filesToGenerate.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Files to Generate
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.filesToGenerate.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-xs text-zinc-300 font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating project files...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Project Files
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function GeneratingStatus({ currentFile, completedFiles, totalFiles }: {
  currentFile: string | null
  completedFiles: Record<string, string>
  totalFiles: number
}) {
  const completed = Object.keys(completedFiles)
  const progress = totalFiles > 0 ? (completed.length / totalFiles) * 100 : 0
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80)
    return () => clearInterval(id)
  }, [])

  // Orbiting particles
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = ((tick * 1.5 + i * 45) % 360) * (Math.PI / 180)
    const r = 52
    return { x: 64 + r * Math.cos(angle), y: 64 + r * Math.sin(angle), i }
  })

  return (
    <div className="w-full animate-fade-in-up">
      {/* Hero generating card */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(168,85,247,0.06) 50%, rgba(245,158,11,0.04) 100%)" }}>

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.015) 2px, rgba(245,158,11,0.015) 4px)",
            animation: "scanline 4s linear infinite",
          }}
        />

        {/* Animated corner glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)", animation: "pulse 2s ease-in-out infinite" }} />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)", animation: "pulse 2.5s ease-in-out 0.5s infinite" }} />

        <div className="relative z-10 p-6">
          {/* Top row: animated logo + title */}
          <div className="flex items-center gap-5 mb-6">
            {/* SVG orbit animation */}
            <div className="relative flex-shrink-0" style={{ width: 128, height: 128 }}>
              <svg width="128" height="128" className="absolute inset-0">
                {/* Outer ring */}
                <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="1" />
                {/* Animated arc */}
                <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5"
                  strokeDasharray="88 264"
                  style={{ transformOrigin: "64px 64px", animation: "spin 2s linear infinite" }}
                />
                {/* Inner ring */}
                <circle cx="64" cy="64" r="38" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="1" />
                <circle cx="64" cy="64" r="38" fill="none" stroke="rgba(168,85,247,0.5)" strokeWidth="1"
                  strokeDasharray="48 192"
                  style={{ transformOrigin: "64px 64px", animation: "spin 1.4s linear reverse infinite" }}
                />
                {/* Orbiting dots */}
                {particles.map(p => (
                  <circle key={p.i} cx={p.x} cy={p.y} r={p.i % 2 === 0 ? 2.5 : 1.5}
                    fill={p.i % 2 === 0 ? "rgba(245,158,11,0.9)" : "rgba(168,85,247,0.8)"}
                  />
                ))}
              </svg>
              {/* Center logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(245,158,11,0.4)",
                    boxShadow: `0 0 ${20 + Math.sin(tick * 0.1) * 10}px rgba(245,158,11,0.3), inset 0 0 20px rgba(245,158,11,0.05)`,
                  }}>
                  <Sparkles className="w-7 h-7 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.8))" }} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-amber-500 uppercase tracking-widest">Midas Architect</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "pulse 1s ease-in-out infinite" }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ textShadow: "0 0 20px rgba(245,158,11,0.3)" }}>
                Building Your Architecture
              </h2>
              <p className="text-sm text-zinc-400 mb-3">
                {currentFile ? `Writing ${currentFile}…` : completed.length > 0 ? `${completed.length} of ${totalFiles} files complete` : "Initializing generation…"}
              </p>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{
                    width: `${Math.max(progress, 4)}%`,
                    background: "linear-gradient(90deg, #f59e0b, #a855f7, #f59e0b)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s linear infinite",
                  }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)", animation: "shimmer 1.5s linear infinite" }} />
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-zinc-600 font-mono">{completed.length}/{totalFiles} files</span>
                <span className="text-[10px] text-amber-600 font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* File list */}
          <div className="space-y-1.5">
            {completed.map((f, i) => (
              <div key={f} className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  animation: `fadeSlideIn 0.4s ease ${i * 0.05}s both`,
                }}>
                <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-green-400" />
                </div>
                <span className="text-xs font-mono text-green-300">{f}</span>
                <span className="ml-auto text-[10px] text-green-700 font-mono">done</span>
              </div>
            ))}
            {currentFile && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  boxShadow: "0 0 12px rgba(245,158,11,0.1)",
                }}>
                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                </div>
                <span className="text-xs font-mono text-amber-300">{currentFile}</span>
                <div className="ml-auto flex gap-0.5">
                  {[0,1,2,3].map(j => (
                    <div key={j} className="w-1 h-3 rounded-full bg-amber-500/60"
                      style={{ animation: `equalizer 0.6s ease ${j * 0.1}s infinite alternate` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanline { from { background-position: 0 0; } to { background-position: 0 100px; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: 200% center; } to { background-position: -200% center; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes equalizer { from { height: 4px; } to { height: 12px; } }
      `}</style>
    </div>
  )
}

function WorkflowGraph({ activeNodes }: { activeNodes: Set<string> }) {
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/3 to-purple-500/3 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Network className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-white">Generating Architecture</span>
        <span className="text-xs text-zinc-500 ml-1">{activeNodes.size} / {WORKFLOW_NODES.length} files</span>
        <div className="ml-auto flex gap-0.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <div className="relative w-full" style={{ height: "180px" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Draw edges between nearby nodes */}
          {WORKFLOW_NODES.map(from =>
            WORKFLOW_NODES
              .filter(to => to.id !== from.id && Math.hypot(to.x - from.x, to.y - from.y) < 35)
              .map(to => (
                <line key={`${from.id}-${to.id}`}
                  x1={`${from.x}%`} y1={`${from.y}%`}
                  x2={`${to.x}%`} y2={`${to.y}%`}
                  stroke={activeNodes.has(from.id) && activeNodes.has(to.id) ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.04)"}
                  strokeWidth="0.4"
                  style={{ transition: "stroke 0.5s ease" }}
                />
              ))
          )}
        </svg>
        {WORKFLOW_NODES.map(node => {
          const Icon = node.icon
          const active = activeNodes.has(node.id)
          return (
            <div
              key={node.id}
              className="absolute flex flex-col items-center gap-0.5"
              style={{
                left: `${node.x}%`, top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                transition: "all 0.4s ease",
              }}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-500 ${
                  active
                    ? "border-amber-500/50 shadow-lg"
                    : "border-white/8 bg-white/3"
                }`}
                style={active ? { backgroundColor: `${node.color}20`, boxShadow: `0 0 12px ${node.color}40` } : {}}
              >
                <Icon className="w-3 h-3" style={{ color: active ? node.color : "#52525b" }} />
              </div>
              <span
                className="text-[8px] font-mono whitespace-nowrap transition-all duration-500"
                style={{ color: active ? node.color : "#3f3f46" }}
              >
                {node.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileViewer({ files, failedFiles, onDownloadZip, onRetry }: {
  files: GeneratedFiles
  failedFiles: string[]
  onDownloadZip: () => void
  onRetry: (files: string[]) => void
}) {
  const [active, setActive] = useState(Object.keys(files)[0] || "")
  const [copied, setCopied] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  function copyFile() {
    navigator.clipboard.writeText(files[active] || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyAll() {
    const all = Object.entries(files)
      .map(([name, content]) => `# ===== ${name} =====\n\n${content}`)
      .join("\n\n\n")
    navigator.clipboard.writeText(all)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/3 to-emerald-500/3 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Project Generated</div>
            <div className="text-xs text-zinc-400">{Object.keys(files).length} files ready</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
            >
              {copiedAll ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              Copy All
            </button>
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs text-black font-semibold transition-all shadow-md shadow-amber-500/20"
            >
              <Archive className="w-3 h-3" />
              Download ZIP
            </button>
          </div>
        </div>

        {/* Failed files retry banner */}
        {failedFiles.length > 0 && (
          <div className="px-4 py-3 border-b border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-red-300">
                {failedFiles.length} file{failedFiles.length > 1 ? "s" : ""} failed to generate
              </span>
              <button
                onClick={() => onRetry(failedFiles)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-300 hover:bg-red-500/30 hover:text-white transition-all font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Retry All Failed
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {failedFiles.map(f => (
                <div key={f} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-[11px] font-mono text-red-300">{f}</span>
                  <button
                    onClick={() => onRetry([f])}
                    className="ml-1 text-[10px] text-red-500/70 hover:text-red-300 transition-colors"
                    title={`Retry ${f}`}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap border-b border-white/5">
          {Object.keys(files).map(name => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`px-3 py-2 text-[11px] font-mono whitespace-nowrap border-r border-white/5 transition-all ${
                active === name
                  ? "bg-white/8 text-white border-b-2 border-b-amber-500"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={copyFile}
            className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="p-5 text-xs text-zinc-300 font-mono overflow-y-auto overflow-x-hidden leading-relaxed whitespace-pre-wrap break-words scrollbar-architect" style={{ minHeight: '520px', maxHeight: 'calc(100vh - 300px)' }}>
            {files[active]}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function ArchitectClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateStep, setGenerateStep] = useState(0)
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null)
  const [failedFiles, setFailedFiles] = useState<string[]>([])

  // Sync from background job store (survives navigation)
  useEffect(() => {
    return ArchitectJobStore.subscribe(job => {
      if (job.status === "running") {
        setGenerating(true)
        setPhase("creating")
        setCurrentFile(job.currentFile)
        if (Object.keys(job.completedFiles).length > 0) {
          setGeneratedFiles({ ...job.completedFiles })
        }
        setFailedFiles([...job.failedFiles])
      } else if (job.status === "done") {
        setGenerating(false)
        setPhase("done")
        setCurrentFile(null)
        setGeneratedFiles({ ...job.completedFiles })
        setFailedFiles([...job.failedFiles])
        // refresh history
        fetch("/api/architect/session")
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.sessions) setPastSessions(data.sessions) })
          .catch(() => {})
      } else if (job.status === "error") {
        setGenerating(false)
        setPhase("ready")
        setCurrentFile(null)
        if (job.error) {
          // Show error to user
          console.error("Job failed:", job.error)
        }
        setFailedFiles([...job.failedFiles])
      } else {
        // idle status
        setGenerating(false)
        setPhase("idle")
        setCurrentFile(null)
      }
    })
  }, [])
  const [statusStep, setStatusStep] = useState(0)
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [sidebarTab, setSidebarTab] = useState<"project" | "history">("project")
  const [bringingToWorkshop, setBringingToWorkshop] = useState(false)
  const [pastSessions, setPastSessions] = useState<SessionSummary[]>([])
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Lock page-level scroll — only the chat panel scrolls
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Load session history on mount (authenticated users only)
  useEffect(() => {
    fetch("/api/architect/session")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.sessions) setPastSessions(data.sessions) })
      .catch(() => {})
  }, [])

  // Restore a past session
  const restoreSession = useCallback(async (id: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/architect/session?id=${id}`)
      if (!res.ok) return
      const { session } = await res.json()
      if (!session) return
      setSessionId(session.id)
      setMessages(session.messages?.length ? session.messages : [WELCOME_MESSAGE])
      setPhase((session.phase as Phase) ?? "idle")
      setConfidence(session.confidence ?? 0)
      setSummary(session.summary ?? null)
      setGeneratedFiles(session.generated_files ?? null)
      setGenerateStep(0)
      setActiveNodes(new Set())
      setSidebarTab("project")
    } catch { /* silent */ } finally {
      setRestoringId(null)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, generating, generatedFiles])

  // Cycle status steps while loading
  useEffect(() => {
    if (!loading) { setStatusStep(0); return }
    const id = setInterval(() => setStatusStep(s => (s + 1) % STATUS_STEPS.length), 1800)
    return () => clearInterval(id)
  }, [loading])

  // Create Supabase session on first message
  const ensureSession = useCallback(async (msgs: Message[]) => {
    if (sessionId) return sessionId
    try {
      const res = await fetch("/api/architect/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", messages: msgs.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (data.sessionId) { setSessionId(data.sessionId); return data.sessionId }
    } catch { /* non-blocking */ }
    return null
  }, [sessionId])

  const logSession = useCallback(async (sid: string | null, update: Record<string, unknown>) => {
    if (!sid) return
    try {
      await fetch("/api/architect/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", sessionId: sid, ...update }),
      })
    } catch { /* non-blocking */ }
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setPhase("discovering")

    try {
      const sid = await ensureSession(newMessages)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/architect/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, currentConfidence: confidence }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: "assistant",
          content: `I encountered an issue: ${data.error || "Unknown error"}. Please try again.`,
          confidence, phase: "discovering", summary: null,
        }])
        return
      }

      const newConf = data.confidence ?? confidence
      const assistantMsg: Message = {
        id: Date.now().toString(), role: "assistant",
        content: data.message || "",
        confidence: newConf,
        phase: data.phase ?? "discovering",
        summary: data.summary ?? null,
      }

      const updatedMessages = [...newMessages, assistantMsg]
      setMessages(updatedMessages)
      setConfidence(newConf)

      const newPhase: Phase =
        (data.phase === "ready" || data.phase === "generating" || data.phase === "generate")
          ? "ready"
          : (data.confidence ?? 0) >= 80 && data.summary
          ? "ready"
          : "discovering"

      setPhase(newPhase)
      if (data.summary) setSummary(data.summary)

      // Auto-generate when phase becomes ready
      if (newPhase === "ready" && data.summary && !generating) {
        const apiMsgs = updatedMessages.map(m => ({ role: m.role, content: m.content }))
        // Start background job - it will auto-resume existing jobs
        ArchitectJobStore.start({
          messages: apiMsgs,
          summary: data.summary,
          filesToGenerate: data.summary.filesToGenerate,
          sessionId: sid,
        }).catch(console.error)
      }

      // Log to Supabase
      logSession(sid, {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        phase: data.phase === "ready" ? "ready" : "discovering",
        confidence: newConf,
        summary: data.summary ?? null,
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: `Connection error: ${errMsg}`,
        confidence, phase: "discovering", summary: null,
      }])
      setPhase("discovering")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, confidence, ensureSession, logSession])

  // Animate workflow nodes during generation
  const animateNodes = useCallback(() => {
    const ids = WORKFLOW_NODES.map(n => n.id)
    let i = 0
    const interval = setInterval(() => {
      if (i >= ids.length) { clearInterval(interval); return }
      setActiveNodes(prev => new Set([...prev, ids[i]]))
      i++
    }, 400)
    return interval
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!summary || generating) return
    setPhase("creating")
    setActiveNodes(new Set())
    setCurrentFile(null)
    animateNodes()

    const sid = await ensureSession(messages)
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

    // Delegate to background store — survives page navigation
    ArchitectJobStore.start({
      messages: apiMessages,
      summary,
      filesToGenerate: summary.filesToGenerate,
      sessionId: sid,
    })
  }, [summary, generating, messages, ensureSession, animateNodes])

  const handleDownloadZip = useCallback(async () => {
    if (!generatedFiles) return
    const { zipSync, strToU8 } = await import("fflate")
    const projectSlug = summary?.projectName?.toLowerCase().replace(/\s+/g, "-") ?? "project"
    const zipFiles: Record<string, Uint8Array> = {}
    for (const [name, content] of Object.entries(generatedFiles)) {
      zipFiles[name] = strToU8(content)
    }
    const zipped = zipSync(zipFiles, { level: 6 })
    const blob = new Blob([zipped], { type: "application/zip" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectSlug}-architect.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedFiles, summary])

  const handleBringToWorkshop = useCallback(async () => {
    if (!generatedFiles || bringingToWorkshop) return
    setBringingToWorkshop(true)
    try {
      const projectName = summary?.projectName ?? "Untitled Project"
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectName,
          description: summary?.goal ?? null,
          session_id: sessionId,
          generated_files: generatedFiles,
        }),
      })
      if (!res.ok) throw new Error("Failed to create workflow")
      router.push("/architect/workshop")
    } catch (e) {
      console.error("Failed to bring to workshop:", e)
      setBringingToWorkshop(false)
    }
  }, [generatedFiles, bringingToWorkshop, summary, sessionId, router])

  const handleRetryFailed = useCallback(async (files: string[]) => {
    if (!summary || generating) return
    setPhase("creating")
    setCurrentFile(null)
    animateNodes()
    const sid = await ensureSession(messages)
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))
    ArchitectJobStore.retryFiles({
      messages: apiMessages,
      summary,
      sessionId: sid,
      filesToRetry: files,
    })
  }, [summary, generating, messages, ensureSession, animateNodes])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const lastSummary = summary || messages.findLast(m => m.summary)?.summary || null
  const StatusIcon = STATUS_STEPS[statusStep].icon

  // Derive display state from phase + loading
  const displayState: "idle" | "discovery" | "ready" | "coding" | "done" =
    generating || phase === "creating" ? "coding"
    : loading ? "discovery"
    : phase === "discovering" ? "discovery"
    : phase === "ready" ? "ready"
    : phase === "done" ? "done"
    : "idle"

  const phaseColor = {
    idle:      { bg: "bg-zinc-500/10",   border: "border-zinc-500/20",   text: "text-zinc-500",   dot: "bg-zinc-600" },
    discovery: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", dot: "bg-purple-400 animate-pulse" },
    ready:     { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-400" },
    coding:    { bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400",  dot: "bg-amber-400 animate-pulse" },
    done:      { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  dot: "bg-green-400" },
  }[displayState]

  const phaseLabel = {
    idle:      "Idle",
    discovery: "Discovery",
    ready:     "Ready",
    coding:    "Coding",
    done:      "Complete",
  }[displayState]

  function handleReset() {
    ArchitectJobStore.reset()
    setMessages([WELCOME_MESSAGE])
    setInput("")
    setPhase("idle")
    setConfidence(0)
    setSummary(null)
    setGeneratedFiles(null)
    setGenerateStep(0)
    setActiveNodes(new Set())
    setSessionId(null)
    // Refresh history list
    fetch("/api/architect/session")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.sessions) setPastSessions(data.sessions) })
      .catch(() => {})
  }

  return (
    <div className="flex-1 bg-[#09090B] flex overflow-hidden relative min-h-0">

      {/* ── ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/4 rounded-full blur-3xl" />
      </div>

      {/* ════════════════════════════════════
          LEFT SIDEBAR — Enterprise Panel
      ════════════════════════════════════ */}
      <aside className="hidden lg:flex w-80 flex-shrink-0 flex-col border-r border-white/[0.07] relative z-10" style={{ background: "#0c0c0f" }}>

        {/* Sidebar header — status only, brand is in top nav */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Project Panel</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${phaseColor.bg} ${phaseColor.border} ${phaseColor.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${phaseColor.dot}`} />
            {phaseLabel}
          </div>
        </div>

        {/* New Chat + confidence */}
        <div className="px-4 pt-4 pb-3 space-y-3 border-b border-white/[0.07]">
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(168,85,247,0.08))", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-3 h-3 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
            </div>
            <span className="text-amber-300 group-hover:text-amber-200 transition-colors">New Chat</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500/50 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </button>

          {confidence > 0 && (
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Confidence</span>
                <span className="text-[11px] font-bold" style={{ color: confidence >= 85 ? "#10b981" : confidence >= 60 ? "#3b82f6" : "#f59e0b" }}>{confidence}%</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${confidence}%`,
                    background: confidence >= 85 ? "linear-gradient(90deg,#10b981,#059669)" : confidence >= 60 ? "linear-gradient(90deg,#3b82f6,#6366f1)" : "linear-gradient(90deg,#f59e0b,#d97706)",
                  }} />
              </div>
              <div className="text-[10px] text-zinc-600">
                {confidence < 40 ? "Gathering context…" : confidence < 70 ? "Getting clearer…" : confidence < 85 ? "Almost ready…" : "Architecture locked in"}
              </div>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex-shrink-0 px-3 pt-3 pb-0">
          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["project", "history"] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold transition-all ${
                  sidebarTab === tab ? "bg-zinc-700/80 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-400"
                }`}>
                {tab === "project" ? <><FolderOpen className="w-3 h-3" /> Project</> : <><History className="w-3 h-3" /> History{pastSessions.length > 0 && <span className="ml-1 bg-amber-500/25 text-amber-300 text-[9px] px-1 rounded">{pastSessions.length}</span>}</>}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable sidebar content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 space-y-1 scrollbar-architect">

          {/* ── History tab ── */}
          {sidebarTab === "history" && (
            <div className="space-y-1.5 pt-1">
              {pastSessions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Clock className="w-5 h-5 text-zinc-700" />
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">No sessions yet.<br/>Start a project to see history.</p>
                </div>
              ) : (
                pastSessions.map(s => {
                  const name = s.session_name || s.summary?.projectName || "Untitled Project"
                  const date = new Date(s.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  const isActive = s.id === sessionId
                  const isRestoring = restoringId === s.id
                  return (
                    <button key={s.id} onClick={() => restoreSession(s.id)} disabled={!!restoringId}
                      className={`w-full text-left px-3 py-3 rounded-xl border transition-all group ${
                        isActive ? "border-amber-500/30 text-amber-300" : "border-transparent hover:border-white/8"
                      }`}
                      style={{ background: isActive ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[11px] font-semibold leading-tight truncate ${
                          isActive ? "text-amber-300" : "text-zinc-400 group-hover:text-white"
                        }`}>{name}</span>
                        {isRestoring
                          ? <RefreshCw className="w-3 h-3 text-amber-400 animate-spin flex-shrink-0" />
                          : <span className="text-[10px] text-zinc-700 flex-shrink-0">{date}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                          s.phase === "done" ? "bg-green-950/60 text-green-500" : s.phase === "ready" ? "bg-blue-950/60 text-blue-400" : "bg-zinc-800/80 text-zinc-600"
                        }`}>{s.phase}</span>
                        {s.file_count > 0 && <span className="text-[9px] text-zinc-700">{s.file_count} files</span>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {/* ── Project tab ── */}
          {sidebarTab === "project" && (
            <div className="space-y-1 pt-1">
              {!lastSummary ? (
                <div className="space-y-1 pt-2">
                  {[
                    { icon: Brain,     label: "Multi-agent systems",   color: "#f59e0b" },
                    { icon: GitBranch, label: "Workflow automation",    color: "#a78bfa" },
                    { icon: Database,  label: "Data pipelines",         color: "#60a5fa" },
                    { icon: Rocket,    label: "Production deployments", color: "#34d399" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon className="w-3 h-3" style={{ color }} />
                      </div>
                      <span className="text-xs text-zinc-600">{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in-up">

                  {/* ── 1. FILES ── */}
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-5 h-5 rounded-md bg-blue-500/15 flex items-center justify-center">
                        <FileText className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Files</span>
                      <span className="ml-auto text-[10px] text-zinc-600 font-mono">{lastSummary.filesToGenerate.length}</span>
                    </div>
                    <div className="p-2 space-y-1">
                      {lastSummary.filesToGenerate.map((f, i) => {
                        const done = !!(generatedFiles && f in generatedFiles)
                        return (
                          <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                            done ? "text-green-300" : "text-zinc-500"
                          }`} style={{ background: done ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)"}` }}>
                            {done
                              ? <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                              : <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0" />}
                            {f}
                            {done && <span className="ml-auto text-[9px] text-green-700">✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── 2. SKILLS ── */}
                  {lastSummary.skills.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                          <Zap className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Skills</span>
                        <span className="ml-auto text-[10px] text-zinc-600 font-mono">{lastSummary.skills.length}</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {lastSummary.skills.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                            style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
                            <Sparkles className="w-3 h-3 text-amber-500/60 flex-shrink-0" />
                            <span className="text-[11px] text-amber-200/80 leading-tight">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 3. AGENTS ── */}
                  {lastSummary.agents.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-purple-400" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Agents</span>
                        <span className="ml-auto text-[10px] text-zinc-600 font-mono">{lastSummary.agents.length}</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {lastSummary.agents.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
                            style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.12)" }}>
                            <div className="w-4 h-4 rounded-md bg-purple-900/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Bot className="w-2.5 h-2.5 text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-zinc-200 leading-tight truncate">{a.name}</div>
                              <div className="text-[10px] text-zinc-600 mt-0.5 leading-tight line-clamp-2">{a.responsibilities}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 4. PROJECT SUMMARY ── */}
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-5 h-5 rounded-md bg-green-500/15 flex items-center justify-center">
                        <Layers className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Summary</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div>
                        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Project</div>
                        <div className="text-xs font-semibold text-white">{lastSummary.projectName}</div>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{lastSummary.goal}</p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.07]">
          <div className="text-[10px] text-zinc-800 text-center">Powered by OpenRouter · Midas AI</div>
        </div>
      </aside>

      {/* ════════════════════════════════════
          RIGHT PANEL — Chat + Generation
      ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Top bar */}
        <div className="flex-shrink-0 border-b border-white/[0.07] px-6 py-3.5 flex items-center justify-between" style={{ background: "rgba(12,12,15,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white lg:hidden">Midas Architect</span>
              <span className="text-[13px] font-medium text-zinc-300 hidden lg:block">
                {displayState === "idle" ? "Describe your project to get started" :
                 displayState === "discovery" ? (loading ? "Analyzing your requirements…" : "Discovering architecture…") :
                 displayState === "ready" ? "Architecture complete — files generating" :
                 displayState === "coding" ? (currentFile ? `Writing ${currentFile}` : "Building your project…") :
                 `${Object.keys(generatedFiles ?? {}).length} files ready to use`}
              </span>
              {displayState !== "idle" && (
                <span className="text-[10px] text-zinc-600 hidden lg:block mt-0.5">
                  {lastSummary?.projectName ?? "Midas Architect"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {confidence > 0 && <ConfidenceRing value={confidence} />}
            {phase === "done" && (
              <div className="flex items-center gap-2">
                <button onClick={handleDownloadZip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black transition-all shadow-lg shadow-amber-500/25"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download ZIP</span>
                </button>
                <button onClick={handleBringToWorkshop} disabled={bringingToWorkshop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 transition-all shadow-lg shadow-purple-500/15 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.35))", border: "1px solid rgba(168,85,247,0.4)" }}>
                  <Hammer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{bringingToWorkshop ? "Sending..." : "Bring to Workshop"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat scroll area ── */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-architect">
          <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">

            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

            {/* Thinking indicator */}
            {loading && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/architect.png" alt="Midas Architect" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                  <StatusIcon className={`w-4 h-4 ${STATUS_STEPS[statusStep].color} transition-all duration-500 flex-shrink-0`} />
                  <span className="text-xs text-zinc-400">{STATUS_STEPS[statusStep].label}</span>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Generate CTA — prominent banner when ready */}
            {!loading && !generating && !generatedFiles && lastSummary && phase === "ready" && (
              <div className="animate-fade-in-up">
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{lastSummary.projectName}</div>
                      <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Architecture ready — {lastSummary.agents.length} agents, {lastSummary.skills.length} skills, {lastSummary.filesToGenerate.length} files to generate
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {lastSummary.filesToGenerate.slice(0, 6).map((f, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">{f}</span>
                        ))}
                        {lastSummary.filesToGenerate.length > 6 && (
                          <span className="text-[10px] text-zinc-500">+{lastSummary.filesToGenerate.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-sm font-bold text-black transition-all shadow-lg shadow-amber-500/25"
                  >
                    <Rocket className="w-4 h-4" />
                    Generate {lastSummary.filesToGenerate.length} Project Files
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Generation: immersive animated status */}
            {generating && (
              <GeneratingStatus
                currentFile={currentFile}
                completedFiles={generatedFiles ?? {}}
                totalFiles={ArchitectJobStore.getJob().totalFiles || Object.keys(generatedFiles ?? {}).length + 1}
              />
            )}

            {/* File viewer — break out of max-w-3xl to use full panel width */}
            {generatedFiles && !generating && (
              <div className="-mx-5">
                <FileViewer
                  files={generatedFiles}
                  failedFiles={failedFiles}
                  onDownloadZip={handleDownloadZip}
                  onRetry={handleRetryFailed}
                />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input bar ── */}
        {phase !== "done" && (
          <div className="flex-shrink-0 border-t border-white/10 bg-zinc-950 px-5 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 focus-within:border-amber-500/60 focus-within:bg-zinc-800/80 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || generating}
                  placeholder={
                    phase === "ready" ? "Ask follow-up questions or refine the architecture…" :
                    phase === "discovering" ? "Add more details about your project…" :
                    "Describe your AI project idea…"
                  }
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 resize-none outline-none disabled:opacity-40 min-h-[24px] max-h-32"
                  onInput={e => {
                    const t = e.currentTarget
                    t.style.height = "auto"
                    t.style.height = Math.min(t.scrollHeight, 128) + "px"
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || generating}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-amber-500/25"
                >
                  <Send className="w-4 h-4 text-black" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] text-zinc-700">↵ Send · ⇧↵ New line</span>
                {messages.length > 1 && (
                  <span className="text-[11px] text-zinc-700">{messages.filter(m => m.role === "user").length} messages</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Done footer ── */}
        {phase === "done" && (
          <div className="flex-shrink-0 border-t border-white/10 bg-zinc-950 px-5 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Check className="w-4 h-4 text-green-400" />
                <span>{Object.keys(generatedFiles ?? {}).length} files generated</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs text-black font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Download ZIP
                </button>
                <button
                  onClick={handleBringToWorkshop}
                  disabled={bringingToWorkshop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 transition-all shadow-lg shadow-purple-500/15 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.35))", border: "1px solid rgba(168,85,247,0.4)" }}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  {bringingToWorkshop ? "Sending..." : "Bring to Workshop"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  New Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
