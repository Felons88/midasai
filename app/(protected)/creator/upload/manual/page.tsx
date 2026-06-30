"use client"

import { useRouter } from "next/navigation"
import { CreateSkillWizard } from "@/components/creator/CreateSkillWizard"

export default function ManualUploadPage() {
  const router = useRouter()

  return (
    <CreateSkillWizard
      isOpen
      onClose={() => router.push("/creator/upload")}
      onSuccess={() => router.push("/creator/listings")}
    />
  )
}
