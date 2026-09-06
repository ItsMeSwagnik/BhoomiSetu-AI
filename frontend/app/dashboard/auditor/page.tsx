'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { BarChart3, CheckCircle2, Eye, Shield, ShieldCheck } from 'lucide-react'
import { api, AuditEntry } from '@/lib/api'

export default function AuditorDashboard() {
  const [section, setSection] = useState('Overview')
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [stats, setStats] = useState<Record<string, number | string>>({})
  const [districtData, setDistrictData] = useState<{ district: string; count: number }[]>([])
  const [filterType, setFilterType] = useState('All')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logs, statsData, districts] = await Promise.all([
        api.audit.trail(),
        api.dashboard.stats(),
        api.dashboard.districtProgress(),
      ])
      setAuditLog(logs)
      setStats(statsData)
      setDistrictData(districts)
    } catch { /* demo */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const actionTypes = ['All', ...Array.from(new Set(auditLog.map(e => e.action)))]
  const filtered = filterType === 'All' ? auditLog : auditLog.filter(e => e.action === filterType)

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      field_corrected: 'Correction', record_approved: 'Approval',
      record_rejected: 'Rejection', verification_submitted: 'Verification',
      user_created: 'User Created', escalated: 'Escalation',
    }
    return map[action] || action
  }

  return (
    <DashboardShell role="auditor" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Audit & Compliance</h1><p className="dash-page-sub">Vigilance Inspector Portal — Read-Only</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Reports')}><BarChart3 size={15} /> Reports</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Audit Entries', value: String(auditLog.length), icon: Shield, color: 'forest' },
              { label: 'Verified Records', value: String(stats.verifiedRecords ?? 0), icon: ShieldCheck, color: 'forest' },
              { label: 'Pending Verification', value: String(stats.pendingVerification ?? 0), icon: Eye, color: 'ochre' },
              { label: 'Avg Confidence', value: stats.averageConfidence ? `${stats.averageConfidence}%` : '—', icon: CheckCircle2, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Shield size={15} /> Recent Audit Entries</h2>
            {loading ? <p className="dash-card-desc" style={{ padding: 12 }}>Loading…</p> : (
              <div className="dash-table">
                {auditLog.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{entry.action.replace(/_/g, ' ')}{entry.fieldChanged ? ` — ${entry.fieldChanged}` : ''}</span>
                      <span className="dash-table-sub">{entry.userName || entry.userId.slice(0, 8)} · {entry.recordId ? entry.recordId.slice(0, 8) : 'system'} · {new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="dash-badge verified">{actionLabel(entry.action)}</span>
                  </div>
                ))}
                {auditLog.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No audit entries yet.</p>}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Audit Trails' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Audit Trails</h1><p className="dash-page-sub">PostgreSQL audit log — read-only</p></div>
          </div>
          <div className="dash-card dash-info-card" style={{ padding: '14px 20px' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Filter by action:</span>
              {actionTypes.slice(0, 7).map((t) => (
                <button key={t} className={filterType === t ? 'dash-primary-btn' : 'dash-outline-btn'} style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setFilterType(t)}>{t === 'All' ? 'All' : actionLabel(t)}</button>
              ))}
            </div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Shield size={15} /> Audit Log ({filtered.length})</h2>
            <div className="dash-table">
              {filtered.map((entry) => (
                <div key={entry.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">
                      {entry.action.replace(/_/g, ' ')}
                      {entry.fieldChanged ? ` — ${entry.fieldChanged}` : ''}
                      {entry.oldValue && entry.newValue ? `: ${entry.oldValue} → ${entry.newValue}` : ''}
                    </span>
                    <span className="dash-table-sub">
                      {entry.userName || entry.userId.slice(0, 8)} · {entry.recordId ? entry.recordId.slice(0, 8) : 'system'} · {new Date(entry.timestamp).toLocaleString()}
                      {entry.reason ? ` · Reason: ${entry.reason}` : ''}
                    </span>
                  </div>
                  <span className="dash-badge verified">{actionLabel(entry.action)}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No entries match this filter.</p>}
            </div>
          </div>
        </>
      )}

      {section === 'Compliance' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Compliance</h1><p className="dash-page-sub">DILRMP & LRMS compliance metrics</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><ShieldCheck size={15} /> Compliance Metrics</h2>
            <div className="dash-progress-list">
              {[
                { label: 'Records with Full Audit Trail', done: auditLog.length, total: Math.max(auditLog.length, 1) },
                { label: 'Verified Records', done: Number(stats.verifiedRecords ?? 0), total: Math.max(Number(stats.documentsProcessed ?? 1), 1) },
                { label: 'GIS Validations', done: Number(stats.gisDiscrepancies ?? 0) === 0 ? Number(stats.verifiedRecords ?? 0) : Number(stats.verifiedRecords ?? 0) - Number(stats.gisDiscrepancies ?? 0), total: Math.max(Number(stats.verifiedRecords ?? 1), 1) },
              ].map((d) => (
                <div key={d.label} className="dash-progress-item">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{d.label}</span>
                    <span className="font-mono">{d.total > 0 ? ((d.done / d.total) * 100).toFixed(1) : 100}%</span>
                  </div>
                  <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Inspection Notes</h2>
            <p className="dash-card-desc">Annotate findings for the CAG compliance report. No modifications to land records are permitted from this portal.</p>
            <textarea className="dash-input dash-textarea" placeholder="Add inspection note…" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="dash-primary-btn" style={{ marginTop: 10 }} onClick={() => { if (note.trim()) { setNotes(n => [note, ...n]); setNote('') } }}>Save Note</button>
            {notes.length > 0 && (
              <div className="dash-table" style={{ marginTop: 14 }}>
                {notes.map((n, i) => (
                  <div key={i} className="dash-table-row"><span className="dash-table-primary" style={{ fontSize: '12px' }}>{n}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Reports' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Reports</h1><p className="dash-page-sub">Operational summary</p></div>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Documents Processed', value: String(stats.documentsProcessed ?? 0), icon: BarChart3, color: 'forest' },
              { label: 'Verified Records', value: String(stats.verifiedRecords ?? 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Avg. Confidence', value: stats.averageConfidence ? `${stats.averageConfidence}%` : '—', icon: ShieldCheck, color: 'forest' },
              { label: 'GIS Discrepancies', value: String(stats.gisDiscrepancies ?? 0), icon: Shield, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><BarChart3 size={15} /> District Progress</h2>
            <div className="dash-progress-list">
              {districtData.map((d) => {
                const max = Math.max(...districtData.map(x => x.count), 1)
                return (
                  <div key={d.district} className="dash-progress-item">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>{d.district || 'Unknown'}</span>
                      <span className="font-mono">{d.count} records</span>
                    </div>
                    <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(d.count / max) * 100}%` }} /></div>
                  </div>
                )
              })}
              {districtData.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No data yet.</p>}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
