

# ZipRoute Enhancement Plan

## Overview
This plan covers 5 enhancements: username support with greeting, "Upgrade to Pro" button in the hamburger menu, Google Maps multi-leg splitting (9-stop batches), a proper Privacy Policy page, and mobile UI polish.

---

## 1. Username Support + Greeting

**What changes:**
- Add a `display_name` column to the `profiles` table (nullable, text).
- Update the registration form to include an optional "Display Name" field.
- Update the `useAuth` hook to include `display_name` in the profile fetch.
- Show "Hi, [display_name]!" in the hamburger menu when logged in. Falls back to email if no name set.

**Database migration:**
```sql
ALTER TABLE public.profiles ADD COLUMN display_name text;
```

**Files changed:**
- `src/hooks/useAuth.tsx` -- add `display_name` to `UserProfile` interface and SELECT query
- `src/components/AuthDialog.tsx` -- add a "Display Name" input on the Register tab, pass it to `signUp`, then upsert into profiles
- `src/components/HamburgerMenu.tsx` -- show greeting: "Hi, [name]!" at the top of the Account section
- `src/hooks/useAuth.tsx` -- update `signUp` to accept optional `displayName` and write it to profiles after signup

## 2. "Upgrade to Pro" Button in Hamburger Menu

**What changes:**
- For non-Pro users (guest or free), add a prominent, accent-colored "Upgrade to Pro" button in the hamburger menu between the account section and routes section.
- Styled with a gradient or accent background to attract attention, with a crown/zap icon.
- Tapping it opens the Pricing modal (or Auth dialog if not logged in).

**Files changed:**
- `src/components/HamburgerMenu.tsx` -- add the upgrade button with eye-catching styling

## 3. Google Maps Multi-Leg Splitting (9-stop batches)

**What changes:**
- Google Maps limits waypoints to ~9 intermediate stops per URL. For Pro users with more stops, the app will split the optimized route into batches of up to 9 waypoints each and open multiple Google Maps tabs (Leg 1, Leg 2, etc.), where the last stop of one leg becomes the first stop of the next.
- Show a brief explanation toast or note when multiple tabs open.

**Files changed:**
- `src/components/MapboxRoutePlanner.tsx` -- update `buildGoogleMapsUrl` to return an array of URLs when stops exceed 10 (1 origin + 9 waypoints + 1 destination = 11 max per leg). Update the Google Maps button handler to open multiple tabs and show user feedback.

**Logic:**
- Each Google Maps URL supports: 1 origin + up to 9 waypoints + 1 destination = 11 stops max.
- For N total stops, split into chunks where each chunk has at most 11 stops, with overlap (last stop of chunk N = first stop of chunk N+1).
- Label the button "Google Maps (X legs)" when splitting is needed.

## 4. Privacy Policy & Terms Updates

**What changes:**
- Replace placeholder company name and email in Privacy and Terms modals with actual or more professional placeholders.
- These are already accessible via modals on the landing page -- no new pages needed, they already work with deep linking (`/#privacy`, `/#tos`).
- Minor content polish (update copyright year to 2025, clean up placeholder text).

**Files changed:**
- `src/components/modals/PrivacyModal.tsx` -- update placeholder text
- `src/components/modals/TermsModal.tsx` -- update placeholder text
- `src/components/LandingPage.tsx` -- update copyright year

## 5. Mobile UI Polish

**What changes:**
- Ensure the hamburger menu sheet is full-width on small screens (already `w-80`, will make it responsive).
- Ensure all tap targets in the menu are at least 44px.
- Make the upgrade button in the menu prominent and thumb-friendly.
- Ensure the pricing modal grid stacks vertically on mobile (already `md:grid-cols-3`, so it stacks on small screens -- just verify spacing).

**Files changed:**
- `src/components/HamburgerMenu.tsx` -- responsive width, proper spacing
- Minor touch-target checks across modified components

---

## Technical Details

### Database Migration
A single migration adds the `display_name` column:
```sql
ALTER TABLE public.profiles ADD COLUMN display_name text;
```

### Component Changes Summary

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Add `display_name` to profile type and fetch; update signUp |
| `src/components/AuthDialog.tsx` | Add display name field on Register tab |
| `src/components/HamburgerMenu.tsx` | Greeting, Upgrade to Pro button, mobile polish |
| `src/components/MapboxRoutePlanner.tsx` | Multi-leg Google Maps URL splitting |
| `src/components/modals/PrivacyModal.tsx` | Content cleanup |
| `src/components/modals/TermsModal.tsx` | Content cleanup |
| `src/components/LandingPage.tsx` | Copyright year |

### Implementation Order
1. Database migration (add `display_name`)
2. Auth changes (profile fetch, signup with name)
3. Hamburger menu (greeting + upgrade button + mobile polish)
4. Google Maps multi-leg splitting
5. Privacy/Terms content updates

