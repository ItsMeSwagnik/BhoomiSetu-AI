'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, CheckCircle2, Clock, FileSearch, MapPin, Plus, Search, X, Map, ShieldCheck } from 'lucide-react'
import { api, LandRecord, Submission } from '@/lib/api'

import { Skeleton, SkeletonList } from '@/components/ui/skeleton'
import { CitizenCadastralView } from '@/components/citizen-cadastral-view'
import { Pagination } from '@/components/ui/pagination'

export const AUTHENTICATED_CITIZEN = {
  name: 'Animesh Halder',
  coOwner: 'Shipra Halder',
  citizenId: 'CIT-WB-2024-8841',
  aadhaarMasked: 'XXXX-XXXX-8921',
  khatianNo: 'LR-1102',
  village: 'Krishnapur',
  mouzaNo: 'JL 42',
  district: 'Nadia',
  state: 'West Bengal',
}

export default function CitizenDashboard() {
  const [section, setSection] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [myRecords, setMyRecords] = useState<LandRecord[]>([])
  const [publicRecords, setPublicRecords] = useState<LandRecord[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [newRequest, setNewRequest] = useState(false)
  const [requestType, setRequestType] = useState('Mutation')
  const [requestParcel, setRequestParcel] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<LandRecord[]>([])
  const [searching, setSearching] = useState(false)

  // Public records pagination
  const [publicPage, setPublicPage] = useState(1)
  const [publicPageSize, setPublicPageSize] = useState(10)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, recs, subs] = await Promise.all([
        api.dashboard.stats(),
        api.records.list({ status: 'verified' }),
        api.submissions.mine().catch(() => [] as Submission[]),
      ])
      setStats(statsData as Record<string, number>)
      setPublicRecords(recs)
      setSubmissions(subs)

      // Strictly filter records for the single authenticated citizen Animesh Halder (deduplicated by plot)
      const seenPlots = new Set<string>()
      const citizenRecs = recs
        .filter(
          (r) =>
            r.owner?.toLowerCase().includes('animesh') ||
            ['101', '106'].includes(r.plotNumber || '')
        )
        .filter((r) => {
          const key = r.plotNumber || r.id
          if (seenPlots.has(key)) return false
          seenPlots.add(key)
          return true
        })

      setMyRecords(citizenRecs)
      if (citizenRecs.length > 0) setRequestParcel(citizenRecs[0].plotNumber || citizenRecs[0].id)
    } catch {
      // demo fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSearch = async () => {
    setSearching(true)
    setPublicPage(1)
    try {
      const results = await api.records.list({ village: searchQuery })
      setSearchResults(results)
    } catch {
      setSearchResults(publicRecords.filter(
        r => r.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.plotNumber?.includes(searchQuery)
      ))
    } finally {
      setSearching(false)
    }
  }

  const handleSubmitRequest = async () => {
    try {
      await api.submissions.create(requestType, requestParcel)
      setSubmitted(true)
      await load()
    } catch {
      setSubmitted(true)
    }
  }

  const displayList = searchResults.length > 0 ? searchResults : publicRecords
  const paginatedPublic = displayList.slice((publicPage - 1) * publicPageSize, publicPage * publicPageSize)

  const pendingCount = submissions.filter(s => ['submitted', 'processing', 'in_verification'].includes(s.status)).length
  const verifiedCount = submissions.filter(s => s.status === 'verified').length

  return (
    <DashboardShell role="citizen" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Citizen Landowner Portal</h1>
              <p className="dash-page-sub">Authenticated Landowner: {AUTHENTICATED_CITIZEN.name} (Aadhaar: {AUTHENTICATED_CITIZEN.aadhaarMasked})</p>
            </div>
            <button className="dash-primary-btn" onClick={() => { setSection('Track Requests'); setNewRequest(true) }}>
              <Plus size={15} /> New Request
            </button>
          </div>

          {/* Citizen Account Identity Card */}
          <div className="dash-card border-emerald-500/20 bg-emerald-500/5 mb-4 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                AH
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">{AUTHENTICATED_CITIZEN.name}</h3>
                  <span
                    title="Verified Citizen Account (Aadhaar & Revenue Office Authenticated)"
                    className="inline-flex items-center text-sky-400"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-sky-500 flex-shrink-0" aria-label="Verified Account">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.41-1.41 2.09 2.09 5.09-5.09 1.41 1.41-6.5 6.5z" fill="#0284c7" />
                      <path d="M10.8 16.2L7.3 12.7L8.71 11.29L10.8 13.38L15.89 8.29L17.3 9.7L10.8 16.2Z" fill="#ffffff" />
                    </svg>
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Citizen ID: <span className="font-mono text-stone-300">{AUTHENTICATED_CITIZEN.citizenId}</span> · Khatian: <span className="font-mono text-amber-300">{AUTHENTICATED_CITIZEN.khatianNo}</span> · Mouza: <span className="text-stone-300">{AUTHENTICATED_CITIZEN.village} (JL {AUTHENTICATED_CITIZEN.mouzaNo})</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSection('Cadastral Map')}
              className="dash-primary-btn text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Map size={13} />
              Open My Cadastral Map
            </button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Registered Parcels', value: String(myRecords.length || stats.registeredParcels || 0), icon: MapPin, color: 'forest' },
              { label: 'Pending Requests', value: String(pendingCount || stats.pendingRequests || 0), icon: Clock, color: 'ochre' },
              { label: 'Verified Records', value: String(verifiedCount || stats.verifiedRecords || 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Flagged Issues', value: String(stats.flaggedIssues || 0), icon: AlertTriangle, color: 'muted' },
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
              <h2 className="dash-card-title"><MapPin size={15} /> My Parcels</h2>
              {loading ? (
                <div className="p-2">
                  <SkeletonList count={3} />
                </div>
              ) : (
                <div className="dash-table">
                  {myRecords.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No verified records found.</p>}
                  {myRecords.map((p) => (
                    <div key={p.id} className="dash-table-row">
                      <div>
                        <span className="dash-table-primary">Plot {p.plotNumber} — {p.village}</span>
                        <span className="dash-table-sub">{p.area} {p.areaUnit} · {p.landClassification}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`dash-badge ${p.status}`}>{p.status}</span>
                        <button className="dash-outline-btn" onClick={() => setSection('My Parcels')}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dash-card">
              <h2 className="dash-card-title"><FileSearch size={15} /> Recent Requests</h2>
              <div className="dash-table">
                {submissions.slice(0, 3).map((r) => (
                  <div key={r.id} className="dash-table-row">
                    <div>
                      <span className="dash-table-primary">{r.requestType}</span>
                      <span className="dash-table-sub">{r.id.slice(0, 8)}… · {new Date(r.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`dash-badge ${r.status === 'verified' ? 'verified' : 'pending'}`}>{r.status}</span>
                  </div>
                ))}
                {submissions.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No requests yet.</p>}
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
              <p className="dash-page-sub">All verified land parcels</p>
            </div>
          </div>
          <div className="dash-table" style={{ gap: '10px' }}>
            {myRecords.map((p) => (
              <div key={p.id} className="dash-card" style={{ padding: '18px 22px' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="dash-table-primary" style={{ fontSize: '15px' }}>Plot {p.plotNumber} — {p.village}, {p.district}</span>
                    <span className="dash-table-sub">{Array.isArray(p.landClassification) ? p.landClassification.join(', ') : p.landClassification} · {p.area} {p.areaUnit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${p.status}`}>{p.status}</span>
                    <button
                      className="dash-primary-btn flex items-center gap-1.5"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => setSection('Cadastral Map')}
                    >
                      <Map size={13} />
                      View on Cadastral Map
                    </button>
                  </div>
                </div>
                <div className="dash-table" style={{ marginTop: '14px' }}>
                  {[
                    ['Owner', String(p.owner || '')], ['Village', String(p.village || '')], ['District', String(p.district || '')],
                    ['Area', `${p.area || ''} ${p.areaUnit || ''}`], ['Classification', Array.isArray(p.landClassification) ? p.landClassification.join(', ') : String(p.landClassification || '')],
                  ].map(([k, v]) => (
                    <div key={k} className="dash-table-row">
                      <span className="dash-table-sub">{k}</span>
                      <span className="dash-table-primary" style={{ fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {myRecords.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No parcels found.</p>}
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
                <div className="auth-status-msg success"><CheckCircle2 size={14} /><span>Request submitted successfully!</span></div>
              ) : (
                <div className="dash-grid-2" style={{ gap: '12px' }}>
                  <label className="auth-form-inner" style={{ display: 'block' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Request Type</span>
                    <select className="dash-input" style={{ marginTop: '4px' }} value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                      <option>Mutation</option><option>Boundary Demarcation</option><option>Name Correction</option><option>Area Correction</option><option>Classification Change</option>
                    </select>
                  </label>
                  <label className="auth-form-inner" style={{ display: 'block' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Parcel Reference</span>
                    <input className="dash-input" style={{ marginTop: '4px' }} value={requestParcel} onChange={(e) => setRequestParcel(e.target.value)} placeholder="e.g. 101" />
                  </label>
                  <div style={{ gridColumn: '1/-1' }}>
                    <button className="dash-primary-btn" onClick={handleSubmitRequest}>Submit Request</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="dash-card">
            <h2 className="dash-card-title"><Clock size={15} /> All Requests</h2>
            <div className="dash-table">
              {submissions.map((r) => (
                <div key={r.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">{r.requestType} — {r.parcelReference}</span>
                    <span className="dash-table-sub">{r.id.slice(0, 8)}… · {new Date(r.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`dash-badge ${r.status === 'verified' ? 'verified' : 'pending'}`}>{r.status}</span>
                </div>
              ))}
              {submissions.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No requests yet.</p>}
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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="dash-primary-btn" onClick={handleSearch} disabled={searching}>
                <Search size={14} /> {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><FileSearch size={15} /> Results ({displayList.length})</h2>
            <div className="dash-table">
              {paginatedPublic.map((r) => (
                <div key={r.id} className="dash-table-row">
                  <div>
                    <span className="dash-table-primary">Plot {r.plotNumber} — {r.village}</span>
                    <span className="dash-table-sub">Owner: {r.owner} · Area: {r.area} {r.areaUnit}</span>
                  </div>
                  <span className={`dash-badge ${r.status}`}>{r.status}</span>
                </div>
              ))}
              {displayList.length === 0 && !loading && (
                <p className="dash-card-desc" style={{ padding: '12px', textAlign: 'center' }}>No records found.</p>
              )}
            </div>
            <Pagination
              currentPage={publicPage}
              totalItems={displayList.length}
              pageSize={publicPageSize}
              onPageChange={setPublicPage}
              onPageSizeChange={(newSize) => {
                setPublicPageSize(newSize)
                setPublicPage(1)
              }}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        </>
      )}

      {section === 'Cadastral Map' && (
        <CitizenCadastralView
          myRecords={myRecords}
          onRequestDemarcation={(plotNo) => {
            setRequestParcel(plotNo)
            setRequestType('Boundary Demarcation')
            setSection('Track Requests')
            setNewRequest(true)
            setSubmitted(false)
          }}
        />
      )}
    </DashboardShell>
  )
}
