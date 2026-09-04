'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Settings, Sliders, Users, X } from 'lucide-react'

const initialUsers = [
  { id: 'u001', name: 'Vikramaditya Sen', role: 'officer', email: 'officer.tehsildar@lrms.gov.in', status: 'active' },
  { id: 'u002', name: 'Pooja Sharma', role: 'verifier', email: 'cadastral.verifier@lrms.gov.in', status: 'active' },
  { id: 'u003', name: 'Anil Verma', role: 'operator', email: 'data.operator@lrms.gov.in', status: 'active' },
  { id: 'u004', name: 'Meenakshi Iyer', role: 'auditor', email: 'vigilance.auditor@cag.gov.in', status: 'suspended' },
  { id: 'u005', name: 'Rajesh Kumar', role: 'citizen', email: 'citizen.rajesh@gmail.com', status: 'active' },
]

const initialPipelines = [
  { id: 'pl1', name: 'PaddleOCR v3.1', status: 'Running', accuracy: '94.2%', lastRun: '2 min ago' },
  { id: 'pl2', name: 'Indic TrOCR', status: 'Running', accuracy: '91.8%', lastRun: '5 min ago' },
  { id: 'pl3', name: 'PostGIS Validator', status: 'Running', accuracy: '99.1%', lastRun: '1 min ago' },
  { id: 'pl4', name: 'RapidFuzz Entity Matcher', status: 'Idle', accuracy: '88.5%', lastRun: '1 hr ago' },
]

export default function AdminDashboard() {
  const [section, setSection] = useState('Overview')
  const [users, setUsers] = useState(initialUsers)
  const [pipelines, setPipelines] = useState(initialPipelines)
  const [apiUrl, setApiUrl] = useState('https://api.lrms.gov.in/v2')
  const [apiSaved, setApiSaved] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('citizen')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [addingUser, setAddingUser] = useState(false)

  const toggleStatus = (id: string) => setUsers((u) => u.map((x) => x.id === id ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' } : x))
  const removeUser = (id: string) => setUsers((u) => u.filter((x) => x.id !== id))
  const togglePipeline = (id: string) => setPipelines((p) => p.map((x) => x.id === id ? { ...x, status: x.status === 'Running' ? 'Idle' : 'Running', lastRun: 'just now' } : x))

  const addUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return
    setUsers((u) => [...u, { id: `u${Date.now()}`, name: newUserName, role: newUserRole, email: newUserEmail, status: 'active' }])
    setNewUserName(''); setNewUserEmail(''); setAddingUser(false)
  }

  return (
    <DashboardShell role="admin" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">System Administration</h1><p className="dash-page-sub">Platform Administrator — BhoomiSetu Root Admin</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('System Config')}><Settings size={15} /> System Config</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Active Users', value: String(users.filter((u) => u.status === 'active').length), icon: Users, color: 'forest' },
              { label: 'ML Pipelines', value: String(pipelines.length), icon: Sliders, color: 'forest' },
              { label: 'System Health', value: '99.8%', icon: CheckCircle2, color: 'forest' },
              { label: 'Alerts', value: '2', icon: AlertTriangle, color: 'ochre' },
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
              <h2 className="dash-card-title"><Users size={15} /> Users ({users.length})</h2>
              <div className="dash-table">
                {users.slice(0, 4).map((u) => (
                  <div key={u.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{u.name}</span>
                      <span className="dash-table-sub">{u.role}</span>
                    </div>
                    <span className={`dash-badge ${u.status === 'active' ? 'verified' : 'failed'}`}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><Sliders size={15} /> ML Pipelines</h2>
              <div className="dash-table">
                {pipelines.map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{p.name}</span>
                      <span className="dash-table-sub">Accuracy: {p.accuracy} · {p.lastRun}</span>
                    </div>
                    <span className={`dash-badge ${p.status === 'Running' ? 'verified' : 'pending'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === 'User Management' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">User Management</h1><p className="dash-page-sub">Manage platform access and roles</p></div>
            <button className="dash-primary-btn" onClick={() => setAddingUser(true)}><Plus size={15} /> Add User</button>
          </div>

          {addingUser && (
            <div className="dash-card dash-info-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="dash-card-title" style={{ margin: 0 }}>New User</h2>
                <button className="dash-outline-btn" onClick={() => setAddingUser(false)}><X size={13} /></button>
              </div>
              <div className="dash-grid-2" style={{ gap: 10 }}>
                <input className="dash-input" placeholder="Full name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                <input className="dash-input" placeholder="Email address" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                <select className="dash-input" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  {['citizen', 'operator', 'verifier', 'officer', 'auditor', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="dash-primary-btn" onClick={addUser}>Add User</button>
              </div>
            </div>
          )}

          <div className="dash-card">
            <h2 className="dash-card-title"><Users size={15} /> All Users ({users.length})</h2>
            <div className="dash-table">
              {users.map((u) => (
                <div key={u.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{u.name}</span>
                    <span className="dash-table-sub">{u.email} · {u.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${u.status === 'active' ? 'verified' : 'failed'}`}>{u.status}</span>
                    <button className="dash-outline-btn" onClick={() => toggleStatus(u.id)}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                    <button className="dash-outline-btn" onClick={() => removeUser(u.id)}><X size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'ML Pipeline' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">ML Pipeline</h1><p className="dash-page-sub">Manage OCR and validation models</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Sliders size={15} /> Pipeline Status</h2>
            <div className="dash-table">
              {pipelines.map((p) => (
                <div key={p.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{p.name}</span>
                    <span className="dash-table-sub">Accuracy: {p.accuracy} · Last run: {p.lastRun}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${p.status === 'Running' ? 'verified' : 'pending'}`}>{p.status}</span>
                    <button className="dash-outline-btn" onClick={() => togglePipeline(p.id)}>
                      <RefreshCw size={12} /> {p.status === 'Running' ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Model Performance</h2>
            <div className="dash-progress-list">
              {pipelines.map((p) => (
                <div key={p.id} className="dash-progress-item">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{p.name}</span><span className="font-mono">{p.accuracy}</span>
                  </div>
                  <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: p.accuracy }} /></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'System Config' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">System Config</h1><p className="dash-page-sub">LRMS API and platform settings</p></div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">LRMS API Node</h2>
            <p className="dash-card-desc">Configure the primary LRMS API endpoint for DILRMP synchronization.</p>
            <div className="dash-search-row">
              <input className="dash-input" value={apiUrl} onChange={(e) => { setApiUrl(e.target.value); setApiSaved(false) }} />
              <button className="dash-primary-btn" onClick={() => setApiSaved(true)}>{apiSaved ? '✓ Saved' : 'Save Config'}</button>
            </div>
          </div>
          <div className="dash-grid-2">
            {[
              { label: 'OCR Confidence Threshold', defaultVal: '75%', desc: 'Fields below this confidence are auto-flagged for review.' },
              { label: 'Area Variance Tolerance', defaultVal: '5.0%', desc: 'Parcels exceeding this GIS variance are routed to officer queue.' },
              { label: 'Session Timeout', defaultVal: '30 min', desc: 'Inactive sessions are automatically signed out.' },
              { label: 'Max Upload Size', defaultVal: '50 MB', desc: 'Maximum file size per document upload.' },
            ].map((cfg) => (
              <div key={cfg.label} className="dash-card">
                <h2 className="dash-card-title" style={{ fontSize: '12px' }}>{cfg.label}</h2>
                <p className="dash-card-desc" style={{ fontSize: '11px' }}>{cfg.desc}</p>
                <input className="dash-input" defaultValue={cfg.defaultVal} />
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Settings size={15} /> System Health</h2>
            <div className="dash-table">
              {[
                ['PostgreSQL Database', 'Connected', 'verified'],
                ['PostGIS Extension', 'Active', 'verified'],
                ['LRMS API v2', 'Reachable', 'verified'],
                ['DILRMP Sync', 'Last sync: 5 min ago', 'verified'],
                ['Redis Cache', 'Running', 'verified'],
              ].map(([k, v, badge]) => (
                <div key={k} className="dash-table-row">
                  <span className="dash-table-primary">{k}</span>
                  <div className="flex items-center gap-2">
                    <span className="dash-table-sub">{v}</span>
                    <span className={`dash-badge ${badge}`}>OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
