#!/usr/bin/env node

import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load from .env.local (production secrets are injected there)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[Hung Job Checker] Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check for jobs that have been processing for more than 2 hours.
 */
const HUNG_JOB_THRESHOLD_MS = 2 * 60 * 60 * 1000;

async function checkHungJobs() {
  console.log("[Hung Job Checker] Starting hung job check...");

  const cutoffTime = new Date(Date.now() - HUNG_JOB_THRESHOLD_MS);

  const { data: hungJobs, error } = await supabase
    .from("architect_background_jobs")
    .select("job_id, started_at")
    .eq("status", "processing")
    .lt("started_at", cutoffTime.toISOString())
    .order("started_at", { ascending: true });

  if (error) {
    console.error("[Hung Job Checker] Error fetching hung jobs:", error);
    process.exit(1);
  }

  if (!hungJobs || hungJobs.length === 0) {
    console.log("[Hung Job Checker] No hung jobs found");
    return;
  }

  console.log(`[Hung Job Checker] Found ${hungJobs.length} potentially hung jobs`);

  for (const job of hungJobs) {
    console.log(`[Hung Job Checker] Marking job ${job.job_id} as failed (started: ${job.started_at})`);

    const { error: updateError } = await supabase
      .from("architect_background_jobs")
      .update({
        status: "failed",
        error: "Job timed out after 2 hours of processing",
        current_step: "timeout",
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", job.job_id);

    if (updateError) {
      console.error(`[Hung Job Checker] Failed to update job ${job.job_id}:`, updateError);
    } else {
      console.log(`[Hung Job Checker] Marked job ${job.job_id} as failed due to timeout`);
    }
  }

  console.log("[Hung Job Checker] Hung job check completed");
}

checkHungJobs().catch((error) => {
  console.error("[Hung Job Checker] Unexpected error:", error);
  process.exit(1);
});
