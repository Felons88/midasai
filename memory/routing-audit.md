# MidasAI Routing Audit

## Date
2025-01-20

## Overview

This document audits the current routing system in MidasAI to identify all dashboard-forced redirects and auth flows that need to be replaced with marketplace-first navigation patterns.

---

## Current Auth Flow Issues

### Dashboard-First Redirect Pattern

**Problem**: Users are forced into `/dashboard` after login, signup, and other actions.

**Current Flow**:
```
User browses → Login → Dashboard (forced)
User browses → Register → Dashboard (forced)
```

**Files with Dashboard Redirects**:

#### 1. Login Page (`app/auth/login/page.tsx`)
```typescript
// Line 34
router.push('/dashboard')
router.refresh()
```

#### 2. Register Page (`app/auth/register/page.tsx`)
```typescript
// Line 64
router.push('/dashboard')
router.refresh()
```

---

## Current Middleware Behavior

### Protected Routes System

**File**: `lib/supabase/middleware.ts`

**Protected Paths** (Lines 40-55):
```typescript
const protectedPaths = [
  '/dashboard',
  '/creator',
  '/admin',
  '/bookmarks',
  '/notifications',
  '/profile',
  '/settings',
  '/explore',
  '/marketplace',
  '/downloads',
  '/collections',
  '/messages',
  '/account',
  '/developers',
]
```

**Current Redirect Logic** (Lines 61-66):
```typescript
if (!user && isProtected) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/login'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}
```

**Issue**: Redirect parameter is captured but NOT used after login.

---

## Current Navigation Architecture

### Guest Navbar (`components/layout/Navbar.tsx`)

**Current Structure**:
- **Left**: Logo + Category Links (Skills, Plugins, MCP, Agents, Workflows)
- **Center**: Search Input
- **Right**: Sign In + Get Started

**Issue**: No marketplace-first navigation, limited category coverage.

### Authenticated Route Handling

**Logic** (Lines 11-22):
```typescript
const authenticatedPrefixes = [
  '/dashboard', '/creator', '/admin', '/bookmarks',
  '/notifications', '/profile', '/settings', '/explore',
  '/marketplace', '/downloads', '/collections', '/messages', '/account',
  '/developers',
]
const isAuthenticatedRoute = authenticatedPrefixes.some(p => pathname.startsWith(p))

// Don't render the top navbar on authenticated pages (sidebar handles navigation)
if (isAuthenticatedRoute) {
  return null
}
```

**Issue**: Authenticated users lose the main navbar and are forced into a sidebar-based dashboard experience.

---

## Current User Journey Problems

### 1. Browse → Login Journey
```
/listing/123 → Login → Dashboard (WRONG)
/listing/123 → Login → Return to /listing/123 (CORRECT)
```

### 2. Search → Login Journey
```
/search?q=claude → Login → Dashboard (WRONG)
/search?q=claude → Login → Return to search (CORRECT)
```

### 3. Purchase Journey
```
/listing/123 → Buy → Login → Dashboard (WRONG)
/listing/123 → Buy → Login → Continue checkout (CORRECT)
```

### 4. Bookmark Journey
```
/listing/123 → Bookmark → Login → Dashboard (WRONG)
/listing/123 → Bookmark → Login → Return to listing (CORRECT)
```

---

## Current Authenticated Layout Issues

### File: `app/(authenticated)/layout.tsx`

**Current Logic** (Lines 34-36):
```typescript
if (!user) {
  redirect('/auth/login')
}
```

**Issue**: No redirect parameter handling for returning users to intended pages.

---

## Current Creator Flow Issues

### File: `app/(authenticated)/creator/upload/page.tsx`

**Upload Success Redirect** (Line 26):
```typescript
const handleUploadSuccess = () => {
  router.push('/creator/listings')
}
```

**Issue**: Creator dashboard forced after upload instead of marketplace continuation.

---

## Current GitHub OAuth Flow

### File: `app/api/github/callback/route.ts`

**Current Redirects**:
```typescript
return NextResponse.redirect(`${appUrl}/creator/upload?github_connected=true`)
```

**Issue**: OAuth always redirects to creator upload page, not user's intended destination.

---

## Current Avatar Dropdown Issues

### Missing Marketplace Actions

**Current dropdown lacks**:
- Purchases access
- Downloads access
- Bookmarks access
- Creator studio (conditional)
- Developer portal (conditional)

---

## Summary of Critical Issues

### 1. Dashboard-First Mentality
- All auth flows redirect to `/dashboard`
- No marketplace-first user experience
- Users lose context after login

### 2. Broken Redirect Chain
- Middleware captures `redirect` parameter
- Login/Register pages ignore redirect parameter
- Users never return to intended pages

### 3. Navigation Fragmentation
- Guest users get full navbar
- Authenticated users lose main navbar
- No consistent marketplace navigation

### 4. Missing Marketplace Journeys
- No purchase flow continuation
- No bookmark flow continuation
- No download flow continuation

### 5. Creator/Developer Forced Flows
- OAuth forces creator upload page
- No natural marketplace discovery
- Dashboard-first instead of marketplace-first

---

## Required Changes

### Phase 1: Fix Auth Redirects
- Implement redirect parameter handling in login/register
- Remove forced dashboard redirects
- Return users to intended pages

### Phase 2: Redesign Navigation
- Create marketplace-first navbar for all users
- Implement proper avatar dropdown
- Remove dashboard-forced navigation

### Phase 3: Implement User Journeys
- Purchase flow continuation
- Bookmark flow continuation
- Download flow continuation
- Creator onboarding flow

### Phase 4: Fix Middleware
- Proper redirect parameter handling
- Marketplace-first protected route logic
- Remove unnecessary protected paths

---

## Files Requiring Changes

### Auth Files
- `app/auth/login/page.tsx` - Remove dashboard redirect
- `app/auth/register/page.tsx` - Remove dashboard redirect
- `app/(authenticated)/layout.tsx` - Add redirect handling

### Navigation Files
- `components/layout/Navbar.tsx` - Marketplace-first redesign
- `components/layout/AuthenticatedShell.tsx` - Avatar dropdown redesign

### Middleware
- `lib/supabase/middleware.ts` - Fix redirect handling

### API Routes
- `app/api/github/callback/route.ts` - Fix OAuth redirect

### Creator Files
- `app/(authenticated)/creator/upload/page.tsx` - Fix upload flow

---

## Priority Matrix

| Issue | Priority | Impact | Effort |
|-------|---------|---------|--------|
| Dashboard redirects | HIGH | Critical | Medium |
| Broken redirect chain | HIGH | Critical | Low |
| Navigation fragmentation | HIGH | High | Medium |
| Missing user journeys | MEDIUM | High | High |
| Creator forced flows | MEDIUM | Medium | Medium |

---

## Success Metrics

### Before Changes
- 100% of auth flows redirect to dashboard
- 0% of users return to intended pages
- Fragmented navigation experience

### After Changes
- 0% of auth flows redirect to dashboard (unless explicit)
- 100% of users return to intended pages
- Consistent marketplace navigation

---

## Next Steps

1. **Phase 1**: Fix auth redirect handling
2. **Phase 2**: Redesign navigation components
3. **Phase 3**: Implement user journeys
4. **Phase 4**: QA testing and documentation

This audit provides the foundation for implementing a marketplace-first routing system that prioritizes user intent over dashboard-centric flows.
