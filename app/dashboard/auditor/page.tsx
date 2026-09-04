'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { BarChart3, CheckCircle2, Eye, Shield, ShieldCheck } from 'lucide-react'

const auditLog = [
  { id: 'AUD-001', officer: 'user_102 (Tehsildar)', action: 'Area corrected: 2.45 → 2.58 ac', record: 'REC-1042', time: '14:32 IST', date: '12 Jan 2024', type: 'Correction' },
  { id: 'AUD-002', officer: 'user_089 (Surveyor)', action: 'OCR field accepted: Owner Name', record: 'REC-1043', time: '13:15 IST', date: '12 Jan 2024', type: 'Acceptance' },
  { id: 'AUD-003', officer: 'user_102 (Tehsildar)', action: 'Record approved & published to LRMS', record: 'REC-1041', time: '11:50 IST', date: '12 Jan 2024', type: 'Approval' },
  { id: 'AUD-004', officer: 'user_045 (Operator)', action: 'Document uploaded: Khatiyan #1042', record: 'DOC-1042', time: '09:20 IST', date: '11 Jan 2024', type: 'Upload' },
  { id: 'AUD-005', officer: 'user_089 (Surveyor)', action: 'GIS polygon validated: Plot 101', record: 'REC-1044', time: '16:05 IST', date: '11 Jan 2024', type: 'Validation' },
]

export default function AuditorDashboard() {
  const [section, setSection] = useState('Overview')
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [filterType, setFilterType] = useState('All')

  const filtered = filterType === 'All' ? auditLog : auditLog.filter((e) => e.type === filterType)

  return (
    <DashboardShell role="auditor" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Audit & Compliance</h1><p className="dash-page-sub">Vigilance Inspector Portal — Meenakshi Iyer (Read-Only)</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('Reports')}><BarChart3 size={15} /> Export Report</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Audit Entries Today', value: '23', icon: Shield, color: 'forest' },
              { label: 'Compliance Score', value: '98.2%', icon: ShieldCheck, color: 'forest' },
              { label: 'Records Reviewed', value: '156', icon: Eye, color: 'ochre' },
              { label: 'Anomalies Logged', value: '4', icon: CheckCircle2, color: 'ochre' },
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
            <div className="dash-table">
              {auditLog.slice(0, 4).map((entry) => (
                <div key={entry.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{entry.action}</span>
                    <span className="dash-table-sub">{entry.officer} · {entry.record} · {entry.time}</span>
                  </div>
                  <span className="dash-badge verified">{entry.type}</span>
                </div>
              ))}
            </div>
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
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Filter by type:</span>
              {['All', 'Correction', 'Acceptance', 'Approval', 'Upload', 'Validation'].map((t) => (
                <button key={t} className={filterType === t ? 'dash-primary-btn' : 'dash-outline-btn'} style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setFilterType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Shield size={15} /> Audit Log ({filtered.length})</h2>
            <div className="dash-table">
              {filtered.map((entry) => (
                <div key={entry.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{entry.action}</span>
                    <span className="dash-table-sub">{entry.officer} · {entry.record} · {entry.date} {entry.time}</span>
                  </div>
                  <span className="dash-badge verified">{entry.type}</span>
                </div>
              ))}
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
                { label: 'Records with Full Audit Trail', done: 1130, total: 1250 },
                { label: 'Officer Actions Documented', done: 98, total: 100 },
                { label: 'GIS Validations Completed', done: 219, total: 250 },
                { label: 'Officer Approvals Documented', done: 1041, total: 1130 },
              ].map((d) => (
                <div key={d.label} className="dash-progress-item">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{d.label}</span>
                    <span className="font-mono">{((d.done / d.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(d.done / d.total) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Inspection Notes</h2>
            <p className="dash-card-desc">Annotate findings for the CAG compliance report. No modifications to land records are permitted from this portal.</p>
            <textarea className="dash-input dash-textarea" placeholder="Add inspection note…" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="dash-primary-btn" style={{ marginTop: 10 }} onClick={() => { if (note.trim()) { setNotes((n) => [note, ...n]); setNote('') } }}>Save Note</button>
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
            <div><h1 className="dash-page-title">Reports</h1><p className="dash-page-sub">Operational summary and export</p></div>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Documents Processed', value: '1,250', icon: BarChart3, color: 'forest' },
              { label: 'Verified Records', value: '1,130', icon: CheckCircle2, color: 'forest' },
              { label: 'Avg. Confidence', value: '91.4%', icon: ShieldCheck, color: 'forest' },
              { label: 'GIS Discrepancies', value: '31', icon: Shield, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><BarChart3 size={15} /> District Modernization Progress</h2>
            <div className="dash-progress-list">
              {[
                { label: 'Gaya, Bihar', done: 420, total: 500 },
                { label: 'Patna, Bihar', done: 310, total: 400 },
                { label: 'Nadia, West Bengal', done: 280, total: 350 },
                { label: 'Varanasi, Uttar Pradesh', done: 240, total: 320 },
              ].map((d) => (
                <div key={d.label} className="dash-progress-item">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{d.label}</span>
                    <span className="font-mono">{d.done}/{d.total} ({((d.done / d.total) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(d.done / d.total) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Export Report</h2>
            <p className="dash-card-desc">Generate a full compliance report for CAG submission in PDF or CSV format.</p>
            <div className="flex gap-3 flex-wrap mt-2">
              <button className="dash-primary-btn">Export as PDF</button>
              <button className="dash-outline-btn">Export as CSV</button>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
