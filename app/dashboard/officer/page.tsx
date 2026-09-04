'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, FileCheck2, Map, MapPin, UserCheck } from 'lucide-react'

const initialFlagged = [
  { id: 'REC-1042', owner: 'Rajesh Kumar', issue: 'Area Variance +5.3%', severity: 'high', village: 'Rampur', field: 'Recorded Area', old: '2.45 ac', suggested: '2.58 ac' },
  { id: 'REC-1055', owner: 'Savitri Devi', issue: 'Ownership Share 110%', severity: 'high', village: 'Patna', field: 'Co-owner Shares', old: '110%', suggested: '100%' },
  { id: 'REC-1061', owner: 'Ramphal Yadav', issue: 'Broken Title Chain', severity: 'medium', village: 'Gaya', field: 'Title Lineage', old: 'Missing 2019 link', suggested: 'Verify with Registration Dept.' },
]

const parcels = [
  { id: 'P100', plot: '100', owner: 'Maheshwar Prasad', area: '1.84 ac', village: 'Rampur', status: 'valid' },
  { id: 'P101', plot: '101', owner: 'Kusum Devi', area: '3.12 ac', village: 'Rampur', status: 'valid' },
  { id: 'P102', plot: '102', owner: 'Rajesh Kumar', area: '2.58 ac', village: 'Rampur', status: 'flagged' },
  { id: 'P103', plot: '103', owner: 'Ramphal Yadav', area: '1.39 ac', village: 'Rampur', status: 'valid' },
]

export default function OfficerDashboard() {
  const [section, setSection] = useState('Overview')
  const [flagged, setFlagged] = useState(initialFlagged)
  const [adjudicated, setAdjudicated] = useState<string[]>([])
  const [signed, setSigned] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState('P102')

  const adjudicate = (id: string) => setAdjudicated((p) => [...p, id])

  return (
    <DashboardShell role="officer" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Adjudication Workspace</h1><p className="dash-page-sub">Revenue Officer Portal — Vikramaditya Sen (Tehsildar)</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Cadastral Map')}><Map size={15} /> Cadastral Map</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Pending Adjudication', value: String(flagged.length - adjudicated.length), icon: AlertTriangle, color: 'ochre' },
              { label: 'Adjudicated', value: String(adjudicated.length), icon: CheckCircle2, color: 'forest' },
              { label: 'Records Published', value: signed ? '32' : '31', icon: FileCheck2, color: 'forest' },
              { label: 'Escalated', value: '1', icon: UserCheck, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><AlertTriangle size={15} /> Flagged Records</h2>
            <div className="dash-table">
              {flagged.slice(0, 3).map((rec) => (
                <div key={rec.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{rec.owner} — {rec.village}</span>
                    <span className="dash-table-sub">{rec.id} · {rec.issue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${rec.severity === 'high' ? 'failed' : 'pending'}`}>{rec.severity}</span>
                    {adjudicated.includes(rec.id)
                      ? <span className="dash-badge verified">Approved ✓</span>
                      : <button className="dash-primary-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => adjudicate(rec.id)}>Adjudicate</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'Adjudication' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Adjudication</h1><p className="dash-page-sub">Review and resolve flagged anomalies</p></div>
          </div>
          <div className="dash-table" style={{ gap: 12 }}>
            {flagged.map((rec) => (
              <div key={rec.id} className="dash-card" style={{ padding: '18px 22px' }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <span className="dash-table-primary" style={{ fontSize: '14px' }}>{rec.owner} — {rec.village}</span>
                    <span className="dash-table-sub">{rec.id} · {rec.issue}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`dash-badge ${rec.severity === 'high' ? 'failed' : 'pending'}`}>{rec.severity}</span>
                    {adjudicated.includes(rec.id) && <span className="dash-badge verified">Adjudicated ✓</span>}
                  </div>
                </div>
                <div className="dash-table" style={{ marginBottom: 12 }}>
                  {[['Field', rec.field], ['Current Value', rec.old], ['Suggested Correction', rec.suggested]].map(([k, v]) => (
                    <div key={k} className="dash-table-row">
                      <span className="dash-table-sub">{k}</span>
                      <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
                {!adjudicated.includes(rec.id) && (
                  <div className="flex gap-2 flex-wrap">
                    <button className="dash-primary-btn" onClick={() => adjudicate(rec.id)}><CheckCircle2 size={13} /> Accept Correction & Adjudicate</button>
                    <button className="dash-outline-btn">Escalate</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {adjudicated.length > 0 && (
            <div className="dash-card dash-info-card">
              <h2 className="dash-card-title">Publish to LRMS</h2>
              <p className="dash-card-desc">{adjudicated.length} record(s) adjudicated and ready for official approval. Each approval is logged with officer ID, timestamp, and reason in the PostgreSQL audit trail.</p>
              <button className="dash-primary-btn" onClick={() => setSigned(true)}>
                {signed ? '✓ Records Approved & Published to LRMS' : `Approve & Publish ${adjudicated.length} Record(s)`}
              </button>
            </div>
          )}
        </>
      )}

      {section === 'Flagged Records' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Flagged Records</h1><p className="dash-page-sub">All anomalies requiring officer attention</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><AlertTriangle size={15} /> All Flagged ({flagged.length})</h2>
            <div className="dash-table">
              {flagged.map((rec) => (
                <div key={rec.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{rec.owner} — {rec.village}</span>
                    <span className="dash-table-sub">{rec.id} · {rec.issue} · Field: {rec.field}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${rec.severity === 'high' ? 'failed' : 'pending'}`}>{rec.severity}</span>
                    {adjudicated.includes(rec.id)
                      ? <span className="dash-badge verified">Done</span>
                      : <button className="dash-primary-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => adjudicate(rec.id)}>Adjudicate</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'Cadastral Map' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Cadastral Map</h1><p className="dash-page-sub">Rampur Village — Sheet #4</p></div>
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <h2 className="dash-card-title"><Map size={15} /> Parcel Map</h2>
              <div style={{ background: '#0d1712', borderRadius: 16, padding: 16, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 340 280" style={{ width: '100%', maxWidth: 320 }}>
                  {[
                    { id: 'P100', points: '40,30 150,35 130,120 30,110', cx: 85, cy: 75 },
                    { id: 'P101', points: '150,35 310,40 280,130 130,120', cx: 215, cy: 80 },
                    { id: 'P102', points: '130,120 280,130 265,245 110,230', cx: 195, cy: 180 },
                    { id: 'P103', points: '30,110 130,120 110,230 20,215', cx: 70, cy: 165 },
                  ].map((p) => {
                    const parcel = parcels.find((x) => x.id === p.id)!
                    const isSelected = selectedParcel === p.id
                    return (
                      <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedParcel(p.id)}>
                        <polygon points={p.points}
                          fill={isSelected ? 'rgba(190,123,66,0.55)' : parcel.status === 'flagged' ? 'rgba(217,155,91,0.25)' : 'rgba(50,77,58,0.4)'}
                          stroke={isSelected ? '#e0a062' : '#ffffff40'} strokeWidth={isSelected ? 3 : 1.5} />
                        <text x={p.cx} y={p.cy} fill={isSelected ? '#fff' : '#e6eee7'} fontSize="11" fontWeight={isSelected ? 'bold' : 'normal'} textAnchor="middle">Plot {parcel.plot}</text>
                        <text x={p.cx} y={p.cy + 13} fill={isSelected ? '#fde68a' : '#aeb9ae'} fontSize="8" textAnchor="middle" fontFamily="monospace">{parcel.area}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>Click any plot to inspect</p>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><MapPin size={15} /> Selected: Plot {parcels.find((p) => p.id === selectedParcel)?.plot}</h2>
              {(() => {
                const p = parcels.find((x) => x.id === selectedParcel)!
                return (
                  <div className="dash-table">
                    {[['Owner', p.owner], ['Village', p.village], ['GIS Area', p.area], ['Status', p.status]].map(([k, v]) => (
                      <div key={k} className="dash-table-row">
                        <span className="dash-table-sub">{k}</span>
                        <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                      </div>
                    ))}
                    <div className="dash-table-row">
                      <span className="dash-table-sub">Anomaly</span>
                      <span className={`dash-badge ${p.status === 'flagged' ? 'failed' : 'verified'}`}>{p.status === 'flagged' ? 'Flagged' : 'Clear'}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
