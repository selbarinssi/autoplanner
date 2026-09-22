# AutoPlanner

Professional, configurable order dispatch & routing planner.

Built as a modular successor to the original single-file O'Planner.  
Designed for multi-criteria vehicle assignment with neighborhood clustering, satellite vehicles, and fully editable dispatch rules.

**Live:** (add your Vercel URL here)

---

## Vision

- **Config-driven** — no hardcoded postal codes, thresholds, or priority weights.
- **One function = one file** — pure domain logic, easy to edit and test.
- **Strategic vs tactical separation**:
  - Master data (neighborhoods, clusters, fleet, rules) → rare changes
  - Daily planning board → high frequency
- Clean ivory / black / Lora interface, production-grade feel.

---

## Architecture
src/
├── app/                    # Next.js App Router (UI only)
│   ├── (app)/              # Authenticated-style shell
│   │   ├── plan/
│   │   ├── orders/
│   │   └── config/
│   │       ├── neighborhoods/
│   │       ├── clusters/
│   │       ├── fleet/
│   │       └── rules/
│   ├── layout.tsx
│   ├── page.tsx            # Landing
│   └── globals.css         # Ivory design system
├── domain/                 # Pure business logic — one function per file
│   ├── types/
│   ├── geo/
│   ├── classification/
│   ├── productivity/
│   ├── clustering/
│   ├── scoring/
│   ├── assignment/
│   └── routing/
├── components/ui/          # Shared shell, buttons, cards
└── config/                 # Default dispatch criteria


**Stack:** Next.js 15 · TypeScript · Tailwind · Vercel

---

## What is already done

### Domain engine (complete)
- Order / Vehicle / Neighborhood / Cluster / Criteria types
- Geo helpers (haversine, adjacency, coordinates)
- Classification (TRS, assembly, order type, time-slot buckets)
- Productivity (points & volume fit checks)
- Clustering pipeline:
  - Sort neighborhoods by volume
  - Dedicated high-volume neighborhoods
  - Absorb low-volume ones into pre-defined clusters
- Scoring criteria (primary area, adjacent, same city, volume, productivity, geographic continuity, TRS, express preference)
- Assignment orchestration (`autoAssign`)
- Route optimisation (nearest-neighbor on centroids + time-slot sort)
- Default dispatch config with ordered priority weights

### UI foundation (complete)
- Ivory background, black text, Lora + IBM Plex Sans
- App shell with sidebar navigation
- Landing page
- Placeholder pages for:
  - Plan Board
  - Orders & Calls
  - Neighborhoods
  - Clusters
  - Fleet
  - Dispatch Rules
- Shared components (PageHeader, Button, Card)
- Deployed on Vercel

---

## What is still missing

| Priority | Missing piece | Status |
|----------|---------------|--------|
| 1 | Persistent data layer (localStorage first, then Supabase) | Not started |
| 2 | Neighborhoods CRUD UI | Placeholder only |
| 3 | Clusters drag-and-drop builder | Placeholder only |
| 4 | Fleet UI + satellite “+” button | Placeholder only |
| 5 | Dispatch Rules priority cards (drag to reorder + weights) | Placeholder only |
| 6 | Excel order upload & parsing | Not started |
| 7 | Wire `autoAssign()` into Plan Board | Not started |
| 8 | Plan Board vehicle columns + drag-drop fine-tuning | Not started |
| 9 | Calls / confirmation board (status + time slots) | Not started |
| 10 | Route map (Leaflet) | Not started |
| 11 | Excel export of the plan | Not started |
| 12 | Teams assignment layer (satellite productivity) | Future |

---

## Current readiness

**~25–30%** of a usable daily tool.

The architecture and pure dispatch engine are solid.  
You cannot yet load orders, configure neighborhoods/clusters/fleet, or produce a real plan from the UI.

---

## Next recommended steps

1. Add localStorage (or Supabase) persistence for master data  
2. Build Neighborhoods + Clusters config screens  
3. Build Fleet screen with satellite links  
4. Wire Auto-Plan button to the domain engine  
5. Excel import → Plan Board becomes usable  

---

## License

Private / internal use for now.
