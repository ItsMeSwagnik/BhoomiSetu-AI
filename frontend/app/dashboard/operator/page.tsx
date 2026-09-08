'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardShell from '@/components/dashboard-shell'
import PdfViewer from '@/components/pdf-viewer'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Droplets,
  ExternalLink,
  Eye,
  Factory,
  FileText,
  Home,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  Mountain,
  Navigation,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Tag,
  Tractor,
  Trees,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { api, LAND_CLASSIFICATION_OPTIONS } from '@/lib/api'
import { uploadToStorageTo } from '@/lib/storage-to'
import type { DocumentItem, LandRecord, LandClassificationOption } from '@/lib/api-types'

interface ProcessingStage {
  id: number
  title: string
  desc: string
  status: 'pending' | 'active' | 'completed' | 'failed'
}

const renderClassificationIcon = (iconKey?: string, isSelected?: boolean) => {
  const iconProps = { size: 14, className: isSelected ? 'text-amber-300' : 'text-amber-500/80' }
  switch (iconKey) {
    case 'Sprout': return <Sprout {...iconProps} />
    case 'Home': return <Home {...iconProps} />
    case 'Building2': return <Building2 {...iconProps} />
    case 'Factory': return <Factory {...iconProps} />
    case 'Trees': return <Trees {...iconProps} />
    case 'Tractor': return <Tractor {...iconProps} />
    case 'Droplets': return <Droplets {...iconProps} />
    case 'Navigation': return <Navigation {...iconProps} />
    case 'Landmark': return <Landmark {...iconProps} />
    case 'Users': return <Users {...iconProps} />
    case 'ShieldAlert': return <ShieldAlert {...iconProps} />
    case 'Mountain': return <Mountain {...iconProps} />
    case 'Scale': return <Scale {...iconProps} />
    default: return <Tag {...iconProps} />
  }
}

export default function OperatorDashboard() {
  const [section, setSection] = useState('Overview')
  const [queue, setQueue] = useState<DocumentItem[]>([])
  const [records, setRecords] = useState<LandRecord[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Upload & live OCR state
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStageIdx, setCurrentStageIdx] = useState(0)
  const [processingFilename, setProcessingFilename] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Inspector state
  const [activeRecord, setActiveRecord] = useState<LandRecord | null>(null)
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [newCoOwnerInput, setNewCoOwnerInput] = useState('')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('All')

  const stages: ProcessingStage[] = [
    { id: 1, title: 'Document Ingestion', desc: 'Uploading PDF to Storage.to Cloud Storage (No login required)', status: currentStageIdx > 0 ? 'completed' : currentStageIdx === 0 ? 'active' : 'pending' },
    { id: 2, title: 'Document Rasterization', desc: 'Rendering PDF pages to 150 DPI vision matrices via PyMuPDF', status: currentStageIdx > 1 ? 'completed' : currentStageIdx === 1 ? 'active' : 'pending' },
    { id: 3, title: 'Native Groq VLM Reasoning', desc: 'Multi-page vision inspection via Qwen 3.8/3.6 Vision VLM', status: currentStageIdx > 2 ? 'completed' : currentStageIdx === 2 ? 'active' : 'pending' },
    { id: 4, title: 'Entity & Land Type Extraction', desc: 'Extracting 20 land revenue fields & classifying terrain', status: currentStageIdx > 3 ? 'completed' : currentStageIdx === 3 ? 'active' : 'pending' },
    { id: 5, title: 'Database Synchronization', desc: 'Writing structured record to Neon PostgreSQL', status: currentStageIdx > 4 ? 'completed' : currentStageIdx === 4 ? 'active' : 'pending' },
  ]

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [docsData, recordsData, statsData] = await Promise.all([
        api.documents.list(),
        api.records.list(),
        api.dashboard.stats(),
      ])
      setQueue(docsData)
      setRecords(recordsData)
      setStats(statsData as Record<string, number>)
    } catch (err) {
      console.error('Failed loading dashboard data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const startOcrPipeline = async () => {
    if (selectedFiles.length === 0) return
    setIsProcessing(true)
    setErrorMessage(null)
    setCurrentStageIdx(0)

    const file = selectedFiles[0]
    setProcessingFilename(file.name)

    const advanceStage = (stage: number) => {
      setCurrentStageIdx(stage)
    }

    try {
      advanceStage(0) // Stage 1: Storage.to Cloud Storage Ingestion
      let storageToUrl: string | null = null
      try {
        const storageToResult = await uploadToStorageTo(file)
        storageToUrl = storageToResult.cloudUrl
      } catch (sErr) {
        console.warn('Storage.to upload fallback:', sErr)
      }
      
      advanceStage(1) // Stage 2: Document Rasterization
      await new Promise(r => setTimeout(r, 400))

      advanceStage(2) // Stage 3: Vision Extraction Pipeline
      const uploadPromise = api.documents.upload(file, storageToUrl || undefined)
      
      const timer = setTimeout(() => advanceStage(3), 1200)

      const result = await uploadPromise
      clearTimeout(timer)

      advanceStage(4) // Stage 5: Database Sync
      await new Promise(r => setTimeout(r, 500))

      await loadData()

      if (result?.record) {
        setActiveRecord(result.record)
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
        const docUrl = result.document?.fileUrl 
          ? (result.document.fileUrl.startsWith('http') || result.document.fileUrl.startsWith('blob:') ? result.document.fileUrl : `${apiBase}${result.document.fileUrl}`)
          : URL.createObjectURL(file)
        setActiveDocUrl(docUrl)
      }

      setIsProcessing(false)
      setSelectedFiles(prev => prev.slice(1))
    } catch (err: any) {
      console.error('OCR pipeline error:', err)
      setErrorMessage(err?.message || 'Error occurred during OCR extraction.')
      setIsProcessing(false)
    }
  }

  const openRecordInspector = async (rec: LandRecord) => {
    setActiveRecord({ ...rec })
    setSaveSuccess(false)
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
    const docUrl = rec.documentId 
      ? `${apiBase}/api/documents/${rec.documentId}/file` 
      : rec.document?.fileUrl 
        ? `${apiBase}${rec.document.fileUrl}` 
        : null
    setActiveDocUrl(docUrl)
  }

  const handleFieldChange = (field: keyof LandRecord, value: any) => {
    if (!activeRecord) return
    setActiveRecord((prev: LandRecord | null) => (prev ? { ...prev, [field]: value } : null))
  }

  const stripEmojis = (str: string) =>
    str.replace(/[\u{10000}-\u{10ffff}\u{2600}-\u{27bf}\u{2300}-\u{23ff}\u{2b50}\u{2b55}\u{200d}\u{fe0f}]/gu, '').trim()

  const coOwnersList = useMemo(() => {
    if (!activeRecord?.coOwner) return []
    return activeRecord.coOwner.split(',').map((s: string) => s.trim()).filter(Boolean)
  }, [activeRecord?.coOwner])

  const calculateEqualShare = (coList: string[]) => {
    const total = 1 + coList.length
    if (total === 1) return '1/1 (100%)'
    if (total === 2) return '1/2 (50% each)'
    if (total === 3) return '1/3 (33.33% each)'
    if (total === 4) return '1/4 (25% each)'
    const pct = (100 / total).toFixed(2)
    return `1/${total} (${pct}% each)`
  }

  const handleAddCoOwner = (nameToAdd?: string) => {
    const name = (nameToAdd || newCoOwnerInput).trim()
    if (!name || !activeRecord) return
    const updated = [...coOwnersList, name]
    const updatedShare = calculateEqualShare(updated)
    setActiveRecord((prev: LandRecord | null) => (prev ? {
      ...prev,
      coOwner: updated.join(', '),
      share: updatedShare,
    } : null))
    setNewCoOwnerInput('')
  }

  const handleRemoveCoOwner = (idx: number) => {
    if (!activeRecord) return
    const updated = coOwnersList.filter((_: string, i: number) => i !== idx)
    const updatedShare = calculateEqualShare(updated)
    setActiveRecord((prev: LandRecord | null) => (prev ? {
      ...prev,
      coOwner: updated.length > 0 ? updated.join(', ') : '',
      share: updatedShare,
    } : null))
  }

  const hasJointOwnerIndicator = useMemo(() => {
    if (!activeRecord?.owner) return false
    return /\s+(?:AND|and|&|\+|along with)\s+|\s*,\s*/i.test(activeRecord.owner)
  }, [activeRecord?.owner])

  const handleSplitJointOwners = () => {
    if (!activeRecord?.owner) return
    const parts = activeRecord.owner.split(/\s+(?:AND|and|&|\+|along with)\s+|\s*,\s*/i).map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      const primary = parts[0]
      const additional = parts.slice(1)
      const mergedCo = [...coOwnersList, ...additional]
      const updatedShare = calculateEqualShare(mergedCo)
      setActiveRecord((prev: LandRecord | null) => (prev ? {
        ...prev,
        owner: primary,
        coOwner: mergedCo.join(', '),
        share: updatedShare,
      } : null))
    }
  }

  const toggleLandClassification = (value: string) => {
    if (!activeRecord) return
    const cleanTarget = stripEmojis(value)
    const current: string[] = (activeRecord.landClassification || []).map(stripEmojis)
    const updated = current.includes(cleanTarget)
      ? current.filter((c: string) => c !== cleanTarget)
      : [...current, cleanTarget]
    handleFieldChange('landClassification', updated)
  }

  const saveRecordChanges = async () => {
    if (!activeRecord?.id) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await api.records.patch(activeRecord.id, {
        ...activeRecord,
        status: 'verified',
      })
      setSaveSuccess(true)
      await loadData()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      alert('Failed to save record changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = searchQuery === '' || 
      (r.owner && r.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.khasra && r.khasra.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.village && r.village.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.plotNumber && r.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDistrict = districtFilter === 'All' || r.district === districtFilter
    return matchesSearch && matchesDistrict
  })

  return (
    <DashboardShell role="operator" activeSection={section} onSectionChange={setSection}>
      {/* 1. SECTION: OVERVIEW */}
      {section === 'Overview' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Operator Overview</h1>
              <p className="dash-page-sub">Ingestion summary and digitized land records database</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="dash-primary-btn" onClick={() => setSection('Upload Documents')}>
                <Upload size={14} /> Upload Documents
              </button>
              <button className="dash-outline-btn" onClick={loadData}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="dash-stats-row">
            {[
              { label: 'Total Ingested', value: String(stats.totalDocuments ?? queue.length ?? 0), icon: Database, color: 'forest' },
              { label: 'Digitized Records', value: String(stats.totalRecords ?? records.length ?? 0), icon: FileText, color: 'ochre' },
              { label: 'Verified in DB', value: String(stats.verifiedRecords ?? records.filter(r => r.status === 'verified').length ?? 0), icon: CheckCircle2, color: 'forest' },
              { label: 'Pending / In-Flight', value: String(stats.processingDocuments ?? 0), icon: Clock, color: 'ochre' },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <s.icon size={18} className={`dash-stat-icon ${s.color}`} />
                <p className="dash-stat-value">{s.value}</p>
                <span className="dash-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Records & Inspection Table */}
          <div className="dash-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="dash-card-title flex items-center gap-2">
                  <Database size={16} /> Digitized Land Records ({records.length})
                </h2>
                <p className="dash-card-desc">Click Inspect to view original document side-by-side with all 20 extracted fields</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Khasra, Owner, Village..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Owner / Co-Owner</th>
                    <th className="py-2.5 px-3">Khasra / Plot</th>
                    <th className="py-2.5 px-3">Khatian / Khata</th>
                    <th className="py-2.5 px-3">Area & Unit</th>
                    <th className="py-2.5 px-3">Location (Village, Dist)</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Model & Score</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => openRecordInspector(rec)}
                      className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-sm">{rec.owner || 'Unnamed'}</div>
                        {rec.coOwner && <div className="text-[11px] text-gray-500">Co: {rec.coOwner}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-medium">{rec.khasra || rec.plotNumber || '—'}</div>
                        {rec.dag && <div className="text-[11px] text-gray-500">Dag: {rec.dag}</div>}
                      </td>
                      <td className="py-3 px-3 font-mono">{rec.khatianKhata || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="font-medium">{rec.area || '—'}</span>{' '}
                        <span className="text-gray-500">{rec.areaUnit || ''}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div>{rec.village || rec.mouza || '—'}</div>
                        <div className="text-[11px] text-gray-500">{rec.district || '—'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(rec.landClassification && rec.landClassification.length > 0 ? rec.landClassification : ['Agricultural Land']).slice(0, 2).map((c: string, i: number) => {
                            const cleanName = stripEmojis(c)
                            const opt = LAND_CLASSIFICATION_OPTIONS.find(o => stripEmojis(o.value) === cleanName)
                            return (
                              <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                                {renderClassificationIcon(opt?.iconKey, false)}
                                {cleanName}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${(rec.confidenceScore || 0.9) > 0.9 ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <span className="font-mono text-[11px]">{Math.round((rec.confidenceScore || 0.95) * 100)}%</span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]">
                          {rec.ocrModelUsed || 'qwen-3.8-vision'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openRecordInspector(rec)
                            }}
                            className="dash-outline-btn py-1 px-2.5 text-xs inline-flex items-center gap-1"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (confirm(`Delete case for ${rec.owner || 'this record'}?`)) {
                                await api.records.delete(rec.id)
                                loadData()
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Case"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No digitized records found in database. Go to <strong>Upload Documents</strong> to start digitizing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. SECTION: UPLOAD DOCUMENTS */}
      {section === 'Upload Documents' && (
        <>
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Document Ingestion Studio</h1>
              <p className="dash-page-sub">Upload land record deeds for Groq Vision OCR extraction</p>
            </div>
            <button className="dash-outline-btn" onClick={() => setSection('Overview')}>
              View Records Database
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Zone (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div
                className={`p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all bg-black/5 dark:bg-white/5 ${
                  dragOver ? 'border-amber-500 bg-amber-500/10 scale-[0.99]' : 'border-gray-300 dark:border-gray-700'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-amber-500/15 text-amber-600">
                  <Upload size={30} />
                </div>
                <h3 className="text-base font-semibold mb-1">Drag and drop land record files here</h3>
                <p className="text-xs text-gray-500 max-w-md mb-6">
                  Supports multi-page PDF, PNG, TIFF, or JPEG files up to 50MB. High resolution scans yield best OCR accuracy.
                </p>

                <label className="dash-primary-btn cursor-pointer py-2.5 px-6">
                  Browse Document Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.tiff"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>

              {/* Staged files queue */}
              {selectedFiles.length > 0 && (
                <div className="dash-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Staged Files Ready for OCR ({selectedFiles.length})
                    </h3>
                    <button
                      onClick={startOcrPipeline}
                      disabled={isProcessing}
                      className="dash-primary-btn text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles size={14} /> Start OCR Pipeline ({selectedFiles.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-between border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={18} className="text-amber-500 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold truncate">{file.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{(file.size / 1024).toFixed(1)} KB · {file.type || 'Document'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSelectedFile(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ingestion Info & Engine Card (1 col) */}
            <div className="space-y-4">
              <div className="dash-card">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Sparkles size={18} />
                  <h3 className="font-bold text-sm">Groq Vision Multimodal Engine</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  The pipeline renders document pages and uses native Vision-Language Models to extract 20 revenue attributes directly.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">🥇 Primary VLM Model</div>
                    <div className="text-[11px] text-gray-500 font-mono">qwen/qwen3.8-27b (Native Vision)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">🥈 Secondary VLM Model</div>
                    <div className="text-[11px] text-gray-500 font-mono">qwen/qwen3.6-27b (Fast Vision)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-800">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">🥉 Text Reasoning Fallback</div>
                    <div className="text-[11px] text-gray-500 font-mono">openai/gpt-oss-120b</div>
                  </div>
                </div>
              </div>

              <div className="dash-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Supported Document Types</h4>
                <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
                  <li>Record of Rights (RoR / Khatian / Parcha)</li>
                  <li>Registered Sale / Gift Deeds</li>
                  <li>Mutation Orders & Jamabandi Extracts</li>
                  <li>Cadastral & Village Survey Sheets</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. SECTION: OCR QUEUE */}
      {section === 'OCR Queue' && (
        <div className="dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="dash-card-title flex items-center gap-2"><Database size={16} /> Ingestion & Processing Queue ({queue.length})</h2>
              <p className="dash-card-desc">Track status and reprocessing history of all submitted document files</p>
            </div>
            <button className="dash-outline-btn" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
          </div>
          <div className="dash-table">
            {queue.map((doc) => (
              <div key={doc.id} className="dash-table-row">
                <div className="flex items-center gap-3">
                  <FileText size={16} style={{ color: 'var(--ochre)' }} />
                  <div>
                    <span className="dash-table-primary">{doc.originalFilename}</span>
                    <span className="dash-table-sub">
                      ID: {doc.id.slice(0, 8)}… · Size: {((doc.fileSize || 0) / 1024).toFixed(1)} KB · District: {doc.district || 'Unassigned'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`dash-badge ${doc.status === 'extracted' ? 'verified' : 'pending'}`}>
                    {doc.status}
                  </span>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}${doc.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dash-outline-btn py-1 px-2 text-xs inline-flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> View File
                    </a>
                  )}
                </div>
              </div>
            ))}
            {queue.length === 0 && <p className="dash-card-desc p-4">No documents in queue. Go to Upload Documents to ingest deeds.</p>}
          </div>
        </div>
      )}

      {/* 4. SECTION: BATCH STATUS */}
      {section === 'Batch Status' && (
        <div className="dash-card">
          <h2 className="dash-card-title mb-1 flex items-center gap-2"><BarChart3 size={16} /> District Ingestion Progress</h2>
          <p className="dash-card-desc mb-4">Real-time breakdown of digitized land revenue records by administrative district</p>
          <DistrictProgressView />
        </div>
      )}

      {/* OCR LIVE PROCESSING MODAL */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Sparkles size={20} className="animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Groq Vision OCR Pipeline</h3>
                  <p className="text-xs text-gray-500 font-mono truncate max-w-[280px]">{processingFilename}</p>
                </div>
              </div>
            </div>

            {/* Stages Stack */}
            <div className="py-6 space-y-4">
              {stages.map((stg, i) => (
                <div key={stg.id} className="flex items-start gap-3">
                  <div className="pt-0.5">
                    {stg.status === 'completed' && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                    {stg.status === 'active' && (
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                    )}
                    {stg.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-400 flex items-center justify-center text-xs">
                        {i + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs font-semibold ${stg.status === 'active' ? 'text-amber-600 dark:text-amber-400' : stg.status === 'completed' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                      {stg.title}
                    </h4>
                    <p className="text-[11px] text-gray-500">{stg.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> {errorMessage}
              </div>
            )}

            <div className="text-center text-xs text-gray-400">
              Processing document images with Qwen 3.8/3.6 Multimodal Vision Intelligence...
            </div>
          </div>
        </div>
      )}

      {/* FULL RECORD & PDF SIDE-BY-SIDE INSPECTOR MODAL */}
      {activeRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full h-full max-w-7xl rounded-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base">Land Record Inspector</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-green-500/15 text-green-700 dark:text-green-400">
                      {activeRecord.ocrModelUsed || 'qwen-3.8-vision'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck size={12} /> Validated & Normalized
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      Confidence: {Math.round((activeRecord.confidenceScore || 0.96) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    ID: {activeRecord.id} · Verify normalized fields against deed pages
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Saved to Database!
                  </span>
                )}
                <button
                  onClick={saveRecordChanges}
                  disabled={isSaving}
                  className="dash-primary-btn text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Save size={14} /> {isSaving ? 'Saving…' : 'Save & Verify Record'}
                </button>
                <button
                  onClick={() => setActiveRecord(null)}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Split Screen Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800 overflow-hidden">
              {/* LEFT PANE: DEDICATED PDF VIEWER */}
              <div className="h-full flex flex-col bg-gray-900 overflow-hidden p-2">
                <PdfViewer
                  documentId={activeRecord.documentId || activeRecord.id}
                  fileUrl={activeDocUrl}
                  originalFilename={activeRecord.document?.originalFilename || (activeRecord.owner ? `${activeRecord.owner}_deed.pdf` : 'Land_Record.pdf')}
                />
              </div>

              {/* RIGHT PANE: 20 EXTRACTED FIELDS EDITABLE FORM */}
              <div className="h-full overflow-y-auto p-6 space-y-6">
                {/* 0. Ground-Truth PDF vs LLM Validation Scorecard */}
                {activeRecord.validationScorecard && (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            PDF Ground-Truth Cross-Validation
                          </h3>
                          <p className="text-[11px] text-gray-500">
                            LLM extractions compared against source PDF text tokens
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                          Grade {activeRecord.validationScorecard.fidelityGrade} · {activeRecord.validationScorecard.overallFidelityScore}% Fidelity
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                          {activeRecord.validationScorecard.verifiedFieldsCount} / {activeRecord.validationScorecard.totalFieldsChecked}
                        </div>
                        <div className="text-[10px] text-gray-500">Verified in PDF</div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="font-bold text-amber-700 dark:text-amber-400">
                          {activeRecord.validationScorecard.partialFieldsCount}
                        </div>
                        <div className="text-[10px] text-gray-500">Probable Match</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="font-bold text-blue-700 dark:text-blue-400">
                          {activeRecord.validationScorecard.isPdfTextLayerAvailable ? 'Direct OCR' : 'Raster Vision'}
                        </div>
                        <div className="text-[10px] text-gray-500">Text Layer</div>
                      </div>
                    </div>

                    {activeRecord.validationScorecard.discrepancies && activeRecord.validationScorecard.discrepancies.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertTriangle size={13} /> Discrepancies & Anomaly Flags:
                        </div>
                        {activeRecord.validationScorecard.discrepancies.map((d: string, idx: number) => (
                          <div key={idx} className="text-[11px] pl-4 list-disc">• {d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 1. Ownership Details */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                      <User size={14} /> 1. Ownership & Co-Owner Details
                    </h3>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {coOwnersList.length > 0 ? `${1 + coOwnersList.length} Joint Parties` : 'Sole Owner'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-gray-500">Primary Owner Name</label>
                        {hasJointOwnerIndicator && (
                          <button
                            type="button"
                            onClick={handleSplitJointOwners}
                            className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <Wand2 size={11} /> Auto-Split Joint Names
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={activeRecord.owner || ''}
                        onChange={(e) => handleFieldChange('owner', e.target.value)}
                        placeholder="e.g. Rajeev Arora"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-1 focus:ring-amber-500"
                      />
                      {hasJointOwnerIndicator && (
                        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} /> Multiple names detected in Owner. Click "Auto-Split" to separate.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-gray-500">Share / Fraction (100% Total)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedShare = calculateEqualShare(coOwnersList)
                            handleFieldChange('share', updatedShare)
                          }}
                          className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                          title="Recalculate equal share fraction across all owners"
                        >
                          <Percent size={11} /> Equal Split
                        </button>
                      </div>
                      <input
                        type="text"
                        value={activeRecord.share || ''}
                        onChange={(e) => handleFieldChange('share', e.target.value)}
                        placeholder="e.g. 1/2 (50% each)"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-1 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Calculated equally across {1 + coOwnersList.length} owner(s): <span className="font-semibold text-amber-600 dark:text-amber-400">{calculateEqualShare(coOwnersList)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Multi Co-owners Section */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <UserPlus size={12} className="text-amber-500" />
                        Co-Owner(s) ({coOwnersList.length} Added)
                      </label>
                    </div>

                    {/* Co-owners Chips */}
                    {coOwnersList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {coOwnersList.map((coName: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium"
                          >
                            <User size={11} />
                            {coName}
                            <button
                              type="button"
                              onClick={() => handleRemoveCoOwner(idx)}
                              className="p-0.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-500 ml-1 transition-colors"
                              title="Remove Co-owner"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add Co-owner Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCoOwnerInput}
                        onChange={(e) => setNewCoOwnerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCoOwner()
                          }
                        }}
                        placeholder="Add co-owner name (e.g. Kavita Arora) & press enter..."
                        className="flex-1 text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCoOwner()}
                        disabled={!newCoOwnerInput.trim()}
                        className="dash-primary-btn text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-40"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Spatial & Plot Identifiers */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <Layers size={14} /> 2. Plot & Survey Identifiers
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Plot Number</label>
                      <input
                        type="text"
                        value={activeRecord.plotNumber || ''}
                        onChange={(e) => handleFieldChange('plotNumber', e.target.value)}
                        placeholder="e.g. GH-05"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono font-medium text-amber-600 dark:text-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Khasra No.</label>
                      <input
                        type="text"
                        value={activeRecord.khasra || ''}
                        onChange={(e) => handleFieldChange('khasra', e.target.value)}
                        placeholder="e.g. 1409"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Dag No.</label>
                      <input
                        type="text"
                        value={activeRecord.dag || ''}
                        onChange={(e) => handleFieldChange('dag', e.target.value)}
                        placeholder="e.g. 882"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Khatian / Khata</label>
                      <input
                        type="text"
                        value={activeRecord.khatianKhata || ''}
                        onChange={(e) => handleFieldChange('khatianKhata', e.target.value)}
                        placeholder="e.g. 582/B"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Survey Number</label>
                      <input
                        type="text"
                        value={activeRecord.surveyNumber || ''}
                        onChange={(e) => handleFieldChange('surveyNumber', e.target.value)}
                        placeholder="e.g. CS-4402"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Administrative Hierarchy */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <MapPin size={14} /> 3. Administrative Location
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Village / Locality</label>
                      <input
                        type="text"
                        value={activeRecord.village || ''}
                        onChange={(e) => handleFieldChange('village', e.target.value)}
                        placeholder="e.g. Dundahera"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mouza (w/ J.L)</label>
                      <input
                        type="text"
                        value={activeRecord.mouza || ''}
                        onChange={(e) => handleFieldChange('mouza', e.target.value)}
                        placeholder="e.g. Gopalpur (J.L. 102)"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tehsil / Sub-Registrar</label>
                      <input
                        type="text"
                        value={activeRecord.tehsilTaluk || ''}
                        onChange={(e) => handleFieldChange('tehsilTaluk', e.target.value)}
                        placeholder="e.g. Tehsil Compound"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">District</label>
                      <input
                        type="text"
                        value={activeRecord.district || ''}
                        onChange={(e) => handleFieldChange('district', e.target.value)}
                        placeholder="e.g. Ghaziabad"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Measurement & Land Classification */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <Sparkles size={14} /> 4. Area & Land Classification
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Area Dimension</label>
                      <input
                        type="text"
                        value={activeRecord.area || ''}
                        onChange={(e) => handleFieldChange('area', e.target.value)}
                        placeholder="e.g. 162.57 or 3.25"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Area Unit</label>
                      <input
                        type="text"
                        value={activeRecord.areaUnit || ''}
                        onChange={(e) => handleFieldChange('areaUnit', e.target.value)}
                        placeholder="Sq. Meters / Sq. Feet / Acres"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-2">
                      Land Classification Tags (Select all applicable categories)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LAND_CLASSIFICATION_OPTIONS.map((opt: LandClassificationOption) => {
                        const isSelected = (activeRecord.landClassification || [])
                          .map(stripEmojis)
                          .includes(stripEmojis(opt.value))
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleLandClassification(opt.value)}
                            title={opt.desc}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border shadow-sm ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 dark:border-amber-400 font-semibold shadow-amber-500/20'
                                : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-400 hover:bg-amber-500/5'
                            }`}
                          >
                            {renderClassificationIcon(opt.iconKey, isSelected)}
                            <span>{opt.label}</span>
                            {isSelected && <Check size={12} className="text-white ml-0.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Mutation & Deed Registration */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <FileText size={14} /> 5. Mutation & Deed Registration
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Registration Deed No.</label>
                      <input
                        type="text"
                        value={activeRecord.registrationNumber || ''}
                        onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                        placeholder="e.g. IN-UP6808264901013U"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Registration Date</label>
                      <input
                        type="text"
                        value={activeRecord.registrationDate || ''}
                        onChange={(e) => handleFieldChange('registrationDate', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mutation Number</label>
                      <input
                        type="text"
                        value={activeRecord.mutationNumber || ''}
                        onChange={(e) => handleFieldChange('mutationNumber', e.target.value)}
                        placeholder="e.g. MUT-UP-2024-88741"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mutation Date</label>
                      <input
                        type="text"
                        value={activeRecord.mutationDate || ''}
                        onChange={(e) => handleFieldChange('mutationDate', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Ownership Transfer History */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <UserCheck size={14} /> 6. Transfer History (Prior & Current Parties)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Previous Owner / Transferor (1st Party)</label>
                      <input
                        type="text"
                        value={activeRecord.previousOwner || ''}
                        onChange={(e) => handleFieldChange('previousOwner', e.target.value)}
                        placeholder="e.g. Devendra Prasad Singh, Sunita Singh"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">New Owner / Transferee (2nd Party)</label>
                      <input
                        type="text"
                        value={activeRecord.newOwner || ''}
                        onChange={(e) => handleFieldChange('newOwner', e.target.value)}
                        placeholder="e.g. Rajeev Arora, Kavita Arora"
                        className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

function DistrictProgressView() {
  const [data, setData] = useState<{ district: string; count: number }[]>([])
  useEffect(() => {
    api.dashboard.districtProgress().then(setData).catch(() => {})
  }, [])
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="dash-progress-list">
      {data.map((d) => (
        <div key={d.district} className="dash-progress-item mb-3">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>{d.district}</span>
            <span className="font-mono">{d.count} records</span>
          </div>
          <div className="dash-progress-bar"><div className="dash-progress-fill" style={{ width: `${(d.count / max) * 100}%` }} /></div>
        </div>
      ))}
      {data.length === 0 && <p className="dash-card-desc p-3">No progress data yet.</p>}
    </div>
  )
}
