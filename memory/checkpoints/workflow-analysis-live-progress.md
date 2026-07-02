# Checkpoint: Workflow Analysis Live Progress

**Date:** 2026-07-02  
**Cycle:** 16 — Enterprise Workflow + Explore V2  
**Agent:** AGENT 0 / Orchestrator

## Summary

Fixed the workflow analysis getting stuck at `ANALYZING` / `deep_scan` / 5% with no progress indication. The `POST /api/workflows/[id]/analyze` endpoint now streams real-time progress events to the client, and the UI shows the current stage and file being scanned.

## Problem

- The analyze endpoint set the workflow status to `ANALYZING` and returned immediately without doing any work.
- The status stayed at `ANALYZING` forever, so the frontend polling never saw completion.
- The `WorkflowCard` showed a generic "Analyzing project files..." message with no file-by-file feedback.

## Changes

### Database
- Added `current_file` column to `public.workflow_expansions` via `supabase/migrations/20260702_workflow_expansions_current_file.sql`.
- Applied the migration to the live Supabase project.

### API
- Rewrote `app/api/workflows/[id]/analyze/route.ts`:
  - `POST` now performs a live multi-stage scan (`manifest_read`, `dependency_graph`, `deep_scan`, `pattern_recognition`, `quality_scoring`).
  - For each stage + file, it updates `pipeline_stage`, `pipeline_progress`, and `current_file` in the database.
  - Returns a streaming JSON-lines response so the UI can show progress as it happens.
  - On completion, writes `analysis_summary`, `initial_score`, `tech_stack_detected`, `strengths`, `weaknesses`, `architecture_pattern`, `readiness_level`, `contextual_questions` into `expansion_config` and marks the workflow `ANALYZED`.
  - `GET` now returns `current_file` for polling fallback.

### UI
- Updated `components/architect/WorkflowCard.tsx`:
  - Added `current_file`, `generated_files`, and `output` to the `WorkflowExpansion` interface.
  - Added `READY` to `WorkflowStatus` and `STATUS_CONFIG`.
  - Replaced the generic analyzing message with a live stage label + current file, progress bar, and percentage.
- Updated `app/(architect)/architect/workshop/WorkshopClient.tsx`:
  - `handleExpand` now reads the streaming `POST` response and updates the workflow state in real-time as each file is scanned.
  - Removed the old polling path for analysis; the stream is the source of truth.
  - Added `Check` import and fixed pre-existing type references.

## Verification

- `npm run build` ✅ passes
- Build output shows `Compiled successfully` with exit code 0

## Next steps

- Consider moving the scan to a background worker if the workflow has many files (>50) so the request doesn't stay open.
- Add real AI analysis to the scan instead of deterministic metadata.
- Wire the analysis stage to the ExpandOverlay neural canvas so the overlay shows the current file too.
