"use client"

import Link from "next/link"
import { Search, Sparkles, TrendingUp, Zap, ArrowRight, Code2, Bot, Workflow, FileCode, Terminal, Layers, Globe, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/marketplace/ListingCard"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const categories = [
  { icon: <Code2 className="h-5 w-5" />, title: "Claude Skills", href: "/skills", count: "250+", description: "Custom skills for Claude & Claude Code" },
  { icon: <FileCode className="h-5 w-5" />, title: "Cursor Rules", href: "/plugins", count: "180+", description: "Rules and plugins for Cursor IDE" },
  { icon: <Terminal className="h-5 w-5" />, title: "MCP Servers", href: "/mcp", count: "120+", description: "Model Context Protocol servers" },
  { icon: <Bot className="h-5 w-5" />, title: "AI Agents", href: "/agents", count: "95+", description: "Autonomous AI agent frameworks" },
  { icon: <Workflow className="h-5 w-5" />, title: "Workflows", href: "/workflows", count: "75+", description: "N8N, Make, and automation flows" },
  { icon: <Layers className="h-5 w-5" />, title: "Templates", href: "/templates", count: "60+", description: "Project starters and boilerplates" },
]

const featuredListings = [
  { title: "Claude Code Mastery Pack", description: "50+ professional skills for Claude Code including test generation, refactoring, and architecture patterns", category: "Claude Skills", creator: "ProDev Labs", price: "$29", rating: 4.9, downloads: 2400, href: "/listing/1" },
  { title: "MCP Database Connector", description: "Universal MCP server for connecting to PostgreSQL, MySQL, MongoDB with schema inference", category: "MCP Servers", creator: "ServerStack", price: "$49", rating: 4.8, downloads: 1800, href: "/listing/2" },
  { title: "Cursor AI Architect", description: "Advanced Cursor rules for system design, API architecture, and clean code patterns", category: "Cursor Rules", creator: "ArchitectAI", price: "Free", rating: 4.7, downloads: 5200, href: "/listing/3" },
  { title: "AutoAgent Pro", description: "Build autonomous AI agents with pre-built tools, memory, and planning capabilities", category: "AI Agents", creator: "AgentForge", price: "$79", rating: 4.9, downloads: 920, href: "/listing/4" },
  { title: "N8N AI Workflow Pack", description: "Production-ready AI automation workflows for content, data, and customer support", category: "Workflows", creator: "FlowMasters", price: "$39", rating: 4.6, downloads: 3100, href: "/listing/5" },
  { title: "Full-Stack SaaS Template", description: "Next.js 15 + Supabase + Stripe + AI-ready SaaS boilerplate with auth and billing", category: "Templates", creator: "SaaSKit", price: "$99", rating: 4.8, downloads: 1500, href: "/listing/6" },
]

const trendingListings = [
  { title: "Windsurf Flow Engine", description: "Advanced workflow automation for Windsurf with custom triggers and actions", category: "Workflows", creator: "WindDev", price: "$35", rating: 4.7, downloads: 890, href: "/listing/7" },
  { title: "Prompt Engineering Suite", description: "200+ battle-tested prompts for GPT-4, Claude, and Gemini across all use cases", category: "Prompts", creator: "PromptLab", price: "$19", rating: 4.5, downloads: 7200, href: "/listing/8" },
  { title: "MCP GitHub Bridge", description: "Connect any AI assistant to GitHub repos, PRs, issues, and actions via MCP", category: "MCP Servers", creator: "GitConnect", price: "Free", rating: 4.8, downloads: 4100, href: "/listing/9" },
]

const stats = [
  { value: "10,000+", label: "AI Resources" },
  { value: "5,000+", label: "Creators" },
  { value: "100K+", label: "Downloads" },
  { value: "4.8", label: "Avg Rating" },
]

const iconMap: Record<string, React.ReactNode> = {
  "Claude Skills": <Code2 className="h-4 w-4" />,
  "MCP Servers": <Terminal className="h-4 w-4" />,
  "Cursor Rules": <FileCode className="h-4 w-4" />,
  "AI Agents": <Bot className="h-4 w-4" />,
  "Workflows": <Workflow className="h-4 w-4" />,
  "Templates": <Layers className="h-4 w-4" />,
  "Prompts": <Sparkles className="h-4 w-4" />,
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-28 md:py-40 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 bg-radial-top" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/[0.03] rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/[0.05]">
                <div className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-slow" />
                <span className="text-xs font-medium text-gold tracking-wide">The Premier AI Marketplace</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]"
            >
              <span className="text-gradient-white">Discover AI tools</span>
              <br />
              <span className="text-gradient-gold">that ship faster</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The marketplace for Claude Skills, Cursor Rules, MCP Servers, AI Agents, Workflows, and more. Built by developers, for developers.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeInUp} className="max-w-xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search skills, plugins, agents, servers..."
                    className="w-full h-12 sm:h-14 pl-12 pr-28 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gold/30 transition-all"
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 bg-gold hover:bg-gold-light text-background font-medium h-8 sm:h-10 px-4 sm:px-6 rounded-lg text-sm"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Popular tags */}
            <motion.div variants={fadeInUp} className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs text-muted-foreground">Popular:</span>
              {["Claude Skills", "MCP Servers", "AI Agents", "Cursor Rules", "Workflows"].map((tag) => (
                <Link
                  key={tag}
                  href="/search"
                  className="text-xs text-foreground/70 hover:text-gold transition-colors font-medium px-2 py-0.5 rounded-md hover:bg-gold/[0.05]"
                >
                  {tag}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.04]">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Browse Categories</h2>
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">Explore the ecosystem</p>
                </div>
                <Link
                  href="/categories"
                  className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.div key={category.title} variants={fadeInUp}>
                  <Link href={category.href} className="block group">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-muted-foreground group-hover:text-gold group-hover:border-gold/20 transition-colors">
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">{category.title}</h3>
                            <span className="text-xs text-muted-foreground">{category.count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
              <div className="flex items-end justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-gold text-xs font-medium mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Hand-picked by our team
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Featured</h2>
                </div>
                <Link
                  href="/featured"
                  className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredListings.map((listing, i) => (
                <motion.div key={listing.title} variants={fadeInUp}>
                  <ListingCard
                    {...listing}
                    icon={iconMap[listing.category] || <Sparkles className="h-4 w-4" />}
                    featured={i < 2}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-24 md:py-32 border-t border-white/[0.04] bg-radial-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
              <div className="flex items-end justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-gold text-xs font-medium mb-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Rising this week
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Trending</h2>
                </div>
                <Link
                  href="/trending"
                  className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingListings.map((listing) => (
                <motion.div key={listing.title} variants={fadeInUp}>
                  <ListingCard
                    {...listing}
                    icon={iconMap[listing.category] || <Sparkles className="h-4 w-4" />}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why MidasAI */}
      <section className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Why MidasAI</h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base max-w-lg mx-auto">The premium platform for AI tools and resources</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Shield className="h-5 w-5" />, title: "Verified Quality", description: "Every listing is reviewed for quality, security, and documentation standards before publishing." },
                { icon: <Zap className="h-5 w-5" />, title: "Instant Access", description: "One-click install and download. Get tools running in your workflow within minutes." },
                { icon: <Globe className="h-5 w-5" />, title: "Creator Economy", description: "Earn revenue from your AI tools. Set your own pricing with transparent marketplace fees." },
              ].map((feature) => (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.1] transition-all duration-300">
                    <div className="h-11 w-11 rounded-lg bg-gold/[0.08] border border-gold/20 flex items-center justify-center text-gold mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/[0.04] rounded-full blur-3xl" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center relative"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            Start building with AI
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-base md:text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Join thousands of developers and creators on MidasAI
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-gold hover:bg-gold-light text-background font-semibold h-12 px-8 rounded-xl text-sm glow-gold"
              asChild
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/[0.1] text-foreground hover:bg-white/[0.04] hover:border-white/[0.15] h-12 px-8 rounded-xl text-sm"
              asChild
            >
              <Link href="/creator/upload">List Your Tool</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
