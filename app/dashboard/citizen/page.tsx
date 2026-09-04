'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, Clock, FileSearch, MapPin, Plus, Search, X } from 'lucide-react'

const parcels = [
  { id: 'P102', village: 'Rampur', district: 'Gaya', area: '2.58 ac', status: 'verified', plot: '102', owner: 'Rajesh Kumar', classification: 'Agricultural' },
  { id: 'P205', village: 'Sitapur', district: 'Patna', area: '1.20 ac', status: 'pending', plot: '205', owner: 'Rajesh Kumar', classification: 'Residential' },
]

const requests = [
  { id: 'MUT-2024-001', type: 'Mutation', status: 'Under Review', date: '12 Jan 2024', parcel: 'P102', note: 'Awaiting officer adjudication' },
  { id: 'MUT-2023-088', type: 'Name Correction', status: 'Approved', date: '04 Aug 2023', parcel: 'P205', note: 'Completed and signed' },
  { id: 'MUT-2022-041', type: 'Area Correction', status: 'Approved', date: '19 Mar 2022', parcel: 'P102', note: 'GIS-verified correction applied' },
]

const publicRecords = [
  { plot: '100', owner: 'Maheshwar Prasad', village: 'Rampur', area: '1.84 ac', status: 'verified' },
  { plot: '101', owner: 'Kusum Devi', village: 'Rampur', area: '3.12 ac', status: 'verified' },
  { plot: '103', owner: 'Ramphal Yadav', village: 'Rampur', area: '1.39 ac', status: 'verified' },
  { plot: '201', owner: 'Sunita Sharma', village: 'Sitapur', area: '2.10 ac', status: 'pending' },
]

export default function CitizenDashboard() {
  const [section, setSection] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [newRequest, setNewRequest] = useState(false)
  const [requestType, setRequestType] = useState('Mutation')
  const [requestParcel, setRequestParcel] = useState('P102')
  const [submitted, setSubmitted] = useState(false)

  const filteredRecords = publicRecords.filter(
    (r) =>
      r.plot.includes(searchQuery) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.village.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardShell role="citizen" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">My Land Records</h1>
              <p className="dash-page-sub">Public Landowner Portal — Rajesh Kumar</p>
            </div>
            <button className="dash-primary-btn" onClick={() => { setSection('Track Requests'); setNewRequest(true) }}>
              <Plus size={15} /> New Request
            </button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Registered Parcels', value: '2', icon: MapPin, color: 'forest' },
              { label: 'Pending Requests', value: '1', icon: Clock, color: 'ochre' },
              { label: 'Verified Records', value: '1', icon: CheckCircle2, color: 'forest' },
              { label: 'Flagged Issues', value: '0', icon: AlertTriangle, color: 'muted' },
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
              <h2 className="dash-card-title"><MapPin size={15} /> My Parcels</h2>
              <div className="dash-table">
                {parcels.map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">Plot {p.plot} — {p.village}</span>
                      <span className="dash-table-sub">{p.area} · {p.classification} · {p.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`dash-badge ${p.status}`}>{p.status}</span>
                      <button className="dash-outline-btn" onClick={() => setSection('My Parcels')}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><FileSearch size={15} /> Recent Requests</h2>
              <div className="dash-table">
                {requests.slice(0, 2).map((r) => (
                  <div key={r.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{r.type}</span>
                      <span className="dash-table-sub">{r.id} · {r.date}</span>
                    </div>
                    <span className={`dash-badge ${r.status === 'Approved' ? 'verified' : 'pending'}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === 'My Parcels' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">My Parcels</h1>
              <p className="dash-page-sub">All registered land parcels under your name</p>
            </div>
          </div>
          <div className="dash-table" style={{ gap: '10px' }}>
            {parcels.map((p) => (
              <div key={p.id} className="dash-card" style={{ padding: '18px 22px' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="dash-table-primary" style={{ fontSize: '15px' }}>Plot {p.plot} — {p.village}, {p.district}</span>
                    <span className="dash-table-sub">Parcel ID: {p.id} · {p.classification} · {p.area}</span>
                  </div>
                  <span className={`dash-badge ${p.status}`}>{p.status}</span>
                </div>
                <div className="dash-table" style={{ marginTop: '14px' }}>
                  {[
                    ['Owner', p.owner], ['Village', p.village], ['District', p.district],
                    ['Area (GIS)', p.area], ['Classification', p.classification], ['Parcel ID', p.id],
                  ].map(([k, v]) => (
                    <div key={k} className="dash-table-row">
                      <span className="dash-table-sub">{k}</span>
                      <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {section === 'Track Requests' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Track Requests</h1>
              <p className="dash-page-sub">Mutation and correction requests</p>
            </div>
            <button className="dash-primary-btn" onClick={() => { setNewRequest(true); setSubmitted(false) }}>
              <Plus size={15} /> New Request
            </button>
          </div>

          {newRequest && (
            <div className="dash-card dash-info-card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="dash-card-title" style={{ margin: 0 }}>Submit New Request</h2>
                <button className="dash-outline-btn" onClick={() => setNewRequest(false)}><X size={13} /> Cancel</button>
              </div>
              {submitted ? (
                <div className="auth-status-msg success"><CheckCircle2 size={14} /><span>Request submitted successfully! Tracking ID: MUT-2024-{Math.floor(Math.random() * 900 + 100)}</span></div>
              ) : (
                <div className="dash-grid-2" style={{ gap: '12px' }}>
                  <label className="auth-form-inner" style={{ display: 'block' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Request Type</span>
                    <select className="dash-input" style={{ marginTop: '4px' }} value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                      <option>Mutation</option><option>Name Correction</option><option>Area Correction</option><option>Classification Change</option>
                    </select>
                  </label>
                  <label className="auth-form-inner" style={{ display: 'block' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Parcel</span>
                    <select className="dash-input" style={{ marginTop: '4px' }} value={requestParcel} onChange={(e) => setRequestParcel(e.target.value)}>
                      {parcels.map((p) => <option key={p.id} value={p.id}>Plot {p.plot} — {p.village} ({p.id})</option>)}
                    </select>
                  </label>
                  <div style={{ gridColumn: '1/-1' }}>
                    <button className="dash-primary-btn" onClick={() => setSubmitted(true)}>Submit Request</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="dash-card">
            <h2 className="dash-card-title"><Clock size={15} /> All Requests</h2>
            <div className="dash-table">
              {requests.map((r) => (
                <div key={r.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{r.type} — Parcel {r.parcel}</span>
                    <span className="dash-table-sub">{r.id} · {r.date} · {r.note}</span>
                  </div>
                  <span className={`dash-badge ${r.status === 'Approved' ? 'verified' : 'pending'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'Public Records' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Public Records</h1>
              <p className="dash-page-sub">Search the digitized cadastral database</p>
            </div>
          </div>
          <div className="dash-card dash-info-card">
            <div className="dash-search-row">
              <input
                className="dash-input"
                placeholder="Search by plot number, owner name, or village…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="dash-primary-btn"><Search size={14} /> Search</button>
            </div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><FileSearch size={15} /> Results ({filteredRecords.length})</h2>
            <div className="dash-table">
              {filteredRecords.map((r) => (
                <div key={r.plot} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">Plot {r.plot} — {r.village}</span>
                    <span className="dash-table-sub">Owner: {r.owner} · Area: {r.area}</span>
                  </div>
                  <span className={`dash-badge ${r.status}`}>{r.status}</span>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <p className="dash-card-desc" style={{ padding: '12px', textAlign: 'center' }}>No records found for "{searchQuery}"</p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
