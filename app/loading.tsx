export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-surface rounded-xl w-1/3" />
          <div className="bento-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 glass rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 glass rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
