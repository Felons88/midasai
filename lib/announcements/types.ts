export type PendingChangelog = {
  id: string
  title: string
  body: string
  version: string | null
  action_url: string | null
  action_label: string | null
  published_at: string
}
