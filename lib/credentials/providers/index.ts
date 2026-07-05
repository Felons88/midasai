/**
 * Provider Registry Initialization
 * 
 * Registers all credential providers with the registry
 */

import { providerRegistry } from '../provider-registry'
import { openaiProvider } from './openai'
import { anthropicProvider } from './anthropic'
import { googleAiProvider } from './google-ai'
import { groqProvider } from './groq'
import { openrouterProvider } from './openrouter'
import { mistralProvider } from './mistral'
import { cohereProvider } from './cohere'
import { githubProvider } from './github'
import { gitlabProvider } from './gitlab'
import { slackProvider } from './slack'
import { discordProvider } from './discord'
import { stripeProvider } from './stripe'
import { notionProvider } from './notion'
import { linearProvider } from './linear'
import { twilioProvider } from './twilio'
import { sendgridProvider } from './sendgrid'
import { resendProvider } from './resend'
import { supabaseProvider } from './supabase'
import { vercelProvider } from './vercel'
import { awsProvider } from './aws'
import { cloudflareProvider } from './cloudflare'
import { airtableProvider } from './airtable'
import { gmailProvider } from './gmail'
import { telegramProvider } from './telegram'
import { activecampaignProvider } from './activecampaign'
import { acuityProvider } from './acuity'
import { affinityProvider } from './affinity'
import { jotformProvider } from './jotform'
import { typeformProvider } from './typeform'
import { vonageProvider } from './vonage'
import { mindeeProvider } from './mindee'

// Register all providers
export function registerProviders() {
  providerRegistry.register(openaiProvider)
  providerRegistry.register(anthropicProvider)
  providerRegistry.register(googleAiProvider)
  providerRegistry.register(groqProvider)
  providerRegistry.register(openrouterProvider)
  providerRegistry.register(mistralProvider)
  providerRegistry.register(cohereProvider)
  providerRegistry.register(githubProvider)
  providerRegistry.register(gitlabProvider)
  providerRegistry.register(slackProvider)
  providerRegistry.register(discordProvider)
  providerRegistry.register(stripeProvider)
  providerRegistry.register(notionProvider)
  providerRegistry.register(linearProvider)
  providerRegistry.register(twilioProvider)
  providerRegistry.register(sendgridProvider)
  providerRegistry.register(resendProvider)
  providerRegistry.register(supabaseProvider)
  providerRegistry.register(vercelProvider)
  providerRegistry.register(awsProvider)
  providerRegistry.register(cloudflareProvider)
  providerRegistry.register(airtableProvider)
  providerRegistry.register(gmailProvider)
  providerRegistry.register(telegramProvider)
  providerRegistry.register(activecampaignProvider)
  providerRegistry.register(acuityProvider)
  providerRegistry.register(affinityProvider)
  providerRegistry.register(jotformProvider)
  providerRegistry.register(typeformProvider)
  providerRegistry.register(vonageProvider)
  providerRegistry.register(mindeeProvider)
}

// Auto-register on import
registerProviders()
