import { auth } from './firebase'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

async function getToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken()
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (!skipAuth) {
    const token = await getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// Auth
export const api = {
  auth: {
    completeRegistration: (name: string, role: string) =>
      request('/auth/complete-registration', {
        method: 'POST',
        body: JSON.stringify({ name, role }),
      }),
    me: () => request<UserProfile>('/auth/me'),
    updateMe: (name: string) =>
      request('/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) }),
  },

  // Dashboard
  dashboard: {
    stats: () => request<Record<string, number | string>>('/dashboard/stats'),
    districtProgress: () => request<{ district: string; count: number }[]>('/analytics/district-progress'),
    approvalFunnel: () => request<{ stage: string; count: number }[]>('/analytics/approval-funnel'),
  },

  // Documents
  documents: {
    list: (params?: { status?: string }) => {
      const qs = params?.status ? `?status=${params.status}` : ''
      return request<DocumentItem[]>(`/documents${qs}`)
    },
    get: (id: string) => request<DocumentItem>(`/documents/${id}`),
    upload: async (file: File, documentType = 'other', village?: string, district?: string) => {
      const token = await getToken()
      const form = new FormData()
      form.append('file', file)
      form.append('document_type', documentType)
      if (village) form.append('village', village)
      if (district) form.append('district', district)
      const res = await fetch(`${BASE}/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'Upload failed')
      }
      return res.json()
    },
    reprocess: (id: string) =>
      request(`/documents/${id}/reprocess`, { method: 'POST' }),
  },

  // Records
  records: {
    list: (params?: { owner?: string; village?: string; district?: string; status?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return request<LandRecord[]>(`/records${qs ? '?' + qs : ''}`)
    },
    get: (id: string) => request<LandRecord>(`/records/${id}`),
    patch: (id: string, body: Record<string, unknown>) =>
      request(`/records/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    history: (id: string) => request<AuditEntry[]>(`/records/${id}/history`),
  },

  // Verification
  verification: {
    queue: () => request<LandRecord[]>('/verification/queue'),
    get: (id: string) => request<LandRecord>(`/verification/${id}`),
    submit: (id: string, corrections: FieldCorrection[], reason?: string) =>
      request(`/verification/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ corrections, reason }),
      }),
    saveDraft: (id: string) =>
      request(`/verification/${id}/save-draft`, { method: 'POST', body: JSON.stringify({}) }),
    escalate: (id: string) =>
      request(`/verification/${id}/escalate`, { method: 'POST', body: JSON.stringify({}) }),
  },

  // Approval
  approval: {
    queue: () => request<LandRecord[]>('/approval/queue'),
    get: (id: string) => request<LandRecord>(`/approval/${id}`),
    approve: (id: string, reason = '') =>
      request(`/approval/${id}/approve`, { method: 'POST', body: JSON.stringify({ reason }) }),
    reject: (id: string, reason: string) =>
      request(`/approval/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },

  // Parcels
  parcels: {
    list: () => request<Parcel[]>('/parcels'),
    search: (village?: string, plotNumber?: string) => {
      const qs = new URLSearchParams({ ...(village && { village }), ...(plotNumber && { plot_number: plotNumber }) }).toString()
      return request<Parcel[]>(`/parcels/search${qs ? '?' + qs : ''}`)
    },
    get: (id: string) => request<Parcel>(`/parcels/${id}`),
    spatialValidation: (id: string) => request(`/parcels/${id}/spatial-validation`),
  },

  // Audit
  audit: {
    trail: (params?: { record_id?: string; action?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return request<AuditEntry[]>(`/audit-trail${qs ? '?' + qs : ''}`)
    },
    systemLogs: () => request<SystemLog[]>('/system-logs'),
  },

  // Users (admin)
  users: {
    list: () => request<UserProfile[]>('/users'),
    create: (body: { name: string; email: string; role: string; password?: string }) =>
      request('/users', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id: string, status: string) =>
      request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  },

  // Settings
  settings: {
    get: () => request<Record<string, unknown>>('/settings'),
    update: (body: Record<string, unknown>) =>
      request('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Submissions
  submissions: {
    mine: () => request<Submission[]>('/submissions/me'),
    create: (requestType: string, parcelReference: string) =>
      request('/submissions', { method: 'POST', body: JSON.stringify({ requestType, parcelReference }) }),
  },

  // Notifications
  notifications: {
    list: () => request<AppNotification[]>('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  },
}

// Types
export interface UserProfile {
  id: string
  firebaseUid: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export interface DocumentItem {
  id: string
  originalFilename: string
  fileType: string
  documentType: string
  status: string
  village: string
  district: string
  uploadedAt: string
  processedAt: string | null
  fileUrl: string
  errorMessage: string | null
  pages: number | null
}

export interface ExtractedField {
  id: string
  fieldName: string
  extractedValue: string
  originalLabel: string
  confidence: number
  bbox: number[]
  pageNumber: number
  isCorrected: boolean
  correctedValue: string | null
}

export interface ValidationResult {
  type: string
  status: string
  message: string
}

export interface LandRecord {
  id: string
  owner: string
  plotNumber: string
  khatianNumber: string
  khasraNumber: string
  village: string
  district: string
  area: number
  areaUnit: string
  landClassification: string
  status: string
  coOwner?: string
  ownerShare?: number
  confidenceScore?: number
  parcelId?: string
  documentId?: string
  mutationNumber?: string
  mutationDate?: string
  previousOwner?: string
  createdAt?: string
  extractedFields?: ExtractedField[]
  validationResults?: ValidationResult[]
  documentUrl?: string
}

export interface Parcel {
  id: string
  parcelCode: string
  plotNumber: string
  village: string
  district: string
  calculatedArea: number
  geometryWkt: string
}

export interface AuditEntry {
  id: string
  action: string
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  timestamp: string
  userId: string
  userName?: string
  recordId?: string
}

export interface SystemLog {
  id: string
  eventType: string
  message: string
  level: string
  timestamp: string
}

export interface Submission {
  id: string
  requestType: string
  parcelReference: string
  status: string
  submittedAt: string
}

export interface AppNotification {
  id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface FieldCorrection {
  fieldId: string
  correctedValue: string
  reason?: string
}
