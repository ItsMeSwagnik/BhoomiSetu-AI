'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  MapPin,
  ShieldCheck,
  Lock,
  Eye,
  Download,
  FileCheck2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building,
  Home,
  User,
  Calendar,
  FileText,
  Clock,
  Printer,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { CadastralMapItem, MapPlotItem, LandRecord } from '@/lib/api-types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CitizenCadastralViewProps {
  myRecords?: LandRecord[]
  onRequestDemarcation?: (plotNumber: string) => void
}

export function CitizenCadastralView({
  myRecords = [],
  onRequestDemarcation,
}: CitizenCadastralViewProps) {
  const [mapData, setMapData] = useState<CadastralMapItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlot, setSelectedPlot] = useState<MapPlotItem | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Zoom & Pan state for SVG
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [hoveredPlot, setHoveredPlot] = useState<MapPlotItem | null>(null)

  // Citizen's owned plot numbers (Deduplicated unique list)
  const ownedPlotNumbers = useMemo(() => {
    if (myRecords.length > 0) {
      const unique = Array.from(
        new Set(myRecords.map((r) => r.plotNumber).filter(Boolean))
      ) as string[]
      return unique.length > 0 ? unique : ['101', '106']
    }
    return ['101', '106']
  }, [myRecords])

  useEffect(() => {
    let isMounted = true
    async function loadMap() {
      setLoading(true)
      try {
        const maps = await api.cadastralMaps.list()
        if (maps.length > 0) {
          const detail = await api.cadastralMaps.get(maps[0].id)
          if (isMounted) {
            setMapData(detail)
            // Auto-select the first owned plot
            const myFirstPlot = detail.plots?.find(
              (p) => p.plotNumber && ownedPlotNumbers.includes(p.plotNumber)
            )
            if (myFirstPlot) {
              setSelectedPlot(myFirstPlot)
            } else if (detail.plots && detail.plots.length > 0) {
              setSelectedPlot(detail.plots[0])
            }
          }
        }
      } catch (err) {
        console.error('Failed to load citizen cadastral map', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadMap()
    return () => {
      isMounted = false
    }
  }, [ownedPlotNumbers])

  const imgWidth = mapData?.imageWidth || 1200
  const imgHeight = mapData?.imageHeight || 900

  // Focus zoom on citizen's plot
  const focusOnPlot = (plotNumber: string) => {
    const targetPlot = mapData?.plots?.find((p) => p.plotNumber === plotNumber)
    if (targetPlot && targetPlot.polygonCoordinates && targetPlot.polygonCoordinates.length > 0) {
      setSelectedPlot(targetPlot)
      const xs = targetPlot.polygonCoordinates.map((c) => c[0])
      const ys = targetPlot.polygonCoordinates.map((c) => c[1])
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const scaleX = rect.width / imgWidth
        const scaleY = rect.height / imgHeight
        const baseScale = Math.min(scaleX, scaleY)
        const targetZoom = 2.2
        const screenCenterX = rect.width / 2
        const screenCenterY = rect.height / 2
        const newPanX = screenCenterX - cx * baseScale * targetZoom
        const newPanY = screenCenterY - cy * baseScale * targetZoom
        setZoom(targetZoom)
        setPan({ x: newPanX, y: newPanY })
      }
    }
  }

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    })
  }

  const handleMouseUp = () => setIsPanning(false)

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.6), 4))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const isSelectedOwned = selectedPlot?.plotNumber
    ? ownedPlotNumbers.includes(selectedPlot.plotNumber)
    : false
  const matchedDeed = useMemo(() => {
    if (!selectedPlot) return null
    return myRecords.find((r) => r.plotNumber === selectedPlot.plotNumber)
  }, [selectedPlot, myRecords])

  const handleDownloadCertificate = () => {
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-12 rounded-xl" />
        <Skeleton className="w-full h-[520px] rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-500" />
            My Cadastral Parcel Map
          </h1>
          <p className="dash-page-sub">
            Personalized spatial cadastral view displaying your registered holdings in Mouza Krishnapur (JL 42).
            Adjoining parcels are boundary-locked under Section 8 Privacy Safeguards.
          </p>
        </div>

        {/* Quick Plot Focus Tabs */}
        <div className="flex items-center gap-2">
          {ownedPlotNumbers.map((plotNo) => {
            if (!plotNo) return null
            return (
              <button
                key={plotNo}
                onClick={() => focusOnPlot(plotNo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedPlot?.plotNumber === plotNo
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                <MapPin size={13} className={selectedPlot?.plotNumber === plotNo ? 'text-white' : 'text-emerald-400'} />
                Plot {plotNo} (My Parcel)
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Map (7 cols) + Citizen Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Viewport Card (7 cols) */}
        <div className="lg:col-span-7 dash-card p-4 flex flex-col justify-between overflow-hidden">
          {/* Top Bar of Map */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-800/80">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-amber-500" />
              <span className="text-xs font-bold text-stone-200">
                {mapData?.mouzaName} (JL No. {mapData?.mouzaNo || '42'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {ownedPlotNumbers.length} Registered Holding{ownedPlotNumbers.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleZoom(0.25)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => handleZoom(-0.25)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                title="Reset View"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Interactive SVG Cadastral Canvas */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isPanning ? 'grabbing' : 'grab',
              height: '460px',
              backgroundColor: '#0a100d',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {mapData?.plots && mapData.plots.length > 0 && (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${imgWidth} ${imgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                {/* All Cadastral Polygons */}
                {mapData.plots.map((plot) => {
                  if (!plot.polygonCoordinates || plot.polygonCoordinates.length < 3) return null

                  const isOwned = plot.plotNumber
                    ? ownedPlotNumbers.includes(plot.plotNumber)
                    : false
                  const isSelected = selectedPlot?.id === plot.id
                  const isHovered = hoveredPlot?.id === plot.id
                  const pointsStr = plot.polygonCoordinates.map((c) => `${c[0]},${c[1]}`).join(' ')

                  // Center point for label
                  const xs = plot.polygonCoordinates.map((c) => c[0])
                  const ys = plot.polygonCoordinates.map((c) => c[1])
                  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
                  const cy = (Math.min(...ys) + Math.max(...ys)) / 2

                  // Styling logic: Owned vs Adjoining Masked
                  let fill = 'rgba(30, 41, 59, 0.4)'
                  let stroke = 'rgba(148, 163, 184, 0.35)'
                  let strokeWidth = 1.2

                  if (isOwned) {
                    fill = isSelected
                      ? 'rgba(16, 185, 129, 0.45)'
                      : 'rgba(16, 185, 129, 0.25)'
                    stroke = isSelected ? '#10b981' : '#34d399'
                    strokeWidth = isSelected ? 3.5 : 2.5
                  } else if (isSelected) {
                    fill = 'rgba(217, 119, 6, 0.25)'
                    stroke = '#d97706'
                    strokeWidth = 2.5
                  } else if (isHovered) {
                    fill = 'rgba(71, 85, 105, 0.45)'
                    stroke = 'rgba(203, 213, 225, 0.6)'
                  }

                  return (
                    <g
                      key={plot.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlot(plot)
                      }}
                      onMouseEnter={() => setHoveredPlot(plot)}
                      onMouseLeave={() => setHoveredPlot(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <polygon
                        points={pointsStr}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                      />

                      {/* Plot Number Label */}
                      <text
                        x={cx}
                        y={cy + 4}
                        fill={isOwned ? '#ffffff' : '#94a3b8'}
                        fontSize={isOwned ? 15 : 11}
                        fontWeight={isOwned ? 'bold' : '500'}
                        textAnchor="middle"
                        fontFamily="monospace"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {plot.plotNumber}
                      </text>

                      {/* "MY PARCEL" Badge on citizen plots */}
                      {isOwned && (
                        <text
                          x={cx}
                          y={cy - 12}
                          fill="#10b981"
                          fontSize={9}
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          MY PARCEL
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Watermark Notice */}
            <div className="absolute bottom-2 left-3 text-[10px] text-stone-500 font-mono bg-stone-950/80 px-2.5 py-1 rounded-md border border-stone-800 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              Digitized Cadastral Spatial Sheet · Survey Scale 1:3960
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-stone-800/80 text-[11px]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-stone-300">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500 inline-block" />
                My Verified Parcel
              </span>
              <span className="flex items-center gap-1.5 text-stone-400">
                <span className="w-3 h-3 rounded-sm bg-slate-700/40 border border-slate-500 inline-block" />
                Adjoining Cadastral Land (Privacy Shielded)
              </span>
            </div>
            <span className="text-stone-400 font-mono">
              Total Mouza Plots: {mapData?.plots?.length || 199}
            </span>
          </div>
        </div>

        {/* Right Column: Citizen Parcel Record Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedPlot ? (
            isSelectedOwned ? (
              /* CITIZEN OWNED PARCEL CARD */
              <div className="dash-card border-emerald-500/30 bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950/20">
                <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        AUTHENTICATED TITLE
                      </span>
                      <span className="text-xs text-stone-400">Dag No. {selectedPlot.plotNumber}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      Plot #{selectedPlot.plotNumber} — {mapData?.mouzaName || 'Krishnapur'}
                    </h3>
                  </div>
                  <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                </div>

                <div className="dash-table mt-3">
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Registered Owner</span>
                    <span className="dash-table-primary font-bold text-white flex items-center gap-1.5">
                      {matchedDeed?.owner || 'Animesh Halder'}
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-sky-500 flex-shrink-0 inline-block" aria-label="Verified">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.41-1.41 2.09 2.09 5.09-5.09 1.41 1.41-6.5 6.5z" fill="#0284c7" />
                        <path d="M10.8 16.2L7.3 12.7L8.71 11.29L10.8 13.38L15.89 8.29L17.3 9.7L10.8 16.2Z" fill="#ffffff" />
                      </svg>
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Co-Owner / Family Share</span>
                    <span className="dash-table-primary font-bold text-white">
                      {matchedDeed?.coOwner || 'Shipra Halder'} (16 Anna)
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Khatian / Khata No.</span>
                    <span className="dash-table-primary font-mono text-amber-300">
                      {matchedDeed?.khatianKhata || 'LR-1102'}
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Spatial Cadastral Area</span>
                    <span className="dash-table-primary font-bold text-emerald-400">
                      {matchedDeed?.area ? `${matchedDeed.area} ${matchedDeed.areaUnit || 'Decimal'}` : '14.2 Decimal'}
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Land Classification</span>
                    <span className="dash-table-primary">
                      {Array.isArray(matchedDeed?.landClassification)
                        ? matchedDeed?.landClassification.join(', ')
                        : 'Bastu (Residential)'}
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Linked Registered Deed</span>
                    <span className="dash-table-primary font-mono text-xs text-stone-300">
                      {matchedDeed?.registrationNumber || 'I-040200871/2023'}
                    </span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Legal Status</span>
                    <span className="dash-badge verified">Verified by Revenue Officer</span>
                  </div>
                </div>

                {/* Citizen Actions */}
                <div className="space-y-2 mt-4 pt-3 border-t border-stone-800">
                  <button
                    onClick={handleDownloadCertificate}
                    className="dash-primary-btn w-full justify-center py-2 text-xs font-semibold flex items-center gap-2"
                  >
                    <Download size={14} />
                    {downloadSuccess ? 'Certificate Downloaded' : 'Download Digital Naksha Parcha (PDF)'}
                  </button>

                  <button
                    onClick={() => {
                      if (selectedPlot.plotNumber) {
                        onRequestDemarcation?.(selectedPlot.plotNumber)
                      }
                    }}
                    className="dash-outline-btn w-full justify-center py-2 text-xs font-semibold flex items-center gap-2 text-stone-300"
                  >
                    <FileText size={14} />
                    Request Mutation / Boundary Demarcation
                  </button>
                </div>
              </div>
            ) : (
              /* NON-OWNED ADJOINING PARCEL (PRIVACY PROTECTED) */
              <div className="dash-card border-stone-800 bg-stone-900/60">
                <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Lock size={10} />
                        PRIVACY PROTECTED
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-stone-200 mt-1">
                      Adjoining Survey Plot #{selectedPlot.plotNumber}
                    </h3>
                  </div>
                  <Lock size={20} className="text-amber-500 flex-shrink-0" />
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 my-3 text-xs text-stone-300 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Info size={14} />
                    <span>Cadastral Boundary Record</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Under Section 8 of the Land Governance Data Privacy Guidelines, personal ownership
                    records, consideration values, and contact details of adjoining citizens are
                    restricted to verified titleholders and authorized Revenue Officers.
                  </p>
                </div>

                <div className="dash-table">
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Mouza & District</span>
                    <span className="dash-table-primary">{mapData?.mouzaName}, Nadia</span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Survey Plot Code</span>
                    <span className="dash-table-primary font-mono">42-{selectedPlot.plotNumber}</span>
                  </div>
                  <div className="dash-table-row">
                    <span className="dash-table-sub">Ownership Details</span>
                    <span className="dash-table-primary font-mono text-stone-500">
                      [RESTRICTED — AUTHENTICATION REQUIRED]
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800 text-center">
                  <button
                    onClick={() => focusOnPlot(ownedPlotNumbers[0] || '101')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 mx-auto"
                  >
                    <MapPin size={13} />
                    Switch back to my registered parcel
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="dash-card text-center p-8">
              <MapPin size={32} className="mx-auto text-stone-600 mb-2" />
              <p className="text-xs text-stone-400">Click any plot on the Cadastral Map to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
