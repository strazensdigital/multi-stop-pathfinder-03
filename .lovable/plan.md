## Comprehensive UI, Copy, Export Logic, and Layout Update

This plan covers four major areas: copy/branding updates, a new competitor comparison table, an export-to-legs modal, and sidebar/map layout fixes.

---

### 1. Global Copy and Branding Updates

**File: `src/components/LandingPage.tsx**`

- Hero subtitle: Change "optimize 50+ addresses" to "optimize 25 addresses"
- Comparison table header: "Google Maps" becomes "Standard Map Apps"
- Section title: "Why Pros Switch from Google Maps" becomes "Why Pros Switch from Standard Map Apps"
- Subtitle copy: Remove specific "Google Maps" reference, use generic phrasing
- Comparison table row "Max stops": "50+" becomes "25"
- Feature card: "50+ Stops" becomes "25 Stops", update description text
- Stats section: "50+" becomes "25"

**File: `src/hooks/useUsageGate.tsx**`

- Change pro `maxStops` from `999` to `25`

**File: `src/components/MapboxRoutePlanner.tsx**`

- Add "Fair Use" disclaimer text below the Stops card header: "Current capacity: 25 stops per route"
- Add a "Pro Tip" tooltip that appears when stop count reaches 20+: "Large routes are automatically split into optimized 9-stop legs for 100% compatibility with mobile navigation apps."
- Update Stops card header range display from `(2-9)` to `(2-9)` for free / remove cap display for pro since it's now 25

---

### 2. New Competitor Comparison Table

**File: `src/components/LandingPage.tsx**`

Insert a new section after the existing "Why Pros Switch" comparison table:

- Title: "How ZippyRouter Compares"
- 4-column responsive table: Feature | ZippyRouter | Competitor R | Competitor C
- Rows:
  - Max Stops: 25 (checkmark) | 20 | 10
  - Address Input: AI Smart-Paste (checkmark) | Upload/Manual | Manual/Camera
  - Optimization: One-Click AI (checkmark) | Basic | Advanced
  - Setup Time: Instant (checkmark) | Moderate | Slow
- ZippyRouter column gets a subtle brand-color left border and light accent background
- On mobile, the table scrolls horizontally with a hint indicator
- Uses existing `Check` icon from lucide-react for checkmarks

---

### 3. Export to Legs Modal

**File: `src/components/MapboxRoutePlanner.tsx**`

Replace the current inline tab-opening behavior with a proper modal:

- Add new state: `showExportModal` (boolean) and `exportLegs` (array of URL strings)
- When user clicks the Google Maps export button:
  - If stops fit in one leg (11 or fewer), open directly as before
  - If stops require multiple legs, set `showExportModal = true` and populate `exportLegs`
- Modal content (using existing `AlertDialog`):
  - Title: "Your route has been split into X legs for mobile compatibility"
  - Description explaining the continuity logic (last stop of Leg N = first stop of Leg N+1)
  - Individual "Open Leg X" buttons for each leg
  - "Open All Legs" button that opens all tabs
  - Close/Cancel button
- The existing `buildGoogleMapsUrls` function already handles the splitting logic correctly with overlap

---

### 4. Sidebar and Map Layout Fixes

**File: `src/components/MapboxRoutePlanner.tsx**`

- Wrap the left column (`lg:col-span-2`) content in a scrollable container: `max-h-[calc(100vh-140px)] overflow-y-auto` on desktop
- Make the "Find My Fastest Route" / "Recalculate" button sticky at the bottom of the left column using `sticky bottom-0 z-10 bg-background pt-2 pb-1` styling
- Add `min-h-[300px]` to the Mapbox map container for safety on small viewports
- These are CSS-only changes, no structural rework needed

---

### Technical Summary

**Files to modify (3 total):**

1. `src/components/LandingPage.tsx` -- all landing page copy changes + new comparison table section
2. `src/hooks/useUsageGate.tsx` -- change `maxStops` from `999` to `25`
3. `src/components/MapboxRoutePlanner.tsx` -- fair use disclaimer, pro tip tooltip, export modal, sidebar scroll + sticky button

**No new dependencies required.** All UI components (AlertDialog, Check icon, tooltips) are already available in the project.  
  
Also, add export route as csv/text button for logged in users near google maps button.