'use client'

import React, { useState } from 'react'
import {
  FileText,
  Layers,
  Cpu,
  ShieldCheck,
  Database,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  Activity,
  Globe2,
  Lock,
  Search,
  Scale,
  Sparkles,
} from 'lucide-react'

const SCOPE_OF_STUDY_ROWS = [
  {
    category: 'Legacy Sale Deeds (Dalil / Baynamah)',
    languages: 'Bengali, Hindi, English, Urdu',
    format: 'Handwritten & Typed Microfilm / Scan (150–300 DPI)',
    fields: 'Vendor/Vendee, Dag/Plot No., Khatian No., Area & Unit, Boundary Schedule (Chouhaddi), Consideration Amount, Deed Date',
    validation: 'Deed Area vs. Cadastral Spatial Polygon Boundary, Cross-Deed Owner Lineage',
  },
  {
    category: 'Record of Rights (Khatian / Jamabandi / 7/12)',
    languages: 'Hindi, Bengali, Marathi, Gujarati, Telugu, Tamil',
    format: 'Government Tabular Ledger & Scanned Register Pages',
    fields: 'Khata/Khatian No., Share Ratio, Possession Type, Land Classification (Bastu, Sali, Danga, Jal), Cess & Revenue Demand',
    validation: 'Sum of fractional shares == 1.0000, Classification consistency check',
  },
  {
    category: 'Cadastral Mouza Maps (Naksha / Sheet)',
    languages: 'Alphanumeric & Regional Plot Numbering',
    format: 'High-Res Scanned Cloth/Mylar Map Sheets (4000x3000px+)',
    fields: 'Vectorized Parcel Polygons, Centroids, Neighboring Adjacencies, Sub-plot Boundaries, Waterbodies, Roads',
    validation: 'Geodesic Area Computation, Overlap & Sliver Detection, Missing Parcel Gap Reconciliation',
  },
  {
    category: 'Mutation Orders & Title Dispute Decrees',
    languages: 'Official State Administrative Dialects',
    format: 'Stamped Legal Petitions & Court Case Decrees',
    fields: 'Case No., Order Date, Adjudicating Tehsildar/BL&LRO, Predecessor in Interest, Mutation Grant Status',
    validation: 'Legal Precedent Chain Verification, Non-Repudiation Digital Officer Signature',
  },
  {
    category: 'Bilingual / Multilingual Revenue Records',
    languages: 'Indic Multi-Script + Romanized Transliteration',
    format: 'Mixed Printed and Cursive Hand Annotations',
    fields: 'Standardized English Canonical Mapping + Preserved Native Vernacular Script',
    validation: 'Dual-Script Entity Match Score, Levenshtein Distance Discrepancy Flagging',
  },
]

const TECH_STACK_COMPONENTS = [
  {
    component: 'Optical Character Recognition & Multimodal Vision',
    coreTech: 'Groq Llama 3.2 Vision (11B / 90B Multimodal) + OpenCV Pipeline',
    capabilities: 'Binarization, Deskewing, Contrast Stretching, Handwritten OCR, Multilingual Indic Tokenization',
    role: 'Primary Vision Extraction Engine',
  },
  {
    component: 'Cadastral GIS & Spatial Vectorization',
    coreTech: 'PostGIS + Shapely + GeoJSON + High-Precision Polygon Vectorizer',
    capabilities: 'Sheet Polygon Boundary Tracing, Centroid Derivation, Geodesic Area Calculation, Plot Boundary Snapping',
    role: 'Spatial Ingestion & Cadastral Alignment',
  },
  {
    component: 'Schema Harmonization & Canonical Taxonomy',
    coreTech: 'Pydantic V2 + State-Aware Revenue Mapping Layer',
    capabilities: 'Standardization of Dag/Khasra/Survey terminology, Acre/Decimal/Bigha/Katha Unit Conversions',
    role: 'National Interoperability Standard',
  },
  {
    component: 'Ground-Truth Verification Engine',
    coreTech: 'PyPDF / pdfplumber Text Layer Scanner + Levenshtein Matching',
    capabilities: 'Automated extraction-to-ground-truth discrepancy analysis, Field-by-field confidence grading',
    role: 'Fidelity & Accuracy Assurance',
  },
  {
    component: 'Human-in-the-Loop Adjudication Queue',
    coreTech: 'Next.js React Client + FastAPI Backend + Accordion Inspector',
    capabilities: 'Collapsible case cards, Low-confidence highlight overlays, One-click officer endorsement & signing',
    role: 'Revenue Officer Governance',
  },
  {
    component: 'Relational Audit Trail & Provenance',
    coreTech: 'PostgreSQL Event Store + Immutable Versioning + Change Log',
    capabilities: 'Per-field mutation history, Prior vs. New value diffs, Officer ID attribution, Legal justifications',
    role: 'Non-Repudiation & Audit Compliance',
  },
  {
    component: 'LRMS & DILRMP Interoperability API',
    coreTech: 'RESTful OpenAPI Microservices + JSONB Storage + Cloudinary CDN',
    capabilities: 'Secure authenticated endpoints, Bulk batch ingestion, GIS export (GeoJSON/WFS), Role-Based Access Control',
    role: 'Digital Governance Integration',
  },
]

export default function StudyScopeMatrix() {
  const [activeTab, setActiveTab] = useState<'scope' | 'tech'>('scope')

  return (
    <section className="terra-section" id="specs" style={{ background: 'var(--cream)' }}>
      <div className="terra-eyebrow">Technical Architecture & Governance</div>
      <div className="solutions-head">
        <h2>
          System specification &
          <br />
          <i>scope of study.</i>
        </h2>
        <p>
          Formulated to satisfy all requirements of India&apos;s National Land Record Modernization Programme
          (DILRMP), delivering complete multilingual digitization, spatial validation, and human-in-the-loop oversight.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setActiveTab('scope')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition ${
            activeTab === 'scope'
              ? 'terra-pill dark'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
          }`}
        >
          <FileText size={15} />
          Scope of Study Matrix
        </button>
        <button
          onClick={() => setActiveTab('tech')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition ${
            activeTab === 'tech'
              ? 'terra-pill dark'
              : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
          }`}
        >
          <Cpu size={15} />
          Component-Wise Technology Stack
        </button>
      </div>

      {/* Scope of Study Table */}
      {activeTab === 'scope' && (
        <div
          className="rounded-3xl border border-stone-300 dark:border-white/10 p-6 shadow-xl overflow-hidden"
          style={{ background: 'var(--paper)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <FileText size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Scope of Study: Document Classes & Extraction Schema
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              Complete Coverage
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-300 dark:border-white/10 bg-stone-100/60 dark:bg-stone-900/60">
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Document Type</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Supported Languages</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Archival Format</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Extracted Revenue Fields</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Validation & Consistency Rules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-white/5">
                {SCOPE_OF_STUDY_ROWS.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-amber-500/5 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                      {row.category}
                    </td>
                    <td className="p-3.5 text-stone-600 dark:text-stone-300">
                      <span className="font-medium text-amber-700 dark:text-amber-400">{row.languages}</span>
                    </td>
                    <td className="p-3.5 text-stone-500 dark:text-stone-400">
                      {row.format}
                    </td>
                    <td className="p-3.5 text-stone-700 dark:text-stone-200">
                      {row.fields}
                    </td>
                    <td className="p-3.5 text-emerald-700 dark:text-emerald-300 font-medium">
                      {row.validation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suggested Component-Wise Technology Table */}
      {activeTab === 'tech' && (
        <div
          className="rounded-3xl border border-stone-300 dark:border-white/10 p-6 shadow-xl overflow-hidden"
          style={{ background: 'var(--paper)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <Cpu size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Suggested Component-Wise Technology Stack
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              Enterprise Grade
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-300 dark:border-white/10 bg-stone-100/60 dark:bg-stone-900/60">
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">System Component</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Core Technology & Frameworks</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Key Capabilities</th>
                  <th className="p-3.5 font-bold text-stone-700 dark:text-stone-300">Functional Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-white/5">
                {TECH_STACK_COMPONENTS.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-amber-500/5 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <Code2 size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      {row.component}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {row.coreTech}
                    </td>
                    <td className="p-3.5 text-stone-600 dark:text-stone-300">
                      {row.capabilities}
                    </td>
                    <td className="p-3.5 text-stone-500 dark:text-stone-400 font-medium">
                      {row.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
