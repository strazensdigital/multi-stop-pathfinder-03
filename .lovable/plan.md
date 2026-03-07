

## Landing Page Copy Overhaul

This is a comprehensive copy update to `src/components/LandingPage.tsx` plus a button color fix in `src/components/MapboxRoutePlanner.tsx`.

### Changes Summary

**1. Hero Section (lines 135-163)**
- Headline → "The Simplest Route Planner on the Web."
- Subheadline → new copy about dropping addresses, no account, no ads
- Trust line → "No login required · No credit card needed · Works on mobile"
- Primary CTA → "Plan My Route — It's Free"
- Secondary CTA → "See How It Works" (opens how-it-works modal instead of pricing)

**2. How It Works (lines 170-195)**
- Step 1: "Add Your Stops" — type, paste, or speak
- Step 2: "Optimize" — one button, real-time traffic
- Step 3: "Export & Go" — updated copy per instructions (Google Maps one-click, CSV, save, auto-split)

**3. Comparison Table (lines 197-241)**
- Replace current rows with the exact 9-row table from the brief (Max stops, Address input, Extracts addresses, Save & reuse, Export CSV, Bookmarks, Live traffic, Export to Maps, No account needed)
- Remove "Route optimization / AI sequencing" row
- Remove the second competitor comparison table entirely (lines 243-287)

**4. Feature Cards (lines 289-362)**
- Replace 6 cards with 12 cards (the 11 from brief + new "See Your Drive Time Instantly")
- Cards with PRO badge: "Beat the 10-Stop Limit", "Stop Locking", "Accurate ETAs"
- New icons imported: Mic, Bookmark, Save, Download, Timer, Eye (lucide-react)

**5. Remove PAS narrative section (lines 364-371)** — contains "AI-powered" language

**6. Remove old Feature Highlights section (lines 373-411)** — contains "Military-Grade Accuracy" and "AI sequencing" references

**7. New "Who It's For" section** — added after feature cards
- Title: "Built for Anyone With More Than 3 Stops"
- Intro + list of professions

**8. Stats Section (lines 414-432)**
- Replace with 4 stats: 25 Stops, 1 Click, Zero Install, Mobile-Ready

**9. Google Maps button color fix** in `MapboxRoutePlanner.tsx` line 1325
- Change from red (`hsl(348, 83%, 47%)`) to orange (e.g. `hsl(30, 90%, 50%)`)

### Files Modified
- `src/components/LandingPage.tsx` — full copy rewrite
- `src/components/MapboxRoutePlanner.tsx` — button color change (1 line)

