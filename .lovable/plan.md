

## Plan: Mobile UI Refinement, Bookmark Autocomplete, and Branding Cleanup

### 1. Mobile Hero Button Spacing and Padding

**File:** `src/components/LandingPage.tsx`

- Add `gap-4` (16px) between the two CTA buttons on mobile by wrapping them in a flex container with `flex-col sm:flex-row` and `gap-4`
- Currently the buttons use `mr-4` inline -- replace with a proper flex gap layout
- Add `px-5` (20px) horizontal padding to the hero section on mobile (currently `px-4`)

### 2. Bookmark Address Autocomplete

**File:** `src/components/HamburgerMenu.tsx`

- Replace the plain `<Input>` for "Full address" with a controlled input that calls the same Mapbox geocoding/suggestions API used in `MapboxRoutePlanner.tsx`
- Add local state for suggestions list and show a dropdown below the address input
- On selecting a suggestion, populate the address field (and optionally store lat/lng for the bookmark)
- Reuse the same `fetchSuggestions` logic (extract it or call inline with the same Mapbox geocoding endpoint + IP geo params)

Since `fetchSuggestions` is currently a module-level function in `MapboxRoutePlanner.tsx`, the cleanest approach is to extract it (along with `getGeoParams`) into a shared utility or just duplicate the small fetch inline in the HamburgerMenu component to keep changes minimal.

### 3. Remove Lovable Branding from index.html

**File:** `index.html`

- Change `<meta name="author" content="Lovable">` to `content="ZipRoute"`
- Update `og:image` and `twitter:image` to remove Lovable OG images (set to empty or a custom ZipRoute image if available)
- Remove `twitter:site` referencing `@lovable_dev`
- Update canonical URL if needed

### Technical Details

**Files modified:**
1. `src/components/LandingPage.tsx` -- button layout + padding
2. `src/components/HamburgerMenu.tsx` -- add Mapbox geocoding autocomplete to bookmark address input
3. `index.html` -- remove Lovable branding metadata

**Bookmark autocomplete approach:**
- Add state: `addressSuggestions`, `showAddressSuggestions`
- On address input change, debounce-fetch from Mapbox geocoding API (same endpoint/params as route planner)
- Render a dropdown list below the input; on click, set `newAddress` to the selected place name
- Uses the same IP-based geo params already cached in the app
