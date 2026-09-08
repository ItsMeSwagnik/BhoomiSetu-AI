import {
  UserProfile, DocumentItem, LandRecord, Parcel, AuditEntry,
  SystemLog, Submission, AppNotification, FieldCorrection, ValidationResult, ExtractedField,
  LAND_CLASSIFICATION_OPTIONS, LandClassificationOption
} from './api-types'

export type {
  UserProfile, DocumentItem, LandRecord, Parcel, AuditEntry,
  SystemLog, Submission, AppNotification, FieldCorrection, ValidationResult, ExtractedField,
  LandClassificationOption
}
export { LAND_CLASSIFICATION_OPTIONS }

const rawBase = process.env.NEXT_PUBLIC_API_URL || ''
const API_BASE = rawBase ? rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '') : ''

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
    return await res.json()
  } catch (err) {
    if (fallbackData !== undefined) {
      return fallbackData
    }
    throw err
  }
}

const mockUser: UserProfile = {
  id: 'u1', firebaseUid: 'f1', name: 'Authorized User', email: 'user@bhoomisetu.gov.in',
  role: 'operator', status: 'active', createdAt: new Date().toISOString()
}

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
    list: async () => [mockUser],
    create: async (u: any) => ({ ...mockUser, ...u }),
    updateRole: async (id: string, role: string) => ({ ...mockUser, id, role }),
    updateStatus: async (id: string, status: string) => ({ ...mockUser, id, status }),
    approve: async (id: string) => ({ ...mockUser, id, status: 'active' }),
    reject: async (id: string) => ({ ...mockUser, id, status: 'rejected' }),
    delete: async (id: string) => ({ success: true }),
  },

  settings: {
    get: async () => ({
      ocr_engine: 'groq-vlm',
      confidence_threshold: 0.85,
      auto_approve_threshold: 0.95,
    }),
    update: async (settings: any) => settings,
  },

  submissions: {
    list: async () => [] as Submission[],
    mine: async () => [] as Submission[],
    create: async (sub: any, file?: any) => ({ ...sub, id: 'sub-1', status: 'submitted', submittedAt: new Date().toISOString() }),
  },

  dashboard: {
    stats: async () => {
      return tryFetch('/api/dashboard/stats', {}, {
        totalDocuments: 0,
        completedDocuments: 0,
        processingDocuments: 0,
        failedDocuments: 0,
        totalRecords: 0,
        verifiedRecords: 0,
      })
    },
    districtProgress: async () => {
      return tryFetch('/api/dashboard/district-progress', {}, [])
    },
    approvalFunnel: async () => [],
  },

  documents: {
    list: async () => {
      return tryFetch<DocumentItem[]>('/api/documents', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<DocumentItem>(`/api/documents/${id}`)
    },
    upload: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
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
    history: async (id?: string) => [] as AuditEntry[],
  },

  verification: {
    queue: async () => {
      return tryFetch<LandRecord[]>('/api/records?status=extracted', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<LandRecord>(`/api/records/${id}`)
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
      return tryFetch<LandRecord[]>('/api/records?status=verified', {}, [])
    },
    get: async (id: string) => {
      return tryFetch<LandRecord>(`/api/records/${id}`)
    },
    approve: async (id?: string, comments?: string) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
      }
      return { status: 'success' }
    },
    reject: async (id?: string, comments?: string) => {
      if (id) {
        return tryFetch(`/api/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        })
      }
      return { status: 'success' }
    },
  },

  parcels: {
    list: async () => [] as Parcel[],
    search: async (q?: string) => [] as Parcel[],
    get: async (id?: string) => ({} as Parcel),
    spatialValidation: async (id?: string) => ({ match: true, variance: 0 }),
  },

  audit: {
    list: async () => [] as AuditEntry[],
    trail: async () => [] as AuditEntry[],
    systemLogs: async () => [] as SystemLog[],
  },

  logs: {
    list: async () => [] as SystemLog[],
    systemLogs: async () => [] as SystemLog[],
  },

  notifications: {
    list: async () => [] as AppNotification[],
    markRead: async (id?: string) => {},
    markAllRead: async () => {},
  },
}
