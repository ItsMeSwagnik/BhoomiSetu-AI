# 🌾 BhoomiSetu AI

**Multimodal AI-Powered Land Record Digitization, Cadastral GIS Intelligence & Verification Platform**

BhoomiSetu AI transforms legacy, paper-based land deeds (*Dalils*, Sale Deeds, Records of Rights / *Khatian*, *Jamabandi*, *Parcha*, *Patta*, 7/12 extracts) and high-resolution cadastral survey maps (*Mouza* sheets) into living, mathematically verified digital infrastructure.

By uniting **State-of-the-Art Multimodal Vision-Language Models (Groq VLMs)**, **OpenCV Contour-Based Cadastral Vectorization**, **Ground-Truth PDF Cross-Verification Engine**, **PostgreSQL / PostGIS Geometry Pipelines**, and a **Multi-Tier Human-in-the-Loop Adjudication Studio**, BhoomiSetu bridges the gap between physical archives and accountable digital public governance.

---

## 📑 Table of Contents

1. [Tech Stack Breakdown](#-tech-stack-breakdown)
2. [High-Level System Architecture](#-high-level-system-architecture)
3. [In-Depth Technical Approach](#-in-depth-technical-approach)
   - [1. Document Ingestion & CDN Synchronization](#1-multi-modal-document-ingestion--cdn-synchronization)
   - [2. Multimodal Vision-Language Model Pipeline](#2-multimodal-vision-language-model-vlm-pipeline)
   - [3. Normalization & Business Logic Engine](#3-post-extraction-normalization--business-logic-engine)
   - [4. Ground-Truth PDF Cross-Verification & Anomaly Scoring](#4-ground-truth-pdf-cross-verification--anomaly-scoring)
   - [5. Cadastral Mouza Map Computer Vision & Vectorization](#5-cadastral-mouza-map-computer-vision--vectorization)
   - [6. Cadastral-to-Deed Relational Linking & GIS Studio](#6-cadastral-to-deed-relational-linking--spatial-studio)
   - [7. Human-in-the-Loop Multi-Persona Governance](#7-human-in-the-loop-multi-persona-governance)
4. [Data Models & Schema Reference](#-data-models--schema-reference)
5. [API Reference Guide](#-api-reference-guide)
6. [User Roles & Access Matrix](#-user-roles--access-matrix)
7. [Repository Structure](#-repository-structure)
8. [Getting Started & Local Setup](#-getting-started--local-setup)
9. [Environment Variables](#-environment-variables)
10. [Demo Credentials](#-demo-credentials)
11. [Compliance & Standards](#-compliance--standards)

---

## 🛠 Tech Stack Breakdown

### Frontend Layer
| Technology | Purpose & Implementation |
|---|---|
| **Next.js 16.3+ (App Router)** | Full-stack React framework utilizing Server & Client Components, file-system routing, and optimized layout streaming. |
| **React 19 & TypeScript 5.7+** | Component state management, type-safe API contracts, and async concurrency features. |
| **Tailwind CSS v4** | Modern utility-first styling engine with custom HSL design tokens, CSS variables, and glassmorphism UI components. |
| **Custom SVG / Canvas GIS Engine** | In-browser interactive vector graphics renderer for Mouza cadastral maps featuring polygon rendering, vertex manipulation, zooming, panning, and plot-to-deed linking. |
| **Base UI & Radix UI Primitives** | Accessible, headless UI primitives (`@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`). |
| **Lucide React** | High-contrast visual icons for operational telemetry, validation badges, and GIS toolbars. |
| **Google Fonts** | *DM Sans* (geometric UI sans-serif) + *Source Serif 4* (formal legal deed typography). |
| **Theme Engine** | Persistent Light / Dark mode system synchronized with user preference and localStorage. |

### Backend & API Layer
| Technology | Purpose & Implementation |
|---|---|
| **FastAPI 0.115+** | High-performance asynchronous Python web framework with ASGI event loop, dependency injection, and OpenAPI 3.1 Swagger documentation. |
| **Uvicorn (Standard)** | Lightning-fast ASGI production web server. |
| **PostgreSQL / Neon Serverless** | Primary relational & spatial database with ACID transaction guarantees. |
| **SQLAlchemy 2.0 ORM** | Declarative data models with relationship cascades, type annotations, and connection pooling. |
| **Alembic 1.14+** | Database schema migrations and revision management. |
| **Pydantic v2 & Pydantic-Settings** | Strict data validation, request parsing, and environment variable sanitation. |

### Multimodal AI, Computer Vision & NLP
| Technology | Purpose & Implementation |
|---|---|
| **Groq Native Vision-Language Models** | `qwen/qwen3.8-27b` and `qwen/qwen3.6-27b` native VLMs for sub-second visual document understanding and zero-shot revenue deed extraction. |
| **High-Capacity Reasoning LLMs** | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `groq/compound` as high-throughput text fallbacks for large multi-page deed reasoning. |
| **PyMuPDF (`fitz` 1.25+)** | High-speed PDF rasterization to 640px compressed JPEGs (~35KB) for low-latency VLM inference + 150 DPI page rendering and line-level text extraction. |
| **OpenCV (`opencv-python-headless 4.10+`)** | Cadastral parcel segmentation pipeline: Gaussian filtering, adaptive Gaussian thresholding, morphological closing, and contour tree extraction. |
| **Shapely 2.0 & GeoAlchemy2** | Spatial geometry operations, polygon centroid calculations, and canonical WKT (`POLYGON`) serialization. |
| **RapidFuzz 3.11+** | High-speed C++ token set ratio and partial ratio string matching for ground-truth PDF text cross-verification. |

### Storage & CDN
| Technology | Purpose & Implementation |
|---|---|
| **Cloudinary Secure CDN** | High-speed, globally distributed cloud hosting for scanned deeds and high-resolution cadastral map rasters. |
| **Local Persistent Storage & `/tmp` Cache** | Local filesystem storage fallback (`./storage/documents`) with automated stateless serverless cache resolution. |

---

## 🏛 High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Architecture (Next.js 16 + React 19)"]
        UI["Role Portals (Citizen, Operator, Verifier, Officer, Auditor, Admin)"]
        Canvas["Interactive Mouza GIS Studio (SVG/Canvas Vectorizer)"]
        Studio["Split-Screen Verification & Anomaly Studio"]
        PDFView["PyMuPDF Dynamic Document Page Viewer"]
    end

    subgraph Ingestion ["Ingestion & CDN Storage"]
        Upload["FastAPI Multipart Ingestion Gateway"]
        Cloudinary["Cloudinary Secure CDN (Global Delivery)"]
        DiskCache["Local Storage & /tmp Serverless Cache"]
    end

    subgraph VisionPipeline ["AI Vision & Extraction Pipeline"]
        FitzRaster["PyMuPDF Matrix Rasterizer (640px JPEG ~35KB)"]
        GroqVLM["Groq Vision Engine (Qwen 3.8/3.6 VLM)"]
        TextLLMFallback["Text LLM Reasoning Fallback (GPT-OSS-120B)"]
        HeuristicFallback["Deterministic Regex Heuristic Parser"]
    end

    subgraph IntelligenceEngine ["Normalization & Ground Truth Validation"]
        NormService["Normalization Service (Joint Owners, 1/N Shares, IDs)"]
        PDFGroundTruth["PyMuPDF Line-Level Ground Truth Extractor"]
        FuzzyMatcher["RapidFuzz Token Set & Partial Ratio Matcher"]
        AnomalyEngine["Domain Anomaly & Chronological Sanity Engine"]
        ScorecardGen["Scorecard Generator (A+ to Flagged, Discrepancies)"]
    end

    subgraph CadastralGIS ["Cadastral Computer Vision & GIS Engine"]
        CVPreprocess["OpenCV Preprocessing (Gaussian + Adaptive Thresh)"]
        MorphClose["Morphological Closing (Line Gap Sealing)"]
        ContourDP["CCOMP Contours + Douglas-Peucker Polygon Approx"]
        WKTConv["Canonical WKT Serialization & Centroid Computation"]
        PlotAssign["MapPlot <-> LandRecord Relational Linker"]
    end

    subgraph Persistence ["Relational & Spatial Database (PostgreSQL)"]
        DBDocs[("documents Table")]
        DBRecords[("land_records Table (21 Revenue Fields + Scorecard)")]
        DBMaps[("cadastral_maps Table")]
        DBPlots[("map_plots Table (WKT Geometry + Plot #)")]
    end

    UI --> Upload
    Upload --> Cloudinary & DiskCache
    DiskCache --> FitzRaster
    FitzRaster --> GroqVLM
    GroqVLM -.->|Rate Limit / Image Only Fail| TextLLMFallback
    TextLLMFallback -.->|No Text Stream| HeuristicFallback
    
    GroqVLM & TextLLMFallback & HeuristicFallback --> NormService
    NormService --> PDFGroundTruth
    PDFGroundTruth --> FuzzyMatcher
    FuzzyMatcher --> AnomalyEngine --> ScorecardGen
    
    Upload --> CVPreprocess
    CVPreprocess --> MorphClose --> ContourDP --> WKTConv
    
    ScorecardGen --> DBRecords
    Upload --> DBDocs
    WKTConv --> DBMaps & DBPlots
    PlotAssign --> DBPlots

    DBDocs & DBRecords & DBMaps & DBPlots --> Studio & Canvas & UI
```

---

## 🔬 In-Depth Technical Approach

BhoomiSetu AI operates as a coordinated 7-stage pipeline engineered for maximum fidelity, high throughput, and zero data hallucination.

### 1. Multi-Modal Document Ingestion & CDN Synchronization
When an operator or citizen uploads a deed document (*PDF*, *PNG*, *JPEG*, *TIFF*):
1. **Stream Buffer Parsing**: The raw byte stream is received via FastAPI multipart form handler.
2. **Dual-Tier Storage Strategy**:
   - The file is saved locally to `./storage/documents/<uuid>.<ext>` for immediate sub-millisecond local processing.
   - Concurrently, the file is uploaded to **Cloudinary CDN** as a persistent raw asset (`bhoomisetu_documents/<uuid>_<filename>`), securing permanent global availability.
3. **Idempotent Case Management**: The system queries existing records by filename to enforce a **1 Dalil = 1 Case** invariant, preventing duplicate case proliferation while allowing reprocessing.

---

### 2. Multimodal Vision-Language Model (VLM) Pipeline
Traditional OCR fails on historical land deeds due to archaic revenue terminology, stamps, and cursive scripts. BhoomiSetu uses a **3-tier hierarchical extraction strategy**:

```
[Uploaded Document]
       │
       ▼
[PyMuPDF Base64 Matrix Rasterizer] (Downsampled to 640px JPEG, ~35KB payload)
       │
       ├──► Tier 1: Native Groq VLM (`qwen/qwen3.8-27b` / `qwen/qwen3.6-27b`)
       │            • Temperature: 0.1
       │            • System prompt enforcing 21 revenue deed schema fields
       │            • Automatic exponential backoff on HTTP 429
       │
       ├──► Tier 2: Text LLM Fallback (`openai/gpt-oss-120b` / `openai/gpt-oss-20b`)
       │            • Executed if VLM fails and PDF text layer > 30 chars
       │
       └──► Tier 3: Deterministic Regex Heuristic Parser
                    • Rule-based extraction fallback guaranteeing 100% pipeline uptime
```

#### Low-Latency Optimization:
By converting high-resolution PDF pages into compact, 640px bounding box JPEG images at 65% quality, payload sizes drop from 10MB+ down to ~35KB. This reduces Groq VLM network transfer latency by over **90%** while retaining crisp text legibility.

---

### 3. Post-Extraction Normalization & Business Logic Engine
Raw AI output is immediately passed through a deterministic Python normalization layer ([validation.py](file:///d:/Codes/bhoomisetu_ai/BhoomiSetu-AI/backend/app/services/validation.py)):

1. **Multi-Owner & Joint Purchaser Parsing**:
   - Deeds frequently group buyers (e.g., `"RAJEEV ARORA AND KAVITA ARORA"` or `"Devendra Singh, Sunita Singh"`).
   - Regex tokenizers split names across delimiters (`AND`, `and`, `&`, `+`, `,`, `;`, `along with`).
   - The primary person is isolated into `owner`, while all subsequent joint holders are assigned to `co_owner`.
2. **Automated Equal Share Allocation ($1/N$)**:
   - Calculates mathematical share proportions dynamically:
     $$\text{Total Owners} = 1 + \text{Count}(\text{co\_owners})$$
     $$\text{Share} = \frac{1}{\text{Total Owners}} \quad \left( \frac{100\%}{\text{Total Owners}} \text{ each} \right)$$
   - Generates exact fractions (e.g., `1/2 (50% each)`, `1/3 (33.33% each)`).
3. **Identifier Sanitization**:
   - Strips boilerplate prefixes (`Plot No.`, `Flat No.`, `Khasra No.`, `Dag No.`, `Khata No.`) to isolate pure canonical alphanumeric strings (e.g., `"GH-06"`, `"1409"`).
4. **Area & Unit Canonicalization**:
   - Separates numeric dimensions from measurement strings and standardizes units across metric, imperial, and traditional Indian land units (*Sq. Meters*, *Sq. Feet*, *Sq. Yards*, *Acres*, *Hectares*, *Bigha*, *Katha*, *Guntha*, *Biswa*, *Cents*, *Decimal*).
5. **Standardized Land Classification**:
   - Strips Unicode emoji noise and maps land types into 13 canonical categories:
     *Residential Land*, *Agricultural Land*, *Commercial Land*, *Industrial Land*, *Forest Land*, *Pasture/Grazing Land*, *Water Bodies*, *Road/Public Land*, *Government Land*, *Abadi / Village Settlement*, *Barren / Uncultivable Land*, *Wasteland*, *Religious/Institutional Land*.

---

### 4. Ground-Truth PDF Cross-Verification & Anomaly Scoring
To eliminate AI hallucinations, BhoomiSetu validates extracted fields against the source PDF text stream:

```
[Extracted Fields]  ◄─── RapidFuzz Token Set & Partial Ratio ───►  [PyMuPDF Extracted PDF Lines]
                                     │
                             Fidelity Scoring
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
      Fidelity Score >= 70%                   Fidelity Score < 70%
      & Zero Discrepancies                    OR Discrepancies Found
                 │                                       │
                 ▼                                       ▼
       is_validated = True                    is_validated = False
       Grade: A+ / A / B                      Grade: C / FLAGGED
```

1. **Line-Level PDF Ground Truth Extraction**: PyMuPDF extracts every raw line of text along with its page number.
2. **Fuzzy String Similarity**:
   - Computes RapidFuzz `token_set_ratio` and `partial_ratio`:
     * $\ge 0.85 \implies$ `VERIFIED_MATCH` (Exact/high-fidelity anchor on specific page)
     * $0.65 \le \text{Score} < 0.85 \implies$ `PROBABLE_MATCH`
     * $< 0.65 \implies$ `UNVERIFIED_IN_TEXT` (Inferred via Vision model)
3. **Domain Sanity & Anomaly Checks**:
   - **Positive Area Rule**: Rejects $\le 0$ numerical areas.
   - **Chronological Consistency**: Asserts $\text{Registration Date} \le \text{Mutation Date}$.
   - **Chain-of-Title Integrity**: Flags cases where $\text{Previous Owner} == \text{New Owner}$.
4. **Verification Scorecard Output**:
   - Computes weighted overall fidelity percentage:
     $$\text{Fidelity} = \frac{(N_{\text{verified}} \times 1.0) + (N_{\text{partial}} \times 0.75) + (N_{\text{unverified}} \times 0.5)}{N_{\text{total}}} \times 100$$
   - Assigns letter grades ($A^+ \ge 90\%$, $A \ge 80\%$, $B \ge 70\%$, $C \ge 60\%$, $\text{FLAGGED} < 60\%$).
   - Automatically updates `is_validated = True` (if passed) or `False` (if flagged) directly in the database.

---

### 5. Cadastral Mouza Map Computer Vision & Vectorization
Cadastral maps (*Mouza* survey sheets) represent intricate cadastral parcel divisions. BhoomiSetu vectorizes these maps using OpenCV ([mouza_vision.py](file:///d:/Codes/bhoomisetu_ai/BhoomiSetu-AI/backend/app/services/mouza_vision.py)):

1. **Raster Ingestion & DPI Upscaling**: Multi-page or single-page PDF maps are rasterized to 150 DPI RGB arrays.
2. **Image Preprocessing**:
   - Converted to grayscale $\rightarrow$ Gaussian Blur ($3 \times 3$ kernel) to suppress scan grain.
   - **Adaptive Gaussian Thresholding** (`cv2.adaptiveThreshold` with inverse binary) isolates parcel boundary ink lines from aged parchment background.
   - **Morphological Closing** (`cv2.MORPH_CLOSE` with $2 \times 2$ rectangular kernel) seals micro-gaps in survey lines without bridging neighboring parcels.
3. **Contour Extraction & Polygon Approximation**:
   - Extracts two-level contour hierarchies (`cv2.RETR_CCOMP`).
   - Area filtering excludes small artifacts ($< 500\text{ px}^2$) and oversized map borders ($> 10\%$ of canvas area).
   - Bounding-box aspect ratio check ($0.12 \le \text{AR} \le 8.0$) eliminates border lines.
   - **Douglas-Peucker Algorithm** (`cv2.approxPolyDP` with $\epsilon = 0.015 \times \text{perimeter}$) simplifies curves into clean polygons with $3 \le V \le 16$ vertices.
4. **Spatial Deduplication & Centroid Calculation**:
   - Inner/outer concentric duplicate contours within a Euclidean distance of $15\text{ px}$ are merged.
   - Spatial centroids are computed via image spatial moments:
     $$C_x = \frac{M_{10}}{M_{00}}, \quad C_y = \frac{M_{01}}{M_{00}}$$
5. **Canonical WKT Polygon Formatting**:
   - Vertex coordinates are serialized into standard OGC Well-Known Text:
     $$\text{POLYGON}((x_1 \, y_1, \, x_2 \, y_2, \, \dots, \, x_1 \, y_1))$$
6. **Automatic Cadastral Plot Numbering**:
   - Sorts parcels top-to-bottom, left-to-right (cadastral survey order) and assigns sequential plot numbers based on the Mouza JL number.

---

### 6. Cadastral-to-Deed Relational Linking & Spatial Studio
The interactive Next.js Mouza Studio ([mouza-map-studio.tsx](file:///d:/Codes/bhoomisetu_ai/BhoomiSetu-AI/frontend/components/mouza-map-studio.tsx)) couples vector geometries with extracted deeds:

- **Interactive Vector Canvas**: Renders detected parcel polygons dynamically over high-res map rasters with zoom, pan, and hover highlighting.
- **Relational Foreign Key Binding**: Cadastral plots (`MapPlot`) are assigned to extracted revenue deeds (`LandRecord`) via `POST /api/cadastral-maps/{map_id}/plots/{plot_id}/assign`.
- **Live Status Color-Coding**:
  * 🟢 **Assigned / Verified**: Green highlight with linked owner & deed preview card.
  * 🔵 **Detected / Unassigned**: Blue boundary ready for linking.
  * 🔴 **Flagged / Discrepancy**: Red boundary indicating spatial or legal variance.
- **Manual Vector Drafting**: Allows operators to manually draw new polygons, adjust vertex coordinates, update plot numbers, and delete obsolete plots.

---

### 7. Human-in-the-Loop Multi-Persona Governance

BhoomiSetu provides 6 tailored portals to support end-to-end land administration:

```
[Citizen] ──────────► Search Parcels, Track Mutation Cases, View Certified Records
       │
[Data Operator] ────► Ingest Scanned Deeds & Mouza Sheets, Monitor OCR Queues
       │
[Cadastral Verifier]► Review OCR Extractions, Adjust WKT Polygons, Resolve Anomalies
       │
[Revenue Officer] ──► Adjudicate Disputed Parcels, Approve / Reject Mutations
       │
[Vigilance Auditor] ─► Read-Only Forensic Audit Trails & Compliance Verification
       │
[System Admin] ─────► Manage Users, ML Pipelines, API Configurations & Telemetry
```

---

## 🗄 Data Models & Schema Reference

### 1. `Document`
Represents uploaded deed files and ingest sessions.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` (PK) | Unique UUID |
| `filename` | `VARCHAR(255)` | Stored filename on disk |
| `original_filename` | `VARCHAR(255)` | Uploaded filename |
| `file_path` | `VARCHAR(512)` | Local filesystem path |
| `file_url` | `VARCHAR(1024)` | Cloudinary CDN URL or local streaming endpoint |
| `file_size` | `INTEGER` | File size in bytes |
| `mime_type` | `VARCHAR(100)` | MIME type (e.g. `application/pdf`) |
| `status` | `VARCHAR(50)` | `queued`, `processing`, `extracted`, `verified`, `failed` |
| `error_message` | `TEXT` | Processing error logs (if any) |
| `created_at` / `updated_at` | `TIMESTAMP` | UTC timestamps |

---

### 2. `LandRecord`
Stores the **21 canonical revenue deed fields**, raw AI responses, and ground-truth validation scorecards.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` (PK) | Unique UUID |
| `document_id` | `VARCHAR(36)` (FK) | Reference to `Document.id` |
| `owner` | `VARCHAR(255)` | Primary Landowner / Transferee |
| `co_owner` | `VARCHAR(255)` | Comma-separated Co-Owner(s) |
| `share` | `VARCHAR(100)` | Fractional & percentage ownership share (e.g. `1/2 (50% each)`) |
| `khatian_khata` | `VARCHAR(100)` | Khatian / Khata Number |
| `khasra` | `VARCHAR(100)` | Khasra Number |
| `dag` | `VARCHAR(100)` | Dag Number |
| `plot_number` | `VARCHAR(100)` | Clean Plot / Flat / House Unit Number |
| `survey_number` | `VARCHAR(100)` | Survey / CS / RS / LR Number |
| `area` | `VARCHAR(100)` | Land dimension value |
| `area_unit` | `VARCHAR(100)` | Standardized unit (e.g. `Sq. Meters`, `Acres`) |
| `village` | `VARCHAR(255)` | Village / Locality / Society name |
| `mouza` | `VARCHAR(255)` | Mouza name |
| `tehsil_taluk` | `VARCHAR(255)` | Tehsil / Sub-Registrar Office |
| `district` | `VARCHAR(255)` | District name |
| `land_classification` | `JSON` | Array of matched categories from 13 canonical options |
| `mutation_number` | `VARCHAR(100)` | Mutation case number |
| `mutation_date` | `VARCHAR(100)` | Mutation order date |
| `registration_number` | `VARCHAR(100)` | Deed registration number |
| `registration_date` | `VARCHAR(100)` | Deed registration date |
| `previous_owner` | `VARCHAR(255)` | Seller / Transferor |
| `new_owner` | `VARCHAR(255)` | Buyer / Transferee |
| `raw_ocr_response` | `JSON` | Full VLM response & PDF validation scorecard |
| `confidence_score` | `FLOAT` | Overall confidence score ($0.0 - 1.0$) |
| `ocr_model_used` | `VARCHAR(100)` | Model tag (e.g. `qwen/qwen3.8-27b (Native VLM)`) |
| `is_validated` | `BOOLEAN` | Ground truth validation status (`True` if passed, `False` if failed) |
| `status` | `VARCHAR(50)` | `extracted`, `verified`, `flagged`, `approved`, `rejected` |

---

### 3. `CadastralMap`
Represents an ingested Mouza survey sheet.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` (PK) | Unique UUID |
| `state` | `VARCHAR(100)` | State name |
| `district` | `VARCHAR(100)` | District name |
| `mouza_name` | `VARCHAR(255)` | Mouza name |
| `mouza_no` | `VARCHAR(100)` | JL (Jurisdiction List) Number |
| `cloudinary_url` | `VARCHAR(1024)` | High-resolution Cloudinary CDN image URL |
| `image_width` / `image_height` | `INTEGER` | Pixel dimensions |
| `status` | `VARCHAR(50)` | `uploaded`, `processing`, `extracted`, `completed`, `failed` |

---

### 4. `MapPlot`
Individual parcel boundary extracted from a Cadastral Map.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36)` (PK) | Unique UUID |
| `map_id` | `VARCHAR(36)` (FK) | Reference to `CadastralMap.id` |
| `plot_number` | `VARCHAR(100)` | Cadastral plot number (e.g. `101`) |
| `geometry_wkt` | `TEXT` | Canonical WKT `POLYGON((...))` in pixel coordinate space |
| `centroid_x` / `centroid_y` | `FLOAT` | Center coordinates for label projection |
| `area_pixels` | `FLOAT` | Polygon area in pixel units |
| `status` | `VARCHAR(50)` | `detected`, `assigned`, `flagged`, `verified` |
| `dalil_id` | `VARCHAR(36)` (FK) | Optional foreign key link to `LandRecord.id` |
| `confidence_score` | `FLOAT` | Contour detection confidence |
| `notes` | `TEXT` | Operator notes and detection logs |

---

## 📡 API Reference Guide

All endpoints are hosted at `/api` (with `/api/v1` aliases available).

### Document Management (`/api/documents`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Uploads deed, uploads to Cloudinary, executes Groq VLM extraction, normalizes fields, runs PDF ground-truth cross-check, and saves record. |
| `GET` | `/api/documents` | Lists recent uploaded documents with status and primary record details. |
| `GET` | `/api/documents/{id}/file` | Streams raw PDF/image bytes from local storage or Cloudinary CDN. |
| `GET` | `/api/documents/{id}/pages` | Renders all PDF pages as base64 PNG images for interactive in-browser preview. |
| `POST` | `/api/documents/{id}/reprocess` | Re-executes the VLM extraction & validation pipeline on an existing document. |
| `DELETE` | `/api/documents/{id}` | Deletes document and associated land records. |

### Land Records & Validation (`/api/records`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/records` | Query land records (supports filtering by `q`, `district`, `status`, `is_validated`). |
| `GET` | `/api/records/{id}` | Fetches full land record with raw OCR response and verification scorecard. |
| `POST` | `/api/records/{id}/validate` | Triggers on-demand ground truth validation against source PDF, computing fidelity grade and setting `is_validated`. |
| `PUT` | `/api/records/{id}` | Updates land record attributes and verification status. |
| `DELETE` | `/api/records/{id}` | Deletes land record. |

### Cadastral GIS & Mouza Maps (`/api/cadastral-maps`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cadastral-maps/upload` | Ingests Mouza sheet, uploads to Cloudinary, executes OpenCV contour extraction, and stores vectorized plots. |
| `GET` | `/api/cadastral-maps` | Lists uploaded Mouza sheets with total, assigned, and flagged plot counts. |
| `GET` | `/api/cadastral-maps/{id}` | Retrieves Mouza sheet details with all embedded WKT plots and linked Dalils. |
| `GET` | `/api/cadastral-maps/{id}/image` | Streams high-res rasterized map sheet image (dynamically converts PDF maps to PNG). |
| `POST` | `/api/cadastral-maps/{id}/reprocess` | Re-runs OpenCV contour extraction on an existing map. |
| `POST` | `/api/cadastral-maps/{id}/plots` | Adds a manually drafted vector plot boundary (`POLYGON`). |
| `PATCH` | `/api/cadastral-maps/{id}/plots/{plot_id}` | Updates plot number, WKT geometry coordinates, status, or notes. |
| `DELETE` | `/api/cadastral-maps/{id}/plots/{plot_id}` | Deletes individual plot polygon. |
| `POST` | `/api/cadastral-maps/{id}/plots/{plot_id}/assign` | Links an extracted Dalil (`LandRecord`) to a cadastral map plot. |
| `POST` | `/api/cadastral-maps/{id}/plots/{plot_id}/unassign` | Unlinks a Dalil from a cadastral plot. |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Returns aggregate counts for documents, records, processing queues, and verified assets. |
| `GET` | `/api/dashboard/district-progress` | Returns record distribution aggregated across districts. |
| `GET` | `/health` | Verifies API health and active PostgreSQL database connectivity. |

---

## 👥 User Roles & Access Matrix

| Role | Upload Deeds / Maps | Verify & Edit OCR | Adjudicate & Approve | Spatial Plot Linking | Audit Logs | Admin Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Citizen** | — | — | — | — | — | — |
| **Data Operator** | ✓ | — | — | ✓ | — | — |
| **Cadastral Verifier** | — | ✓ | — | ✓ | — | — |
| **Revenue Officer** | — | — | ✓ | ✓ | — | — |
| **Vigilance Auditor** | — | — | — | — | Read-only | — |
| **System Admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 📂 Repository Structure

```
BhoomiSetu-AI/
├── frontend/                          # Next.js 16 App Router Frontend
│   ├── app/
│   │   ├── auth/page.tsx              # Unified role-based authentication modal
│   │   ├── dashboard/
│   │   │   ├── citizen/page.tsx       # Citizen portal — search & track records
│   │   │   ├── operator/page.tsx      # Operator portal — deed & mouza upload studio
│   │   │   ├── verifier/page.tsx      # Verifier portal — OCR review & parcel verification
│   │   │   ├── officer/page.tsx       # Revenue Officer — adjudication & approval
│   │   │   ├── auditor/page.tsx       # Auditor portal — vigilance & compliance trails
│   │   │   └── admin/page.tsx         # System administrator dashboard
│   │   ├── globals.css                # Design tokens, CSS variables & component styles
│   │   ├── layout.tsx                 # Root layout with theme initialization script
│   │   └── page.tsx                   # Public landing page with interactive demos
│   ├── components/
│   │   ├── cadastral-gis.tsx          # Interactive GIS preview component
│   │   ├── dashboard-shell.tsx        # Responsive dashboard layout, topbar & navigation
│   │   ├── mouza-map-studio.tsx       # Comprehensive Mouza map vector editor & Dalil linker
│   │   ├── mouza-map-viewer.tsx       # Lightweight SVG/Canvas map viewer
│   │   ├── pdf-viewer.tsx             # In-browser PyMuPDF multi-page document renderer
│   │   ├── validation-engine.tsx      # Ground-truth validation scorecards & anomaly studio
│   │   └── verification-studio.tsx    # Split-screen deed inspection & correction studio
│   ├── lib/
│   │   ├── api.ts                     # Fully typed HTTP client for all backend endpoints
│   │   ├── api-types.ts               # Shared TypeScript domain models & DTOs
│   │   └── utils.ts                   # Tailwind merge & utility helpers
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                           # FastAPI Python Backend
│   ├── app/
│   │   ├── routers/
│   │   │   ├── documents.py           # Document upload, page rendering & reprocessing
│   │   │   ├── records.py             # Land record CRUD, ground-truth PDF validation
│   │   │   └── cadastral_maps.py      # Cadastral map upload, OpenCV contours & plot linking
│   │   ├── services/
│   │   │   ├── groq_vision.py         # Groq Native VLM inference & fallback cascade
│   │   │   ├── mouza_vision.py        # OpenCV parcel segmentation & WKT vectorizer
│   │   │   ├── validation.py          # Normalization, RapidFuzz ground truth & anomaly checks
│   │   │   └── storage.py             # Dual-tier Cloudinary CDN & local storage abstraction
│   │   ├── config.py                  # Pydantic environment configuration
│   │   ├── database.py                # SQLAlchemy engine & session factory
│   │   ├── main.py                    # FastAPI application, lifespan & router registration
│   │   └── models.py                  # Declarative SQLAlchemy ORM models
│   ├── .env.example                   # Environment configuration template
│   └── requirements.txt               # Python package dependencies
│
├── storage/documents/                 # Local document storage directory (gitignored)
└── README.md                          # Master documentation
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18+ (Node 20 LTS recommended)
- **pnpm** or **npm**
- **Python**: 3.10+ (Python 3.11 recommended)
- **PostgreSQL**: Local instance or free [Neon](https://neon.tech) serverless database
- **Groq API Key**: Free tier available at [console.groq.com](https://console.groq.com)
- **Cloudinary Account** (Optional for CDN hosting; defaults to local storage if omitted)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env     # Windows
# cp .env.example .env     # macOS / Linux
```

Edit `backend/.env` with your credentials:
```ini
DATABASE_URL=postgresql://user:password@localhost:5432/bhoomisetu
GROQ_API_KEY=gsk_your_groq_api_key_here
STORAGE_BACKEND=cloudinary
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

Start the API server:
```bash
uvicorn app.main:app --reload --port 8000
```
> Interactive API Swagger Documentation is available at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install
# or: npm install

# Configure environment
copy .env.local.example .env.local     # Windows
# cp .env.local.example .env.local     # macOS / Linux
```

Ensure `frontend/.env.local` points to your backend:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:
```bash
pnpm dev
# or: npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔑 Demo Credentials

All test accounts share the password: `BhoomiSetu@2026`

| Persona | Role | Email | Target Workflow |
|---|---|---|---|
| **Citizen** | Landowner | `citizen.rajesh@gmail.com` | Public parcel search & mutation tracking |
| **Data Operator** | Clerk | `data.operator@lrms.gov.in` | Scanned deed ingestion & map uploading |
| **Cadastral Verifier** | Surveyor | `cadastral.verifier@lrms.gov.in` | Split-screen verification & GIS polygon adjustment |
| **Revenue Officer** | Tehsildar | `officer.tehsildar@lrms.gov.in` | Legal deed approval & mutation adjudication |
| **Vigilance Auditor** | Inspector | `vigilance.auditor@cag.gov.in` | Read-only compliance audit & forensic logs |
| **System Admin** | Administrator | `sysadmin@bhoomisetu.gov.in` | System configuration & pipeline telemetry |

---

## 🛡 Compliance & Standards

- **DILRMP**: Digital India Land Records Modernisation Programme compliant data structure.
- **OGC Spatial Standards**: Canonical Well-Known Text (WKT) `POLYGON` geometry definitions for GIS parcel compatibility.
- **ISO 19152 LADM**: Land Administration Domain Model spatial unit alignment.
- **Role-Based Access Control (RBAC)**: Enforced across all API endpoints to protect sensitive land tenure data.

---

<div align="center">
  <sub>Built with precision for transparent, accountable, and tamper-proof digital land governance.</sub><br>
  <strong>© 2026 BhoomiSetu AI</strong>
</div>
