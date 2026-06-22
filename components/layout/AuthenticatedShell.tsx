"use client"

import { useState } from "react"
import { AppSidebar } from "./AppSidebar"
import { TopBar } from "./TopBar"
import { NotificationProvider } from "@/components/notifications/NotificationProvider"
import { NotificationToastStack } from "@/components/notifications/NotificationToast"

interface AuthenticatedShellProps {
  children: React.ReactNode
  userRole?: string
  userEmail?: string
  userName?: string
  userAvatar?: string
  userId?: string
}

export function AuthenticatedShell({
  children,
  userRole,
  userEmail,
  userName,
  userAvatar,
  userId,
}: AuthenticatedShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <NotificationProvider userId={userId || null}>
      <div className="min-h-screen bg-[#07070b]">
        <AppSidebar
          userRole={userRole}
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <div className="min-h-screen flex flex-col transition-all duration-300 md:ml-[240px]">
          <TopBar
            userEmail={userEmail}
            userName={userName}
            userAvatar={userAvatar}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 overflow-x-hidden p-4 sm:p-5 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <NotificationToastStack />
    </NotificationProvider>
  )
}
