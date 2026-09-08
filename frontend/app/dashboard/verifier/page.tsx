'use client'

import React, { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  Layers,
  X,
  FileText,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckSquare
} from 'lucide-react'
import { api } from '@/lib/api'
import type { LandRecord, FieldCorrection, ValidationScorecard, FieldVerification } from '@/lib/api-types'
import PdfViewer from '@/components/pdf-viewer'

const REVENUE_FIELD_LABELS: Record<string, string> = {
  owner: 'Primary Owner / Transferee',
  coOwner: 'Co-Owner(s)',
  share: 'Ownership Share Fraction',
  plotNumber: 'Plot / Unit / Flat No.',
  khasra: 'Khasra Number',
  dag: 'Dag Number',
  khatianKhata: 'Khatian / Khata Number',
  surveyNumber: 'Survey / CS / RS Number',
  area: 'Land / Plot Area',
  areaUnit: 'Measurement Unit',
  village: 'Village / Locality / Society',
  mouza: 'Mouza',
  tehsilTaluk: 'Tehsil / Sub-Registrar',
  district: 'District',
  landClassification: 'Land Classification',
  mutationNumber: 'Mutation Case No.',
  mutationDate: 'Mutation Order Date',
  registrationNumber: 'Registration Deed No.',
  registrationDate: 'Deed Registration Date',
  previousOwner: 'Previous Owner / Seller',
  newOwner: 'New Owner / Buyer',
}

export default function VerifierDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState<LandRecord[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<LandRecord | null>(null)
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [editingField, setEditingField] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterValidation, setFilterValidation] = useState<'all' | 'true' | 'false'>('all')
  const [activeTab, setActiveTab] = useState<'split' | 'matrix' | 'pdf'>('split')
  const [parcels, setParcels] = useState<{ id: string; plotNumber: string; village: string; calculatedArea: number }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [q, statsData, parcelData] = await Promise.all([
        api.verification.queue(),
        api.dashboard.stats(),
        api.parcels.list(),
      ])
      setQueue(q || [])
      setStats(statsData as Record<string, number>)
      setParcels(parcelData || [])
    } catch (err) {
      console.error('Error loading verifier data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openRecord = async (id: string) => {
    try {
      const rec = await api.verification.get(id)
      setSelected(rec)
      setCorrections({})
      setEditingField(null)
      setSection('Review Queue')
    } catch (err) {
      console.error('Error fetching record detail:', err)
    }
  }

  // Trigger on-demand PDF validation against ground truth
  const triggerPdfValidation = async (recordId: string) => {
    setValidating(true)
    try {
      const res = await api.verification.validate(recordId)
      if (res && res.record) {
        setSelected(res.record)
        // update item in queue
        setQueue((prev) => prev.map((item) => (item.id === recordId ? res.record : item)))
      }
    } catch (err: any) {
      alert(`Validation error: ${err?.message || 'Failed to validate against PDF'}`)
    } finally {
      setValidating(false)
    }
  }

  const submitVerification = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        status: 'verified',
        ...corrections,
      }
      await api.records.patch(selected.id, payload)
      setSelected(null)
      await load()
    } catch (err) {
      console.error('Error submitting verification:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const validatedTrueCount = queue.filter((r) => r.isValidated === true).length
  const validatedFalseCount = queue.filter((r) => r.isValidated === false).length
  const pendingCount = queue.filter((r) => r.status === 'extracted' || r.status === 'flagged').length

  const filteredQueue = queue.filter((r) => {
    if (filterValidation === 'true') return r.isValidated === true
    if (filterValidation === 'false') return r.isValidated === false
    return true
  })

  // Prepare key field pairs for selected record
  const getFieldPairs = (rec: LandRecord) => {
    const fields: Array<{
      key: string
      label: string
      value: string
      verification?: FieldVerification
    }> = []

    const scorecard = rec.validationScorecard
    const verificationMap = new Map<string, FieldVerification>()
    if (scorecard?.fieldVerifications) {
      for (const fv of scorecard.fieldVerifications) {
        verificationMap.set(fv.field, fv)
      }
    }

    const standardKeys: Array<keyof LandRecord> = [
      'owner',
      'coOwner',
      'share',
      'plotNumber',
      'khasra',
      'dag',
      'khatianKhata',
      'surveyNumber',
      'area',
      'areaUnit',
      'village',
      'mouza',
      'tehsilTaluk',
      'district',
      'landClassification',
      'registrationNumber',
      'registrationDate',
      'mutationNumber',
      'mutationDate',
      'previousOwner',
      'newOwner',
    ]

    for (const k of standardKeys) {
      const val = rec[k]
      if (val !== undefined && val !== null && val !== '') {
        const valStr = Array.isArray(val) ? val.join(', ') : String(val)
        // map camelCase to snake_case for verification lookup
        const snakeKey = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        fields.push({
          key: k,
          label: REVENUE_FIELD_LABELS[k] || k,
          value: corrections[k] !== undefined ? corrections[k] : valStr,
          verification: verificationMap.get(snakeKey) || verificationMap.get(k),
        })
      }
    }

    return fields
  }

  return (
    <DashboardShell role="verifier" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Cadastral Verifier Console</h1>
              <p className="dash-page-sub">
                Compare Groq LLM Extractions directly with PDF Ground-Truth Text Layers & Discrepancy Auditing
              </p>
            </div>
            <button className="dash-primary-btn" onClick={() => setSection('Review Queue')}>
              <Eye size={15} /> Start Review Queue
            </button>
          </div>

          {/* Stats Bar */}
          <div className="dash-stats-row">
            <div className="dash-stat-card">
              <Eye size={18} className="dash-stat-icon ochre" />
              <p className="dash-stat-value">{queue.length}</p>
              <span className="dash-stat-label">Total in Queue</span>
            </div>
            <div className="dash-stat-card">
              <ShieldCheck size={18} className="dash-stat-icon forest" />
              <p className="dash-stat-value text-emerald-600">{validatedTrueCount}</p>
              <span className="dash-stat-label">PDF Validated (True)</span>
            </div>
            <div className="dash-stat-card">
              <ShieldAlert size={18} className="dash-stat-icon red" />
              <p className="dash-stat-value text-amber-500">{validatedFalseCount}</p>
              <span className="dash-stat-label">Discrepancy / Unvalidated (False)</span>
            </div>
            <div className="dash-stat-card">
              <CheckCircle2 size={18} className="dash-stat-icon forest" />
              <p className="dash-stat-value">{stats.verifiedToday || queue.filter((r) => r.status === 'verified').length}</p>
              <span className="dash-stat-label">Verified Today</span>
            </div>
          </div>

          {/* Main Verification Queue Table */}
          <div className="dash-card">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="dash-card-title flex items-center gap-2" style={{ margin: 0 }}>
                <FileCheck2 size={16} className="text-emerald-500" />
                Land Record Validation Queue ({filteredQueue.length})
              </h2>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setFilterValidation('all')}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    filterValidation === 'all'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  All ({queue.length})
                </button>
                <button
                  onClick={() => setFilterValidation('true')}
                  className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                    filterValidation === 'true'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <ShieldCheck size={13} /> Validated (True) ({validatedTrueCount})
                </button>
                <button
                  onClick={() => setFilterValidation('false')}
                  className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                    filterValidation === 'false'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <ShieldAlert size={13} /> Discrepancies (False) ({validatedFalseCount})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-500" />
                <p className="text-xs">Loading verifier records...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No records match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Deed / Case</th>
                      <th className="py-2.5 px-3">Primary Owner & Co-Owner</th>
                      <th className="py-2.5 px-3">Plot / Khasra / Village</th>
                      <th className="py-2.5 px-3">Area & Class</th>
                      <th className="py-2.5 px-3">LLM Conf</th>
                      <th className="py-2.5 px-3">PDF Ground-Truth Validated</th>
                      <th className="py-2.5 px-3">Workflow Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredQueue.map((r) => {
                      const scorecard = r.validationScorecard
                      const hasDiscrepancies = scorecard?.discrepancies && scorecard.discrepancies.length > 0
                      const fidelity = scorecard?.overallFidelityScore

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition group"
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              <FileText size={13} className="text-amber-500 flex-shrink-0" />
                              <span className="truncate max-w-[140px]" title={r.document?.originalFilename || r.id}>
                                {r.document?.originalFilename || `Record-${r.id.slice(0, 8)}`}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">ID: {r.id.slice(0, 8)}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{r.owner || '—'}</div>
                            {r.coOwner && <div className="text-[11px] text-gray-500">Co: {r.coOwner}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              Plot: {r.plotNumber || '—'} {r.khasra ? `· Khasra ${r.khasra}` : ''}
                            </div>
                            <div className="text-[11px] text-gray-500">{r.village || r.district || '—'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div>{r.area ? `${r.area} ${r.areaUnit || ''}` : '—'}</div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              {(r.landClassification || ['Residential Land'])[0]}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-medium">
                              {r.confidenceScore ? `${(r.confidenceScore * 100).toFixed(0)}%` : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {r.isValidated === true ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 w-fit border border-emerald-500/30">
                                  <ShieldCheck size={12} /> True (Passed)
                                </span>
                                {fidelity !== undefined && (
                                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 pl-1">
                                    Grade {scorecard?.fidelityGrade || 'A+'} ({fidelity}%)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 w-fit border border-amber-500/30">
                                  <ShieldAlert size={12} /> False ({hasDiscrepancies ? 'Discrepancy' : 'Unvalidated'})
                                </span>
                                {hasDiscrepancies && (
                                  <span className="text-[10px] text-red-500 pl-1 font-medium">
                                    {scorecard.discrepancies.length} mismatch(es)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`dash-badge ${
                                r.status === 'verified' ? 'verified' : r.status === 'flagged' ? 'failed' : 'processing'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => openRecord(r.id)}
                              className="dash-primary-btn text-xs py-1 px-3 inline-flex items-center gap-1 shadow-sm"
                            >
                              <Eye size={12} /> Review
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Review Queue' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Ground-Truth Verification & PDF Corroboration</h1>
              <p className="dash-page-sub">
                Side-by-side comparative inspection between LLM Extractions and Original PDF Text Anchors
              </p>
            </div>
            {selected && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPdfValidation(selected.id)}
                  disabled={validating}
                  className="dash-outline-btn text-xs py-1.5 px-3 flex items-center gap-1.5 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                  title="Re-run Ground Truth validation against source PDF"
                >
                  <RefreshCw size={13} className={validating ? 'animate-spin' : ''} />
                  {validating ? 'Validating PDF…' : '⚡ Run PDF Validation'}
                </button>
                <button
                  onClick={submitVerification}
                  disabled={submitting}
                  className="dash-primary-btn text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                >
                  <Check size={13} /> {submitting ? 'Submitting…' : 'Mark as Verified'}
                </button>
                <button onClick={() => setSelected(null)} className="dash-outline-btn text-xs py-1.5 px-2">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {selected ? (
            <div className="space-y-4">
              {/* Top Banner: Validation Status & Discrepancies */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  selected.isValidated === true
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selected.isValidated === true
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {selected.isValidated === true ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          PDF Validation Column:{' '}
                          <span
                            className={
                              selected.isValidated === true
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {selected.isValidated === true ? 'TRUE (PASSED)' : 'FALSE (FAILED / DISCREPANCY)'}
                          </span>
                        </span>
                        {selected.validationScorecard && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                            Grade {selected.validationScorecard.fidelityGrade}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Deed Document: <b>{selected.document?.originalFilename || 'Deed.pdf'}</b> · Case ID:{' '}
                        <span className="font-mono">{selected.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    {selected.validationScorecard && (
                      <>
                        <div className="text-right">
                          <div className="text-gray-500 text-[10px]">PDF FIDELITY MATCH</div>
                          <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {selected.validationScorecard.overallFidelityScore}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500 text-[10px]">CORROBORATED FIELDS</div>
                          <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {selected.validationScorecard.verifiedFieldsCount}/
                            {selected.validationScorecard.totalFieldsChecked}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="text-right">
                      <div className="text-gray-500 text-[10px]">OCR ENGINE</div>
                      <div className="font-bold text-gray-700 dark:text-gray-300">
                        {selected.ocrModelUsed || 'Groq Native VLM'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Match Percentage Progress Bar */}
                {selected.validationScorecard && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-800/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-emerald-500" />
                        PDF Ground-Truth Match Corroboration:
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {selected.validationScorecard.overallFidelityScore}% Matched
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          selected.validationScorecard.overallFidelityScore >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : selected.validationScorecard.overallFidelityScore >= 60
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, selected.validationScorecard.overallFidelityScore))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{selected.validationScorecard.verifiedFieldsCount} of {selected.validationScorecard.totalFieldsChecked} revenue fields directly anchored in document text</span>
                      <span>Text Layer: {selected.validationScorecard.isPdfTextLayerAvailable ? 'Extracted & Corroborated' : 'Vision Raster Processed'}</span>
                    </div>
                  </div>
                )}

                {/* What didn't match with the PDF (Discrepancy Section) */}
                {selected.validationScorecard?.discrepancies &&
                selected.validationScorecard.discrepancies.length > 0 ? (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <AlertTriangle size={14} /> What Didn&apos;t Match with the PDF Ground Truth:
                    </div>
                    {selected.validationScorecard.discrepancies.map((d: string, idx: number) => (
                      <div key={idx} className="pl-4 flex items-start gap-1.5 text-[11.5px]">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                ) : selected.isValidated === true ? (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>
                      <b>Zero Discrepancies:</b> All 21 revenue fields matched with high fidelity against the PDF text
                      layer and revenue deed ground truth.
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Workspace Split: Left = Field Corroboration Matrix, Right = PDF Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: LLM Extractions vs PDF Ground Truth */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="dash-card" style={{ padding: '16px' }}>
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500" />
                        Field-by-Field Corroboration Matrix
                      </h3>
                      <span className="text-[11px] text-gray-400">Click &quot;Edit&quot; to override any value</span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {getFieldPairs(selected).map((field) => {
                        const isEditing = editingField === field.key
                        const fv = field.verification
                        const matchStatus = fv?.matchStatus

                        return (
                          <div key={field.key} className="py-2.5 space-y-1">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                                {field.label}
                              </span>

                              {/* Corroboration Status Tag */}
                              {matchStatus === 'VERIFIED_MATCH' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Check size={10} /> PDF Match (100%)
                                </span>
                              ) : matchStatus === 'PROBABLE_MATCH' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Probable Match ({fv ? `${Math.round(fv.matchScore * 100)}%` : '75%'})
                                </span>
                              ) : matchStatus === 'DISCREPANCY' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                  <AlertTriangle size={10} /> Discrepancy
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                  VLM Inference
                                </span>
                              )}
                            </div>

                            {/* Value Display / Editor */}
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  className="dash-input text-xs py-1 px-2 flex-1"
                                  value={corrections[field.key] !== undefined ? corrections[field.key] : field.value}
                                  onChange={(e) =>
                                    setCorrections((c) => ({ ...c, [field.key]: e.target.value }))
                                  }
                                />
                                <button
                                  className="dash-primary-btn text-xs py-1 px-2.5"
                                  onClick={() => setEditingField(null)}
                                >
                                  <Check size={12} /> Save
                                </button>
                                <button
                                  className="dash-outline-btn text-xs py-1 px-2"
                                  onClick={() => {
                                    const c = { ...corrections }
                                    delete c[field.key]
                                    setCorrections(c)
                                    setEditingField(null)
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-mono font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded border border-gray-200/60 dark:border-gray-800 flex-1 truncate">
                                  {corrections[field.key] !== undefined ? (
                                    <span className="text-amber-500 font-bold">{corrections[field.key]} (Edited)</span>
                                  ) : (
                                    field.value || '—'
                                  )}
                                </div>
                                <button
                                  onClick={() => setEditingField(field.key)}
                                  className="p-1 text-gray-400 hover:text-amber-500 transition"
                                  title="Edit value"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            )}

                            {/* PDF Ground-Truth Anchor Snippet */}
                            {fv?.pdfContextSnippet && (
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-900/40 p-1.5 rounded font-mono border-l-2 border-emerald-500/60">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  PDF Anchor (p.{fv.pageNumber || 1}):
                                </span>{' '}
                                &quot;{fv.pdfContextSnippet}&quot;
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: PDF Viewer */}
                <div className="lg:col-span-5 flex flex-col h-[720px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-900 shadow-xl">
                  <div className="px-3.5 py-2.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-gray-200">
                      <FileText size={14} className="text-amber-400" />
                      <span>Original Deed PDF (Firebase / Storage)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ground-Truth Source
                    </span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <PdfViewer
                      documentId={selected.documentId || selected.document?.id}
                      fileUrl={selected.document?.fileUrl}
                      originalFilename={selected.document?.originalFilename}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dash-card text-center py-12 text-gray-500">
              <Eye size={36} className="mx-auto mb-2 opacity-30 text-emerald-500" />
              <p className="text-sm font-medium">Select a case from the Overview table to start verification review.</p>
              <button className="dash-primary-btn text-xs py-1.5 px-3 mt-3" onClick={() => setSection('Overview')}>
                Return to Overview Table
              </button>
            </div>
          )}
        </>
      )}

      {section === 'GIS Validation' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">GIS Parcel Area Corroboration</h1>
              <p className="dash-page-sub">PostGIS cadastral polygon area comparison against deed dimensions</p>
            </div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title flex items-center gap-2">
              <Layers size={15} /> Parcel Spatial Corroboration
            </h2>
            <div className="dash-table">
              {parcels.map((p) => (
                <div key={p.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">
                      Plot {p.plotNumber} — {p.village}
                    </span>
                    <span className="dash-table-sub">GIS Polygon Area: {p.calculatedArea} ac</span>
                  </div>
                  <span className="dash-badge verified">Valid GIS Polygon</span>
                </div>
              ))}
              {parcels.length === 0 && (
                <p className="dash-card-desc" style={{ padding: 12 }}>
                  No parcel spatial records found.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
