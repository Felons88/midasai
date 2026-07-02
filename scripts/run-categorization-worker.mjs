#!/usr/bin/env node

import dotenv from "dotenv";
import path from "path";

// Load from .env.local (production secrets are injected there)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

const BATCH_SIZE = Number(process.env.CATEGORIZATION_BATCH_SIZE ?? "5");
const POLL_INTERVAL_MS = Number(process.env.CATEGORIZATION_POLL_INTERVAL_MS ?? "5000");
const MAX_RUNTIME_MS = Number(process.env.CATEGORIZATION_MAX_RUNTIME_MS ?? "300000");

if (!ADMIN_SECRET_KEY) {
  console.error("[Categorization Worker] Missing ADMIN_SECRET_KEY");
  process.exit(1);
}

async function processBatch() {
  const res = await fetch(`${APP_URL}/api/admin/categorize/worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_SECRET_KEY,
    },
    body: JSON.stringify({ batchSize: BATCH_SIZE }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Worker request failed ${res.status}: ${text}`);
  }

  return await res.json();
}

async function main() {
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  console.log("[Categorization Worker] Started");

  while (Date.now() - startTime < MAX_RUNTIME_MS) {
    const results = await processBatch();

    totalProcessed += results.processed || 0;
    totalSucceeded += results.succeeded || 0;
    totalFailed += results.failed || 0;

    if (!results.processed) {
      console.log("[Categorization Worker] No pending jobs. Exiting.");
      break;
    }

    console.log(`[Categorization Worker] Batch complete: ${results.succeeded}/${results.processed} succeeded`);
    await sleep(POLL_INTERVAL_MS);
  }

  console.log(
    `[Categorization Worker] Finished. Processed: ${totalProcessed}, succeeded: ${totalSucceeded}, failed: ${totalFailed}`
  );
  process.exit(0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("[Categorization Worker] Crashed:", err);
  process.exit(1);
});
