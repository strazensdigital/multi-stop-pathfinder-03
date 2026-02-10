

## Plan: Fix Subscription Robustness, Remove "Stable Results", and Add IP-Based Geo-Bias

### Problem 1: Manual Pro status gets overwritten

Your SQL query did set `plan = 'pro'`, but the `check-subscription` edge function runs every 60 seconds and overwrites it back to `"free"` because there's no Stripe subscription for your account.

**Fix:** Add a `plan_source` column to the `profiles` table. When you manually set someone to Pro, you also set `plan_source = 'manual'`. The `check-subscription` function will skip overwriting the plan if `plan_source = 'manual'`.

Steps:
- Add migration: `ALTER TABLE profiles ADD COLUMN plan_source text DEFAULT 'stripe';`
- Update `check-subscription` edge function to check `plan_source` before overwriting. If `plan_source = 'manual'`, return the existing plan without touching it.
- Run SQL to set your account: `UPDATE profiles SET plan = 'pro', plan_source = 'manual' WHERE email = 'anmolpanna@gmail.com';`

### Problem 2: Remove "Stable Results" toggle

The "Stable Results" switch pre-sorts destinations by coordinates for deterministic optimizer output. This is confusing for users and provides minimal value.

Steps:
- Remove the `stabilizeResults` state, localStorage persistence, and the Switch UI from `MapboxRoutePlanner.tsx`
- Remove the sorting branch in the `optimizeRoute` function -- always use the simple (non-sorted) path

### Problem 3: IP-based geocoding bias

Currently geocoding is restricted to `country=us,ca`. Instead of prompting users for location, we can use a free IP geolocation API to detect the user's approximate country/region and bias results accordingly -- no browser permission popup needed.

Steps:
- On app load, fetch the user's approximate location from a free IP API (e.g., `https://ipapi.co/json/`) once and cache it in state
- Pass the detected country code(s) and coordinates as `proximity` and `country` parameters to the Mapbox geocoding calls
- Fall back to the current `us,ca` default if the IP lookup fails

### Technical Details

**Files to modify:**
- `supabase/functions/check-subscription/index.ts` -- add `plan_source` check
- `src/components/MapboxRoutePlanner.tsx` -- remove stable results toggle and logic; add IP geolocation for geocoding bias
- New migration for `plan_source` column

**Edge function change (check-subscription):**
```
// Before overwriting plan, check plan_source
const { data: profileData } = await supabaseClient
  .from("profiles")
  .select("plan_source")
  .eq("id", user.id)
  .single();

if (profileData?.plan_source === "manual") {
  // Don't touch manually-set plans
  return existing plan from profiles
}
// Otherwise proceed with Stripe-based plan sync as before
```

**IP geolocation (one-time on mount):**
```
// Fetch once, cache in ref
const geo = await fetch("https://ipapi.co/json/").then(r => r.json());
// Use geo.country_code for country filter
// Use [geo.longitude, geo.latitude] for proximity bias
```

