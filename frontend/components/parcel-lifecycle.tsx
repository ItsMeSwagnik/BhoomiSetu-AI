'use client'

import { useState, useRef } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  History,
  Layers,
  MapPin,
  RefreshCw,
  Sliders,
  UserCheck,
} from 'lucide-react'

export interface LifecycleStep {
  step: number
  title: string
  subtitle: string
  icon: any
  tag: string
}

export const LIFECYCLE_STEPS: LifecycleStep[] = [
  {
    step: 1,
    title: 'Document Ingestion',
    subtitle: 'High-resolution PDF & image intake from revenue archives',
    icon: FileText,
    tag: 'Ingestion',
  },
  {
    step: 2,
    title: 'Image Preprocessing',
    subtitle: 'Automated deskewing, denoising & binarization via OpenCV',
    icon: Sliders,
    tag: 'Image Processing',
  },
  {
    step: 3,
    title: 'Multilingual OCR & TrOCR',
    subtitle: 'Printed & handwritten Hindi, Bengali, English extraction',
    icon: FileSearch,
    tag: 'OCR & Handwriting',
  },
  {
    step: 4,
    title: 'Structured Schema Extraction',
    subtitle: 'Standardization into canonical land record schema',
    icon: Cpu,
    tag: 'Field Extraction',
  },
  {
    step: 5,
    title: 'Cadastral Parcel Matching',
    subtitle: 'Rampur Plot 102 resolved to PostGIS Parcel P102',
    icon: MapPin,
    tag: 'PostGIS GIS',
  },
  {
    step: 6,
    title: 'Spatial Area Validation',
    subtitle: 'Comparison between textual deed area and geodesic GIS geometry',
    icon: Layers,
    tag: 'Spatial Validation',
  },
  {
    step: 7,
    title: 'Chain-of-Custody Lineage',
    subtitle: 'Cross-record reconciliation across RoR, Registration & Mutation',
    icon: History,
    tag: 'Lineage Analysis',
  },
  {
    step: 8,
    title: 'Validation Engine Alerts',
    subtitle: 'Rule-based identification of ownership and area anomalies',
    icon: AlertTriangle,
    tag: 'Rule Validation',
  },
  {
    step: 9,
    title: 'Evidence-Linked Highlighting',
    subtitle: 'Traceable bounding box positioning on historical scan',
    icon: Eye,
    tag: 'Traceability',
  },
  {
    step: 10,
    title: 'Human Verification',
    subtitle: 'Revenue officer split-screen review and adjudication',
    icon: UserCheck,
    tag: 'Human Verification',
  },
  {
    step: 11,
    title: 'Audit Trail Recording',
    subtitle: 'Relational audit logging in PostgreSQL with operational reasons',
    icon: FileCheck2,
    tag: 'Audit Trail',
  },
  {
    step: 12,
    title: 'Verified Digital Land Record',
    subtitle: 'Living digital infrastructure synchronized with LRMS & DILRMP',
    icon: CheckCircle2,
    tag: 'Verified Record',
  },
]

export default function ParcelLifecycle() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCorrected, setIsCorrected] = useState(false)
  const [activeLang, setActiveLang] = useState<'hindi' | 'bengali' | 'english'>('hindi')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const stepData = LIFECYCLE_STEPS[currentStep - 1]

  return (
    <section id="pipeline" className="terra-section" style={{ background: 'var(--cream)' }}>
      <div className="terra-eyebrow">The Processing Engine</div>
      <div className="solutions-head">
        <h2>
          End-to-end parcel
          <br />
          <i>intelligence.</i>
        </h2>
        <p>
          Trace each record from historical parchment through automated optical extraction,
          geodesic PostGIS verification, and authorized officer sign-off.
        </p>
      </div>

      {/* Progress Capsule Bar */}
      <div className="relative mb-10 group flex items-center w-full">
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 md:-left-4 z-10 p-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-50 dark:hover:bg-stone-700"
        >
          <ChevronLeft size={16} />
        </button>

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div
            className="flex min-w-max items-center gap-2 p-2 rounded-full border border-stone-300 dark:border-white/10 mx-auto w-fit"
            style={{ background: 'var(--paper)' }}
          >
            {LIFECYCLE_STEPS.map((s) => {
              const isDone = currentStep > s.step
              const isCurrent = currentStep === s.step
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isCurrent
                      ? 'terra-pill dark'
                      : isDone
                      ? 'text-emerald-800 dark:text-emerald-400 font-bold'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                  }`}
                >
                  <span>{isDone ? '✓' : s.step}</span>
                  <span className="hidden md:inline">{s.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-1 md:-right-4 z-10 p-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-50 dark:hover:bg-stone-700"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Main Workspace Stage Box */}
      <div
        className="rounded-3xl border border-stone-300/80 dark:border-white/15 p-6 sm:p-10 shadow-lg"
        style={{ background: 'var(--paper)' }}
      >
        {/* Step Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-300 dark:border-white/10 pb-5 mb-8 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="badge-icon">
              <stepData.icon size={18} />
            </div>
            <div>
              <span className="terra-eyebrow" style={{ fontSize: '9px' }}>
                Stage {stepData.step} · {stepData.tag}
              </span>
              <h3 style={{ margin: '4px 0 0', fontFamily: 'Georgia, serif', fontSize: '24px' }}>
                {stepData.title}
              </h3>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md text-right hidden sm:block">
            {stepData.subtitle}
          </p>
        </div>

        {/* Dynamic Step Body */}
        <div className="min-h-[340px] flex items-center justify-center">
          {/* STEP 1: Ingestion */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
              <div>
                <span className="terra-eyebrow">Revenue Archives Intake</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '8px 0' }}>
                  Khatiyan Register #1042
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Ingested scanned 1968 land record from Rampur revenue village. The document
                  displays paper yellowing, micro-creases, and an axial tilt of 7.4 degrees.
                </p>
                <div className="mt-4 p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Source Archive:</span>
                    <b>Bihar Revenue Department</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Document Classification:</span>
                    <b>Record of Rights (RoR / Khatian)</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Primary Script:</span>
                    <b>Devanagari (Hindi) with handwritten marginal notes</b>
                  </div>
                </div>
              </div>

              <div className="record-preview">
                <div className="preview-top">
                  ARCHIVE INGESTION <span>STAGE 01</span>
                </div>
                <div className="preview-paper">
                  <small>REVENUE DEPARTMENT</small>
                  <strong>KHATIYAN REGISTER #1042</strong>
                  <div className="paper-rule" />
                  <div className="highlight-line">रैयत: राजेश कुमार</div>
                  <div className="highlight-line short">रकबा: २.४५ एकड़</div>
                  <span className="paper-stamp">PARCHMENT</span>
                </div>
                <div className="record-status">
                  <span className="status-dot" /> 300 DPI Grayscale Stream Received
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preprocessing */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center">
              <div className="p-5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                <span className="terra-eyebrow">OpenCV</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '6px 0 12px' }}>
                  Radon Deskewing
                </h4>
                <div className="h-28 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center relative overflow-hidden mb-3">
                  <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
                    Rotated -7.4°
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Restores horizontal text alignment across skewed register scans.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                <span className="terra-eyebrow">Pillow / CV2</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '6px 0 12px' }}>
                  Morphological Denoising
                </h4>
                <div className="h-28 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center mb-3">
                  <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
                    Median Filter
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Filters background speckles, scan dust, and ink bleeds.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                <span className="terra-eyebrow">Sauvola Threshold</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '6px 0 12px' }}>
                  Adaptive Binarization
                </h4>
                <div className="h-28 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-3">
                  <span className="text-xs font-mono text-amber-300">High Contrast Text</span>
                </div>
                <p className="text-xs text-stone-500">
                  Separates faint ink strokes from darkened aged parchment.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Multilingual OCR */}
          {currentStep === 3 && (
            <div className="w-full space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', margin: 0 }}>
                    PaddleOCR & Indic TrOCR Bounding Box Extraction
                  </h4>
                  <p className="text-xs text-stone-500">
                    Dual extraction pipeline maintaining pixel-level bounding coordinates.
                  </p>
                </div>
                <div className="flex rounded-full border border-stone-300 dark:border-stone-700 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveLang('hindi')}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      activeLang === 'hindi' ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    Hindi
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('bengali')}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      activeLang === 'bengali' ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    Bengali
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLang('english')}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      activeLang === 'english' ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Owner (रैयत)</span>
                  <p className="text-base font-bold text-stone-900 dark:text-white mt-1">
                    {activeLang === 'hindi' ? 'राजेश कुमार' : activeLang === 'bengali' ? 'রাজেশ কুমার' : 'Rajesh Kumar'}
                  </p>
                  <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Confidence: 98% · BBox [42, 110, 180, 135]
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Plot (खेसरा)</span>
                  <p className="text-base font-bold text-stone-900 dark:text-white mt-1">102</p>
                  <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Confidence: 96% · BBox [185, 110, 240, 135]
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                  <span className="text-[10px] text-stone-500 font-bold uppercase">Village (मौजा)</span>
                  <p className="text-base font-bold text-stone-900 dark:text-white mt-1">Rampur</p>
                  <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Confidence: 94% · BBox [305, 110, 390, 135]
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-400 bg-amber-500/10">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase">
                    Area (रकबा - Handwritten)
                  </span>
                  <p className="text-base font-bold text-amber-900 dark:text-amber-200 mt-1">
                    2.45 acres
                  </p>
                  <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                    Confidence: 63% ⚠️ (Ink Bleed)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Canonical Schema */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
              <div>
                <span className="terra-eyebrow">Schema Normalization</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '8px 0' }}>
                  State-Aware Terminology Layer
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Standardizes local nomenclatures (Dag, Khasra, Survey Number) into uniform
                  digital land records while persistently preserving original deed values.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4 text-xs font-mono text-emerald-400 shadow-inner">
                <pre>{`{
  "parcel_id": "P102",
  "owner": "Rajesh Kumar",
  "plot_number": "102",
  "khatian_number": "1042",
  "village": "Rampur",
  "district": "Gaya",
  "area": 2.45,
  "area_unit": "acre",
  "land_classification": "Agricultural"
}`}</pre>
              </div>
            </div>
          )}

          {/* STEP 5: PostGIS Parcel Matching */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
              <div>
                <span className="terra-eyebrow">Spatial Ingestion</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '8px 0' }}>
                  PostGIS Cadastral Match
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Rampur Village + Plot 102 queries the PostGIS database, matching the physical
                  survey parcel with coordinates and surrounding boundaries.
                </p>
              </div>
              <div className="h-48 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-900 flex items-center justify-center text-white">
                <div className="text-center">
                  <MapPin size={24} className="text-emerald-400 mx-auto mb-2 animate-bounce" />
                  <span className="font-bold text-sm block">Parcel P102 Resolved</span>
                  <span className="text-xs text-stone-400 font-mono">POLYGON ((85.001 24.801, ...))</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Spatial Validation */}
          {currentStep === 6 && (
            <div className="w-full text-center space-y-6 max-w-xl">
              <span className="terra-eyebrow">Spatial Validation</span>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                Deed Area vs. Cadastral Geometry
              </h4>
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase">Text Record</span>
                  <p className="text-xl font-bold mt-1">2.45 ac</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-500/10">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">
                    PostGIS Area
                  </span>
                  <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                    2.58 ac
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-amber-500 bg-amber-500/10">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold">
                    Variance
                  </span>
                  <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                    +5.3% ⚠️
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-500">
                Discrepancy exceeds the 5.0% tolerance limit. Automatically routed to officer queue.
              </p>
            </div>
          )}

          {/* STEP 7: Lineage */}
          {currentStep === 7 && (
            <div className="w-full space-y-4 max-w-2xl text-left">
              <span className="terra-eyebrow">Chain of Custody</span>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                Reconstructed Title History
              </h4>
              <div className="border-l-2 border-emerald-700 pl-4 space-y-3 text-xs">
                <div>
                  <span className="font-bold">2018 · Prior RoR:</span> Savitri Devi (Sole Owner · 2.50 acres)
                </div>
                <div>
                  <span className="font-bold">2020 · Sale Registration #482:</span> Savitri Devi → Rajesh Kumar
                </div>
                <div>
                  <span className="font-bold">2020 · Mutation Order #19:</span> Savitri Devi → Rajesh Kumar
                </div>
                <div>
                  <span className="font-bold">2024 · Current Draft Application:</span> Rajesh Kumar (Claimed Area 2.45 ac vs GIS 2.58 ac)
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Anomaly Alerts */}
          {currentStep === 8 && (
            <div className="w-full max-w-xl space-y-4 text-left">
              <div className="p-4 rounded-2xl border border-rose-400 bg-rose-500/10">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                  Ownership Share Inconsistency
                </span>
                <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                  Owner A (60%) + Owner B (30%) + Owner C (20%) totals 110%. Must equal 100%.
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-amber-400 bg-amber-500/10">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Spatial Area Discrepancy
                </span>
                <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                  Textual 2.45 acres vs PostGIS 2.58 acres (5.3% variance exceeds 5.0% threshold).
                </p>
              </div>
            </div>
          )}

          {/* STEP 9: Bounding Box Evidence */}
          {currentStep === 9 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
              <div>
                <span className="terra-eyebrow">Explainable Evidence</span>
                <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '8px 0' }}>
                  Traceable Source Location
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Clicking an anomaly directly displays the exact pixel bounding box on the original
                  scanned paper register for inspection.
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-[#fbf8ef] text-stone-900 font-serif text-xs">
                <p>खेसरा: १०२</p>
                <div className="my-2 p-2 rounded border-2 border-amber-600 bg-amber-200/60 font-bold">
                  रकबा: २.५८ एकड़ (स्याही फैलाव के साथ २.४५ पढ़ा गया)
                </div>
                <p className="text-[10px] text-stone-500 font-sans">Source Coordinate Box #4</p>
              </div>
            </div>
          )}

          {/* STEP 10: Human Verification */}
          {currentStep === 10 && (
            <div className="w-full max-w-xl text-center space-y-4">
              <span className="terra-eyebrow">Human-in-the-Loop</span>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                Officer Workspace Adjudication
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                AI flags uncertainty; authorized officers make the final binding determination.
              </p>
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Field:</span>
                  <b>Parcel Area (Plot 102)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">AI Hypothesis:</span>
                  <span className="line-through text-stone-400">2.45 acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Human Correction:</span>
                  <b className="text-emerald-700 dark:text-emerald-400">
                    {isCorrected ? '2.58 acres (Recorded)' : '2.58 acres (Matched with Cadastre)'}
                  </b>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCorrected(true)}
                className="terra-pill dark"
              >
                {isCorrected ? '✓ Adjudication Saved' : 'Accept 2.58 Acres & Sign'}
              </button>
            </div>
          )}

          {/* STEP 11: PostgreSQL Audit Trail */}
          {currentStep === 11 && (
            <div className="w-full max-w-xl text-left space-y-4">
              <span className="terra-eyebrow">Relational Audit Trail</span>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                PostgreSQL Audit Log Entry
              </h4>
              <p className="text-xs text-stone-500">
                Every alteration records who, what changed, previous value, new value, timestamp, and legal reason.
              </p>
              <div className="p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Officer ID:</span>
                  <b>user_102 (Tehsildar)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Field Modified:</span>
                  <b>area</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Old Value:</span>
                  <span className="text-rose-500">2.45 acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">New Value:</span>
                  <span className="text-emerald-600">2.58 acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Timestamp:</span>
                  <span>14:32:05 IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Reason:</span>
                  <span>OCR correction verified against cadastral geometry</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Verified Record */}
          {currentStep === 12 && (
            <div className="w-full max-w-md text-center space-y-4">
              <div className="badge-icon mx-auto" style={{ width: '50px', height: '50px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', margin: 0 }}>
                Verified Land Record
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Digital land record, historical chain of custody, PostGIS cadastral polygon, and
                officer audit trail are unified into an authoritative asset.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="terra-pill light"
              >
                Restart Pipeline Walkthrough
              </button>
            </div>
          )}
        </div>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between border-t border-stone-300 dark:border-white/10 pt-5 mt-8">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="under-link disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Previous Stage
          </button>

          <span className="text-xs font-mono text-stone-500">
            {currentStep} / {LIFECYCLE_STEPS.length}
          </span>

          <button
            type="button"
            disabled={currentStep === 12}
            onClick={() => setCurrentStep((prev) => Math.min(12, prev + 1))}
            className="under-link disabled:opacity-30"
          >
            Next Stage <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}
