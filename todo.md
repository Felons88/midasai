# MidasAI Workflow Inspection Fixes - Step-by-Step Plan

## Phase 1: Enable Workflow Inspector Access
- [x] Update WorkshopClient.tsx to allow clicks on PROCESSING_AI workflows
- [x] Add expand button always visible for active workflows
- [x] Add hover/touch indicators for better UX
- [x] Update toast/error handling for blocked clicks
- [ ] Add expand button accessibility via keyboard

## Phase 2: API Layer Repair
- [ ] Fix backend API route authentication and error handling
- [ ] Resolve syntax errors in expand route
- [ ] Ensure proper status transitions for PROCESSING_AI
- [ ] Add missing analyze endpoint if needed
- [ ] Add robust error logging

## Phase 3: Conversation Memory Integration
- [ ] Implement database schema for conversation persistence
- [ ] Update API routes to read/write conversation history
- [ ] Add loading logic in ExpandOverlay for existing history
- [ ] Save user messages to backend
- [ ] Restore conversation history on re-opening overlay

## Phase 4: ExpandOverlay Enhancements
- [ ] Allow user to input guidance messages
- [ ] Improve loading state management
- [ ] Add visual feedback for analysis progress
- [ ] Enhance error display with retry options
- [ ] Optimize performance for large conversations

## Phase 5: Full Integration Testing
- [ ] Test end-to-end workflow:
  - Click PROCESSING_AI workflow
  - Open inspector
  - View conversation history
  - Send guidance message
  - Continue with suggestions
  - Generate final files
- [ ] Validate authentication flows
- [ ] Check mobile responsiveness
- [ ] Verify performance metrics

---

# GitHub Discovery & Prompt Import Pipeline

## Phase 1: Audit
- [x] Read AGENTS.md, project-state, architecture docs
- [x] Audit existing ingestion (ClawHub, SkillsMP), categorization, search, GitHub scan
- [x] Audit database schema and identify missing tables

## Phase 2: Blueprint
- [x] Create architecture blueprint at `plans/github-discovery-pipeline.md`
- [x] Assign agent ownership for each subsystem

## Phase 3: Database Schema
- [x] Create migration with discovery queries, jobs, repositories, versions, classifications, import queue, analytics
- [x] Add missing `categorization_jobs` table
- [x] Add indexes, triggers, RLS policies
- [x] Regenerate `types/database.ts`

## Phase 4: GitHub Discovery Service
- [x] Build `lib/discovery/github.ts` with GitHub Search API, metadata extraction, README fetch
- [x] Implement rate-limit handling and retries
- [x] Create API routes: `/api/admin/discovery/queries`, `/api/admin/discovery/jobs`

## Phase 5: Classification & Import Pipeline
- [x] Build `lib/discovery/classify.ts` using Gemini
- [x] Create `/api/admin/discovery/classify` route
- [x] Queue newly discovered repos into `import_queue`

## Phase 6: Review Queue
- [x] Create `/api/admin/discovery/queue` route
- [x] Support approve/reject/archive actions

## Phase 7: Search Index
- [ ] Auto-refresh `listings.search_vector` after approved imports
- [ ] Add discovery search filters to public search

## Phase 8: Admin Frontend
- [x] Add Discovery to admin nav
- [x] Create `/felon-admin/discovery` dashboard with queries, jobs, repos, queue

## Phase 9: Scheduler
- [ ] Edge function for scheduled discovery based on `schedule_cron`
- [ ] Track API rate limits and analytics

## Phase 10: Validation
- [x] `npm run build` passes
- [ ] Test discovery run against real GitHub API
- [ ] Test classification and review workflow
- [ ] Update documentation and project memory