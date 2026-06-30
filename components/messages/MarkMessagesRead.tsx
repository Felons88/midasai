"use client"

import { useEffect } from "react"

interface MarkMessagesReadProps {
  messageIds: string[]
}

export function MarkMessagesRead({ messageIds }: MarkMessagesReadProps) {
  useEffect(() => {
    if (messageIds.length === 0) return

    messageIds.forEach((id) => {
      fetch(`/api/messages/${id}`, { method: "PATCH" }).catch(() => {
        // best-effort
      })
    })
  }, [messageIds])

  return null
}
