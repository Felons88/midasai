"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Activity, Star, Search, Eye, BookmarkPlus, Trash2,
  Bell, BellOff, Filter, Zap, ShoppingBag, MessageSquare,
  TrendingUp, Award, Plus, X, ChevronRight, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface FeedItem {
  id: string
  actor_id: string | null
  event_type: string
  entity_type: string
  entity_id: string | null
  entity_title: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface WatchlistItem {
  id: string
  item_type: string
  item_id: string
  label: string | null
  notes: string | null
  created_at: string
}

interface SavedSearch {
  id: string
  name: string
  query: string | null
  filters: Record<string, unknown>
  alert_push: boolean
  created_at: string
}

interface Milestone {
  id: string
  milestone_key: string
  achieved_at: string
  metadata: Record<string, unknown> | null
}

interface FeedData {
  userId: string
  feed: FeedItem[]
  watchlist: WatchlistItem[]
  savedSearches: SavedSearch[]
  milestones: Milestone[]
}

// ── Event display config ───────────────────────────────────────────────────
const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  listing_published:  { label: "New listing published",   icon: Zap,         color: "text-amber-400 bg-amber-500/10" },
  listing_purchased:  { label: "Purchase made",           icon: ShoppingBag, color: "text-emerald-400 bg-emerald-500/10" },
  review_posted:      { label: "Review posted",           icon: Star,        color: "text-yellow-400 bg-yellow-500/10" },
  user_followed:      { label: "New follower",            icon: Activity,    color: "text-blue-400 bg-blue-500/10" },
  listing_updated:    { label: "Listing updated",         icon: RefreshCw,   color: "text-white/60 bg-white/[0.06]" },
  milestone_achieved: { label: "Milestone achieved",      icon: Award,       color: "text-purple-400 bg-purple-500/10" },
  message_received:   { label: "New message",             icon: MessageSquare, color: "text-cyan-400 bg-cyan-500/10" },
}

const MILESTONE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  first_listing:    { label: "First Listing Published", icon: "🎯", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  first_sale:       { label: "First Sale",              icon: "💰", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
  first_review:     { label: "First Review",            icon: "⭐", color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" },
  top_rated:        { label: "Top Rated Creator",       icon: "🏆", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
  fast_responder:   { label: "Fast Responder",          icon: "⚡", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  power_creator:    { label: "Power Creator",           icon: "🚀", color: "from-rose-500/20 to-rose-600/10 border-rose-500/30" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Saved Search Modal ────────────────────────────────────────────────────
function SaveSearchModal({ onClose, onSaved }: { onClose: () => void; onSaved: (s: SavedSearch) => void }) {
  const [name, setName] = useState("")
  const [query, setQuery] = useState("")
  const [alertPush, setAlertPush] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from("saved_searches").insert({
        user_id: user.id,
        name: name.trim(),
        query: query.trim() || null,
        filters: {},
        alert_push: alertPush,
      }).select().single()
      if (!error && data) {
        onSaved(data as SavedSearch)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0f0f18] p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Save Search</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pressure Washing Leads"
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Search Query (optional)</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. roofing, landscaping..."
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/40" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer">
            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${alertPush ? "bg-amber-500 border-amber-500" : "border-white/20"}`}
              onClick={() => setAlertPush(v => !v)}>
              {alertPush && <span className="text-black text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className="text-sm text-white font-medium">Push Alerts</p>
              <p className="text-xs text-white/40">Notify me when new matches appear</p>
            </div>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex-1 h-10 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Search"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function FeedClient({ data }: { data: FeedData }) {
  const [feed, setFeed] = useState<FeedItem[]>(data.feed)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(data.savedSearches)
  const [watchlist] = useState<WatchlistItem[]>(data.watchlist)
  const [activeTab, setActiveTab] = useState<"feed" | "saved" | "watchlist" | "milestones">("feed")
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const supabase = createBrowserSupabaseClient()

  // Realtime feed subscription
  useEffect(() => {
    const channel = supabase
      .channel("activity_feed_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed", filter: "is_public=eq.true" },
        payload => setFeed(prev => [payload.new as FeedItem, ...prev.slice(0, 99)])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const deleteSavedSearch = useCallback(async (id: string) => {
    await supabase.from("saved_searches").delete().eq("id", id)
    setSavedSearches(prev => prev.filter(s => s.id !== id))
  }, [])

  const filteredFeed = feed.filter(item => filterType === "all" || item.event_type === filterType)

  const feedEventTypes = [...new Set(feed.map(f => f.event_type))]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Activity Feed</h1>
          <p className="text-sm text-white/50">Real-time marketplace activity and your saved searches</p>
        </div>
        <button onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
          <Plus className="h-4 w-4" /> Save Search
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {[
          { id: "feed", label: "Live Feed", count: feed.length },
          { id: "saved", label: "Saved Searches", count: savedSearches.length },
          { id: "watchlist", label: "Watchlist", count: watchlist.length },
          { id: "milestones", label: "Milestones", count: data.milestones.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.06] text-white/40"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── LIVE FEED TAB ─────────────────────────────────────────────────── */}
      {activeTab === "feed" && (
        <div className="space-y-4">
          {/* Filter chips */}
          {feedEventTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setFilterType("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterType === "all" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-white/40 hover:text-white bg-white/[0.03] border border-white/[0.06]"
                }`}>
                <Filter className="h-3 w-3" /> All
              </button>
              {feedEventTypes.map(type => {
                const cfg = EVENT_CONFIG[type]
                if (!cfg) return null
                const Icon = cfg.icon
                return (
                  <button key={type} onClick={() => setFilterType(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      filterType === type ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-white/40 hover:text-white bg-white/[0.03] border border-white/[0.06]"
                    }`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          )}

          {filteredFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
              <Activity className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-base font-semibold text-white/40">No activity yet</p>
              <p className="text-sm text-white/25 mt-1">Marketplace events will appear here in real-time</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected — listening for updates
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/30 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live — {filteredFeed.length} events
              </div>
              {filteredFeed.map(item => {
                const cfg = EVENT_CONFIG[item.event_type] || { label: item.event_type, icon: Activity, color: "text-white/60 bg-white/[0.06]" }
                const Icon = cfg.icon
                return (
                  <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{item.entity_title || cfg.label}</p>
                        <span className="text-[10px] text-white/30 flex-shrink-0">{timeAgo(item.created_at)}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{cfg.label}</p>
                      {item.entity_id && item.entity_type === "listing" && (
                        <Link href={`/listing/${item.entity_id}`}
                          className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                          View listing <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SAVED SEARCHES TAB ──────────────────────────────────────────────── */}
      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedSearches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.06] border-dashed">
              <Search className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-base font-semibold text-white/40">No saved searches</p>
              <p className="text-sm text-white/25 mt-1 mb-6">Save filters to get notified when new matches appear</p>
              <button onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-colors">
                <Plus className="h-4 w-4" /> Create Saved Search
              </button>
            </div>
          ) : (
            savedSearches.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  {s.query && <p className="text-xs text-white/40 mt-0.5">Query: {s.query}</p>}
                  <p className="text-[10px] text-white/25 mt-0.5">Saved {timeAgo(s.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                    s.alert_push ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 bg-white/[0.04]"
                  }`}>
                    {s.alert_push ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                    {s.alert_push ? "Alerts on" : "Muted"}
                  </span>
                  <Link href={`/explore${s.query ? `?q=${encodeURIComponent(s.query)}` : ""}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                    Search
                  </Link>
                  <button onClick={() => deleteSavedSearch(s.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── WATCHLIST TAB ────────────────────────────────────────────────── */}
      {activeTab === "watchlist" && (
        <div className="space-y-3">
          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.06] border-dashed">
              <Eye className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-base font-semibold text-white/40">Your watchlist is empty</p>
              <p className="text-sm text-white/25 mt-1">Track listings, vendors, and creators you care about</p>
              <Link href="/explore"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/[0.06] text-white text-sm font-semibold hover:bg-white/[0.1] transition-colors border border-white/[0.08]">
                <BookmarkPlus className="h-4 w-4" /> Browse Marketplace
              </Link>
            </div>
          ) : (
            watchlist.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{item.label || item.item_id}</p>
                  <p className="text-xs text-white/40 capitalize">{item.item_type.toLowerCase()} · Added {timeAgo(item.created_at)}</p>
                </div>
                {item.item_type === "LISTING" && (
                  <Link href={`/listing/${item.item_id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                    View
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MILESTONES TAB ──────────────────────────────────────────────── */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          {data.milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="h-14 w-14 text-white/10 mb-4" />
              <p className="text-base font-semibold text-white/40">No milestones yet</p>
              <p className="text-sm text-white/25 mt-1">Start creating and selling to earn badges</p>
            </div>
          ) : null}

          {/* Show all potential milestones with locked/unlocked state */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(MILESTONE_CONFIG).map(([key, cfg]) => {
              const achieved = data.milestones.find(m => m.milestone_key === key)
              return (
                <div key={key} className={`p-4 rounded-2xl border bg-gradient-to-br ${
                  achieved ? cfg.color : "from-white/[0.02] to-transparent border-white/[0.06]"
                } ${achieved ? "" : "opacity-40"}`}>
                  <div className="text-3xl mb-2">{cfg.icon}</div>
                  <p className={`text-sm font-bold ${achieved ? "text-white" : "text-white/40"}`}>{cfg.label}</p>
                  {achieved ? (
                    <p className="text-xs text-white/50 mt-1">Achieved {timeAgo(achieved.achieved_at)}</p>
                  ) : (
                    <p className="text-xs text-white/25 mt-1">Not yet achieved</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <SaveSearchModal
          onClose={() => setShowSaveModal(false)}
          onSaved={s => setSavedSearches(prev => [s, ...prev])}
        />
      )}
    </div>
  )
}
