# ORBITER — Earth & Space Intelligence Dashboard

```
   ◉ ──────────────────────────────────────────────────────── ◉
  /                                                              \
 │    ██████╗ ██████╗ ██████╗ ██╗████████╗███████╗██████╗        │
 │   ██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝██╔════╝██╔══██╗       │
 │   ██║   ██║██████╔╝██████╔╝██║   ██║   █████╗  ██████╔╝       │
 │   ██║   ██║██╔══██╗██╔══██╗██║   ██║   ██╔══╝  ██╔══██╗       │
 │   ╚██████╔╝██║  ██║██████╔╝██║   ██║   ███████╗██║  ██║       │
 │    ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝       │
 │                                                                 │
 │           Real-time Earth & Space Intelligence                  │
  \                                                              /
   ◉ ──────────────────────────────────────────────────────── ◉
```

> **"To make a restless planet legible."**

ORBITER is a real-time planetary command center that fuses live data from NASA, USGS, the ISS, and more into a single AI-powered dashboard. Every refresh is a new story — a near-Earth asteroid approaching, a fresh solar flare, an earthquake somewhere on Earth, or the ISS passing over your horizon.

---

## Live Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  ◉ orbiter          [  Explore  ≡  ]                            │
├────────────────────────────────┬────────────────────────────────┤
│                                │  ◉ LIVE ORBITAL TELEMETRY      │
│  ●  8/9 intelligence networks  │  −12.09° / −136.87°            │
│                                │  ALT 421km  VEL 28k  CREW 12   │
│  Observe the world.            ├────────────────────────────────┤
│  Understand beyond.            │  NOW / GLOBAL OVERVIEW         │
│            ↗ in real time      │  Planetary pulse    ● 8 LIVE   │
│                                │  ┌──────────┐  ┌──────────┐   │
│  Live Earth and space          │  │ 93.47 LD │  │  M 2.6   │   │
│  intelligence, fused from      │  │ 2019 YO4 │  │ Willow,AK│   │
│  scientific networks and       │  └──────────┘  └──────────┘   │
│  translated by AI.             │                                │
│                                │  ◎ What the planet is telling  │
│  [ Enter command center ↓ ]    │    us →                        │
│                                │  Next: Falcon 9 | Sirius SXM-11│
├────────────────────────────────┴────────────────────────────────┤
│  LIVE OPERATIONS / 30 Jun · Command center          8 LIVE SRCS │
├─────────────────────┬───────────────────────────────────────────┤
│ AI PLANETARY        │  LIVE ORBITAL MAP                         │
│ BRIEFING            │                                           │
│                     │         🌍  ← Earth night view            │
│ Generate a live     │       ◉ ISS marker + orbit ring           │
│ situation report    │    ·   earthquake epicenters (20)         │
│ from every feed     │                                           │
│ [Seismic][Asteroids]│  POS −12.09°/−136.87°  ALT 421km         │
│ [☀ Weather][🚀]     │  VEL 27,580 km/h   SEISMIC PLOTS 20      │
│ [▶ Generate]        │                                           │
├──────────┬──────────┼──────────┬──────────────────────────────┤
│ ISS &    │ ASTEROID │ EARTH    │ EVENT WEATHER                 │
│ CREW     │ WATCH    │ ACTIVITY │                               │
│          │          │          │  12.5°                        │
│    12    │ 2019 YO4 │ M 2.6 ↗ │  Near latest earthquake       │
│  people  │ 53 LD    │ M 4.8 ↗ │  Wind 12 km/h  WMO 1         │
│  in space│ 2019 YC1 │ M 3.9 ↗ │                               │
├──────────┴──────────┴──────────┴──────────────────────────────┤
│ GLOBAL LAUNCH SCHEDULE                                   ● LIVE │
│ 01 Falcon 9 | Sirius SXM-11  · SpaceX · Jun 29 · Launch in flt │
│ 02 ADD Solid-Fuel SLV Demo   · Agency  · Jun 30 · Go for launch │
│ 03 Pegasus XL | Swift Boost  · NRO     · Jun 30 · Go for launch │
├───────────────────────────┬───────────────────────────────────┤
│ MARS INTELLIGENCE         │ ASTRONOMY PICTURE                 │
│                           │                                   │
│  ╔══════════════════╗     │  ╔═══════════════════════════╗    │
│  ║ AWAITING ROVER   ║     │  ║  🌌  M82: Galaxy with a   ║    │
│  ║   DOWNLINK  📷   ║     │  ║   Supergalactic Wind      ║    │
│  ╚══════════════════╝     │  ╚═══════════════════════════╝    │
│  [🔮 Analyze terrain]     │  [🔮 Analyze image]               │
└───────────────────────────┴───────────────────────────────────┘
```

---

## Architecture

```
                    DATA SOURCES
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
  NASA APIs           Open APIs          USGS / NOAA
  ─────────        ────────────        ─────────────
  · APOD           · Open Notify       · Earthquake
  · Mars Rover       (ISS position,      Feed (M2.5+)
  · NeoWs (NEO)      astronauts)       · Open-Meteo
  · DONKI          · wheretheiss.at      (weather)
    (space weather) · Launch Library 2
                         │
                         ▼
              ┌─────────────────────┐
              │   Next.js API Layer │
              │                     │
              │  /api/iss    ← fast │  polls every 5s
              │  /api/dashboard     │  polls every 60s
              │  /api/briefing      │  on-demand
              │  /api/vision        │  on-demand
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    NVIDIA NIM       │
              │                     │
              │  LLM: Llama 3.3 70B │ → AI Planetary Briefing
              │  Vision: Kimi K2.6  │ → Mars / APOD Analysis
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   React Client      │
              │                     │
              │  · Boot Loader      │ ← video + Anton/Condiment
              │  · Hero + Globe     │ ← WebGL, react-globe.gl
              │  · Command Center   │ ← 9-module grid
              │  · Live ISS orbit   │ ← 5s telemetry polling
              └─────────────────────┘
```

---

## Features

### 🛰 Live ISS Tracker
Real-time latitude, longitude, altitude, velocity, and visibility (daylight / eclipsed) via wheretheiss.at. Updates every 5 seconds. Rendered on a 3D interactive WebGL globe.

### ☄️ Near-Earth Asteroid Watch
Today's asteroid flybys from NASA NeoWs — ranked by closest approach distance in Lunar Distances (LD), with hazard classification and estimated diameter.

### 🌍 Interactive Globe
WebGL Earth globe (react-globe.gl) showing the live ISS position with an animated pulse ring, and all recent earthquakes plotted as magnitude-scaled points.

### 🌋 Earth Activity Monitor
Live earthquake feed from USGS — magnitude 2.5+ events, location, depth, and links to the USGS event page.

### 🔭 Astronomy Picture of the Day
NASA's daily featured image with real `<img>` rendering and on-demand Kimi Vision AI analysis.

### 🤖 AI Planetary Briefing
NVIDIA NIM (Llama 3.3 70B) synthesizes all live feeds into a calm, factual 110–160 word situation report — the kind a mission analyst would write.

### 🔴 Mars Rover Intelligence
Latest Perseverance or Curiosity image (Perseverance → Curiosity fallback) with Kimi Vision geological analysis.

### 🌤 Space Weather Monitor
NASA DONKI solar flares and coronal mass ejections from the past 7 days — classified by type and severity.

### 🚀 Global Launch Schedule
Upcoming rocket launches from Launch Library 2 — with agency, pad location, countdown, and webcast links.

### 🧑‍🚀 People in Space
Live crew manifest from Open Notify — names and spacecraft assignments.

---

## Tech Stack

```
┌──────────────┬─────────────────────────────────────────┐
│ Layer        │ Technology                              │
├──────────────┼─────────────────────────────────────────┤
│ Framework    │ Next.js 15 (App Router)                 │
│ Language     │ TypeScript                              │
│ Styling      │ Plain CSS (no Tailwind)                 │
│ Fonts        │ Anton · Condiment · Poppins · Source    │
│              │ Serif 4 (Google Fonts)                  │
│ Icons        │ lucide-react                            │
│ Globe        │ react-globe.gl + three.js               │
│ AI Briefing  │ NVIDIA NIM — Llama 3.3 70B Instruct     │
│ AI Vision    │ NVIDIA NIM — Kimi K2.6 (Moonshot AI)    │
│ Deployment   │ Vercel (recommended)                    │
└──────────────┴─────────────────────────────────────────┘
```

---

## Quick Start

### 1 — Clone

```bash
git clone https://github.com/lukan-lawslaf/orbital.git
cd orbital
npm install
```

### 2 — Environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
# NASA (free at https://api.nasa.gov)
NASA_API_KEY=your_nasa_api_key

# NVIDIA NIM (https://build.nvidia.com)
# Briefing LLM — use a fast instruction model, NOT a reasoning model
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_LLM_MODEL=meta/llama-3.3-70b-instruct

# Kimi Vision (same NVIDIA NIM platform)
NVIDIA_VISION_API_KEY=your_nvidia_vision_key
NVIDIA_VISION_MODEL=moonshotai/kimi-k2.6
```

The rest of the variables have working defaults and don't need keys.

### 3 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The first load takes 10–12 seconds while the server aggregates all external feeds. A full-screen boot loader plays during this time.

---

## Environment Variables Reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NASA_API_KEY` | Yes | `DEMO_KEY` | Free, get at api.nasa.gov |
| `NVIDIA_API_KEY` | Yes | — | For AI briefing |
| `NVIDIA_ALT_API_KEY` | No | — | Fallback key |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | |
| `NVIDIA_LLM_MODEL` | No | `meta/llama-3.3-70b-instruct` | Must be a fast instruction model |
| `NVIDIA_VISION_API_KEY` | Yes | — | For image analysis |
| `NVIDIA_VISION_MODEL` | No | `moonshotai/kimi-k2.6` | |
| `NEXT_PUBLIC_REFRESH_INTERVAL` | No | `5000` | ISS poll interval (ms) |
| `NEXT_PUBLIC_GLOBE_AUTO_ROTATE` | No | `true` | Set `false` to disable |

> ⚠️ **Never commit `.env.local`** — it is gitignored. All API keys stay server-side and never reach the browser.

---

## API Routes

```
GET  /api/iss        → Live ISS position + crew (fast, 5s TTL)
GET  /api/dashboard  → All feeds aggregated (60s TTL)
POST /api/briefing   → AI planetary briefing (Llama 3.3 70B)
POST /api/vision     → Image analysis (Kimi K2.6 vision)
```

The client polls `/api/iss` every 5 seconds for smooth globe motion, and `/api/dashboard` every 60 seconds so rate-limited APIs (Launch Library, DONKI) aren't hammered.

---

## Data Sources

| Module | Source | Rate limit |
|---|---|---|
| ISS telemetry | wheretheiss.at | None |
| ISS crew | Open Notify | None |
| Asteroids | NASA NeoWs | 1000/day (free key) |
| Earthquakes | USGS GeoJSON | None |
| Weather | Open-Meteo | None |
| Launches | Launch Library 2 | ~15/hr (public) |
| APOD | NASA APOD | 1000/day |
| Mars photos | NASA Mars Rover | 1000/day |
| Space weather | NASA DONKI | 1000/day |

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**. The API routes run as serverless functions automatically.

---

## Project Structure

```
orbital/
├── app/
│   ├── api/
│   │   ├── briefing/route.ts   ← Llama 3.3 70B briefing
│   │   ├── dashboard/route.ts  ← full feed aggregation
│   │   ├── iss/route.ts        ← fast ISS telemetry
│   │   └── vision/route.ts     ← Kimi image analysis
│   ├── components/
│   │   ├── GlobeView.tsx       ← WebGL earth + ISS + quakes
│   │   └── Loader.tsx          ← boot loader screen
│   ├── globals.css             ← all styles (no Tailwind)
│   ├── layout.tsx
│   └── page.tsx                ← dashboard UI
├── lib/
│   └── orbiter.ts              ← data fetching + types
├── public/
│   └── loader.mp4              ← boot animation video
├── .env.example                ← key reference (no secrets)
└── next.config.ts
```

---

## Notes

- **Nemotron Ultra (550B)** is specified in several references for this project but is a *reasoning model* — it streams a chain-of-thought trace as its response and consistently times out in a serverless environment. `meta/llama-3.3-70b-instruct` (also on NVIDIA NIM) delivers clean briefing prose in 15–40 seconds and is the default.
- **Mars photos API** (`api.nasa.gov/mars-photos`) is intermittently returning 404 ("No such app") — this is a NASA upstream issue. The UI shows a designed placeholder and will populate automatically when the service recovers. Perseverance → Curiosity fallback is implemented.
- The globe requires WebGL and is dynamically imported (code-split, no SSR). It degrades to a spinner on environments without GPU acceleration.

---

## License

MIT — use it, fork it, launch it.

```
   · · · · · · · · · ◉ · · · · · · · · ·
        ORBITER — made with Next.js
   · · · · · · · · · · · · · · · · · · ·
```
