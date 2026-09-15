'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Edit3,
  Check,
  X,
  Trash2,
  Link as LinkIcon,
  Unlink,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  Eye,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react'
import { CadastralMapItem, MapPlotItem } from '@/lib/api-types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MouzaMapViewerProps {
  mapData: CadastralMapItem
  selectedPlotId?: string | null
  onSelectPlot?: (plot: MapPlotItem | null) => void
  onPlotUpdated?: (updatedPlot: MapPlotItem) => void
  onPlotDeleted?: (plotId: string) => void
  onAssignClick?: (plot: MapPlotItem) => void
  onUnassignClick?: (plot: MapPlotItem) => void
  onReprocessClick?: () => void
  isReprocessing?: boolean
  onSaveVertices?: (plotId: string, coordinates: [number, number][]) => Promise<void>
}

const STATUS_COLORS: Record<string, { stroke: string; fill: string; badge: string }> = {
  assigned: {
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.25)',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  verified: {
    stroke: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  flagged: {
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.28)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  manual: {
    stroke: '#a855f7',
    fill: 'rgba(168, 85, 247, 0.25)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  extracted: {
    stroke: '#3b82f6',
    fill: 'rgba(59, 130, 246, 0.2)',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
}

export function MouzaMapViewer({
  mapData,
  selectedPlotId,
  onSelectPlot,
  onPlotUpdated,
  onPlotDeleted,
  onAssignClick,
  onUnassignClick,
  onReprocessClick,
  isReprocessing,
  onSaveVertices,
}: MouzaMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [hoveredPlot, setHoveredPlot] = useState<MapPlotItem | null>(null)
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null)
  const [editedCoords, setEditedCoords] = useState<[number, number][]>([])
  const [draggingVertexIdx, setDraggingVertexIdx] = useState<number | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const imgWidth = mapData.imageWidth || 1200
  const imgHeight = mapData.imageHeight || 900

  const selectedPlot = mapData.plots?.find((p) => p.id === selectedPlotId) || null

  const getPlotCoords = useCallback((plot?: MapPlotItem | null): [number, number][] => {
    if (!plot) return []
    if (Array.isArray(plot.polygonCoordinates) && plot.polygonCoordinates.length > 0) {
      return plot.polygonCoordinates
    }
    if (Array.isArray((plot as any).coordinates) && (plot as any).coordinates.length > 0) {
      return (plot as any).coordinates
    }
    return []
  }, [])

  // Setup vertex editing when toggled
  const startEditingPlot = (plot: MapPlotItem) => {
    const coords = getPlotCoords(plot)
    setEditingPlotId(plot.id)
    setEditedCoords([...coords])
  }

  const cancelEditing = () => {
    setEditingPlotId(null)
    setEditedCoords([])
    setDraggingVertexIdx(null)
  }

  const handleSaveVertexEdits = async () => {
    if (!editingPlotId || !onSaveVertices) return
    setIsSavingEdit(true)
    try {
      await onSaveVertices(editingPlotId, editedCoords)
      setEditingPlotId(null)
      setEditedCoords([])
      setDraggingVertexIdx(null)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Auto-fit image to container dimensions
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return
    const containerW = containerRef.current.clientWidth || 800
    const containerH = containerRef.current.clientHeight || 600
    const scaleX = (containerW - 24) / imgWidth
    const scaleY = (containerH - 24) / imgHeight
    const fitScale = Math.min(scaleX, scaleY, 1.0)
    const fitZoomVal = Math.max(0.15, fitScale)

    // Center image
    const centeredX = Math.max(0, (containerW - imgWidth * fitZoomVal) / 2)
    const centeredY = Math.max(0, (containerH - imgHeight * fitZoomVal) / 2)

    setZoom(fitZoomVal)
    setPan({ x: centeredX, y: centeredY })
  }, [imgWidth, imgHeight])

  useEffect(() => {
    // Automatically fit to screen when map sheet is loaded
    fitToScreen()
  }, [mapData.id, fitToScreen])

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 6))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.25, 0.2))
  const handleResetZoom = () => fitToScreen()

  // Wheel zoom handler centered on mouse cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current) return

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    const nextZoom = Math.max(0.15, Math.min(6, zoom * zoomFactor))
    if (nextZoom === zoom) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Adjust pan so mouse position remains steady during zoom
    const nextPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom)
    const nextPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom)

    setZoom(nextZoom)
    setPan({ x: nextPanX, y: nextPanY })
  }

  // Pan handlers on container
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof SVGElement && e.target.getAttribute('data-vertex')) {
      return // Don't pan if clicking vertex handle
    }
    if (e.button === 0) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    } else if (draggingVertexIdx !== null && containerRef.current) {
      // Drag vertex in SVG space
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom

      // Constrain within bounds
      const boundedX = Math.round(Math.max(0, Math.min(imgWidth, mouseX)))
      const boundedY = Math.round(Math.max(0, Math.min(imgHeight, mouseY)))

      setEditedCoords((prev) => {
        const next = [...prev]
        next[draggingVertexIdx] = [boundedX, boundedY]
        return next
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingVertexIdx(null)
  }

  // Filter plots based on dropdown filter
  const visiblePlots = (mapData.plots || []).filter((plot) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'flagged') return plot.status === 'flagged'
    if (filterStatus === 'assigned') return plot.status === 'assigned'
    if (filterStatus === 'unassigned') return plot.status !== 'assigned'
    if (filterStatus === 'verified') return plot.status === 'verified'
    return true
  })

  // Format SVG polygon points string
  const formatPoints = (coords?: [number, number][]) => {
    if (!Array.isArray(coords) || coords.length === 0) return ''
    return coords.map(([x, y]) => `${x},${y}`).join(' ')
  }

  const imageUrl = React.useMemo(() => {
    const rawUrl = mapData.cloudinaryUrl || ''
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
    if (mapData.id) {
      return `${apiBase}/api/cadastral-maps/${mapData.id}/image`
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl
    }
    return `${apiBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
  }, [mapData.cloudinaryUrl, mapData.id])

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-200">
              {mapData.mouzaName}
              {mapData.mouzaNo ? ` (JL ${mapData.mouzaNo})` : ''}
            </span>
            <span className="text-xs text-slate-400">
              • {mapData.district}, {mapData.state}
            </span>
          </div>
          <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-xs">
            {mapData.plots?.length || 0} Plots Detected
          </Badge>
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none pr-2 cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All ({mapData.plots?.length || 0})</option>
              <option value="assigned" className="bg-slate-900">Assigned Dalil</option>
              <option value="unassigned" className="bg-slate-900">Unassigned</option>
              <option value="flagged" className="bg-slate-900">Flagged (Low Conf)</option>
              <option value="verified" className="bg-slate-900">Verified</option>
            </select>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700 p-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-slate-400 px-1.5 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={fitToScreen}
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={fitToScreen}
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Reprocess Button */}
          {onReprocessClick && (
            <Button
              size="sm"
              variant="outline"
              disabled={isReprocessing}
              onClick={onReprocessClick}
              className="h-8 text-xs border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              {isReprocessing ? 'Reprocessing...' : 'Re-run CV Extraction'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative flex-1 bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Transform Layer for Zoom & Pan */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning || draggingVertexIdx !== null ? 'none' : 'transform 0.1s ease-out',
            width: `${imgWidth}px`,
            height: `${imgHeight}px`,
          }}
          className="relative origin-top-left"
        >
          {/* Base Mouza Sheet Image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={mapData.mouzaName}
              draggable={false}
              className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none filter contrast-125 brightness-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
              No Map Image Available
            </div>
          )}

          {/* SVG Vector Polygon Overlay */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-auto"
            viewBox={`0 0 ${imgWidth} ${imgHeight}`}
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render all visible polygons */}
            {visiblePlots.map((plot) => {
              const isSelected = selectedPlotId === plot.id
              const isEditing = editingPlotId === plot.id
              const isHovered = hoveredPlot?.id === plot.id
              const coords = isEditing ? editedCoords : getPlotCoords(plot)
              const pointsStr = formatPoints(coords)
              const colors = STATUS_COLORS[plot.status] || STATUS_COLORS.extracted

              return (
                <g key={plot.id} className="cursor-pointer transition-all duration-150">
                  {/* Polygon Shape */}
                  <polygon
                    points={pointsStr}
                    fill={isSelected ? 'rgba(59, 130, 246, 0.45)' : isHovered ? 'rgba(255, 255, 255, 0.25)' : colors.fill}
                    stroke={isSelected ? '#60a5fa' : colors.stroke}
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                    strokeDasharray={plot.status === 'flagged' ? '4 2' : undefined}
                    filter={isSelected ? 'url(#glow)' : undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isEditing) {
                        onSelectPlot?.(plot)
                      }
                    }}
                    onMouseEnter={() => setHoveredPlot(plot)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  />

                  {/* Centroid Plot Number Label */}
                  {plot.centroidX && plot.centroidY && (
                    <g
                      transform={`translate(${plot.centroidX}, ${plot.centroidY})`}
                      className="pointer-events-none"
                    >
                      <rect
                        x="-18"
                        y="-10"
                        width="36"
                        height="20"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke={colors.stroke}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#f8fafc"
                        fontSize="10"
                        fontWeight="bold"
                        className="font-mono select-none"
                      >
                        {plot.plotNumber || 'Plot'}
                      </text>
                    </g>
                  )}

                  {/* Active Vertex Handles if in Editing Mode */}
                  {isEditing &&
                    editedCoords.map(([vx, vy], vIdx) => (
                      <circle
                        key={`v-${vIdx}`}
                        cx={vx}
                        cy={vy}
                        r={6 / zoom + 2}
                        fill="#38bdf8"
                        stroke="#0f172a"
                        strokeWidth={2}
                        data-vertex="true"
                        className="cursor-move hover:scale-125 transition-transform"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setDraggingVertexIdx(vIdx)
                        }}
                      />
                    ))}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredPlot && !editingPlotId && (
          <div
            className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs text-slate-200 z-20 pointer-events-none min-w-[220px]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-white">
                Plot #{hoveredPlot.plotNumber || 'Unnumbered'}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 uppercase font-semibold ${STATUS_COLORS[hoveredPlot.status]?.badge}`}
              >
                {hoveredPlot.status}
              </Badge>
            </div>
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-mono text-slate-200">
                  {Math.round(hoveredPlot.confidenceScore * 100)}%
                </span>
              </div>
              {hoveredPlot.calculatedAreaPx && (
                <div className="flex justify-between">
                  <span>Pixel Area:</span>
                  <span className="font-mono text-slate-200">
                    {Math.round(hoveredPlot.calculatedAreaPx)} px²
                  </span>
                </div>
              )}
              {hoveredPlot.linkedDalil ? (
                <div className="pt-1.5 mt-1.5 border-t border-slate-800 text-emerald-400">
                  <div className="font-medium text-[11px] flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Linked to Dalil Deed
                  </div>
                  <div className="text-slate-300 mt-0.5 font-medium truncate">
                    {hoveredPlot.linkedDalil.owner || 'Unknown Owner'}
                  </div>
                </div>
              ) : (
                <div className="pt-1 mt-1 border-t border-slate-800 text-slate-500 italic">
                  No Dalil assigned yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editing Mode Banner */}
        {editingPlotId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-blue-500/50 rounded-xl px-5 py-2.5 shadow-2xl backdrop-blur-md z-20 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Editing Boundary Vertices (Plot #{selectedPlot?.plotNumber})
              </span>
              <span className="text-[11px] text-slate-400">
                • Drag vertices on the map to adjust geometry
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                disabled={isSavingEdit}
                className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveVertexEdits}
                disabled={isSavingEdit}
                className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                <Check className="w-3 h-3 mr-1" /> {isSavingEdit ? 'Saving...' : 'Save Geometry'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Selected Plot Inspector & Action Bar */}
      {selectedPlot && !editingPlotId && (
        <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Selected: Plot #{selectedPlot.plotNumber || 'Unassigned'}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${STATUS_COLORS[selectedPlot.status]?.badge}`}
                >
                  {selectedPlot.status}
                </Badge>
                {selectedPlot.confidenceScore < 0.7 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px]">
                    <AlertCircle className="w-3 h-3 mr-1" /> Needs Review
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vertices: {getPlotCoords(selectedPlot).length} points • Confidence:{' '}
                {Math.round(selectedPlot.confidenceScore * 100)}%
                {selectedPlot.linkedDalil && (
                  <span className="text-emerald-400 ml-2 font-medium">
                    • Owner: {selectedPlot.linkedDalil.owner} (Khasra: {selectedPlot.linkedDalil.khasra || 'N/A'})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Vertex Edit Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEditingPlot(selectedPlot)}
              className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Adjust Vertices
            </Button>

            {/* Dalil Assignment / Unlink */}
            {selectedPlot.dalilId ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnassignClick?.(selectedPlot)}
                className="h-8 text-xs border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" /> Unlink Dalil
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onAssignClick?.(selectedPlot)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20"
              >
                <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Link with Dalil
              </Button>
            )}

            {/* Delete Plot */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPlotDeleted?.(selectedPlot.id)}
              className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              title="Delete Plot"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
