## Tiered "Dispatcher Mode" — Stop Locking, Service Times, and Enhanced Drag-and-Drop

This update adds Pro-gated features (stop locking and service duration inputs) to every stop card, modifies the optimization algorithm to respect locked stops, and updates the total time display to include service durations for Pro users.

---

### 1. Enhanced Stop Card UI (SortableStopItem)

Expand the existing `SortableStopItem` component to include a "Pro Feature Container" below each stop's address:

- **Lock Toggle**: A small toggle/button (using the existing `Lock` icon) to pin a stop at its current position. State stored in a new `lockedStops` Set and `serviceTimes` Record at the parent level.
- **Service Duration Input**: A compact number input (e.g., "15 min") for time spent at the location.
- **Visual Paywall**: For non-Pro users, render both controls as disabled/greyed-out with a small "PRO" badge. Clicking either triggers the upgrade modal with the message: *"Take control of your day. Upgrade to ZippyRouter Pro to lock specific stops and calculate accurate ETAs with service times."*

The SortableStopItem props will be extended:

```text
+ isLocked: boolean
+ serviceMins: number
+ isPro: boolean
+ onToggleLock: (index: number) => void
+ onServiceChange: (index: number, mins: number) => void
+ onProFeatureClick: () => void
```

---

### 2. Parent State Management (MapboxRoutePlanner)

Add two new state variables:

- `lockedStops: Set<number>` — indices of stops pinned by the user
- `serviceTimes: Record<number, number>` — minutes spent at each stop (keyed by stop index)

These reset when a new route is created or the ordered list changes structurally.

---

### 3. Optimization Logic — Respecting Locked Stops

Modify `optimizeRoute`:

- **Pro users**: Before calling the Mapbox Optimization API, identify locked stops. Send only unlocked stops to the optimizer. After receiving the optimized order, merge unlocked stops back around the locked ones at their pinned positions.
- **Free users**: Optimize the entire list as before, ignoring any lock state.

Implementation approach:

1. Extract locked stops with their fixed positions
2. Collect unlocked stops' coordinates
3. Call Optimization API with unlocked stops only
4. Reconstruct the full ordered list by inserting locked stops at their original indices
5. Fetch route geometry via Directions API for the final merged sequence

---

### 4. Total Time Display Update

In the "Optimized Route" card header where totals are shown:

- **Pro users**: Display `Total Time = Driving Time + Sum of Service Durations`. Show as two parts: "42 min driving + 30 min service = 72 min total"
- **Free users**: Display driving time only (current behavior)

---

### 5. Drag-and-Drop with Lock Awareness

Update `handleDragEnd`:

- Locked stops cannot be dragged (disable drag handle for locked items)
- When reordering, locked stops stay in place; only unlocked stops shift around them
- After reorder, recalculate route via Directions API as currently done

---

### 6. Upgrade Modal for Free Users

Reuse the existing `AlertDialog` upgrade nudge pattern. When a free user clicks any Pro feature (lock toggle or service input):

- Show modal with title: "Take control of your day"
- Body: "Upgrade to ZippyRouter Pro to lock specific stops and calculate accurate ETAs with service times."
- Buttons: "Continue Free" and "Upgrade to Pro" (triggers pricing modal)

---

### 7. Map Continuity

No changes needed — the existing `handleDragEnd` and `optimizeRoute` already update the Mapbox route line and markers. The export-to-legs logic uses the current `ordered` state, so it automatically reflects any reordering.

---

### Technical Summary

**Files to modify (1 file):**

1. `src/components/MapboxRoutePlanner.tsx`
  - Extend `SortableStopItem` with lock toggle, service input, and Pro gating
  - Add `lockedStops` and `serviceTimes` state
  - Modify `optimizeRoute` to handle locked stops for Pro users
  - Update total time display to include service durations
  - Add Pro feature upgrade modal
  - Disable drag on locked stops

**No new files or dependencies required.** All UI primitives (Switch, Input, Lock icon, AlertDialog, Tooltip) are already imported.

> **Prompt: Add "Advanced Features" Section to Landing Page**
>
> **1. Layout:** > - Create a new section below the Comparison Table titled "**Everything You Need to Finish Your Route Faster**".
>
> - Use a clean, 3-column grid layout for desktop (1-column for mobile).
>
> **2. Content & Icons:**
>
> - **Card 1 (Smart-Paste):** Use a 'Paste' icon. Title: "AI Smart-Paste". Copy: "Paste messy text from emails or notes. Our AI extracts addresses in seconds."
> - **Card 2 (Leg-Chaining):** Use a 'Link' icon. Title: "The Google Bypass". Copy: "Plan 25 stops at once. We auto-split your route into easy 9-stop legs for Google/Apple Maps."
> - **Card 3 (Dispatcher Mode - PRO):** Use a 'Lock' icon and a small 'PRO' badge. Title: "Stop Locking". Copy: "Lock 'must-visit' stops at specific times. The AI optimizes the rest around your schedule."
> - **Card 4 (Service Times - PRO):** Use a 'Clock' icon and a small 'PRO' badge. Title: "Accurate ETAs". Copy: "Add service minutes for each stop to see exactly when you'll finish your day."
> - **Card 5 (Drag-and-Drop):** Use a 'Move' icon. Title: "Manual Override". Copy: "Don't like the AI path? Simply drag and drop stops to reorder. The map updates instantly."
> - **Card 6 (Live Traffic):** Use a 'Car' icon. Title: "Live Traffic". Copy: "Powered by Mapbox real-time data to avoid Toronto/US congestion and save on fuel."
>
> **3. Styling:**
>
> - Cards should have a subtle shadow and hover effect.
> - Ensure the 'PRO' features are visually distinct (maybe a thin border in your brand color) to drive interest in the paid tier.
> - Add a final Call to Action (CTA) button at the bottom: "**Start Planning Your First Route (Free)**".

---