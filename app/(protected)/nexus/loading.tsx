export default function NexusLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-48 rounded-lg bg-white/[0.04] mb-2" />
        <div className="h-4 w-72 rounded-lg bg-white/[0.02]" />
      </div>
      <div className="h-10 w-96 rounded-xl bg-white/[0.03] mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 h-36" />
        ))}
      </div>
    </div>
  )
}
