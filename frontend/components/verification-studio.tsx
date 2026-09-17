'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Edit3,
  FileCheck2,
  Map,
  ShieldCheck,
  X,
} from 'lucide-react'

interface ExtractedField {
  id: string
  label: string
  originalTerm: string
  value: string
  confidence: number
  status: 'verified' | 'warning' | 'edited'
  sourceCoord: string
}

export default function VerificationStudio() {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('area')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editValue, setEditValue] = useState<string>('2.58 acres')
  const [auditReason, setAuditReason] = useState<string>(
    'Aligned with Cadastral Map geometry and Line 4 ink annotation'
  )
  const [auditLog, setAuditLog] = useState<string[]>([
    'System: Parsed by Groq Llama 3.2 Vision + OpenCV pipeline',
    'Anomaly: Area variance flagged for authorized officer review',
  ])

  const [fields, setFields] = useState<ExtractedField[]>([
    {
      id: 'owner',
      label: 'Landowner Name',
      originalTerm: 'रैयत का नाम',
      value: 'Savitri Devi',
      confidence: 98,
      status: 'verified',
      sourceCoord: 'Page 1, Box [42, 110, 180, 135]',
    },
    {
      id: 'plot',
      label: 'Plot / Khasra No.',
      originalTerm: 'खेसरा संख्या',
      value: '102',
      confidence: 96,
      status: 'verified',
      sourceCoord: 'Page 1, Box [185, 110, 240, 135]',
    },
    {
      id: 'khatian',
      label: 'Khatian / Khata No.',
      originalTerm: 'खाता / खतियान',
      value: '1042',
      confidence: 95,
      status: 'verified',
      sourceCoord: 'Page 1, Box [245, 110, 300, 135]',
    },
    {
      id: 'area',
      label: 'Recorded Area',
      originalTerm: 'रकबा (एकड़)',
      value: '2.45 acres',
      confidence: 63,
      status: 'warning',
      sourceCoord: 'Page 1, Box [410, 110, 490, 135]',
    },
    {
      id: 'village',
      label: 'Village / Mouza',
      originalTerm: 'मौजा',
      value: 'Rampur',
      confidence: 94,
      status: 'verified',
      sourceCoord: 'Page 1, Box [305, 110, 390, 135]',
    },
  ])

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[3]

  const handleAccept = (id: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'verified', confidence: 100 } : f))
    )
    setAuditLog((prev) => [
      `Officer user_102 accepted field '${fields.find((f) => f.id === id)?.label}'`,
      ...prev,
    ])
  }

  const handleSaveEdit = () => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedFieldId
          ? { ...f, value: editValue, status: 'edited', confidence: 100 }
          : f
      )
    )
    setAuditLog((prev) => [
      `Officer user_102 updated '${selectedField.label}' to '${editValue}' (Reason: ${auditReason})`,
      ...prev,
    ])
    setIsEditing(false)
  }

  return (
    <section className="terra-section record-section" id="records">
      <div className="record-card">
        {/* Left Side: Overview & Active Field Actions */}
        <div>
          <div className="terra-eyebrow">A record in motion</div>
          <h2>See more than a scan.</h2>
          <p>
            Every extracted field stays connected to its source — and every question stays visible
            to the person who can answer it.
          </p>

          {/* Interactive Field Status Inspector */}
          <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-800/80 backdrop-blur-md mb-5 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                Active Selection
              </span>
              <span
                className="font-bold"
                style={{
                  color: selectedField.confidence >= 90 ? 'var(--forest)' : 'var(--ochre)',
                }}
              >
                {selectedField.confidence}% Confidence
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="font-bold">{selectedField.label}:</span>
              <span className="font-mono font-bold" style={{ color: 'var(--ochre)' }}>
                {selectedField.value}
              </span>
            </div>

            <span className="text-[11px] text-stone-500 block font-mono">
              Source: {selectedField.sourceCoord}
            </span>

            {isEditing ? (
              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700 space-y-2">
                <label className="block text-[11px] font-bold">Officer Correction:</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-2 border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
                <label className="block text-[11px] font-bold">Audit Reason:</label>
                <input
                  type="text"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="w-full p-2 border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="terra-pill dark"
                    style={{ padding: '7px 14px', fontSize: '11px' }}
                  >
                    Save & Sign Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="under-link"
                    style={{ fontSize: '11px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAccept(selectedField.id)}
                  className="terra-pill dark"
                  style={{ padding: '8px 14px', fontSize: '11px' }}
                >
                  <Check size={13} /> Accept Field
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="terra-pill light"
                  style={{ padding: '8px 14px', fontSize: '11px' }}
                >
                  <Edit3 size={13} /> Correct Value
                </button>
              </div>
            )}
          </div>

          {/* Relational Audit Stream */}
          <div className="border-t border-stone-300 dark:border-stone-700 pt-3 text-[11px] text-stone-600 dark:text-stone-400 font-mono space-y-1">
            <span className="font-bold text-stone-800 dark:text-stone-200 uppercase block font-sans">
              PostgreSQL Audit Ledger
            </span>
            {auditLog.map((log, i) => (
              <div key={i}>• {log}</div>
            ))}
          </div>
        </div>

        {/* Right Side: Original Paper Deed Simulation */}
        <div className="record-preview">
          <div className="preview-top">
            RECORD #1042 <span>VERIFICATION QUEUE</span>
          </div>
          <div className="preview-paper select-none">
            <small>REVENUE DEPARTMENT</small>
            <strong>LAND RECORD EXTRACT (KHATIAN)</strong>
            <div className="paper-rule" />

            {fields.map((field) => {
              const isSelected = selectedFieldId === field.id
              return (
                <div
                  key={field.id}
                  onClick={() => {
                    setSelectedFieldId(field.id)
                    setEditValue(field.value)
                  }}
                  className={`p-1.5 my-1.5 rounded cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-300/90 dark:bg-amber-500/40 text-stone-900 dark:text-amber-100 font-bold shadow-sm'
                      : 'hover:bg-amber-100/60 dark:hover:bg-stone-800/60 text-stone-800 dark:text-stone-200'
                  }`}
                  style={{ fontSize: '13px' }}
                >
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mr-2">
                    {field.originalTerm}:
                  </span>
                  <span>{field.value}</span>
                </div>
              )
            })}

            <span className="paper-stamp">SOURCE</span>
          </div>

          <div className="record-status">
            <span className="status-dot" /> GIS geometry aligned <b>94%</b>
          </div>
        </div>
      </div>
    </section>
  )
}
