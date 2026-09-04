'use client'

import { useState } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Database, FileText, RefreshCw, Upload, X } from 'lucide-react'

const initialQueue = [
  { id: 'DOC-1042', name: 'Khatiyan Register #1042', status: 'Processing', confidence: 91, pages: 12, district: 'Gaya' },
  { id: 'DOC-1043', name: 'Mutation Order #19/2020', status: 'Queued', confidence: null, pages: 4, district: 'Patna' },
  { id: 'DOC-1041', name: 'Sale Deed #482', status: 'Completed', confidence: 97, pages: 8, district: 'Gaya' },
  { id: 'DOC-1040', name: 'Survey Map Sheet #4', status: 'Failed', confidence: null, pages: 1, district: 'Varanasi' },
  { id: 'DOC-1039', name: 'RoR Register #0991', status: 'Completed', confidence: 94, pages: 16, district: 'Nadia' },
]

export default function OperatorDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState(initialQueue)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const retry = (id: string) => setQueue((q) => q.map((d) => d.id === id ? { ...d, status: 'Queued' } : d))
  const remove = (id: string) => setQueue((q) => q.filter((d) => d.id !== id))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).map((f) => f.name)
    setUploadedFiles((p) => [...p, ...files])
    files.forEach((name, i) => {
      setQueue((q) => [{
        id: `DOC-${1050 + q.length + i}`,
        name,
        status: 'Queued',
        confidence: null,
        pages: Math.floor(Math.random() * 20 + 1),
        district: 'Pending',
      }, ...q])
    })
  }

  const stats = {
    total: queue.length,
    completed: queue.filter((d) => d.status === 'Completed').length,
    processing: queue.filter((d) => d.status === 'Processing').length,
    failed: queue.filter((d) => d.status === 'Failed').length,
  }

  return (
    <DashboardShell role="operator" activeSection={section} onSectionChange={setSection}>
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Document Ingestion</h1>
              <p className="dash-page-sub">Front-Line Staff Portal — Anil Verma</p>
            </div>
            <button className="dash-primary-btn" onClick={() => setSection('Upload Documents')}>
              <Upload size={15} /> Upload Documents
            </button>
          </div>
          <div className="dash-stats-row">
            {[
              { label: 'Total in Queue', value: String(stats.total), icon: Database, color: 'forest' },
              { label: 'Processing', value: String(stats.processing), icon: Clock, color: 'ochre' },
              { label: 'Completed', value: String(stats.completed), icon: CheckCircle2, color: 'forest' },
              { label: 'Failed', value: String(stats.failed), icon: AlertTriangle, color: 'ochre' },
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
            <div className="dash-table">
              {queue.slice(0, 4).map((doc) => (
                <div key={doc.id} className="dash-table-row">
                  <div className="flex items-center gap-3">
                    <FileText size={15} style={{ color: 'var(--ochre)', flexShrink: 0 }} />
                    <div>
                      <span className="dash-table-primary">{doc.name}</span>
                      <span className="dash-table-sub">{doc.id} · {doc.pages} pages · {doc.district}</span>
                    </div>
                  </div>
                  <span className={`dash-badge ${doc.status === 'Completed' ? 'verified' : doc.status === 'Failed' ? 'failed' : doc.status === 'Processing' ? 'processing' : 'pending'}`}>{doc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'Upload Documents' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">Upload Documents</h1><p className="dash-page-sub">Ingest new land records into the OCR pipeline</p></div>
          </div>
          <div
            className={`dash-card dash-upload-zone`}
            style={{ minHeight: 220, borderStyle: 'dashed', cursor: 'pointer', borderColor: dragOver ? 'var(--ochre)' : undefined, background: dragOver ? 'rgba(184,112,56,0.08)' : undefined }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload size={32} style={{ color: 'var(--ochre)', marginBottom: 12 }} />
            <h3 className="dash-card-title" style={{ justifyContent: 'center' }}>Drop files here to upload</h3>
            <p className="dash-card-desc" style={{ textAlign: 'center' }}>Supports PDF, TIFF, PNG, JPEG — up to 50MB per file</p>
            <label className="dash-primary-btn" style={{ cursor: 'pointer', marginTop: 8 }}>
              Browse Files
              <input type="file" multiple accept=".pdf,.tiff,.png,.jpg,.jpeg" style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).map((f) => f.name)
                  setUploadedFiles((p) => [...p, ...files])
                  files.forEach((name, i) => {
                    setQueue((q) => [{ id: `DOC-${1050 + q.length + i}`, name, status: 'Queued', confidence: null, pages: Math.floor(Math.random() * 20 + 1), district: 'Pending' }, ...q])
                  })
                }}
              />
            </label>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="dash-card">
              <h2 className="dash-card-title"><CheckCircle2 size={15} /> Uploaded ({uploadedFiles.length})</h2>
              <div className="dash-table">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="dash-table-row">
                    <span className="dash-table-primary">{f}</span>
                    <span className="dash-badge pending">Queued for OCR</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {section === 'OCR Queue' && (
        <>
          <div className="dash-page-header">
            <div><h1 className="dash-page-title">OCR Queue</h1><p className="dash-page-sub">Monitor and manage OCR processing jobs</p></div>
          </div>
          <div className="dash-card">
            <h2 className="dash-card-title"><Database size={15} /> All Documents ({queue.length})</h2>
            <div className="dash-table">
              {queue.map((doc) => (
                <div key={doc.id} className="dash-table-row">
                  <div className="flex items-center gap-3">
                    <FileText size={15} style={{ color: 'var(--ochre)', flexShrink: 0 }} />
                    <div>
                      <span className="dash-table-primary">{doc.name}</span>
                      <span className="dash-table-sub">{doc.id} · {doc.pages} pages · {doc.district}{doc.confidence ? ` · ${doc.confidence}% conf.` : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`dash-badge ${doc.status === 'Completed' ? 'verified' : doc.status === 'Failed' ? 'failed' : doc.status === 'Processing' ? 'processing' : 'pending'}`}>{doc.status}</span>
                    {doc.status === 'Failed' && <button className="dash-outline-btn" onClick={() => retry(doc.id)}><RefreshCw size={12} /> Retry</button>}
                    <button className="dash-outline-btn" onClick={() => remove(doc.id)}><X size={12} /></button>
                  </div>
                </div>
              ))}
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
          <div className="dash-grid-2">
            {[
              { label: 'Avg. OCR Confidence', value: '93.4%', icon: CheckCircle2, color: 'forest' },
              { label: 'Pages Processed', value: '4,821', icon: FileText, color: 'forest' },
              { label: 'Failed Jobs', value: String(stats.failed), icon: AlertTriangle, color: 'ochre' },
              { label: 'Pending Review', value: '38', icon: Clock, color: 'ochre' },
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
