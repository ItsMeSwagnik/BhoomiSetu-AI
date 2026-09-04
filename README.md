# BhoomiSetu AI

AI-powered land record intelligence for accountable digital public service. BhoomiSetu transforms legacy paper land records into verified, living digital infrastructure — connecting physical archives, PostGIS cadastral parcels, and human verification workflows.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + custom CSS design tokens
- **Icons:** Lucide React
- **Fonts:** DM Sans + Source Serif 4 (Google Fonts)
- **Package Manager:** pnpm

---

## Project Structure

```
BhoomiSetu AI/
├── app/
│   ├── auth/
│   │   └── page.tsx          # Unified auth page (login + register) with role selector
│   ├── dashboard/
│   │   ├── citizen/
│   │   │   └── page.tsx      # Citizen / Public Landowner portal
│   │   ├── operator/
│   │   │   └── page.tsx      # Data Operator / Document Ingestion portal
│   │   ├── verifier/
│   │   │   └── page.tsx      # Cadastral Surveyor / Verifier portal
│   │   ├── officer/
│   │   │   └── page.tsx      # Revenue Officer / Tehsildar adjudication portal
│   │   ├── auditor/
│   │   │   └── page.tsx      # Vigilance & Audit Inspector portal (read-only)
│   │   └── admin/
│   │       └── page.tsx      # System Administrator portal
│   ├── login/
│   │   └── page.tsx          # Alias → auth page (login tab)
│   ├── register/
│   │   └── page.tsx          # Alias → auth page (register tab)
│   ├── globals.css            # Global styles, design tokens, dashboard & animation CSS
│   ├── layout.tsx             # Root layout with theme init script
│   └── page.tsx               # Landing / home page
│
├── components/
│   ├── ui/
│   │   └── button.tsx         # shadcn button primitive
│   ├── auth-sliding.tsx       # (legacy, unused)
│   ├── cadastral-gis.tsx      # Interactive PostGIS cadastral map section
│   ├── dashboard-shell.tsx    # Shared sidebar + topbar layout for all role dashboards
│   ├── dashboard-view.tsx     # Monitoring telemetry section (home page)
│   ├── parcel-lifecycle.tsx   # 12-step pipeline walkthrough section
│   ├── validation-engine.tsx  # Validation & anomaly intelligence section
│   └── verification-studio.tsx # Split-screen verification studio section
│
├── lib/
│   ├── use-scroll-reveal.ts   # IntersectionObserver hook for scroll animations
│   └── utils.ts               # clsx/tailwind-merge utility
│
├── public/
│   ├── auth-landscape.png     # (unused)
│   ├── bhoomisetu bg video.mp4 # Hero background video
│   ├── bhoomisetu-fields.png  # Background image (auth + dashboard pages)
│   └── icon.svg               # Favicon
│
├── .gitignore
├── components.json            # shadcn config
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero video, feature sections, scroll animations |
| `/auth` | Unified login + register with role selector dropdown |
| `/login` | Alias for `/auth` (login tab pre-selected) |
| `/register` | Alias for `/auth` (register tab pre-selected) |
| `/dashboard/citizen` | Public landowner portal — parcel search, mutation tracking |
| `/dashboard/operator` | Document ingestion clerk — upload, OCR queue management |
| `/dashboard/verifier` | Cadastral surveyor — OCR review, GIS polygon validation |
| `/dashboard/officer` | Revenue officer / Tehsildar — adjudication, record signing |
| `/dashboard/auditor` | Vigilance inspector — read-only audit trails, compliance |
| `/dashboard/admin` | System admin — user management, ML pipelines, API config |

---

## User Roles

| Role | Portal | Access Level |
|---|---|---|
| **Citizen** | Public Portal | Self-service cadastral search & mutation tracking |
| **Data Operator** | Front-Line Staff | Document upload & OCR batch management |
| **Verifier** | Technical Review | OCR correction & PostGIS polygon validation |
| **Approving Officer** | Statutory Authority | Adjudication, record approval & LRMS publication |
| **Auditor** | Compliance Oversight | Read-only audit trail inspection |
| **System Admin** | System Control | Full platform administration |

---

## Demo Credentials

All roles use the password `BhoomiSetu@2026` in demo mode.

| Role | Demo Email |
|---|---|
| Citizen | `citizen.rajesh@gmail.com` |
| Operator | `data.operator@lrms.gov.in` |
| Verifier | `cadastral.verifier@lrms.gov.in` |
| Officer | `officer.tehsildar@lrms.gov.in` |
| Auditor | `vigilance.auditor@cag.gov.in` |
| Admin | `sysadmin@bhoomisetu.gov.in` |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Features

- **Hero video background** with animated text entrance on the landing page
- **Scroll reveal animations** — sections fade and slide up as you scroll
- **Dark / Light theme** — persisted in localStorage, respects system preference
- **Unified auth page** — role selector dropdown on both login and register tabs
- **Role-specific dashboards** — each role gets a tailored interface after sign-in
- **Consistent background** — `bhoomisetu-fields.png` used across auth and all dashboards
- **Fully responsive** — mobile-first layout with collapsible sidebar on dashboards
- **Interactive pipeline walkthrough** — 12-step parcel lifecycle with step navigation
- **Live cadastral GIS map** — SVG-based parcel map with tolerance slider
- **Validation engine** — interactive ownership share, lineage, and entity resolution demos

---

## Design System

Design tokens are defined as CSS custom properties in `globals.css`:

| Token | Light | Dark |
|---|---|---|
| `--ink` | `#17251d` | `#eff5ed` |
| `--paper` | `#f8f6f0` | `#111a14` |
| `--forest` | `#27402f` | `#4b7a5a` |
| `--ochre` | `#b87038` | `#e29c57` |
| `--muted` | `#57655a` | `#a1b2a6` |

---

## Compatibility

- DILRMP (Digital India Land Records Modernisation Programme)
- LRMS (Land Records Management System) API v2
- PostGIS / PostgreSQL spatial database
- PaddleOCR + Indic TrOCR multilingual extraction pipeline

---

© 2026 BhoomiSetu AI
