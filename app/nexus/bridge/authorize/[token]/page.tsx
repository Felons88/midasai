/**
 * /nexus/bridge/authorize/[token]
 * Public page — no layout wrapper needed.
 * The CLI opens this in the user's browser after `npx @midasai/bridge`.
 */
import { BridgeAuthorizePage } from "@/components/nexus/BridgeAuthorizePage"

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  return <BridgeAuthorizePage paramsPromise={params} />
}

export const metadata = {
  title: "Authorize Midas Bridge — MidasAI",
  description: "Approve or deny your IDE's request to connect to MidasAI.",
}
