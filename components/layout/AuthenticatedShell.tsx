"use client"

import { AppSidebar } from "./AppSidebar"
import { TopBar } from "./TopBar"
import { NotificationProvider } from "@/components/notifications/NotificationProvider"
import { NotificationToastStack } from "@/components/notifications/NotificationToast"
import { NotificationDetailModal } from "@/components/notifications/NotificationDetailModal"
import { ChangelogGate } from "@/components/announcements/ChangelogGate"
import { ArchitectJobProvider } from "@/components/architect/ArchitectJobProvider"
import { useNotifications } from "@/components/notifications/NotificationProvider"

interface AuthenticatedShellProps {
  children: React.ReactNode
  userId: string
  userRole?: string
  userEmail?: string
  userName?: string
  userAvatar?: string
  showAds?: boolean
}

export function AuthenticatedShell({
  children,
  userId,
  userRole,
  userEmail,
  userName,
  userAvatar,
  showAds = false,
}: AuthenticatedShellProps) {
  return (
    <NotificationProvider userId={userId || null}>
      <ArchitectJobProvider userId={userId || null} />
      <AuthenticatedShellInner
        userRole={userRole}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        showAds={showAds}
      >
        {children}
      </AuthenticatedShellInner>
    </NotificationProvider>
  )
}

function AuthenticatedShellInner({
  children,
  userRole,
  userEmail,
  userName,
  userAvatar,
  showAds,
}: Omit<AuthenticatedShellProps, "userId">) {
  const { selectedNotification, closeNotification, markRead } = useNotifications()

  return (
    <>
      <div className="min-h-screen bg-[#07070b]">
        <AppSidebar
          userRole={userRole}
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
        />

        <div className="ml-[240px] min-h-screen flex flex-col transition-all duration-300">
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
      <NotificationToastStack />
      <ChangelogGate />
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={closeNotification}
        onMarkRead={markRead}
      />
    </>
  )
}
