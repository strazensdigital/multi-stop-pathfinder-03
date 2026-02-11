

## Plan: Core UI/UX Enhancements + Website Narrative Overhaul

This is a large set of changes spanning 4 files. Here's the breakdown organized by area.

---

### Part 1: Zero-State Sample Route

When the address list is empty on first load, auto-populate 15 pre-set coordinates (spread across a US city like NYC or LA) and render the optimized route on the map. Show a dismissible toast: "Viewing sample 15-stop route. Clear to start your own."

**File:** `src/components/MapboxRoutePlanner.tsx`
- Add a `SAMPLE_STOPS` constant with 15 real addresses
- On mount, if `start` is empty and `destinations` are empty, populate them and auto-trigger optimization
- Add a `isSampleRoute` state flag; when user clears or edits any field, dismiss the sample

---

### Part 2: Drag-and-Drop Stop Reordering

Install `@dnd-kit/core` and `@dnd-kit/sortable` (lightweight, well-maintained). Allow users to drag stops in the optimized route list to manually override the sequence.

**File:** `src/components/MapboxRoutePlanner.tsx`
- Wrap the optimized route `<ul>` with `DndContext` + `SortableContext`
- Each `<li>` becomes a `useSortable` item with a drag handle
- On `onDragEnd`, reorder the `ordered` array, recalculate leg distances via Mapbox Directions API (not full re-optimization), and update map markers/route line in real-time
- The "Time Saved" card in the hamburger menu updates automatically since it reads from `usage_events`

---

### Part 3: Side Menu "Estimated Time Saved" Fixes

**File:** `src/components/UsageDashboard.tsx`
- Round display to 1 decimal: `Math.round(time * 10) / 10`
- Add `overflow-hidden`, `text-overflow: ellipsis`, `whitespace: nowrap` to the value container
- Update formula to: `(numberOfStops * 2) + (numberOfStops * Math.log10(numberOfStops) * 1.5)`

---

### Part 4: Landing Page -- Hero and Narrative Overhaul

**File:** `src/components/LandingPage.tsx`

**Hero changes:**
- Headline: "Route 20+ Stops in Seconds. Save 2 Hours of Driving Every Day."
- Primary CTA: "Start Planning for Free" (smooth-scrolls to `/app`)
- Secondary CTA: "See Pricing" (unchanged)

**"Rule of 3" section** (new, below hero):
Three columns with icons:
1. **Upload** -- "Excel/CSV or type addresses."
2. **Optimize** -- "One-click for shortest time."
3. **Export** -- "Send to Google/Apple Maps."

**Feature cards update:**
- Replace "Free Tier" card copy: "Beat the 10-stop limit. Plan your entire day without manual headache."
- Replace "Easy Upgrade" card copy: "Military-grade accuracy using real-time traffic data from global logistics fleets."
- Remove "Lock Destinations" card; replace with a "50+ Stops" benefit card

**Stats section update:**
- Change "9 Stops in Free Tier" to "50+ Stops" (for Pro)

**"ZipRoute vs. Google Maps" comparison table** (new section before footer):
| Feature | Google Maps | ZipRoute |
|---|---|---|
| Max stops | 10 | 50+ |
| Route optimization | None | Mathematical shortest path |
| Live traffic | Yes | Yes |
| Export to Maps | N/A | One-click |

---

### Part 5: Pricing Modal Updates

**File:** `src/components/modals/PricingModal.tsx`
- Remove "Lock a specific stop" from Pro features
- Replace with "Beat Google's 10-stop limit"
- Ultimate tier: replace features with "Fuel Savings Calculator", "SMS Route to Phone", "Printable Driver Manifests"

---

### Part 6: Copywriting Updates in Route Planner

**File:** `src/components/MapboxRoutePlanner.tsx`
- Change button label from `"Find shortest route"` to `"Find My Fastest Route"`
- Change subtitle from "Free multi-stop optimizer" to "Beat the 10-stop limit"
- Change tagline from "Optimize multi-stop routes in seconds..." to "Type your stops, tap once, save 2 hours of driving."

---

### Technical Details

**New dependency:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Files modified:**
1. `src/components/MapboxRoutePlanner.tsx` -- sample route, drag-and-drop, copy changes
2. `src/components/UsageDashboard.tsx` -- formula + display fix
3. `src/components/LandingPage.tsx` -- hero, Rule of 3, comparison table, copy
4. `src/components/modals/PricingModal.tsx` -- feature list updates

**Drag-and-drop recalculation approach:**
After reorder, call Mapbox Directions API (not optimization) with the new stop order to get updated geometry and leg distances, then redraw the route on the map. This avoids a full re-optimization which would ignore the user's manual order.

