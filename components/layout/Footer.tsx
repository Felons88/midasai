"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"
import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()

  const isAuthenticatedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/creator') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/bookmarks') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings')

  if (isAuthenticatedRoute) {
    return null
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">MidasAI</h3>
            <p className="text-sm text-muted-foreground">
              The premier marketplace for AI tools, skills, and automations.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/skills" className="hover:text-primary">Skills</Link></li>
              <li><Link href="/plugins" className="hover:text-primary">Plugins</Link></li>
              <li><Link href="/mcp" className="hover:text-primary">MCP Servers</Link></li>
              <li><Link href="/agents" className="hover:text-primary">Agents</Link></li>
              <li><Link href="/workflows" className="hover:text-primary">Workflows</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary">About</Link></li>
              <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
              <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 MidasAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
