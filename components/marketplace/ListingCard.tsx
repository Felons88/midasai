"use client"

import Link from "next/link"
import { Star, Download, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"

interface ListingCardProps {
  title: string
  description: string
  category?: string
  creator?: string
  price: string
  rating: number
  downloads: number
  href: string
  icon: React.ReactNode
  featured?: boolean
}

export function ListingCard({
  title,
  description,
  price,
  rating,
  downloads,
  href,
  icon,
  featured = false,
}: ListingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={href} className="block group">
        <div className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
          featured
            ? 'border-gold/20 bg-gradient-to-b from-gold/[0.04] to-transparent hover:border-gold/40 glow-gold-sm'
            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
        }`}>
          {/* Header */}
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-muted-foreground group-hover:text-gold group-hover:border-gold/20 transition-colors">
                {icon}
              </div>
              {featured && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                  Featured
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-gold transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-gold text-gold" />
                <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-3 w-3" />
                <span className="text-xs">{downloads >= 1000 ? `${(downloads / 1000).toFixed(1)}k` : downloads}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">{price}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
