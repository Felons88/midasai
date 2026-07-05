import { scrapeAllN8nTemplates } from '@/lib/nexus/n8n-scraper'

async function main() {
  console.log('Starting n8n workflow scrape...')

  const result = await scrapeAllN8nTemplates((current, total, message) => {
    console.log(`[${current}/${total}] ${message}`)
  })

  console.log('\n=== Scrape Results ===')
  console.log(`Categories processed: ${result.categories}`)
  console.log(`Workflows imported: ${result.imported}`)
  console.log(`Failures: ${result.failed}`)

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach((error) => console.log(`  - ${error}`))
  }

  const exitCode = result.failed > 0 || result.errors.length > 0 ? 1 : 0
  process.exitCode = exitCode

  // Allow any pending async handles (Supabase/fetch) to close before exiting.
  // On Windows, a hard process.exit() with open handles can trigger a libuv assertion.
  setTimeout(() => process.exit(exitCode), 500).unref()
}

main().catch((error) => {
  console.error('Scrape failed:', error)
  process.exitCode = 1
  setTimeout(() => process.exit(1), 500).unref()
})
