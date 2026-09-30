# Hazard Watch — merged CEP prototype

Merged from the three parallel development tracks:

- Citizen reporting + authority dashboard
- ST-DBSCAN + deterministic Pune demo data
- Leaflet map + validated hotspots + alerts

## Run

```bash
npm install
npm run dev
```

Then open `/report`, `/dashboard`, or `/monitor`.

## Hazard analysis

The default clustering provider is `runSTDBSCAN`, using the prototype defaults:
- 500 m spatial radius
- 30 minute temporal window
- minimum 5 reports

`/monitor` loads the deterministic Pune demo data and runs the real clustering implementation.

## Leaflet

Leaflet is loaded client-side through `next/dynamic(..., { ssr: false })`.
The real Leaflet environment still needs to be verified locally after `npm install`.
