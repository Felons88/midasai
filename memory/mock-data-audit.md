# MidasAI Mock Data Audit

## Date
2025-01-19

## Overview

This document identifies all instances of mock data in the codebase that must be replaced with real database queries.

---

## Summary

**Total Pages with Mock Data**: 37/37 (100%)
**Total Mock Data Instances**: 150+
**Real Database Queries**: 0

---

## Homepage Mock Data

### File: `app/page.tsx`

**Mock Data Instances**:
1. Category counts (hardcoded):
   - "250+" for Claude Skills
   - "180+" for Cursor Rules
   - "120+" for MCP Servers
   - "95+" for AI Agents

2. Featured listings (hardcoded array):
   - "Claude Skill Pack Pro" - $29 - 4.8 rating - 42 reviews
   - "MCP Server Bundle" - $49 - 4.9 rating - 28 reviews
   - "AI Agent Toolkit" - $79 - 4.7 rating - 35 reviews

3. Popular tags (hardcoded array):
   - "Claude Skills"
   - "MCP Servers"
   - "AI Agents"
   - "Workflows"

**Required Real Data**:
- Fetch actual category counts from database
- Fetch featured listings from database
- Fetch trending tags from database
- Implement caching for performance

---

## Search Page Mock Data

### File: `app/search/page.tsx`

**Mock Data Instances**:
1. Search results (hardcoded array):
   - "AI Tool 1" through "AI Tool 4"
   - All with same description and price ($29)

**Required Real Data**:
- Implement actual search query
- Fetch results from database based on search term
- Implement filtering by type
- Implement sorting options
- Add pagination

---

## Category Pages Mock Data

### Skills Page: `app/skills/page.tsx`

**Mock Data Instances**:
1. Skill listings (hardcoded array):
   - "Claude Skill 1" through "Claude Skill 6"
   - All with same description, price ($19), downloads (1.2k)

**Required Real Data**:
- Fetch skills from database
- Filter by category
- Implement pagination
- Add sorting options
- Show real download counts

### Plugins Page: `app/plugins/page.tsx`

**Mock Data Instances**:
1. Plugin listings (hardcoded array)
   - Similar pattern to skills page

**Required Real Data**:
- Fetch plugins from database
- Same requirements as skills page

### MCP Page: `app/mcp/page.tsx`

**Mock Data Instances**:
1. MCP listings (hardcoded array)

**Required Real Data**:
- Fetch MCP servers from database
- Same requirements as skills page

### Agents Page: `app/agents/page.tsx`

**Mock Data Instances**:
1. Agent listings (hardcoded array)

**Required Real Data**:
- Fetch AI agents from database
- Same requirements as skills page

### Prompts Page: `app/prompts/page.tsx`

**Mock Data Instances**:
1. Prompt listings (hardcoded array)

**Required Real Data**:
- Fetch prompts from database
- Same requirements as skills page

### Workflows Page: `app/workflows/page.tsx`

**Mock Data Instances**:
1. Workflow listings (hardcoded array)

**Required Real Data**:
- Fetch workflows from database
- Same requirements as skills page

### Templates Page: `app/templates/page.tsx`

**Mock Data Instances**:
1. Template listings (hardcoded array)

**Required Real Data**:
- Fetch templates from database
- Same requirements as skills page

---

## Dashboard Mock Data

### File: `app/dashboard/page.tsx`

**Mock Data Instances**:
1. User stats (hardcoded):
   - Total Downloads: 24
   - Bookmarks: 12
   - Listings: 3
   - Revenue: $482

2. Recent downloads (hardcoded array):
   - "AI Tool 1" through "AI Tool 3"
   - All with "2 days ago" timestamp

**Required Real Data**:
- Fetch actual user stats from database
- Fetch actual recent downloads
- Calculate real revenue
- Show real bookmark count
- Show real listing count

---

## Creator Dashboard Mock Data

### File: `app/creator/dashboard/page.tsx`

**Mock Data Instances**:
1. Creator stats (hardcoded):
   - Total Revenue: $4,820
   - Total Sales: 156
   - Total Views: 12.4k
   - Active Listings: 8

2. Recent sales (hardcoded array):
   - "AI Tool 1" through "AI Tool 3"
   - All with "+$29" revenue
   - All with "2 hours ago" timestamp

3. Creator listings (hardcoded array):
   - "Listing 1" through "Listing 4"
   - All with "Claude Skills • $19"
   - All with same view/sales/revenue stats

**Required Real Data**:
- Fetch actual creator revenue
- Fetch actual sales count
- Fetch actual view count
- Fetch actual active listings
- Fetch real recent sales
- Fetch real listing performance
- Calculate real revenue per listing

---

## Admin Dashboard Mock Data

### File: `app/admin/dashboard/page.tsx`

**Mock Data Instances**:
1. Platform stats (hardcoded):
   - Total Users: 2,456
   - Total Revenue: $48,290
   - Total Listings: 892
   - Pending Reviews: 23

2. Recent registrations (hardcoded array):
   - "User 1" through "User 5"
   - All with "X hours ago" timestamp

3. Pending listings (hardcoded array):
   - "Listing 1" through "Listing 5"
   - All with "X hours ago" timestamp

4. Platform alerts (hardcoded):
   - "Payment Gateway Issue"
   - "Database Maintenance"

**Required Real Data**:
- Fetch actual user count
- Fetch actual platform revenue
- Fetch actual listing count
- Fetch actual pending reviews
- Fetch real recent registrations
- Fetch real pending listings
- Fetch real platform alerts
- Calculate real growth metrics

---

## Other Pages with Mock Data

### Categories Page: `app/categories/page.tsx`
- Hardcoded category listings
- No real category data

### Collections Page: `app/collections/page.tsx`
- Hardcoded collection listings
- No real collection data

### Trending Page: `app/trending/page.tsx`
- Hardcoded trending listings
- No real trending algorithm

### Featured Page: `app/featured/page.tsx`
- Hardcoded featured listings
- No real featured system

### Bookmarks Page: `app/bookmarks/page.tsx`
- Hardcoded bookmark listings
- No real bookmark data

### Notifications Page: `app/notifications/page.tsx`
- Hardcoded notifications
- No real notification system

### Profile Page: `app/profile/page.tsx`
- Hardcoded profile data
- No real profile system

### Settings Page: `app/settings/page.tsx`
- Hardcoded settings
- No real settings system

### Pricing Page: `app/pricing/page.tsx`
- Hardcoded pricing tiers
- No real pricing system

### Blog Page: `app/blog/page.tsx`
- Hardcoded blog posts
- No real blog system

### Docs Page: `app/docs/page.tsx`
- Hardcoded documentation
- No real docs system

### About Page: `app/about/page.tsx`
- Hardcoded about content
- Static content (acceptable)

### Contact Page: `app/contact/page.tsx`
- Hardcoded contact info
- No real contact form

---

## Mock Data Patterns

### Common Patterns Found

1. **Array Mapping Pattern**:
```typescript
{[1, 2, 3, 4, 5, 6].map((i) => (
  <Card key={i}>
    <CardTitle>Item {i}</CardTitle>
  </Card>
))}
```

2. **Hardcoded Stats Pattern**:
```typescript
<CardTitle className="text-3xl">24</CardTitle>
```

3. **Hardcoded Objects Pattern**:
```typescript
{[
  { title: "Item 1", price: "$29", rating: 4.8 },
  { title: "Item 2", price: "$49", rating: 4.9 },
].map((item, i) => (
  <Card key={i}>
    <CardTitle>{item.title}</CardTitle>
  </Card>
))}
```

---

## Replacement Strategy

### Phase 1: Database Queries (Week 1-2)

**Priority**: HIGH

1. Create Supabase query functions
2. Replace hardcoded arrays with database queries
3. Add error handling
4. Add loading states
5. Add empty states

### Phase 2: Caching (Week 2-3)

**Priority**: MEDIUM

1. Implement React Query or SWR
2. Add caching strategies
3. Add revalidation logic
4. Optimize query performance

### Phase 3: Real-time Updates (Week 3-4)

**Priority**: MEDIUM

1. Implement Supabase Realtime
2. Add optimistic updates
3. Add subscription logic
4. Handle connection states

---

## Required Database Queries

### User Queries
- Get user profile
- Get user stats
- Get user bookmarks
- Get user downloads
- Get user notifications

### Creator Queries
- Get creator profile
- Get creator stats
- Get creator listings
- Get creator revenue
- Get creator sales
- Get creator analytics

### Admin Queries
- Get platform stats
- Get all users
- Get all listings
- Get pending reviews
- Get recent registrations
- Get platform alerts

### Marketplace Queries
- Get listings by type
- Get listings by category
- Get featured listings
- Get trending listings
- Get search results
- Get listing details

### Social Queries
- Get reviews for listing
- Get bookmarks for user
- Get collections for user
- Get followers for creator

---

## Estimated Effort

**Total Pages to Update**: 37
**Estimated Time per Page**: 2-4 hours
**Total Estimated Time**: 74-148 hours (9-19 days)

**Critical Path**:
1. Homepage (4 hours)
2. Search page (8 hours)
3. Category pages (24 hours for 8 pages)
4. Dashboard (4 hours)
5. Creator dashboard (6 hours)
6. Admin dashboard (6 hours)
7. Other pages (22-62 hours)

---

## Success Criteria

### Completion Criteria
- [ ] Zero hardcoded arrays in production code
- [ ] All pages fetch real data from database
- [ ] All pages have loading states
- [ ] All pages have error handling
- [ ] All pages have empty states
- [ ] Database queries are optimized
- [ ] Caching is implemented
- [ ] Real-time updates where needed

### Quality Criteria
- Query performance < 200ms
- Error rate < 1%
- Loading time < 2s
- Data freshness < 5 minutes
