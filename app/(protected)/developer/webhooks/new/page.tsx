import { redirect } from "next/navigation"

export default function NewWebhookRedirect() {
  redirect("/developer/webhooks")
}
