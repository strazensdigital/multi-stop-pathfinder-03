# Multi-Stop Route Optimizer (Mapbox)

Plan the shortest route across multiple stops with Mapbox. Mobile and desktop friendly, open-source, and easy to deploy.

Demo stack: React + Vite + TypeScript + Tailwind + shadcn/ui + Mapbox GL JS.

## Features
- Multi-stop routing: start + 2–9 destinations.
- Uses Mapbox Optimization API to compute the shortest route (TSP-like).
- Interactive map with markers and a smooth, responsive UI.
- “Use my location” for quick starting point.
- Accessible, responsive, and SEO-friendly.

## Getting Started

1. Install dependencies
```bash
npm i
```

2. Run the dev server
```bash
npm run dev
```

## Mapbox access token
This project runs entirely on the client. Mapbox public tokens are safe to use in the frontend.

- Default token is set for convenience (provided by you). You can change it without editing code by setting a value in localStorage:
```js
localStorage.setItem('MAPBOX_TOKEN', 'pk.YOUR_PUBLIC_TOKEN')
```
Refresh the page after setting.

- Alternatively, open src/components/MapboxRoutePlanner.tsx and replace DEFAULT_MAPBOX_TOKEN with your own public token.

Note on .env files: This Lovable environment does not use a traditional .env file. Public keys can live in the frontend (or be read from localStorage as shown above). For server-side/secret use cases, prefer Supabase Edge Functions + Secrets.

## How it works
- Forward geocoding (addresses -> coordinates) via Mapbox Geocoding API v5.
- Route optimization via Mapbox Optimization API with driving profile and geometries=geojson.
- The returned route is rendered as a line layer; stops are shown as markers.

## Key endpoints
- Geocoding: `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json`
- Optimization: `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/{coords}`

Both require `?access_token=YOUR_PUBLIC_TOKEN`.

## Configuration
- UI tokens and theming are defined in `src/index.css` (HSL variables) and consumed via Tailwind.
- A custom `hero` Button variant is available using gradient tokens.

## Accessibility & Mobile
- Keyboard-focusable controls with visible focus ring.
- Mobile-first layout; map and form adapt to smaller screens.

## Deployment
Click Share -> Publish in Lovable. For custom domains, go to Project > Settings > Domains.

## Contributing
Issues and PRs welcome! Please keep contributions accessible, responsive, and consistent with the design system tokens.

## License
MIT
