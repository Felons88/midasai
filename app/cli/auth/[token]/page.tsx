/**
 * /cli/auth/[token]
 * Public page — no layout wrapper needed.
 * The CLI opens this in the user's browser after 'npx @midasai/bridge login'.
 * User signs in (if not already) and approves the CLI connection.
 */
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CliAuthPage } from "@/components/cli/CliAuthPage"

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if the login request exists and is still valid
  const { data: loginRequest, error } = await supabase
    .from("cli_login_requests")
    .select("*")
    .eq("token", token)
    .single()

  if (error || !loginRequest) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
        <div className="text-center text-white/40">
          <p className="text-lg font-semibold mb-2">Invalid login link</p>
          <p className="text-sm">This link is not valid or has expired.</p>
          <p className="text-sm mt-4">Run <code className="font-mono bg-white/10 px-2 py-1 rounded">npx @midasai/bridge login</code> again.</p>
        </div>
      </div>
    )
  }

  // Check if expired
  if (new Date(loginRequest.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
        <div className="text-center text-white/40">
          <p className="text-lg font-semibold mb-2">Link expired</p>
          <p className="text-sm">This login link has expired.</p>
          <p className="text-sm mt-4">Run <code className="font-mono bg-white/10 px-1 rounded">npx @midasai/bridge login</code> again.</p>
        </div>
      </div>
    )
  }

  // If already approved, show success
  if (loginRequest.status === "approved") {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-semibold mb-2">CLI authorized</p>
          <p className="text-sm text-white/50">You can close this window and return to your terminal.</p>
        </div>
      </div>
    )
  }

  // If denied, show denied state
  if (loginRequest.status === "denied") {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-xl font-semibold mb-2">Authorization denied</p>
          <p className="text-sm text-white/50">Run <code className="font-mono bg-white/10 px-1 rounded">npx @midasai/bridge login</code> to try again.</p>
        </div>
      </div>
    )
  }

  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/auth/login?returnTo=/cli/auth/${token}`)
  }

  // User is logged in, show approval page
  return <CliAuthPage token={token} user={user} />
}

export const metadata = {
  title: "Authorize Midas CLI — MidasAI",
  description: "Approve the Midas Bridge CLI connection to your account.",
}
