"use client"

import { AppSidebar } from "./AppSidebar"
import { TopBar } from "./TopBar"

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
  return (
    <div className="min-h-screen bg-[#07070b]">
      <AppSidebar
        userRole={userRole}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
      />

      <div className="ml-[260px] min-h-screen flex flex-col">
        <TopBar
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
