# Nexus Setup — Environment Variables & Manual Steps

Everything in this file is **your responsibility**. The code is complete — you just need to configure the services and set the env vars.

---

## 1. Required Always

| Variable | Where to get it | Used for |
|----------|----------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL e.g. `https://midasai.app` | OAuth redirects, webhook trigger URLs |

---

## 2. OAuth App Setup (one per provider you want to support)

For each provider you want OAuth login to work for, you need to create an OAuth App and get a Client ID + Secret.

### GitHub
1. Go to **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Authorization callback URL: `https://your-domain.com/api/nexus/oauth/github/callback`
3. Set:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

### Google (Gmail, Sheets, Calendar, Drive)
1. Go to **console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client**
2. Redirect URI: `https://your-domain.com/api/nexus/oauth/google/callback`
3. Enable APIs: Gmail API, Google Sheets API, Google Calendar API, Google Drive API
4. Set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Slack
1. Go to **api.slack.com/apps → Create New App → OAuth & Permissions**
2. Redirect URL: `https://your-domain.com/api/nexus/oauth/slack/callback`
3. Set:
   - `SLACK_CLIENT_ID`
   - `SLACK_CLIENT_SECRET`

### Discord (OAuth / Bot)
1. Go to **discord.com/developers/applications → New Application → OAuth2**
2. Redirect: `https://your-domain.com/api/nexus/oauth/discord/callback`
3. Set:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
4. **For bot token nodes** (comm.discord): Users enter their own Bot Token manually in the credential popup — no extra env vars needed.

### Notion
1. Go to **notion.so/my-integrations → New Integration → OAuth**
2. Redirect URI: `https://your-domain.com/api/nexus/oauth/notion/callback`
3. Set:
   - `NOTION_CLIENT_ID`
   - `NOTION_CLIENT_SECRET`

### Linear
1. Go to **linear.app/settings/api → OAuth Application → Create**
2. Callback URL: `https://your-domain.com/api/nexus/oauth/linear/callback`
3. Set:
   - `LINEAR_CLIENT_ID`
   - `LINEAR_CLIENT_SECRET`

### Twitter / X
1. Go to **developer.twitter.com/en/portal → Projects & Apps → User Authentication Settings**
2. Callback URI: `https://your-domain.com/api/nexus/oauth/twitter/callback`
3. Set:
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`

### LinkedIn
1. Go to **linkedin.com/developers/apps → Create App → Auth**
2. Redirect URL: `https://your-domain.com/api/nexus/oauth/linkedin/callback`
3. Set:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`

### Stripe Connect
1. Go to **dashboard.stripe.com/settings/connect/oauth → Get Client ID**
2. Redirect URI: `https://your-domain.com/api/nexus/oauth/stripe/callback`
3. Set:
   - `STRIPE_CLIENT_ID` ← this is the Connect client ID (`ca_...`), not the secret key
   - `STRIPE_CLIENT_SECRET` ← your normal secret key (`sk_...`)

---

## 3. API Key Integrations (users enter their own — no env vars needed)

These are entered by the user directly in the credential popup when they drop the node. No server-side setup required:

| Integration | What user needs |
|-------------|----------------|
| OpenAI | API key from platform.openai.com/api-keys |
| Anthropic | API key from console.anthropic.com/account/keys |
| Groq | API key from console.groq.com/keys |
| Telegram | Bot token from @BotFather |
| Supabase | Project URL + anon key + optional service key |
| AWS | Access Key ID + Secret + region |
| Azure | Connection string |
| Cloudflare | API token + account ID |
| Vercel | API token from vercel.com/account/tokens |
| Twilio | Account SID + Auth Token |
| SendGrid | API key |
| Resend | API key |
| Pinecone | API key + environment |
| Qdrant | URL + optional API key |
| PostHog | Project API key |
| PagerDuty | API key |
| Railway | API token |
| WordPress | Site URL + username + app password |
| Contentful | Delivery token + optional management token |
| Cal.com | API key |
| Docker | Registry URL + username + password |

---

## 4. Database Migration

The Nexus credential, schedule, and webhook tables must be applied to your Supabase project.

Run this in the Supabase SQL Editor or via CLI:

```bash
npx supabase db push
# or apply manually:
# supabase/migrations/20260704_200000_nexus_credentials.sql
```

Tables created:
- `nexus_credentials` — encrypted credential storage per user
- `nexus_workflow_schedules` — cron-based triggers per workflow
- `nexus_webhook_tokens` — public webhook URLs per workflow

---

## 5. Scheduled Workflow Execution (Cron)

The `nexus_workflow_schedules` table stores cron expressions, but **execution is not automatic yet** — you need a job runner. Options:

### Option A — Supabase pg_cron (recommended)
```sql
-- Run every minute, pick up due schedules
SELECT cron.schedule(
  'nexus-schedule-runner',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-domain.com/api/nexus/schedules/run',
      headers := '{"Authorization": "Bearer ' || current_setting('app.service_key') || '"}'::jsonb
    )
  $$
);
```

### Option B — Vercel Cron
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/nexus/schedules/run",
      "schedule": "* * * * *"
    }
  ]
}
```
Then create `app/api/nexus/schedules/run/route.ts` — it should query all enabled schedules where `next_run_at <= now()` and trigger them.

### Option C — External cron (EasyCron, GitHub Actions scheduled)
Make a GET request to `/api/nexus/schedules/run` every minute with your service key.

---

## 6. Summary: All Env Vars

```env
# Required
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# OAuth (only set the ones you want to enable)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
LINEAR_CLIENT_ID=
LINEAR_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
STRIPE_CLIENT_ID=
STRIPE_CLIENT_SECRET=

# Existing (already set)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 7. What's Already Done (no action needed)

- ✅ Credential vault — DB table + API routes + UI
- ✅ OAuth callback + token storage
- ✅ Node auth popup on drop — spins → expands → connect
- ✅ Webhook triggers — generate URL, sign with HMAC, auto-trigger workflow
- ✅ Schedule manager UI — cron expressions, timezones, enable/disable
- ✅ Webhook manager UI — URL + secret display, curl example, enable/disable
- ✅ Telegram, Supabase, WhatsApp, Gmail, Google Sheets, GitHub Actions nodes
- ✅ 150+ nodes across 20+ categories
