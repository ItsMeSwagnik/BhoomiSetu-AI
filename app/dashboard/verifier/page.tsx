'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, Check, CheckCircle2, Eye, FileCheck2, Layers, X } from 'lucide-react'

const initialFlags = [
  { id: 'REC-1042', field: 'Recorded Area', ocr: '2.45 ac', gis: '2.58 ac', confidence: 63, flag: 'Area Variance', status: 'pending' },
  { id: 'REC-1043', field: 'Owner Name', ocr: 'Rajesh K.', gis: '—', confidence: 78, flag: 'Low Confidence', status: 'pending' },
  { id: 'REC-1044', field: 'Plot Number', ocr: '102', gis: '102', confidence: 96, flag: null, status: 'verified' },
  { id: 'REC-1045', field: 'Village Name', ocr: 'Rampurr', gis: '—', confidence: 71, flag: 'Spelling Error', status: 'pending' },
]

const parcels = [
  { id: 'P100', plot: '100', village: 'Rampur', textArea: 1.85, gisArea: 1.84, variance: 0.5, valid: true },
  { id: 'P101', plot: '101', village: 'Rampur', textArea: 3.10, gisArea: 3.12, variance: 0.6, valid: true },
  { id: 'P102', plot: '102', village: 'Rampur', textArea: 2.45, gisArea: 2.58, variance: 5.3, valid: false },
  { id: 'P103', plot: '103', village: 'Rampur', textArea: 1.40, gisArea: 1.39, variance: 0.7, valid: true },
]

export default function VerifierDashboard() {
  const [section, setSection] = useState('Overview')
  const [flags, setFlags] = useState(initialFlags)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const accept = (id: string) => setFlags((f) => f.map((r) => r.id === id ? { ...r, status: 'verified' } : r))
  const reject = (id: string) => setFlags((f) => f.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))
  const saveEdit = (id: string) => {
    setFlags((f) => f.map((r) => r.id === id ? { ...r, ocr: editValue, status: 'verified', confidence: 100 } : r))
    setEditId(null)
  }

  return (
    <DashboardShell role="verifier" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Verification Queue</h1><p className="dash-page-sub">Cadastral Surveyor Portal — Pooja Sharma</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Review Queue')}><Eye size={15} /> Start Review</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Pending Review', value: String(flags.filter((f) => f.status === 'pending').length), icon: Eye, color: 'ochre' },
              { label: 'GIS Mismatches', value: String(parcels.filter((p) => !p.valid).length), icon: AlertTriangle, color: 'ochre' },
              { label: 'Verified Today', value: String(flags.filter((f) => f.status === 'verified').length), icon: CheckCircle2, color: 'forest' },
              { label: 'Polygons Validated', value: String(parcels.length), icon: Layers, color: 'forest' },
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
              <h2 className="dash-card-title"><AlertTriangle size={15} /> Flagged Fields</h2>
              <div className="dash-table">
                {flags.filter((f) => f.status === 'pending').slice(0, 3).map((f) => (
                  <div key={f.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{f.field} — {f.id}</span>
                      <span className="dash-table-sub">OCR: {f.ocr} · {f.confidence}% conf.</span>
                    </div>
                    <span className="dash-badge failed">{f.flag}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><Layers size={15} /> GIS Mismatches</h2>
              <div className="dash-table">
                {parcels.filter((p) => !p.valid).map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">Plot {p.plot} — {p.village}</span>
                      <span className="dash-table-sub">Text: {p.textArea} ac · GIS: {p.gisArea} ac · Δ{p.variance}%</span>
                    </div>
                    <span className="dash-badge failed">+{p.variance}%</span>
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
          <div className="dash-card">
            <h2 className="dash-card-title"><Eye size={15} /> OCR Confidence Flags ({flags.length})</h2>
            <div className="dash-table">
              {flags.map((item) => (
                <div key={item.id} className="dash-table-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="dash-table-primary">{item.field} — {item.id}</span>
                      <span className="dash-table-sub">OCR: <b>{item.ocr}</b> · GIS: <b>{item.gis}</b> · Confidence: <b className="font-mono">{item.confidence}%</b></span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.flag && <span className="dash-badge failed">{item.flag}</span>}
                      <span className={`dash-badge ${item.status === 'verified' ? 'verified' : item.status === 'rejected' ? 'failed' : 'pending'}`}>{item.status}</span>
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    editId === item.id ? (
                      <div className="flex gap-2 flex-wrap">
                        <input className="dash-input" style={{ flex: 1, minWidth: 120 }} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                        <button className="dash-primary-btn" onClick={() => saveEdit(item.id)}><Check size={13} /> Save</button>
                        <button className="dash-outline-btn" onClick={() => setEditId(null)}><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button className="dash-primary-btn" onClick={() => accept(item.id)}><Check size={13} /> Accept</button>
                        <button className="dash-outline-btn" onClick={() => { setEditId(item.id); setEditValue(item.ocr) }}>Correct Value</button>
                        <button className="dash-outline-btn" onClick={() => reject(item.id)}><X size={13} /> Reject</button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
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
              {flags.filter((f) => f.status === 'verified' && f.confidence === 100).map((f) => (
                <div key={f.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{f.field} — {f.id}</span>
                    <span className="dash-table-sub">Corrected value: <b>{f.ocr}</b> · Confidence set to 100%</span>
                  </div>
                  <span className="dash-badge verified">Corrected</span>
                </div>
              ))}
              {flags.filter((f) => f.status === 'verified' && f.confidence === 100).length === 0 && (
                <p className="dash-card-desc" style={{ padding: '12px', textAlign: 'center' }}>No corrections made yet. Go to Review Queue to correct fields.</p>
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
                    <span className="dash-table-primary">Plot {p.plot} — {p.village}</span>
                    <span className="dash-table-sub">Text: {p.textArea} ac · GIS: {p.gisArea} ac · Variance: {p.variance}%</span>
                  </div>
                  <span className={`dash-badge ${p.valid ? 'verified' : 'failed'}`}>{p.valid ? 'Within Tolerance' : `+${p.variance}% ⚠`}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Validation Summary</h2>
            <div className="dash-progress-list">
              <div className="dash-progress-item">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Parcels within 5% tolerance</span>
                  <span className="font-mono">{parcels.filter((p) => p.valid).length}/{parcels.length}</span>
                </div>
                <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(parcels.filter((p) => p.valid).length / parcels.length) * 100}%` }} /></div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
