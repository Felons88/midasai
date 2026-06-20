"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { CommandPalette } from "./CommandPalette"

interface AuthenticatedShellProps {
  children: React.ReactNode
  userRole?: string
  userEmail?: string
  userName?: string
  userAvatar?: string
}

export function AuthenticatedShell({
  children,
  userRole,
  userEmail,
  userName,
  userAvatar,
}: AuthenticatedShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-[#07070b]">
      <Sidebar userRole={userRole} />
      
      {/* Main content area with dynamic margin based on sidebar state */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen transition-all duration-300">
        <TopBar
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
          onSearchOpen={() => setCommandOpen(true)}
        />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Command Palette Overlay */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}
