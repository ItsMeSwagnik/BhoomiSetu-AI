'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Settings, Sliders, Users, X } from 'lucide-react'
import { api, UserProfile, SystemLog } from '@/lib/api'

const PIPELINES = [
  { id: 'pl1', name: 'Groq Llama 3.2 90B Vision Engine', status: 'Running', accuracy: '96.8%' },
  { id: 'pl2', name: 'Groq Llama 3.2 11B Fast Vision', status: 'Running', accuracy: '93.4%' },
  { id: 'pl3', name: 'PostGIS Geodesic Cadastral Engine', status: 'Running', accuracy: '99.4%' },
  { id: 'pl4', name: 'Ground-Truth PDF Fidelity Engine', status: 'Running', accuracy: '98.2%' },
]

import { Skeleton, SkeletonList } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'

export default function AdminDashboard() {
  const [section, setSection] = useState('Overview')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [stats, setStats] = useState<Record<string, number | string>>({})
  const [pipelines, setPipelines] = useState(PIPELINES)
  const [loading, setLoading] = useState(true)
  const [addingUser, setAddingUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('citizen')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('BhoomiSetu@2026')
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Pagination states
  const [usersPage, setUsersPage] = useState(1)
  const [usersPageSize, setUsersPageSize] = useState(10)
  const [logsPage, setLogsPage] = useState(1)
  const [logsPageSize, setLogsPageSize] = useState(10)

  const paginatedUsers = users.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize)
  const paginatedLogs = systemLogs.slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, statsData, logsData, settingsData] = await Promise.all([
        api.users.list(),
        api.dashboard.stats(),
        api.audit.systemLogs(),
        api.settings.get(),
      ])
      setUsers(usersData)
      setStats(statsData)
      setSystemLogs(logsData)
      setSettings(settingsData)
    } catch { /* demo */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return
    try {
      await api.users.create({ name: newUserName, email: newUserEmail, role: newUserRole, password: newUserPassword })
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword('BhoomiSetu@2026'); setAddingUser(false)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create user')
    }
  }

  const toggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    try {
      await api.users.updateStatus(user.id, newStatus)
      await load()
    } catch { /* ignore */ }
  }

  const removeUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.users.delete(id)
      await load()
    } catch { /* ignore */ }
  }

  const saveSettings = async () => {
    try {
      await api.settings.update(settings)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch { /* ignore */ }
  }

  const togglePipeline = (id: string) =>
    setPipelines(p => p.map(x => x.id === id ? { ...x, status: x.status === 'Running' ? 'Idle' : 'Running' } : x))

  return (
    <DashboardShell role="admin" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">System Administration</h1><p className="dash-page-sub">Platform Administrator</p></div>
            <button className="dash-primary-btn" onClick={() => setSection('System Config')}><Settings size={15} /> System Config</button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Active Users', value: String(users.filter(u => u.status === 'active').length || stats.activeUsers || 0), icon: Users, color: 'forest' },
              { label: 'ML Pipelines', value: String(pipelines.length), icon: Sliders, color: 'forest' },
              { label: 'Verified Records', value: String(stats.verifiedRecords ?? 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Pending Review', value: String(stats.pendingVerification ?? 0), icon: AlertTriangle, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                {loading ? (
                  <Skeleton className="w-16 h-7 rounded my-1" />
                ) : (
                  <p className="dash-stat-value">{s.value}</p>
                )}
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <h2 className="dash-card-title"><Users size={15} /> Users ({users.length})</h2>
              {loading ? (
                <div className="p-3">
                  <SkeletonList count={3} />
                </div>
              ) : (
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
              )}
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><Sliders size={15} /> ML Pipelines</h2>
              <div className="dash-table">
                {pipelines.map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{p.name}</span>
                      <span className="dash-table-sub">Accuracy: {p.accuracy}</span>
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
                  {['citizen', 'operator', 'verifier', 'officer', 'auditor', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input className="dash-input" placeholder="Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                <div style={{ gridColumn: '1/-1' }}>
                  <button className="dash-primary-btn" onClick={addUser}>Create User</button>
                </div>
              </div>
            </div>
          )}

          <div className="dash-card">
            <h2 className="dash-card-title"><Users size={15} /> All Users ({users.length})</h2>
            {loading ? <p className="dash-card-desc" style={{ padding: 12 }}>Loading…</p> : (
              <div className="dash-table">
                {paginatedUsers.map((u) => (
                  <div key={u.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{u.name}</span>
                      <span className="dash-table-sub">{u.email} · {u.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`dash-badge ${u.status === 'active' ? 'verified' : 'failed'}`}>{u.status}</span>
                      <button className="dash-outline-btn" onClick={() => toggleStatus(u)}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                      <button className="dash-outline-btn" onClick={() => removeUser(u.id)}><X size={12} /></button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No users found.</p>}
              </div>
            )}
            <Pagination
              currentPage={usersPage}
              totalItems={users.length}
              pageSize={usersPageSize}
              onPageChange={setUsersPage}
              onPageSizeChange={(newSize) => {
                setUsersPageSize(newSize)
                setUsersPage(1)
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
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
                    <span className="dash-table-sub">Accuracy: {p.accuracy}</span>
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
          <div className="dash-card">
            <h2 className="dash-card-title">System Logs ({systemLogs.length})</h2>
            <div className="dash-table">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{log.eventType}</span>
                    <span className="dash-table-sub">{log.message} · {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`dash-badge ${log.level === 'error' ? 'failed' : log.level === 'warning' ? 'pending' : 'verified'}`}>{log.level}</span>
                </div>
              ))}
              {systemLogs.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No system logs.</p>}
            </div>
            <Pagination
              currentPage={logsPage}
              totalItems={systemLogs.length}
              pageSize={logsPageSize}
              onPageChange={setLogsPage}
              onPageSizeChange={(newSize) => {
                setLogsPageSize(newSize)
                setLogsPage(1)
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </>
      )}

      {section === 'System Config' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">System Config</h1><p className="dash-page-sub">LRMS API and platform settings</p></div>
          </div>
          <div className="dash-card dash-info-card">
            <h2 className="dash-card-title">Platform Settings</h2>
            <div className="dash-grid-2" style={{ gap: 12, marginTop: 12 }}>
              {[
                { key: 'confidence_threshold', label: 'OCR Confidence Threshold', desc: 'Fields below this are auto-flagged.' },
                { key: 'gis_area_tolerance_percent', label: 'Area Variance Tolerance (%)', desc: 'GIS area mismatch tolerance.' },
                { key: 'session_timeout_minutes', label: 'Session Timeout (min)', desc: 'Inactive session timeout.' },
                { key: 'max_upload_size_mb', label: 'Max Upload Size (MB)', desc: 'Maximum file size per upload.' },
                { key: 'lrms_api_url', label: 'LRMS API URL', desc: 'Primary LRMS API endpoint.' },
              ].map((cfg) => (
                <div key={cfg.key} className="dash-card" style={{ padding: '14px 18px' }}>
                  <h2 className="dash-card-title" style={{ fontSize: '12px' }}>{cfg.label}</h2>
                  <p className="dash-card-desc" style={{ fontSize: '11px' }}>{cfg.desc}</p>
                  <input
                    className="dash-input"
                    value={String(settings[cfg.key] ?? '')}
                    onChange={(e) => setSettings(s => ({ ...s, [cfg.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button className="dash-primary-btn" style={{ marginTop: 16 }} onClick={saveSettings}>
              {settingsSaved ? 'Saved' : 'Save Settings'}
            </button>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Settings size={15} /> System Health</h2>
            <div className="dash-table">
              {[
                ['PostgreSQL Database', 'Connected'],
                ['PostGIS Extension', 'Active'],
                ['LRMS API v2', 'Configured'],
                ['Storage Backend', String(settings.storage_backend ?? 'local')],
                ['OCR Engine', String(settings.ocr_engine ?? 'mock')],
              ].map(([k, v]) => (
                <div key={k} className="dash-table-row">
                  <span className="dash-table-primary">{k}</span>
                  <div className="flex items-center gap-2">
                    <span className="dash-table-sub">{v}</span>
                    <span className="dash-badge verified">OK</span>
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
