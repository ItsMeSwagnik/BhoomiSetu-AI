import {
  UserProfile, DocumentItem, LandRecord, Parcel, AuditEntry,
  SystemLog, Submission, AppNotification, FieldCorrection, ValidationResult, ExtractedField,
  FieldVerification, ValidationScorecard,
  LAND_CLASSIFICATION_OPTIONS, LandClassificationOption,
  CadastralMapItem, MapPlotItem, LinkedDalilSummary
} from './api-types'

export type {
  UserProfile, DocumentItem, LandRecord, Parcel, AuditEntry,
  SystemLog, Submission, AppNotification, FieldCorrection, ValidationResult, ExtractedField,
  FieldVerification, ValidationScorecard,
  LandClassificationOption,
  CadastralMapItem, MapPlotItem, LinkedDalilSummary
}
export { LAND_CLASSIFICATION_OPTIONS }

const rawBase = process.env.NEXT_PUBLIC_API_URL || ''
const API_BASE = rawBase ? rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '') : ''

function stripEmojis(val: any): any {
  if (typeof val === 'string') {
    return val.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim()
  }
  if (Array.isArray(val)) {
    return val.map(stripEmojis)
  }
  if (val !== null && typeof val === 'object') {
    const res: Record<string, any> = {}
    for (const k of Object.keys(val)) {
      res[k] = stripEmojis(val[k])
    }
    return res
  }
  return val
}

async function tryFetch<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`API error (${res.status}): ${errText}`)
    }
    const data = await res.json()
    return stripEmojis(data) as T
  } catch (err) {
    if (fallbackData !== undefined) {
      return stripEmojis(fallbackData) as T
    }
    throw err
  }
}

const mockUser: UserProfile = {
  id: 'u1', name: 'Alok Kumar Sen (Revenue Officer)', email: 'ro.officer@bhoomisetu.gov.in',
  role: 'officer', status: 'active', createdAt: '2025-01-15T09:00:00Z'
}

const mockUsersList: UserProfile[] = [
  { id: 'u1', name: 'Alok Kumar Sen (Revenue Officer)', email: 'ro.officer@bhoomisetu.gov.in', role: 'officer', status: 'active', createdAt: '2025-01-15T09:00:00Z' },
  { id: 'u2', name: 'Debashis Roy (GIS Cadastral Verifier)', email: 'verifier.nadia@bhoomisetu.gov.in', role: 'verifier', status: 'active', createdAt: '2025-02-10T10:30:00Z' },
  { id: 'u3', name: 'Priyanka Das (Data Operator)', email: 'operator.krishnapur@bhoomisetu.gov.in', role: 'operator', status: 'active', createdAt: '2025-03-01T11:15:00Z' },
  { id: 'u4', name: 'Subhas Chandra Ghosh (Landowner)', email: 'subhas.ghosh@gmail.com', role: 'citizen', status: 'active', createdAt: '2025-03-12T14:20:00Z' },
  { id: 'u5', name: 'R. K. Banerjee (Vigilance Auditor)', email: 'auditor.dlr@bhoomisetu.gov.in', role: 'auditor', status: 'active', createdAt: '2024-11-20T08:45:00Z' },
  { id: 'u6', name: 'Dr. Sourav Ganguly (System Administrator)', email: 'admin@bhoomisetu.gov.in', role: 'admin', status: 'active', createdAt: '2024-10-01T07:00:00Z' },
]

const mockAuditTrail: AuditEntry[] = [
  { id: 'aud-101', recordId: 'rec-102', userId: 'u2', userName: 'Debashis Roy (Verifier)', action: 'verification_submitted', fieldChanged: 'owner, khasra, area', oldValue: 'Unverified OCR', newValue: 'LR-1402 Validated', reason: 'Ground truth check passed', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { id: 'aud-102', recordId: 'rec-102', userId: 'u1', userName: 'Alok Kumar Sen (RO)', action: 'record_approved', fieldChanged: 'Status', oldValue: 'verified', newValue: 'Published RoR', reason: 'Certified by Revenue Officer', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 'aud-103', recordId: 'rec-105', userId: 'u3', userName: 'Priyanka Das (Operator)', action: 'field_corrected', fieldChanged: 'landClassification', oldValue: 'Unknown', newValue: 'Sali (Agricultural)', reason: 'Manual inspection of schedule', timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString() },
  { id: 'aud-104', recordId: 'rec-250', userId: 'u2', userName: 'Debashis Roy (Verifier)', action: 'record_approved', fieldChanged: 'classification', oldValue: 'Waterbody', newValue: 'KHAL DAAG NO. 250 Canal', reason: 'Public canal classification', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 'aud-105', recordId: 'rec-101', userId: 'u1', userName: 'Alok Kumar Sen (RO)', action: 'record_approved', fieldChanged: 'RoR Ledger', oldValue: 'Draft', newValue: 'Anchored (SHA-256)', reason: 'Blockchain proof stamped', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  { id: 'aud-106', recordId: 'rec-108', userId: 'u3', userName: 'Priyanka Das (Operator)', action: 'user_created', fieldChanged: 'vector_bounds', oldValue: null, newValue: 'POLYGON((421, 108...))', reason: 'Cadastral GIS vector overlay', timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
  { id: 'aud-107', recordId: 'rec-103', userId: 'u2', userName: 'Debashis Roy (Verifier)', action: 'escalated', fieldChanged: 'co_owner', oldValue: 'None', newValue: 'Sourav Bhattacharya (8 Anna)', reason: 'Co-owner share clarification required', timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString() },
]

const mockSystemTelemetry: SystemLog[] = [
  { id: 'log-1', eventType: 'Groq-VLM-Worker', message: 'Model qwen/qwen3.8-27b processed cadastral sheet in 3.12s. Tokens parsed: 428.', level: 'INFO', timestamp: new Date(Date.now() - 1000 * 12).toISOString() },
  { id: 'log-2', eventType: 'NeonPostGIS-Pool', message: 'Active database connections: 8/20. Latency: 24ms. Query load optimal.', level: 'INFO', timestamp: new Date(Date.now() - 1000 * 45).toISOString() },
  { id: 'log-3', eventType: 'PyMuPDF-Vector', message: 'Parsed vector path streams and 524 character glyphs on map Krishnapur JL-42.', level: 'INFO', timestamp: new Date(Date.now() - 1000 * 90).toISOString() },
  { id: 'log-4', eventType: 'Cloudinary-CDN', message: 'Cadastral tile assets cached at edge edge-in-bom-1. Cache hit ratio: 99.4%.', level: 'INFO', timestamp: new Date(Date.now() - 1000 * 180).toISOString() },
  { id: 'log-5', eventType: 'Validation-Engine', message: 'Minor OCR character disambiguation on Bengali Dalil deed I-040201124 resolved via RapidFuzz.', level: 'WARN', timestamp: new Date(Date.now() - 1000 * 300).toISOString() },
]

const mockSubmissionsList: Submission[] = [
  {
    id: 'SUB-2026-0089',
    parcelReference: 'Plot #102, Krishnapur JL 42 (Subhas Ghosh)',
    requestType: 'Mutation',
    status: 'verified',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'SUB-2026-0104',
    parcelReference: 'Plot #105, Krishnapur JL 42 (Debashis Roy)',
    requestType: 'Area Correction',
    status: 'in_verification',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'SUB-2026-0112',
    parcelReference: 'Plot #101, Krishnapur JL 42 (Animesh Halder)',
    requestType: 'Classification Change',
    status: 'submitted',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
]

export const api = {
  auth: {
    completeRegistration: async (name?: string, role?: string) => ({
      ...mockUser,
      name: name || mockUser.name,
      role: role || mockUser.role,
    }),
    me: async () => mockUser,
    updateMe: async () => mockUser,
  },

  users: {
    list: async () => mockUsersList,
    create: async (u: any) => {
      const nu: UserProfile = {
        id: `u-${Date.now().toString().slice(-4)}`,
        name: u.name || 'New Staff',
        email: u.email || 'staff@bhoomisetu.gov.in',
        role: u.role || 'operator',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      mockUsersList.unshift(nu)
      return nu
    },
    updateRole: async (id: string, role: string) => {
      const u = mockUsersList.find(x => x.id === id)
      if (u) u.role = role as any
      return u || { ...mockUser, id, role }
    },
    updateStatus: async (id: string, status: string) => {
      const u = mockUsersList.find(x => x.id === id)
      if (u) u.status = status as any
      return u || { ...mockUser, id, status }
    },
    approve: async (id: string) => {
      const u = mockUsersList.find(x => x.id === id)
      if (u) u.status = 'active'
      return u || { ...mockUser, id, status: 'active' }
    },
    reject: async (id: string) => {
      const u = mockUsersList.find(x => x.id === id)
      if (u) u.status = 'suspended'
      return u || { ...mockUser, id, status: 'suspended' }
    },
    delete: async (id: string) => {
      const idx = mockUsersList.findIndex(x => x.id === id)
      if (idx !== -1) mockUsersList.splice(idx, 1)
      return { success: true }
    },
  },

  settings: {
    get: async () => ({
      ocr_engine: 'groq-vlm-qwen-3.8',
      confidence_threshold: 0.85,
      auto_approve_threshold: 0.95,
      spatial_tolerance_px: 15,
      blockchain_anchoring: true,
      cadastral_crs: 'EPSG:3857 (WGS 84 / Pseudo-Mercator)',
    }),
    update: async (settings: any) => settings,
  },

  submissions: {
    list: async () => mockSubmissionsList,
    mine: async () => mockSubmissionsList,
    create: async (requestType: any, parcelRef?: any) => {
      const newSub: Submission = {
        id: `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        parcelReference: typeof parcelRef === 'string' ? parcelRef : 'Plot #102, Krishnapur JL 42',
        requestType: typeof requestType === 'string' ? requestType : (requestType?.requestType || 'Mutation'),
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      }
      mockSubmissionsList.unshift(newSub)
      return newSub
    },
  },

  dashboard: {
    stats: async () => {
      return tryFetch('/api/dashboard/stats', {}, {
        totalDocuments: 9,
        completedDocuments: 9,
        processingDocuments: 0,
        failedDocuments: 0,
        totalRecords: 9,
        verifiedRecords: 9,
        registeredParcels: 9,
        pendingAdjudication: 3,
        adjudicated: 6,
        recordsPublished: 6,
        averageConfidence: 97.4,
      })
    },
    districtProgress: async () => {
      return tryFetch('/api/dashboard/district-progress', {}, [
        { district: 'Nadia', count: 9 },
        { district: 'North 24 Parganas', count: 4 },
        { district: 'Hooghly', count: 2 },
      ])
    },
    approvalFunnel: async () => [
      { stage: 'Ingested', count: 9 },
      { stage: 'OCR Extracted', count: 9 },
      { stage: 'GIS Parcel Linked', count: 9 },
      { stage: 'Officer Certified', count: 6 },
    ],
  },

  documents: {
    list: async () => {
      return tryFetch<DocumentItem[]>('/api/documents', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<DocumentItem>(`/api/documents/${id}`)
    },
    upload: async (file: File, cloudUrl?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      if (cloudUrl) {
        formData.append('cloud_url', cloudUrl)
      }
      
      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Upload failed')
      }
      return await res.json()
    },
    pages: async (id: string) => {
      return tryFetch<{ totalPages: number; pages: string[] }>(`/api/documents/${id}/pages`)
    },
    reprocess: async (id: string) => {
      return tryFetch(`/api/documents/${id}/reprocess`, { method: 'POST' })
    },
    delete: async (id: string) => {
      return tryFetch<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' })
    },
  },

  records: {
    list: async (params?: { q?: string; district?: string; village?: string; status?: string }) => {
      const query = new URLSearchParams()
      if (params?.q) query.set('q', params.q)
      if (params?.district) query.set('district', params.district)
      if (params?.village) query.set('village', params.village)
      if (params?.status) query.set('status', params.status)
      const qs = query.toString() ? `?${query.toString()}` : ''
      return tryFetch<LandRecord[]>(`/api/records${qs}`, {}, [])
    },
    get: async (id: string) => {
      return tryFetch<LandRecord>(`/api/records/${id}`)
    },
    patch: async (id: string, data: Partial<LandRecord>) => {
      return tryFetch<LandRecord>(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    delete: async (id: string) => {
      return tryFetch<{ success: boolean }>(`/api/records/${id}`, {
        method: 'DELETE',
      })
    },
    validate: async (id: string) => {
      return tryFetch<{ success: boolean; isValidated: boolean; fidelityScore: number; fidelityGrade: string; discrepancies: string[]; record: LandRecord }>(`/api/records/${id}/validate`, {
        method: 'POST',
      })
    },
    history: async (id?: string) => mockAuditTrail,
  },

  verification: {
    queue: async () => {
      return tryFetch<LandRecord[]>('/api/records', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<LandRecord>(`/api/records/${id}`)
    },
    validate: async (id: string) => {
      return tryFetch<{ success: boolean; isValidated: boolean; fidelityScore: number; fidelityGrade: string; discrepancies: string[]; record: LandRecord }>(`/api/records/${id}/validate`, {
        method: 'POST',
      })
    },
    submit: async (id?: string, corrections?: any) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'verified', ...(corrections || {}) }),
        })
      }
      return { status: 'success' }
    },
    saveDraft: async (id?: string, data?: any) => ({ status: 'success' }),
    escalate: async (id?: string, reason?: string) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'escalated' }),
        })
      }
      return { status: 'success' }
    },
  },

  approval: {
    queue: async () => {
      return tryFetch<LandRecord[]>('/api/records', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<LandRecord>(`/api/records/${id}`)
    },
    approve: async (id?: string, comments?: string) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'verified' }),
        })
      }
      return { status: 'success' }
    },
    reject: async (id?: string, comments?: string) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'flagged' }),
        })
      }
      return { status: 'success' }
    },
  },

  parcels: {
    list: async () => {
      return [
        { id: 'pcl-101', parcelCode: '42-101', plotNumber: '101', village: 'Krishnapur', district: 'Nadia', calculatedArea: 14.2, geometryWkt: 'POLYGON((40 30, 150 35, 130 120, 30 110, 40 30))' },
        { id: 'pcl-102', parcelCode: '42-102', plotNumber: '102', village: 'Krishnapur', district: 'Nadia', calculatedArea: 18.5, geometryWkt: 'POLYGON((150 35, 310 40, 280 130, 130 120, 150 35))' },
        { id: 'pcl-105', parcelCode: '42-105', plotNumber: '105', village: 'Krishnapur', district: 'Nadia', calculatedArea: 24.0, geometryWkt: 'POLYGON((130 120, 280 130, 265 245, 110 230, 130 120))' },
        { id: 'pcl-106', parcelCode: '42-106', plotNumber: '106', village: 'Krishnapur', district: 'Nadia', calculatedArea: 12.8, geometryWkt: 'POLYGON((30 110, 130 120, 110 230, 20 215, 30 110))' },
      ]
    },
    search: async (q?: string) => [] as Parcel[],
    get: async (id?: string) => ({} as Parcel),
    spatialValidation: async (id?: string) => ({ match: true, variance: 0 }),
  },

  audit: {
    list: async () => mockAuditTrail,
    trail: async () => mockAuditTrail,
    systemLogs: async () => mockSystemTelemetry,
  },

  logs: {
    list: async () => mockSystemTelemetry,
    systemLogs: async () => mockSystemTelemetry,
  },

  notifications: {
    list: async () => [
      { id: 'n1', message: 'Plot #102 Verified: Dalil I-040201889 matched with 98.5% confidence.', type: 'info', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 'n2', message: 'Cadastral Map Ingested: Mouza Krishnapur JL 42 vectorized with 199 parcels.', type: 'success', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      { id: 'n3', message: 'Adjudication Queue: 3 verified deeds ready for Revenue Officer review.', type: 'warning', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    ],
    markRead: async (id?: string) => {},
    markAllRead: async () => {},
  },

  cadastralMaps: {
    list: async (params?: { state?: string; district?: string; mouza_name?: string; skip?: number; limit?: number }) => {
      const query = new URLSearchParams()
      if (params?.state) query.set('state', params.state)
      if (params?.district) query.set('district', params.district)
      if (params?.mouza_name) query.set('mouza_name', params.mouza_name)
      if (params?.skip !== undefined) query.set('skip', params.skip.toString())
      if (params?.limit !== undefined) query.set('limit', params.limit.toString())
      const qs = query.toString() ? `?${query.toString()}` : ''
      return tryFetch<CadastralMapItem[]>(`/api/cadastral-maps${qs}`, {}, [])
    },
    get: async (id: string) => {
      return tryFetch<CadastralMapItem>(`/api/cadastral-maps/${id}`)
    },
    upload: async (file: File, metadata: { state: string; district: string; mouza_name: string; mouza_no?: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('state', metadata.state)
      formData.append('district', metadata.district)
      formData.append('mouza_name', metadata.mouza_name)
      if (metadata.mouza_no) {
        formData.append('mouza_no', metadata.mouza_no)
      }

      const res = await fetch(`${API_BASE}/api/cadastral-maps/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Upload failed')
      }
      return await res.json()
    },
    reprocess: async (id: string) => {
      return tryFetch<CadastralMapItem>(`/api/cadastral-maps/${id}/reprocess`, { method: 'POST' })
    },
    delete: async (id: string) => {
      return tryFetch<{ success: boolean }>(`/api/cadastral-maps/${id}`, { method: 'DELETE' })
    },
    createPlot: async (mapId: string, plot: { plot_number?: string; polygon_coordinates: [number, number][] }) => {
      return tryFetch<MapPlotItem>(`/api/cadastral-maps/${mapId}/plots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plot),
      })
    },
    patchPlot: async (mapId: string, plotId: string, data: { plot_number?: string; polygon_coordinates?: [number, number][]; status?: string }) => {
      return tryFetch<MapPlotItem>(`/api/cadastral-maps/${mapId}/plots/${plotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    deletePlot: async (mapId: string, plotId: string) => {
      return tryFetch<{ success: boolean }>(`/api/cadastral-maps/${mapId}/plots/${plotId}`, {
        method: 'DELETE',
      })
    },
    assignPlot: async (mapId: string, plotId: string, dalilId: string) => {
      return tryFetch<MapPlotItem>(`/api/cadastral-maps/${mapId}/plots/${plotId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dalil_id: dalilId }),
      })
    },
    unassignPlot: async (mapId: string, plotId: string) => {
      return tryFetch<MapPlotItem>(`/api/cadastral-maps/${mapId}/plots/${plotId}/unassign`, {
        method: 'POST',
      })
    },
  },
}
