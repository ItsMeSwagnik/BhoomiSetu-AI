'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, FileCheck2, Map, MapPin, UserCheck } from 'lucide-react'
import { api, LandRecord, Parcel } from '@/lib/api'

export default function OfficerDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState<LandRecord[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [selectedParcel, setSelectedParcel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [q, statsData, parcelData] = await Promise.all([
        api.approval.queue(),
        api.dashboard.stats(),
        api.parcels.list(),
      ])
      setQueue(q)
      setStats(statsData as Record<string, number>)
      setParcels(parcelData)
      if (parcelData.length > 0) setSelectedParcel(parcelData[0].id)
    } catch { /* demo */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id: string) => {
    try {
      await api.approval.approve(id, 'Approved by officer')
      setActionMsg(m => ({ ...m, [id]: 'approved' }))
      await load()
    } catch { setActionMsg(m => ({ ...m, [id]: 'error' })) }
  }

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.approval.reject(id, reason)
      setActionMsg(m => ({ ...m, [id]: 'rejected' }))
      await load()
    } catch { setActionMsg(m => ({ ...m, [id]: 'error' })) }
  }

  const selected = parcels.find(p => p.id === selectedParcel)

  // Build SVG parcel positions for the first 4 parcels
  const svgPositions = [
    { points: '40,30 150,35 130,120 30,110', cx: 85, cy: 75 },
    { points: '150,35 310,40 280,130 130,120', cx: 215, cy: 80 },
    { points: '130,120 280,130 265,245 110,230', cx: 195, cy: 180 },
    { points: '30,110 130,120 110,230 20,215', cx: 70, cy: 165 },
  ]

  return (
    <DashboardShell role="officer" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Adjudication Workspace</h1><p className="dash-page-sub">Revenue Officer Portal</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Cadastral Map')}><Map size={15} /> Cadastral Map</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Pending Adjudication', value: String(stats.pendingAdjudication ?? queue.length), icon: AlertTriangle, color: 'ochre' },
              { label: 'Adjudicated', value: String(stats.adjudicated ?? 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Records Published', value: String(stats.recordsPublished ?? 0), icon: FileCheck2, color: 'forest' },
              { label: 'Escalated', value: String(stats.escalated ?? 0), icon: UserCheck, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><AlertTriangle size={15} /> Pending Approval</h2>
            {loading ? <p className="dash-card-desc" style={{ padding: 12 }}>Loading…</p> : (
              <div className="dash-table">
                {queue.slice(0, 4).map((rec) => (
                  <div key={rec.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{rec.owner} — {rec.village}</span>
                      <span className="dash-table-sub">Plot {rec.plotNumber} · Conf: {rec.confidenceScore ? `${(rec.confidenceScore * 100).toFixed(0)}%` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="dash-badge pending">Pending</span>
                      <button className="dash-primary-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setSection('Adjudication')}>Review</button>
                    </div>
                  </div>
                ))}
                {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No records pending approval.</p>}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Adjudication' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Adjudication</h1><p className="dash-page-sub">Approve or reject verified records</p></div>
          </div>
          <div className="dash-table" style={{ gap: 12 }}>
            {queue.map((rec) => (
              <div key={rec.id} className="dash-card" style={{ padding: '18px 22px' }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <span className="dash-table-primary" style={{ fontSize: '14px' }}>{rec.owner} — {rec.village}</span>
                    <span className="dash-table-sub">Plot {rec.plotNumber} · {rec.district} · Conf: {rec.confidenceScore ? `${(rec.confidenceScore * 100).toFixed(0)}%` : '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    {actionMsg[rec.id] === 'approved' && <span className="dash-badge verified">Approved ✓</span>}
                    {actionMsg[rec.id] === 'rejected' && <span className="dash-badge failed">Rejected</span>}
                  </div>
                </div>
                <div className="dash-table" style={{ marginBottom: 12 }}>
                  {[
                    ['Owner', rec.owner], ['Plot', rec.plotNumber], ['Area', `${rec.area} ${rec.areaUnit}`],
                    ['Village', rec.village], ['District', rec.district], ['Classification', rec.landClassification],
                    ...(rec.previousOwner ? [['Previous Owner', rec.previousOwner]] : []),
                    ...(rec.mutationNumber ? [['Mutation No.', rec.mutationNumber]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="dash-table-row">
                      <span className="dash-table-sub">{k}</span>
                      <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
                {rec.validationResults && rec.validationResults.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {rec.validationResults.map((v, i) => (
                      <div key={i} className={`auth-status-msg ${v.status === 'fail' ? 'error' : v.status === 'warning' ? 'error' : 'success'}`} style={{ marginBottom: 4 }}>
                        <AlertTriangle size={12} /><span style={{ fontSize: 11 }}>{v.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!actionMsg[rec.id] && (
                  <div className="flex gap-2 flex-wrap">
                    <button className="dash-primary-btn" onClick={() => approve(rec.id)}><CheckCircle2 size={13} /> Approve & Publish</button>
                    <button className="dash-outline-btn" onClick={() => reject(rec.id)}>Reject</button>
                  </div>
                )}
              </div>
            ))}
            {queue.length === 0 && !loading && (
              <div className="dash-card"><p className="dash-card-desc" style={{ padding: 12 }}>No records pending adjudication.</p></div>
            )}
          </div>
        </>
      )}

      {section === 'Flagged Records' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Flagged Records</h1><p className="dash-page-sub">All records pending approval</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><AlertTriangle size={15} /> All Pending ({queue.length})</h2>
            <div className="dash-table">
              {queue.map((rec) => (
                <div key={rec.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{rec.owner} — {rec.village}</span>
                    <span className="dash-table-sub">Plot {rec.plotNumber} · Conf: {rec.confidenceScore ? `${(rec.confidenceScore * 100).toFixed(0)}%` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="dash-badge pending">Pending</span>
                    {!actionMsg[rec.id] && (
                      <button className="dash-primary-btn" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => approve(rec.id)}>Approve</button>
                    )}
                    {actionMsg[rec.id] === 'approved' && <span className="dash-badge verified">Done ✓</span>}
                  </div>
                </div>
              ))}
              {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No flagged records.</p>}
            </div>
          </div>
        </>
      )}

      {section === 'Cadastral Map' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Cadastral Map</h1><p className="dash-page-sub">GIS Parcel Overview</p></div>
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <h2 className="dash-card-title"><Map size={15} /> Parcel Map</h2>
              <div style={{ background: '#0d1712', borderRadius: 16, padding: 16, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 340 280" style={{ width: '100%', maxWidth: 320 }}>
                  {parcels.slice(0, 4).map((p, i) => {
                    const pos = svgPositions[i]
                    if (!pos) return null
                    const isSelected = selectedParcel === p.id
                    return (
                      <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedParcel(p.id)}>
                        <polygon points={pos.points}
                          fill={isSelected ? 'rgba(190,123,66,0.55)' : 'rgba(50,77,58,0.4)'}
                          stroke={isSelected ? '#e0a062' : '#ffffff40'} strokeWidth={isSelected ? 3 : 1.5} />
                        <text x={pos.cx} y={pos.cy} fill={isSelected ? '#fff' : '#e6eee7'} fontSize="11" fontWeight={isSelected ? 'bold' : 'normal'} textAnchor="middle">Plot {p.plotNumber}</text>
                        <text x={pos.cx} y={pos.cy + 13} fill={isSelected ? '#fde68a' : '#aeb9ae'} fontSize="8" textAnchor="middle" fontFamily="monospace">{p.calculatedArea} ac</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>Click any plot to inspect</p>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><MapPin size={15} /> {selected ? `Plot ${selected.plotNumber}` : 'Select a parcel'}</h2>
              {selected && (
                <div className="dash-table">
                  {[
                    ['Parcel Code', selected.parcelCode],
                    ['Village', selected.village],
                    ['District', selected.district],
                    ['GIS Area', `${selected.calculatedArea} ac`],
                  ].map(([k, v]) => (
                    <div key={k} className="dash-table-row">
                      <span className="dash-table-sub">{k}</span>
                      <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
