import { FolderOpen, Plus } from "lucide-react"
import Link from "next/link"

export default function CollectionsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Collections</h1>
          <p className="text-white/50 text-sm">Organize your saved assets into collections</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors">
          <Plus className="h-4 w-4" />
          New Collection
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FolderOpen className="h-12 w-12 text-white/10 mb-4" />
        <p className="text-white/50 mb-2">No collections yet</p>
        <p className="text-white/30 text-sm mb-6">Create a collection to organize your bookmarked assets</p>
        <button className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/60 text-sm font-medium hover:bg-white/[0.1] transition-colors">
          Create Your First Collection
        </button>
      </div>
    </div>
  )
}
