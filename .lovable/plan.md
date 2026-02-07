

# ZipRoute Feature Roadmap & Implementation Plan

## Current Issues Found

### 1. Auth Registration Bug (Critical)
**Problem**: Registration fails with `email_address_invalid` error when using non-standard email domains. The Supabase auth instance has strict email validation enabled, rejecting emails with unverifiable domains (e.g., `testuser123@ziptest.com`). Additionally, even when errors occur (400 response), the dialog may close prematurely instead of displaying the error message.

**Root Cause**: Supabase's GoTrue server validates email domains by default. The code itself is structured correctly (checks for `error` before closing dialog), but there may be edge cases in how the Supabase JS client surfaces 400 errors.

**Fix**:
- Improve error handling in `AuthDialog.tsx` to be more defensive
- Add a success notification for registration that tells users to check their email (if email confirmation is enabled)
- Recommend the user disable "Confirm email" in Supabase Auth settings for easier testing (Settings > Authentication > Email)
- Add input validation with zod for email format before sending to Supabase

### 2. No `handle_new_user` trigger on routes table
The `set_route_user_email` function exists but has no trigger attached. The `handle_new_user` trigger correctly creates profiles on signup. The `routes` table has no `user_email` column, so the `set_route_user_email` function is orphaned/unused -- this is fine since routes only need `user_id`.

---

## Phased Implementation Plan

### Phase 1: Fix Auth + Save Routes (Week 1)

**1a. Fix Authentication Flow**
- Harden `AuthDialog.tsx` error handling -- ensure errors are always displayed and dialog stays open on failure
- Add zod validation for email/password before API call
- Show clear success message on registration: "Check your email to confirm your account"
- Add a "Forgot password" link (optional, low priority)

**1b. Save Routes to Supabase**
- The `routes` table already exists with `user_id`, `name`, `stops` (JSONB), `created_at`
- Add a "Save Route" button in the optimized route card (only visible when logged in)
- Save ordered stops as JSONB with all stop details (label, lat, lng, order, distance/duration)
- Add a "My Routes" section in the hamburger menu showing saved routes
- Add ability to load a previously saved route
- Add DELETE and UPDATE RLS policies for the routes table so users can manage their own routes
- Add `id` column auto-increment default if missing (currently has no default)

**Database changes needed:**
- ALTER routes table: add default for `id` column (use `generated always as identity`)
- Add RLS policy for DELETE on routes (users can delete own routes)
- Add RLS policy for UPDATE on routes (users can update own routes)

---

### Phase 2: Stripe Integration + Plan Enforcement (Week 2-3)

**2a. Enable Stripe**
- Use Lovable's built-in Stripe integration tool to connect Stripe
- Create products/prices:
  - Pro: $10/month or $69/year
  - Ultimate: waitlist only (no Stripe product yet)
- Build a checkout flow triggered from the Pricing modal's "Upgrade to Pro" button

**2b. Sync Plans to Supabase**
- The `profiles` table already has a `plan` column (default: `'free'`)
- Create a Stripe webhook edge function that listens for:
  - `checkout.session.completed` -- update profile plan to `'pro'`
  - `customer.subscription.deleted` -- revert plan to `'free'`
  - `customer.subscription.updated` -- handle plan changes
- Add `stripe_customer_id` column to `profiles` table for linking

**2c. Free Tier Usage Limits (20 optimizations/day)**
- Create a `usage_tracking` approach using the existing `usage_events` table
- On each route optimization, insert an event with `event_type = 'route_optimization'`
- Before optimizing, check count of today's events for the user
- For non-logged-in users: use a cookie-based counter stored in localStorage (less secure but reasonable for anonymous users)
- For logged-in free users: query `usage_events` for today's count
- Pro users: unlimited (skip the check)
- Show a friendly message when limit is reached: "You've used 20/20 free optimizations today. Upgrade to Pro for unlimited."

**Database changes needed:**
- Add `stripe_customer_id` text column to profiles
- Ensure `usage_events` has proper RLS (already has INSERT and SELECT for own events)

---

### Phase 3: Bookmarks System (Week 3-4)

**3a. Bookmarks Table**
- Create a `bookmarks` table:
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, references auth.users)
  - `nickname` (text, not null) -- e.g., "Office", "Warehouse A"
  - `address` (text, not null)
  - `lat` (double precision)
  - `lng` (double precision)
  - `created_at` (timestamptz, default now())
- RLS: users can only CRUD their own bookmarks

**3b. UI Integration**
- When a logged-in user types in a stop field, check if input matches any bookmark nicknames
- Show bookmark suggestions with a star icon in the autocomplete dropdown
- Add a "Save as Bookmark" button next to each stop input (visible when logged in and address is valid)
- Add a "Bookmarks" section in the hamburger menu to manage saved locations

**3c. Limit to US/Canada Addresses**
- Update the Mapbox geocoding API calls to include `country=us,ca` parameter
- This restricts autocomplete and geocoding results to US and Canada only
- No API key changes needed -- Mapbox supports this natively via query parameter

---

### Phase 4: AI Email-to-Route Feature (Week 4-5)

**4a. AI Address Parser Edge Function**
- Create a Supabase edge function `parse-addresses`
- Accepts pasted text (email body) as input
- Uses OpenAI API (or similar) to extract addresses from unstructured text
- Returns structured list: `{ address: string, nickname?: string }[]`
- Cross-references with user's bookmarks to auto-match nicknames
- Validates extracted addresses via Mapbox geocoding (US/Canada only)
- Requires: OpenAI API key stored as Supabase secret

**4b. UI Integration**
- Add a "Paste Email" button/mode in the stops card (Pro users only)
- Opens a textarea modal where user can paste email content
- Shows extracted addresses with checkboxes for selection
- "Add to Route" button populates the stop fields
- Free users see the feature grayed out with "Upgrade to Pro" prompt

**Requirements from you:**
- OpenAI API key (or preferred AI provider)
- Confirmation on which AI model to use (GPT-4o-mini is fast and cost-effective for address extraction)

---

## Security Improvements

1. **Input validation**: Add zod schemas for all user inputs (auth forms, contact form, bookmark names)
2. **Rate limiting**: Add rate limiting on the parse-addresses edge function to prevent abuse
3. **RLS audit**: Current RLS policies look solid -- restrictive (not permissive), scoped to `auth.uid()`. Will add missing DELETE/UPDATE policies for routes
4. **Sensitive data**: Ensure Stripe webhook endpoint validates signatures
5. **CORS**: Edge functions will use proper CORS headers
6. **No console logging of sensitive data**: Audit existing code for any sensitive data in console.log statements

## UI/UX Improvements

1. **Plan badge**: Show current plan (Free/Pro) prominently in the hamburger menu -- already partially implemented
2. **Usage counter**: Show "X/20 optimizations today" for free users
3. **Upgrade prompts**: Contextual prompts when free users hit limits
4. **Loading states**: Already well implemented with the sticky button states
5. **Mobile responsiveness**: Already mobile-first; will maintain this for all new features
6. **Success toasts**: Clear feedback for saving routes, bookmarks, and successful upgrades

## Technical Details

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/AuthDialog.tsx` | Modify | Fix error handling, add zod validation |
| `src/hooks/useAuth.tsx` | Modify | Add profile fetching for plan status |
| `src/components/MapboxRoutePlanner.tsx` | Modify | Add save route, bookmarks, usage tracking, AI paste |
| `src/components/HamburgerMenu.tsx` | Modify | Add My Routes, Bookmarks, plan display |
| `supabase/functions/stripe-webhook/index.ts` | Create | Handle Stripe events |
| `supabase/functions/parse-addresses/index.ts` | Create | AI address extraction |
| `src/components/modals/PricingModal.tsx` | Modify | Wire up Stripe checkout |
| `supabase/config.toml` | Modify | Register edge functions |

### Database Migrations Needed

1. **Phase 1**: Fix routes table `id` default, add DELETE/UPDATE RLS policies
2. **Phase 2**: Add `stripe_customer_id` to profiles
3. **Phase 3**: Create `bookmarks` table with RLS
4. **Phase 4**: No additional tables needed

### Secrets/Keys Required

| Secret | Phase | Purpose |
|--------|-------|---------|
| Stripe Secret Key | Phase 2 | Payment processing |
| Stripe Webhook Secret | Phase 2 | Webhook signature verification |
| OpenAI API Key | Phase 4 | AI address extraction |

---

## Recommended Starting Point

Start with **Phase 1** (fix auth + save routes) since it unblocks everything else. I'll fix the registration bug, add route saving, and set up the foundation for the later phases. Would you like me to proceed with Phase 1?

