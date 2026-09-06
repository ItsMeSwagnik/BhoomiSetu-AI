# BhoomiSetu AI

AI-powered land record intelligence for accountable digital public service. BhoomiSetu transforms legacy paper land records into verified, living digital infrastructure — connecting physical archives, PostGIS cadastral parcels, and human verification workflows.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + custom CSS design tokens
- **Icons:** Lucide React
- **Fonts:** DM Sans + Source Serif 4 (Google Fonts)
- **Auth:** Firebase Authentication (client-side)
- **Package Manager:** pnpm

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL + PostGIS (Neon serverless or local)
- **ORM:** SQLAlchemy 2.x + Alembic
- **Auth:** Firebase Admin SDK (token verification + RBAC)
- **OCR:** PaddleOCR (primary) / MockOCREngine (dev)
- **NLP:** spaCy + regex + rule-based extraction
- **Entity Matching:** RapidFuzz
- **GIS:** PostGIS, GeoPandas, Shapely
- **Background Jobs:** Celery + Redis
- **Storage:** Local filesystem (dev) / S3-compatible (prod)

---

## Project Structure

```
BhoomiSetu AI/
├── frontend/                          # Next.js frontend application
│   ├── app/
│   │   ├── auth/page.tsx              # Unified login + register with role selector
│   │   ├── dashboard/
│   │   │   ├── citizen/page.tsx       # Public landowner portal
│   │   │   ├── operator/page.tsx      # Document ingestion portal
│   │   │   ├── verifier/page.tsx      # Cadastral surveyor portal
│   │   │   ├── officer/page.tsx       # Revenue officer adjudication portal
│   │   │   ├── auditor/page.tsx       # Vigilance inspector portal (read-only)
│   │   │   └── admin/page.tsx         # System administrator portal
│   │   ├── login/page.tsx             # Alias → /auth (login tab)
│   │   ├── register/page.tsx          # Alias → /auth (register tab)
│   │   ├── globals.css                # Design tokens + all component styles
│   │   ├── layout.tsx                 # Root layout with theme init script
│   │   └── page.tsx                   # Landing page
│   ├── components/
│   │   ├── ui/button.tsx              # shadcn button primitive
│   │   ├── brand-icon.tsx             # BhoomiSetu brand icon
│   │   ├── cadastral-gis.tsx          # Interactive GIS map section
│   │   ├── dashboard-shell.tsx        # Shared sidebar + topbar + notifications
│   │   ├── dashboard-view.tsx         # Monitoring telemetry section
│   │   ├── parcel-lifecycle.tsx       # 12-step pipeline walkthrough
│   │   ├── validation-engine.tsx      # Validation & anomaly demos
│   │   └── verification-studio.tsx    # Split-screen verification studio
│   ├── lib/
│   │   ├── api.ts                     # Typed API client (all backend calls)
│   │   ├── firebase.ts                # Firebase Auth SDK setup
│   │   ├── use-scroll-reveal.ts       # IntersectionObserver scroll hook
│   │   ├── use-theme.ts               # Dark/light theme hook
│   │   └── utils.ts                   # clsx/tailwind-merge utility
│   ├── public/                        # Static assets (video, images, favicon)
│   ├── .env.local                     # Local env vars (gitignored)
│   ├── .env.local.example             # Env template
│   ├── components.json                # shadcn config
│   ├── next.config.mjs
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── vercel.json
│
├── backend/                           # FastAPI backend application
│   ├── app/
│   │   ├── routers/                   # API route handlers
│   │   │   ├── auth.py                # /auth/complete-registration, /auth/me
│   │   │   ├── documents.py           # /documents/upload, list, reprocess
│   │   │   ├── records.py             # /records CRUD + history
│   │   │   ├── verification.py        # /verification/queue, submit, draft
│   │   │   ├── approval.py            # /approval/queue, approve, reject
│   │   │   ├── parcels.py             # /parcels GIS endpoints
│   │   │   ├── audit.py               # /audit-trail, /system-logs
│   │   │   ├── dashboard.py           # /dashboard/stats, /analytics/*
│   │   │   ├── admin.py               # /users, /settings, /roles
│   │   │   ├── submissions.py         # /submissions/me
│   │   │   └── notifications.py       # /notifications
│   │   ├── services/
│   │   │   ├── ocr.py                 # OCR engine interface + Mock/PaddleOCR
│   │   │   ├── extraction.py          # Field extraction + terminology mapping
│   │   │   ├── validation.py          # Rule, cross-record, entity, GIS checks
│   │   │   └── storage.py             # Local/S3 storage abstraction
│   │   ├── auth.py                    # Firebase token verification + RBAC
│   │   ├── celery_app.py              # Celery configuration
│   │   ├── config.py                  # Pydantic settings from .env
│   │   ├── database.py                # SQLAlchemy engine + session
│   │   ├── main.py                    # FastAPI app + CORS + router registration
│   │   ├── models.py                  # SQLAlchemy ORM models
│   │   └── tasks.py                   # Celery document processing pipeline
│   ├── alembic/                       # Database migrations
│   ├── .env                           # Local env vars (gitignored)
│   ├── .env.example                   # Env template
│   ├── requirements.txt
│   └── seed.py                        # Demo data seeder
│
├── storage/                           # Uploaded documents (dev, gitignored)
├── .gitignore
├── BhoomiSetu_Backend_Spec.md
└── README.md
```

---

## Getting Started

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — set DATABASE_URL at minimum

# Create tables and seed demo data
python seed.py

# Start the API server
uvicorn app.main:app --reload --port 8000

# (Optional) Start Celery worker for async document processing
celery -A app.celery_app worker --loglevel=info
```

API docs available at: http://localhost:8000/api/docs

### 2. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment
copy .env.local.example .env.local
# Edit .env.local — add Firebase config (optional, falls back to demo mode)

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Credentials

All roles use the password `BhoomiSetu@2026`.

| Role | Email |
|---|---|
| Citizen | `citizen.rajesh@gmail.com` |
| Operator | `data.operator@lrms.gov.in` |
| Verifier | `cadastral.verifier@lrms.gov.in` |
| Officer | `officer.tehsildar@lrms.gov.in` |
| Auditor | `vigilance.auditor@cag.gov.in` |
| Admin | `sysadmin@bhoomisetu.gov.in` |

> **Dev mode:** Leave `FIREBASE_SERVICE_ACCOUNT_JSON` blank in `backend/.env` and Firebase keys blank in `frontend/.env.local`. The backend accepts dev tokens and the frontend falls back to demo mode automatically.

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
| `/dashboard/officer` | Revenue officer / Tehsildar — adjudication, record approval |
| `/dashboard/auditor` | Vigilance inspector — read-only audit trails, compliance |
| `/dashboard/admin` | System admin — user management, ML pipelines, API config |

---

## API Endpoints

All endpoints are prefixed `/api/v1` and require a Firebase ID token (`Authorization: Bearer <token>`) unless noted.

| Method | Path | Roles |
|---|---|---|
| POST | `/auth/complete-registration` | any Firebase token |
| GET | `/auth/me` | any authenticated |
| POST | `/documents/upload` | operator, admin |
| GET | `/documents` | operator, admin |
| GET | `/records` | all (citizens see verified only) |
| GET | `/verification/queue` | verifier, admin |
| POST | `/verification/{id}/submit` | verifier, admin |
| GET | `/approval/queue` | officer, admin |
| POST | `/approval/{id}/approve` | officer, admin |
| POST | `/approval/{id}/reject` | officer, admin |
| GET | `/parcels` | all authenticated |
| GET | `/audit-trail` | admin, auditor |
| GET | `/dashboard/stats` | all (role-scoped) |
| GET | `/users` | admin |
| GET | `/notifications` | all authenticated |

Full OpenAPI spec: http://localhost:8000/api/docs

---

## User Roles & Permissions

| Role | Upload | Verify | Approve | Audit | Admin |
|---|---|---|---|---|---|
| Citizen | — | — | — | — | — |
| Data Operator | ✓ | — | — | — | — |
| Verifier | — | ✓ | — | — | — |
| Approving Officer | — | — | ✓ | — | — |
| Auditor | — | — | — | Read-only | — |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Design System

Design tokens defined as CSS custom properties in `frontend/app/globals.css`:

| Token | Light | Dark |
|---|---|---|
| `--ink` | `#17251d` | `#eff5ed` |
| `--paper` | `#f8f6f0` | `#111a14` |
| `--forest` | `#27402f` | `#4b7a5a` |
| `--ochre` | `#b87038` | `#e29c57` |
| `--muted` | `#57655a` | `#a1b2a6` |

---

## Key Features

- **Multilingual OCR pipeline** — PaddleOCR + MockOCREngine (swappable interface)
- **Async document processing** — Celery pipeline: preprocess → OCR → extract → validate → score
- **Validation engine** — rule-based, cross-record, entity matching, GIS spatial checks
- **Human-in-the-loop verification** — split-screen workspace with bounding-box evidence
- **Full audit trail** — every field correction, approval, and rejection logged to PostgreSQL
- **Live notifications** — bell icon fetches real notifications from the backend
- **Role-specific dashboards** — all 6 roles wired to real API data, zero hardcoded values
- **GIS / cadastral map** — parcels stored with WKT geometry, area comparison via PostGIS
- **Dark / Light theme** — persisted in localStorage, respects system preference
- **Firebase Auth** — client-side login/register; backend verifies tokens via Admin SDK

---

## Compatibility

- DILRMP (Digital India Land Records Modernisation Programme)
- LRMS (Land Records Management System) API v2
- PostGIS / PostgreSQL spatial database
- PaddleOCR + Indic TrOCR multilingual extraction pipeline

---

© 2026 BhoomiSetu AI
