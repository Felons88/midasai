# Blueprint: User Learning Recommendation Engine

## Objective

MidasAI should continuously learn from each user based on what they click, search, install, and every prompt they use in the Architect workshop. The output is a personalized recommendation layer that improves the home feed, explore page, search results, and Architect suggestions.

## Scope

This is a multi-phase build. Each phase is designed as one production-ready PR.

---

## Phase 1 — Event Collection Pipeline

Goal: Capture every meaningful user action with context and persistence.

### Database
- Verify `analytics_events` is sufficient. Add missing columns if needed (e.g., `session_id`, `ip_address`, `user_agent`).
- Create a `user_interest_profile` table if not proceeding with `analytics_events` alone.

### API
- Create `POST /api/analytics/event`.
  - Accepts `{ event, properties, timestamp }`.
  - Validates the event against a schema.
  - Writes to `analytics_events` with the authenticated user ID.
  - Public-safe: allows anonymous events with `user_id: null`.

### Client tracking
- Update `lib/analytics.ts` `trackEvent` to actually call `/api/analytics/event`.
- Add `trackEvent` calls to:
  - Listing card click
  - Search submit
  - Install / GitHub open
  - Bookmark toggle
  - Purchase complete
  - Category click
  - Tag click
  - Architect prompt send (capture prompt text, session_id)

### Verification
- Build passes.
- Events appear in `analytics_events` when actions are performed.
- E2E test: a search event is recorded.

---

## Phase 2 — User Interest Profile

Goal: Build a weighted profile per user from the event stream.

### Database
- Create `user_interest_profile`:
  - `user_id`, `dimension` (category, tag, type, creator, language), `value`, `weight`, `event_count`, `last_updated_at`, `decayed_at`.
  - Unique on `(user_id, dimension, value)`.
  - Index on `user_id` and `last_updated_at`.

### Scoring
- Define event weights:
  - view: 1
  - click: 2
  - search: 3
  - bookmark: 5
  - install/download: 8
  - purchase: 12
  - architect prompt: 5
  - follow creator: 6
- Apply exponential time decay: `weight *= 0.5 ^ (days_since / 7)`.
- Aggregate by listing category, tags, type, creator, language, and topics from GitHub metadata.

### Compute job
- Create a Supabase Edge Function `recompute-user-profile`:
  - Reads all `analytics_events` for a user since the last run.
  - Updates `user_interest_profile` rows.
  - Runs on a cron every 15 minutes or is triggered by high-value events.

### Verification
- Unit tests for scoring/decay math.
- Edge function runs without errors.
- Profile weights reflect recent user actions.

---

## Phase 3 — Recommendation Engine

Goal: Use the profile to rank content.

### RPC / API
- Create `get_personalized_listings` RPC or `GET /api/recommendations`:
  - Takes `user_id`, `limit`, `context` (home, explore, search, architect).
  - Computes a score for each candidate listing:
    - Category/tag overlap with profile
    - Creator affinity
    - Popularity (downloads, rating)
    - Recency
    - Diversity penalty
  - Returns ranked list of listing IDs.

### Architect integration
- Create `POST /api/recommendations/architect-prompt`:
  - Accepts the current Architect session messages.
  - Uses the user profile + recent prompts to suggest the next prompt or project direction.
  - Optional: call Gemini to rewrite the prompt.

### Verification
- API returns ranked results.
- Results are different for different users (or anonymous vs logged-in).
- Performance: <200ms for a user profile.

---

## Phase 4 — UI Integration

Goal: Surface recommendations in the product.

### Home feed
- Replace or augment the static “Marketplace Spotlight” with a personalized section.
- Add a “Recommended for you” row on the homepage.

### Explore
- Add a “Because you viewed X” / “Based on your interests” carousel.

### Search
- Boost listings that match the user profile in the search ranking.

### Architect
- Show a “Suggested next prompt” chip based on the user profile and current session.

### Verification
- Build passes.
- UI smoke tests verify sections render.
- Recommendation API is called on relevant pages.

---

## Phase 5 — Feedback Loop & Iteration

Goal: The system improves itself.

- Track `recommendation_served` and `recommendation_clicked` events.
- Add a click-through rate (CTR) metric to the recommendation job.
- Recompute weights periodically based on observed CTR.
- Add a dashboard for the user to view/adjust their interests (optional).

### Verification
- Recommendation events are recorded.
- CTR can be calculated per user segment.

---

## Anti-patterns

- Do not store raw prompt text in the profile table; extract topics/intent first.
- Do not compute recommendations synchronously on every page load; use a materialized profile.
- Do not leak other users’ profiles through RLS.
- Do not rely on client-side analytics only; server-side events (downloads, purchases) are authoritative.

## First Slice

Start with **Phase 1 — Event Collection Pipeline**:
1. Wire up `trackEvent` to call `/api/analytics/event`.
2. Add event tracking for listing clicks, searches, installs, bookmarks, and Architect prompts.
3. Verify events land in `analytics_events`.

Done when: a user can click a listing and a row with `event: listing_clicked` appears in the table with the correct `user_id` and `listing_id`.
