import { createClient } from "@/lib/supabase/server"
import SettingsClient from "./SettingsClient"

async function getSettings(userId: string) {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('email_notifications, marketing_emails, theme, language')
    .eq('user_id', userId)
    .single()

  const { data: user } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .single()

  return {
    settings: settings || {
      email_notifications: true,
      marketing_emails: false,
      theme: 'dark',
      language: 'en',
    },
    user: user || { name: '', email: '' },
  }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const data = await getSettings(user.id)

  return <SettingsClient initialSettings={data.settings} user={data.user} />
}
