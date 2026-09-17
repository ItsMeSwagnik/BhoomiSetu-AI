'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  Scale,
  Users,
} from 'lucide-react'

export default function ValidationEngine() {
  const [activeTab, setActiveTab] = useState<'rules' | 'lineage' | 'entity'>('rules')

  // Rule Test
  const [shareA, setShareA] = useState<number>(60)
  const [shareB, setShareB] = useState<number>(30)
  const [shareC, setShareC] = useState<number>(20)
  const totalShare = shareA + shareB + shareC
  const isShareValid = totalShare === 100

  const [entityConfirmed, setEntityConfirmed] = useState<boolean | null>(null)

  return (
    <section className="terra-section" id="validation" style={{ background: 'var(--paper)' }}>
      <div className="terra-eyebrow">Integrity Architecture</div>
      <div className="solutions-head">
        <h2>
          Validation & anomaly
          <br />
          <i>intelligence.</i>
        </h2>
        <p>
          Deterministic business rules, cross-record historical reconciliation, and RapidFuzz
          entity matching prevent duplicate claims, broken chains of title, and invalid shares.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-300 dark:border-stone-700 pb-3 mb-8 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-2 transition ${
            activeTab === 'rules'
              ? 'border-b-2 font-bold text-stone-900 dark:text-amber-300'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
          style={{
            borderColor: activeTab === 'rules' ? 'var(--ochre)' : 'transparent',
          }}
        >
          Ownership Share Summation Rule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lineage')}
          className={`pb-2 transition ${
            activeTab === 'lineage'
              ? 'border-b-2 font-bold text-stone-900 dark:text-amber-300'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
          style={{
            borderColor: activeTab === 'lineage' ? 'var(--ochre)' : 'transparent',
          }}
        >
          Cross-Record Title Lineage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('entity')}
          className={`pb-2 transition ${
            activeTab === 'entity'
              ? 'border-b-2 font-bold text-stone-900 dark:text-amber-300'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
          style={{
            borderColor: activeTab === 'entity' ? 'var(--ochre)' : 'transparent',
          }}
        >
          Multilingual Entity Resolution
        </button>
      </div>

      {/* Tab Panels */}
      <div
        className="rounded-3xl border border-stone-300 dark:border-white/10 p-6 sm:p-8 shadow-lg"
        style={{ background: 'var(--cream)' }}
      >
        {/* PANEL 1: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div>
              <span className="terra-eyebrow">Deterministic Rule Check</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                Co-Ownership Share Validation
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Land records containing multiple co-sharers must strictly total 100%. Adjust the
                shares below to observe automated detection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Co-Owner A:</span>
                  <span className="font-mono">{shareA}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shareA}
                  onChange={(e) => setShareA(parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Co-Owner B:</span>
                  <span className="font-mono">{shareB}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shareB}
                  onChange={(e) => setShareB(parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Co-Owner C:</span>
                  <span className="font-mono">{shareC}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shareC}
                  onChange={(e) => setShareC(parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                isShareValid
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                  : 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {isShareValid ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <div>
                  <b className="text-sm block">
                    {isShareValid ? 'Valid Share Sum (100%)' : `Share Inconsistency (${totalShare}%)`}
                  </b>
                  <span>
                    {isShareValid
                      ? 'Total shares equal exactly 100%. Complies with Indian Registration standards.'
                      : `Shares total ${totalShare}%. Automatically flagged before updating the registry.`}
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold font-mono ml-4">{totalShare}%</span>
            </div>
          </div>
        )}

        {/* PANEL 2: Lineage */}
        {activeTab === 'lineage' && (
          <div className="space-y-6">
            <div>
              <span className="terra-eyebrow">Title Lineage Reconciliation</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                RoR ↔ Mutation ↔ Registration Lineage
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Automated comparison prevents fraudulent title transfers by identifying skips in
                the legal chain of custody.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold">1. Prior RoR (2018)</span>
                <p className="font-bold text-sm mt-1">Owner: Savitri Devi</p>
                <span className="text-stone-500">Sole Owner · 2.50 acres</span>
              </div>
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold">2. Registration (2020)</span>
                <p className="font-bold text-sm mt-1">Sale: Savitri → Rajesh</p>
                <span className="text-stone-500">Deed #482 Registered</span>
              </div>
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold">3. Mutation (2020)</span>
                <p className="font-bold text-sm mt-1">Order: Savitri → Rajesh</p>
                <span className="text-stone-500">Mutation Case #19/2020</span>
              </div>
              <div className="p-4 rounded-xl border border-rose-400 bg-rose-500/10">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold">4. Draft RoR</span>
                <p className="font-bold text-sm mt-1 text-rose-800 dark:text-rose-200">Claimant: Chandan S.</p>
                <span className="text-rose-600 dark:text-rose-300 font-bold block">Broken Title Link</span>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: Entity */}
        {activeTab === 'entity' && (
          <div className="space-y-6">
            <div>
              <span className="terra-eyebrow">Entity Resolution</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', margin: '4px 0' }}>
                Multilingual Fuzzy Matching (RapidFuzz)
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Identifies probable same-person records across scripts and abbreviations without
                automatically merging identities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-800 text-xs space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">Deed Record (Hindi):</span>
                  <b className="font-serif">राजेश कुमार (सुपुत्र: रामेश्वर शर्मा)</b>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">Mutation Order (English):</span>
                  <b>Rajesh K. Sharma (S/o Rameshwar)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Contextual Evidence:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Same Village (Rampur) & Same Historical Parcel
                  </span>
                </div>
              </div>

              <div className="text-center space-y-3">
                <span className="text-xs font-bold font-mono" style={{ color: 'var(--ochre)' }}>
                  RapidFuzz Match Score: 91%
                </span>
                <p className="text-xs text-stone-500">
                  «The system does not automatically merge identities. A human officer must confirm.»
                </p>
                {entityConfirmed === null ? (
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEntityConfirmed(true)}
                      className="terra-pill dark"
                      style={{ padding: '8px 16px', fontSize: '11px' }}
                    >
                      Confirm Entity Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntityConfirmed(false)}
                      className="under-link"
                      style={{ fontSize: '11px' }}
                    >
                      Keep Separate
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    {entityConfirmed ? 'Entity Association Recorded in Audit Table' : 'Stored as Distinct Individuals'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
