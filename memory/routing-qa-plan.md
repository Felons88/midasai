# MidasAI Routing Overhaul - QA Testing Plan

## Overview
Comprehensive testing plan for the marketplace-first routing and navigation overhaul.

---

## Test Scenarios

### 1. Guest User Navigation

#### Test 1.1: Browse Marketplace
**Steps:**
1. Navigate to homepage as guest
2. Click on marketplace categories (Skills, Workflows, MCP, Agents, Plugins)
3. Verify navigation works without authentication
4. Verify guest navbar is displayed

**Expected Results:**
- All marketplace pages accessible
- Guest navbar with Login/Get Started buttons
- No authentication required
- Consistent navigation experience

#### Test 1.2: Search Functionality
**Steps:**
1. Use global search in navbar
2. Search for marketplace items
3. Verify search results display
4. Click on search results

**Expected Results:**
- Search works for guest users
- Results display correctly
- Navigation to listings works

---

### 2. Authentication Redirect Flows

#### Test 2.1: Browse → Login → Return
**Steps:**
1. Navigate to `/listings/123` as guest
2. Click Login button
3. Complete authentication
4. Verify redirect back to `/listings/123`

**Expected Results:**
- Redirect parameter preserved
- User returned to original listing
- Context maintained
- Authenticated navbar displayed

#### Test 2.2: Search → Login → Return
**Steps:**
1. Navigate to `/search?q=claude` as guest
2. Click Login button
3. Complete authentication
4. Verify redirect back to search page with query preserved

**Expected Results:**
- Search query preserved in redirect
- User returned to search results
- Search context maintained

#### Test 2.3: New User Registration
**Steps:**
1. Navigate to `/auth/register`
2. Complete registration
3. Verify redirect to homepage (marketplace-first)

**Expected Results:**
- New users directed to homepage
- Welcome experience
- No forced dashboard redirect

---

### 3. Marketplace User Journeys

#### Test 3.1: Purchase Journey
**Steps:**
1. Navigate to paid listing as guest
2. Click purchase button
3. Redirect to login with return URL
4. Complete authentication
5. Return to listing
6. Complete purchase
7. Verify download access

**Expected Results:**
- Seamless purchase flow
- Auth redirect with return URL
- Purchase completion
- Download access granted

#### Test 3.2: Bookmark Journey
**Steps:**
1. Navigate to listing as guest
2. Click bookmark button
3. Redirect to login with return URL
4. Complete authentication
5. Return to listing
6. Verify bookmark saved

**Expected Results:**
- Bookmark flow preserved
- Auth redirect with return URL
- Bookmark successfully saved
- Success notification displayed

#### Test 3.3: Download Journey
**Steps:**
1. Navigate to free listing as guest
2. Click download button
3. Redirect to login with return URL
4. Complete authentication
5. Return to listing
6. Complete download
7. Verify download recorded

**Expected Results:**
- Download flow preserved
- Auth redirect with return URL
- Download initiated successfully
- Download recorded in history

---

### 4. Creator Journey

#### Test 4.1: Creator Onboarding
**Steps:**
1. Navigate to `/creator/dashboard` as new creator
2. Complete onboarding steps
3. Connect GitHub account
4. Set up creator profile
5. Upload first asset
6. Verify creator dashboard access

**Expected Results:**
- Onboarding flow works
- GitHub connection successful
- Profile setup complete
- First upload successful
- Dashboard accessible

#### Test 4.2: Creator Dashboard Access
**Steps:**
1. Navigate to creator dashboard
2. Verify marketplace navigation still available
3. Verify creator-specific sections
4. Test navigation between creator tools

**Expected Results:**
- Marketplace navigation maintained
- Creator tools accessible
- Navigation works correctly
- No forced dashboard redirects

---

### 5. Developer Journey

#### Test 5.1: Developer Portal Access
**Steps:**
1. Access developer portal via avatar dropdown
2. Complete developer onboarding
3. Generate API keys
4. Set up webhooks
5. Monitor usage analytics

**Expected Results:**
- Developer portal accessible
- Onboarding flow works
- API key generation successful
- Webhook configuration works
- Analytics display correctly

#### Test 5.2: API Integration
**Steps:**
1. Use generated API key
2. Test API endpoints
3. Verify authentication
4. Monitor usage in analytics

**Expected Results:**
- API authentication works
- Endpoints respond correctly
- Usage tracked in analytics
- Rate limiting applied

---

### 6. Dashboard as Personal Hub

#### Test 6.1: Dashboard Accessibility
**Steps:**
1. Navigate to `/dashboard`
2. Verify personal hub displayed
3. Verify marketplace-first quick actions
4. Test navigation from dashboard

**Expected Results:**
- Dashboard accessible as personal hub
- Marketplace actions prioritized
- Navigation works correctly
- No forced redirects

#### Test 6.2: Dashboard Content
**Steps:**
1. Verify recent downloads displayed
2. Verify bookmarks displayed
3. Verify recommendations shown
4. Verify quick actions work

**Expected Results:**
- Personal activity displayed
- Recommendations relevant
- Quick actions functional
- Content loads correctly

---

### 7. Navigation Consistency

#### Test 7.1: Guest vs Authenticated Navigation
**Steps:**
1. Compare guest navbar with authenticated navbar
2. Verify marketplace links same for both
3. Verify user-specific actions for authenticated
4. Test navigation consistency

**Expected Results:**
- Marketplace navigation identical
- User actions added for authenticated
- Consistent visual design
- Smooth transitions

#### Test 7.2: Avatar Dropdown
**Steps:**
1. Click avatar dropdown
2. Verify Account section
3. Verify Creator section (if creator)
4. Verify Developer section
5. Verify Settings section
6. Test all dropdown links

**Expected Results:**
- All sections display correctly
- Conditional sections work
- Links navigate correctly
- Dropdown functions properly

---

### 8. Protected Routes

#### Test 8.1: Protected Route Access
**Steps:**
1. Try to access `/bookmarks` as guest
2. Verify redirect to login with return URL
3. Complete authentication
4. Verify redirect to bookmarks

**Expected Results:**
- Protected routes redirect properly
- Return URL preserved
- Access granted after auth
- Navigation works correctly

#### Test 8.2: Marketplace Route Access
**Steps:**
1. Try to access `/explore` as guest
2. Verify no redirect required
3. Verify content accessible
4. Test navigation

**Expected Results:**
- Marketplace routes accessible
- No authentication required
- Content displays correctly
- Navigation works

---

### 9. Middleware Behavior

#### Test 9.1: Redirect Parameter Handling
**Steps:**
1. Access protected route as guest
2. Verify redirect parameter set correctly
3. Complete authentication
4. Verify redirect parameter used

**Expected Results:**
- Redirect parameter set correctly
- Parameter preserved through auth
- User redirected to intended page
- No dashboard forced redirect

#### Test 9.2: Session Management
**Steps:**
1. Login and navigate to protected route
2. Logout
3. Try to access protected route again
4. Verify redirect to login

**Expected Results:**
- Session expires correctly
- Protected routes re-protected
- Redirect to login
- Return URL preserved

---

### 10. Edge Cases

#### Test 10.1: Invalid Redirect URLs
**Steps:**
1. Try to access with invalid redirect parameter
2. Verify fallback to homepage
3. Test with external URLs
4. Test with malformed URLs

**Expected Results:**
- Invalid redirects handled safely
- Fallback to homepage
- External URLs rejected
- No security vulnerabilities

#### Test 10.2: Concurrent Sessions
**Steps:**
1. Login in one tab
2. Access protected route in another tab
3. Verify session shared
4. Test navigation across tabs

**Expected Results:**
- Session shared across tabs
- Navigation works correctly
- No session conflicts
- Consistent experience

---

## Success Criteria

### Must Pass
- All authentication redirect flows work correctly
- Marketplace navigation consistent for all users
- User journeys complete without forced redirects
- Protected routes properly secured
- Dashboard functions as personal hub

### Should Pass
- Onboarding flows work smoothly
- API integrations function correctly
- Performance acceptable
- Mobile navigation works

### Nice to Have
- Advanced analytics tracking
- Error handling graceful
- Loading states clear
- Accessibility standards met

---

## Testing Tools

- Manual browser testing
- Automated E2E tests (Playwright)
- Performance monitoring
- Accessibility audit
- Security scan

---

## Known Issues to Monitor

1. TypeScript errors in marketplace components
2. Supabase client type issues
3. Edge Function Deno types
4. Redirect parameter edge cases
5. Session state management

---

## Sign-off Criteria

- All critical tests pass
- No blocking issues
- Performance acceptable
- Security review complete
- Documentation updated
