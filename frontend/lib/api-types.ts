export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  firebaseUid?: string
}

export interface DocumentItem {
  id: string
  originalFilename: string
  fileType?: string
  documentType?: string
  status: string
  village?: string
  district?: string
  uploadedAt?: string
  createdAt?: string
  processedAt?: string | null
  fileUrl?: string
  fileSize?: number
  errorMessage?: string | null
  pages?: number | null
  recordId?: string
  khasra?: string
  owner?: string
}

export interface ExtractedField {
  id: string
  fieldName: string
  extractedValue: string
  originalLabel: string
  confidence: number
  bbox?: number[]
  pageNumber?: number
  isCorrected?: boolean
  correctedValue?: string | null
}

export interface ValidationResult {
  type: string
  status: string
  message: string
}

export interface FieldVerification {
  field: string
  label: string
  extractedValue: string
  matchStatus: 'VERIFIED_MATCH' | 'PROBABLE_MATCH' | 'UNVERIFIED_IN_TEXT' | 'DISCREPANCY'
  matchScore: number
  matchType: string
  pdfContextSnippet?: string
  pageNumber?: number
  notes?: string
}

export interface ValidationScorecard {
  overallFidelityScore: number
  fidelityGrade: 'A+' | 'A' | 'B' | 'C' | 'FLAGGED'
  verifiedFieldsCount: number
  partialFieldsCount: number
  flaggedFieldsCount: number
  totalFieldsChecked: number
  isPdfTextLayerAvailable: boolean
  discrepancies: string[]
  fieldVerifications: FieldVerification[]
  timestamp: string
}

export interface LandRecord {
  id: string
  documentId?: string
  owner?: string
  coOwner?: string
  share?: string
  khatianKhata?: string
  khasra?: string
  dag?: string
  plotNumber?: string
  surveyNumber?: string
  area?: string
  areaUnit?: string
  village?: string
  mouza?: string
  tehsilTaluk?: string
  district?: string
  landClassification?: string[]
  mutationNumber?: string
  mutationDate?: string
  registrationNumber?: string
  registrationDate?: string
  previousOwner?: string
  newOwner?: string
  confidenceScore?: number
  ocrModelUsed?: string
  isValidated?: boolean
  rawOcrResponse?: Record<string, any>
  validationScorecard?: ValidationScorecard
  status: string
  createdAt?: string
  updatedAt?: string
  extractedFields?: ExtractedField[]
  validationResults?: ValidationResult[]
  document?: {
    id: string
    originalFilename: string
    fileUrl?: string
    status: string
  }
}

export interface LandClassificationOption {
  label: string
  value: string
  desc: string
  iconKey: string
}

export const LAND_CLASSIFICATION_OPTIONS: LandClassificationOption[] = [
  { label: 'Agricultural Land', value: 'Agricultural Land', desc: 'Land used for cultivation / crops', iconKey: 'Sprout' },
  { label: 'Residential Land', value: 'Residential Land', desc: 'Land used for houses / flats / residential buildings', iconKey: 'Home' },
  { label: 'Commercial Land', value: 'Commercial Land', desc: 'Shops, offices, commercial activities', iconKey: 'Building2' },
  { label: 'Industrial Land', value: 'Industrial Land', desc: 'Factories, plants and industrial zones', iconKey: 'Factory' },
  { label: 'Forest Land', value: 'Forest Land', desc: 'Forested and protected green reserves', iconKey: 'Trees' },
  { label: 'Pasture / Grazing Land', value: 'Pasture/Grazing Land', desc: 'Land designated for livestock grazing', iconKey: 'Tractor' },
  { label: 'Water Bodies', value: 'Water Bodies', desc: 'Ponds, lakes, canals, tanks, rivers', iconKey: 'Droplets' },
  { label: 'Road / Public Infrastructure', value: 'Road/Public Land', desc: 'Highways, roads and public rights-of-way', iconKey: 'Navigation' },
  { label: 'Government Land', value: 'Government Land', desc: 'Land owned / vested in State or Union Govt', iconKey: 'Landmark' },
  { label: 'Abadi / Village Settlement', value: 'Abadi / Village Settlement', desc: 'Built-up rural habitation & Gram Sabha area', iconKey: 'Users' },
  { label: 'Barren / Uncultivable Land', value: 'Barren / Uncultivable Land', desc: 'Arid, rocky or uncultivable terrain', iconKey: 'ShieldAlert' },
  { label: 'Wasteland', value: 'Wasteland', desc: 'Degraded or marshy non-utilized tracts', iconKey: 'Mountain' },
  { label: 'Religious / Institutional', value: 'Religious/Institutional Land', desc: 'Temples, schools, hospitals, public trusts', iconKey: 'Scale' },
]

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

export interface LinkedDalilSummary {
  id: string
  khasra?: string
  owner?: string
  district?: string
  mouza?: string
  area?: string
  status?: string
}

export interface MapPlotItem {
  id: string
  mapId: string
  plotNumber?: string
  geometryWkt: string
  polygonCoordinates: [number, number][]
  centroidX?: number | null
  centroidY?: number | null
  calculatedAreaPx?: number | null
  confidenceScore: number
  status: 'extracted' | 'flagged' | 'verified' | 'assigned' | 'manual'
  dalilId?: string | null
  linkedDalil?: LinkedDalilSummary | null
  createdAt?: string
  updatedAt?: string
}

export interface CadastralMapItem {
  id: string
  state: string
  district: string
  mouzaName: string
  mouzaNo?: string | null
  cloudinaryUrl: string
  cloudinaryPublicId?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  scaleFactor?: number | null
  status: 'processing' | 'ready' | 'failed'
  uploadedBy?: string | null
  uploadedAt?: string
  plotsCount?: number
  plots?: MapPlotItem[]
}
