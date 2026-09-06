'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Database, FileText, RefreshCw, Upload, X } from 'lucide-react'
import { api, DocumentItem } from '@/lib/api'

export default function OperatorDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState<DocumentItem[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [docsData, statsData] = await Promise.all([
        api.documents.list(),
        api.dashboard.stats(),
      ])
      setQueue(docsData)
      setStats(statsData as Record<string, number>)
    } catch {
      // demo fallback — keep empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    setUploadMsg('')
    try {
      for (const file of files) {
        await api.documents.upload(file)
      }
      setUploadMsg(`${files.length} file(s) uploaded and queued for OCR processing.`)
      await load()
    } catch (e: unknown) {
      setUploadMsg(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  const retry = async (id: string) => {
    try {
      await api.documents.reprocess(id)
      await load()
    } catch { /* ignore */ }
  }

  const statusCounts = {
    total: queue.length,
    processing: queue.filter(d => d.status === 'processing').length,
    completed: queue.filter(d => d.status === 'extracted').length,
    failed: queue.filter(d => d.status === 'failed').length,
  }

  const badgeClass = (status: string) =>
    status === 'extracted' ? 'verified' : status === 'failed' ? 'failed' : status === 'processing' ? 'processing' : 'pending'

  const badgeLabel = (status: string) =>
    status === 'extracted' ? 'Completed' : status === 'queued' ? 'Queued' : status === 'processing' ? 'Processing' : status === 'failed' ? 'Failed' : status

  return (
    <DashboardShell role="operator" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Document Ingestion</h1>
              <p className="dash-page-sub">Front-Line Staff Portal</p>
            </div>
            <button className="dash-primary-btn" onClick={() => setSection('Upload Documents')}>
              <Upload size={15} /> Upload Documents
            </button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Total in Queue', value: String(statusCounts.total), icon: Database, color: 'forest' },
              { label: 'Processing', value: String(statusCounts.processing), icon: Clock, color: 'ochre' },
              { label: 'Completed', value: String(statusCounts.completed), icon: CheckCircle2, color: 'forest' },
              { label: 'Failed', value: String(statusCounts.failed), icon: AlertTriangle, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Database size={15} /> Recent Queue</h2>
            {loading ? <p className="dash-card-desc" style={{ padding: 12 }}>Loading…</p> : (
              <div className="dash-table">
                {queue.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="dash-table-row">
                    <div className="flex items-center gap-3">
                      <FileText size={15} style={{ color: 'var(--ochre)', flexShrink: 0 }} />
                      <div>
                        <span className="dash-table-primary">{doc.originalFilename}</span>
                        <span className="dash-table-sub">{doc.id.slice(0, 8)}… · {doc.district || 'Unknown'}</span>
                      </div>
                    </div>
                    <span className={`dash-badge ${badgeClass(doc.status)}`}>{badgeLabel(doc.status)}</span>
                  </div>
                ))}
                {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No documents yet. Upload to get started.</p>}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'Upload Documents' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Upload Documents</h1><p className="dash-page-sub">Ingest new land records into the OCR pipeline</p></div>
          </div>
          <div
            className="dash-card dash-upload-zone"
            style={{ minHeight: 220, borderStyle: 'dashed', cursor: 'pointer', borderColor: dragOver ? 'var(--ochre)' : undefined, background: dragOver ? 'rgba(184,112,56,0.08)' : undefined }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload size={32} style={{ color: 'var(--ochre)', marginBottom: 12 }} />
            <h3 className="dash-card-title" style={{ justifyContent: 'center' }}>Drop files here to upload</h3>
            <p className="dash-card-desc" style={{ textAlign: 'center' }}>Supports PDF, TIFF, PNG, JPEG — up to 50MB per file</p>
            <label className="dash-primary-btn" style={{ cursor: 'pointer', marginTop: 8 }}>
              {uploading ? 'Uploading…' : 'Browse Files'}
              <input type="file" multiple accept=".pdf,.tiff,.png,.jpg,.jpeg" style={{ display: 'none' }}
                onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
                disabled={uploading}
              />
            </label>
          </div>
          {uploadMsg && (
            <div className={`auth-status-msg ${uploadMsg.includes('failed') || uploadMsg.includes('error') ? 'error' : 'success'}`}>
              <CheckCircle2 size={14} /><span>{uploadMsg}</span>
            </div>
          )}
        </>
      )}

      {section === 'OCR Queue' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">OCR Queue</h1><p className="dash-page-sub">Monitor and manage OCR processing jobs</p></div>
            <button className="dash-outline-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Database size={15} /> All Documents ({queue.length})</h2>
            <div className="dash-table">
              {queue.map((doc) => (
                <div key={doc.id} className="dash-table-row">
                  <div className="flex items-center gap-3">
                    <FileText size={15} style={{ color: 'var(--ochre)', flexShrink: 0 }} />
                    <div>
                      <span className="dash-table-primary">{doc.originalFilename}</span>
                      <span className="dash-table-sub">{doc.id.slice(0, 8)}… · {doc.district || 'Unknown'}{doc.errorMessage ? ` · Error: ${doc.errorMessage}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${badgeClass(doc.status)}`}>{badgeLabel(doc.status)}</span>
                    {doc.status === 'failed' && (
                      <button className="dash-outline-btn" onClick={() => retry(doc.id)}><RefreshCw size={12} /> Retry</button>
                    )}
                  </div>
                </div>
              ))}
              {queue.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No documents in queue.</p>}
            </div>
          </div>
        </>
      )}

      {section === 'Batch Status' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Batch Status</h1><p className="dash-page-sub">District-wise ingestion progress</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><BarChart3 size={15} /> District Progress</h2>
            <DistrictProgress />
          </div>
          <div className="dash-grid-2">
            {[
              { label: 'Total Documents', value: String(statusCounts.total), icon: CheckCircle2, color: 'forest' },
              { label: 'Completed', value: String(statusCounts.completed), icon: FileText, color: 'forest' },
              { label: 'Failed Jobs', value: String(statusCounts.failed), icon: AlertTriangle, color: 'ochre' },
              { label: 'Processing', value: String(statusCounts.processing), icon: Clock, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  )
}

function DistrictProgress() {
  const [data, setData] = useState<{ district: string; count: number }[]>([])
  useEffect(() => {
    api.dashboard.districtProgress().then(setData).catch(() => {})
  }, [])
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="dash-progress-list">
      {data.map((d) => (
        <div key={d.district} className="dash-progress-item">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>{d.district}</span>
            <span className="font-mono">{d.count} records</span>
          </div>
          <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(d.count / max) * 100}%` }} /></div>
        </div>
      ))}
      {data.length === 0 && <p className="dash-card-desc" style={{ padding: 12 }}>No data yet.</p>}
    </div>
  )
}
