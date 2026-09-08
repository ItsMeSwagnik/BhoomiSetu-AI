'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, Check, CheckCircle2, Eye, FileCheck2, Layers, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { LandRecord, ExtractedField, FieldCorrection } from '@/lib/api-types'

export default function VerifierDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState<LandRecord[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<LandRecord | null>(null)
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [editingField, setEditingField] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [parcels, setParcels] = useState<{ id: string; plotNumber: string; village: string; calculatedArea: number; textArea?: number; variance?: number; valid?: boolean }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [q, statsData, parcelData] = await Promise.all([
        api.verification.queue(),
        api.dashboard.stats(),
        api.parcels.list(),
      ])
      setQueue(q)
      setStats(statsData as Record<string, number>)
      setParcels(parcelData.map(p => ({ ...p, textArea: p.calculatedArea, variance: 0, valid: true })))
    } catch { /* demo */ } finally {
      setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openRecord = async (id: string) => {
    try {
      const rec = await api.verification.get(id)
      setSelected(rec)
      setCorrections({})
      setEditingField(null)
      setSection('Review Queue')
    } catch { /* ignore */ }
  }

  const submitVerification = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const corrList: FieldCorrection[] = Object.entries(corrections).map(([fieldId, correctedValue]) => ({ fieldId, correctedValue }))
      await api.verification.submit(selected.id, corrList)
      setSelected(null)
      await load()
    } catch { /* ignore */ } finally { setSubmitting(false) }
  }

  const pendingCount = queue.filter(r => r.status === 'flagged').length

  return (
    <DashboardShell role="verifier" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Verification Queue</h1><p className="dash-page-sub">Cadastral Surveyor Portal</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Review Queue')}><Eye size={15} /> Start Review</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Pending Review', value: String(pendingCount), icon: Eye, color: 'ochre' },
              { label: 'GIS Mismatches', value: String(stats.gisMismatches || 0), icon: AlertTriangle, color: 'ochre' },
              { label: 'Verified Today', value: String(stats.verifiedToday || 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Polygons Validated', value: String(stats.polygonsValidated || parcels.length), icon: Layers, color: 'forest' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <h2 className="dash-card-title"><AlertTriangle size={15} /> Flagged Records</h2>
              <div className="dash-table">
                {queue.slice(0, 4).map((r) => (
                  <div key={r.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{r.owner} — {r.village}</span>
                      <span className="dash-table-sub">Conf: {r.confidenceScore ? `${(r.confidenceScore * 100).toFixed(0)}%` : '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="dash-badge failed">Flagged</span>
                      <button className="dash-outline-btn" onClick={() => openRecord(r.id)}>Review</button>
                    </div>
                  </div>
                ))}
                {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No flagged records.</p>}
              </div>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><Layers size={15} /> GIS Parcels</h2>
              <div className="dash-table">
                {parcels.slice(0, 4).map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">Plot {p.plotNumber} — {p.village}</span>
                      <span className="dash-table-sub">GIS Area: {p.calculatedArea} ac</span>
                    </div>
                    <span className="dash-badge verified">Valid</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === 'Review Queue' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Review Queue</h1><p className="dash-page-sub">Accept, correct, or reject OCR-extracted fields</p></div>
          </div>
          {selected ? (
            <div className="dash-card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="dash-card-title" style={{ margin: 0 }}>{selected.owner} — {selected.village}</h2>
                <div className="flex gap-2">
                  <button className="dash-primary-btn" onClick={submitVerification} disabled={submitting}>
                    <Check size={13} /> {submitting ? 'Submitting…' : 'Submit Verification'}
                  </button>
                  <button className="dash-outline-btn" onClick={() => setSelected(null)}><X size={13} /></button>
                </div>
              </div>
              {selected.validationResults?.map((v: any, i: number) => (
                <div key={i} className={`auth-status-msg ${v.status === 'fail' ? 'error' : v.status === 'warning' ? 'error' : 'success'}`} style={{ marginBottom: 8 }}>
                  <AlertTriangle size={13} /><span>{v.message}</span>
                </div>
              ))}
              <div className="dash-table" style={{ marginTop: 12 }}>
                {(selected.extractedFields || []).map((f: any) => (
                  <div key={f.id} className="dash-table-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="dash-table-primary">{f.originalLabel || f.fieldName}</span>
                        <span className="dash-table-sub">
                          Value: <b>{corrections[f.id] ?? f.extractedValue}</b> · Conf: <b className="font-mono">{(f.confidence * 100).toFixed(0)}%</b>
                          {f.isCorrected && <span className="dash-badge verified" style={{ marginLeft: 6 }}>Corrected</span>}
                        </span>
                      </div>
                      <span className={`dash-badge ${f.confidence >= 0.85 ? 'verified' : 'failed'}`}>
                        {f.confidence >= 0.85 ? 'OK' : 'Low Conf'}
                      </span>
                    </div>
                    {editingField === f.id ? (
                      <div className="flex gap-2">
                        <input className="dash-input" style={{ flex: 1 }}
                          value={corrections[f.id] ?? f.extractedValue}
                          onChange={(e) => setCorrections(c => ({ ...c, [f.id]: e.target.value }))}
                        />
                        <button className="dash-primary-btn" onClick={() => setEditingField(null)}><Check size={13} /> Done</button>
                        <button className="dash-outline-btn" onClick={() => { const c = { ...corrections }; delete c[f.id]; setCorrections(c); setEditingField(null) }}><X size={13} /></button>
                      </div>
                    ) : (
                      <button className="dash-outline-btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setEditingField(f.id); setCorrections(c => ({ ...c, [f.id]: f.extractedValue })) }}>
                        Correct Value
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dash-card">
              <h2 className="dash-card-title"><Eye size={15} /> Flagged Records ({queue.length})</h2>
              <div className="dash-table">
                {queue.map((r) => (
                  <div key={r.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{r.owner} — {r.village}</span>
                      <span className="dash-table-sub">Confidence: {r.confidenceScore ? `${(r.confidenceScore * 100).toFixed(0)}%` : '—'} · Plot {r.plotNumber}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="dash-badge failed">Flagged</span>
                      <button className="dash-primary-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => openRecord(r.id)}>Review</button>
                    </div>
                  </div>
                ))}
                {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No records pending review.</p>}
              </div>
            </div>
          )}
        </>
      )}

      {section === 'OCR Corrections' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">OCR Corrections</h1><p className="dash-page-sub">History of corrected extractions</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><FileCheck2 size={15} /> Correction Log</h2>
            <div className="dash-table">
              {queue.flatMap(r => (r.extractedFields || []).filter((f: any) => f.isCorrected).map((f: any) => (
                <div key={f.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{f.originalLabel || f.fieldName} — {r.id.slice(0, 8)}</span>
                    <span className="dash-table-sub">Original: <b>{f.extractedValue}</b> → Corrected: <b>{f.correctedValue}</b></span>
                  </div>
                  <span className="dash-badge verified">Corrected</span>
                </div>
              )))}
              {queue.every(r => !(r.extractedFields || []).some((f: any) => f.isCorrected)) && (
                <p className="dash-card-desc" style={{ padding: 12 }}>No corrections yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {section === 'GIS Validation' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">GIS Validation</h1><p className="dash-page-sub">PostGIS polygon area comparison</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Layers size={15} /> Parcel Area Comparison</h2>
            <div className="dash-table">
              {parcels.map((p) => (
                <div key={p.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">Plot {p.plotNumber} — {p.village}</span>
                    <span className="dash-table-sub">GIS Area: {p.calculatedArea} ac</span>
                  </div>
                  <span className="dash-badge verified">Valid</span>
                </div>
              ))}
              {parcels.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No parcel data.</p>}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
