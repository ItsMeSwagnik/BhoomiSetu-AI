'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  Map,
  MapPin,
} from 'lucide-react'

interface CadastralParcel {
  id: string
  plotNumber: string
  owner: string
  textualArea: number
  gisArea: number
  village: string
  status: 'valid' | 'warning'
  polygonPoints: string
  centroid: { x: number; y: number }
}

export default function CadastralGis() {
  const [selectedParcelId, setSelectedParcelId] = useState<string>('P102')
  const [tolerance, setTolerance] = useState<number>(5.0)
  const [showHistoricalShift, setShowHistoricalShift] = useState<boolean>(false)

  const parcels: CadastralParcel[] = [
    {
      id: 'P100',
      plotNumber: '100',
      owner: 'Maheshwar Prasad',
      textualArea: 1.85,
      gisArea: 1.84,
      village: 'Rampur',
      status: 'valid',
      polygonPoints: '40,30 150,35 130,120 30,110',
      centroid: { x: 85, y: 75 },
    },
    {
      id: 'P101',
      plotNumber: '101',
      owner: 'Kusum Devi',
      textualArea: 3.1,
      gisArea: 3.12,
      village: 'Rampur',
      status: 'valid',
      polygonPoints: '150,35 310,40 280,130 130,120',
      centroid: { x: 215, y: 80 },
    },
    {
      id: 'P102',
      plotNumber: '102',
      owner: 'Rajesh Kumar',
      textualArea: 2.45,
      gisArea: 2.58,
      village: 'Rampur',
      status: 'warning',
      polygonPoints: '130,120 280,130 265,245 110,230',
      centroid: { x: 195, y: 180 },
    },
    {
      id: 'P103',
      plotNumber: '103',
      owner: 'Ramphal Yadav',
      textualArea: 1.4,
      gisArea: 1.39,
      village: 'Rampur',
      status: 'valid',
      polygonPoints: '30,110 130,120 110,230 20,215',
      centroid: { x: 70, y: 165 },
    },
  ]

  const activeParcel = parcels.find((p) => p.id === selectedParcelId) || parcels[2]
  const discrepancyPct = Math.abs(
    ((activeParcel.gisArea - activeParcel.textualArea) / activeParcel.textualArea) * 100
  )
  const isOverTolerance = discrepancyPct > tolerance

  return (
    <section className="terra-section" id="cadastre" style={{ background: 'var(--cream)' }}>
      <div className="terra-eyebrow">Spatial Verification</div>
      <div className="solutions-head">
        <h2>
          PostGIS cadastral
          <br />
          <i>alignment.</i>
        </h2>
        <p>
          Connecting OCR textual extractions with surveyed cadastral geometry. Deterministic
          geodesic calculations detect area discrepancies and boundary overlaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Interactive Vector Parcel Map (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-stone-300 dark:border-white/10 p-6 shadow-lg flex flex-col justify-between" style={{ background: 'var(--paper)' }}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-300 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Map size={15} style={{ color: 'var(--forest)' }} />
                <b>Cadastral Sheet: Rampur (Sheet #4)</b>
              </div>
              <span className="font-mono text-stone-500">EPSG:4326 PostGIS</span>
            </div>

            {/* SVG Cadastral Map Canvas */}
            <div className="my-6 p-4 rounded-2xl bg-stone-900 text-white flex items-center justify-center relative min-h-[300px]">
              <svg viewBox="0 0 340 280" className="w-full max-w-sm h-auto">
                {parcels.map((parcel) => {
                  const isSelected = parcel.id === selectedParcelId
                  return (
                    <g
                      key={parcel.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedParcelId(parcel.id)}
                    >
                      <polygon
                        points={parcel.polygonPoints}
                        fill={
                          isSelected
                            ? 'rgba(190, 123, 66, 0.55)'
                            : parcel.status === 'warning'
                            ? 'rgba(217, 155, 91, 0.25)'
                            : 'rgba(50, 77, 58, 0.4)'
                        }
                        stroke={isSelected ? '#e0a062' : '#ffffff40'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all duration-300"
                      />
                      <text
                        x={parcel.centroid.x}
                        y={parcel.centroid.y}
                        fill={isSelected ? '#ffffff' : '#e6eee7'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        Plot {parcel.plotNumber}
                      </text>
                      <text
                        x={parcel.centroid.x}
                        y={parcel.centroid.y + 13}
                        fill={isSelected ? '#fde68a' : '#aeb9ae'}
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {parcel.gisArea} ac
                      </text>
                    </g>
                  )
                })}

                {/* 1968 Historical Boundary ghost */}
                {showHistoricalShift && selectedParcelId === 'P102' && (
                  <polygon
                    points="130,120 280,130 250,225 105,215"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
              </svg>

              <span className="absolute bottom-3 right-4 text-[10px] text-stone-300 font-mono bg-black/60 px-2 py-1 rounded">
                Click any plot to inspect
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 pt-3 border-t border-stone-300 dark:border-stone-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHistoricalShift}
                onChange={(e) => setShowHistoricalShift(e.target.checked)}
                className="rounded"
              />
              <span>Overlay 1968 Historical Cadastral Boundary</span>
            </label>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">ST_IsValid: PASS</span>
          </div>
        </div>

        {/* Right: Geodesic Area Comparison (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-stone-300 dark:border-white/10 p-6 shadow-lg flex flex-col justify-between" style={{ background: 'var(--paper)' }}>
          <div>
            <div className="pb-4 border-b border-stone-300 dark:border-white/10">
              <span className="terra-eyebrow">Geodesic Analysis</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', margin: '4px 0' }}>
                Plot #{activeParcel.plotNumber}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Landowner: {activeParcel.owner} · Mouza {activeParcel.village}
              </p>
            </div>

            <div className="my-5 space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-xs">
                <span>Textual Deed Area:</span>
                <b className="text-sm font-mono">{activeParcel.textualArea} acres</b>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl border border-emerald-600/30 bg-emerald-700/10 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  PostGIS Geodesic Area:
                </span>
                <b className="text-sm font-mono text-emerald-800 dark:text-emerald-300">
                  {activeParcel.gisArea} acres
                </b>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Spatial Variance:</span>
                  <span className="font-mono">{discrepancyPct.toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  {isOverTolerance
                    ? `Variance exceeds ${tolerance}% threshold. Requires officer verification.`
                    : 'Within acceptable boundary surveying tolerance.'}
                </p>
              </div>
            </div>

            {/* Tolerance slider */}
            <div className="p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-800/60 text-xs space-y-2">
              <div className="flex justify-between font-bold">
                <span>Configurable Tolerance:</span>
                <span className="font-mono" style={{ color: 'var(--ochre)' }}>{tolerance}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="border-t border-stone-300 dark:border-stone-700 pt-3 text-xs space-y-1 text-stone-600 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Adjacent Parcel Overlap:</span>
              <b style={{ color: 'var(--forest)' }}>None Detected</b>
            </div>
            <div className="flex justify-between">
              <span>Polygon Self-Intersection:</span>
              <b style={{ color: 'var(--forest)' }}>Clear</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
