'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  MapPin,
  Upload,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Link as LinkIcon,
  Unlink,
  Trash2,
  Eye,
  FileText,
  Sliders,
  ChevronRight,
  Database,
  Check,
  X,
  Plus,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { CadastralMapItem, MapPlotItem, LandRecord } from '@/lib/api-types'
import { MouzaMapViewer } from '@/components/mouza-map-viewer'
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function MouzaMapStudio() {
  const [maps, setMaps] = useState<CadastralMapItem[]>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [selectedMap, setSelectedMap] = useState<CadastralMapItem | null>(null)
  const [selectedPlot, setSelectedPlot] = useState<MapPlotItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapDetailLoading, setMapDetailLoading] = useState(false)

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formState, setFormState] = useState('West Bengal')
  const [formDistrict, setFormDistrict] = useState('South 24 Parganas')
  const [formMouzaName, setFormMouzaName] = useState('')
  const [formMouzaNo, setFormMouzaNo] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Reprocessing state
  const [isReprocessing, setIsReprocessing] = useState(false)

  // Dalil assignment state
  const [dalilSearchQuery, setDalilSearchQuery] = useState('')
  const [availableDalils, setAvailableDalils] = useState<LandRecord[]>([])
  const [loadingDalils, setLoadingDalils] = useState(false)
  const [assigningPlotId, setAssigningPlotId] = useState<string | null>(null)

  // Plot editing state
  const [editingPlotNumber, setEditingPlotNumber] = useState('')
  const [isSavingPlotNumber, setIsSavingPlotNumber] = useState(false)

  // Search/Filter for Mouza Maps list
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch all Cadastral Maps
  const loadMaps = useCallback(async (selectFirst = false) => {
    setLoading(true)
    try {
      const data = await api.cadastralMaps.list()
      setMaps(data)
      if (selectFirst && data.length > 0 && !selectedMapId) {
        setSelectedMapId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load cadastral maps', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMapId])

  // 2. Fetch selected map details with plots
  const loadMapDetail = useCallback(async (mapId: string) => {
    setMapDetailLoading(true)
    try {
      const detail = await api.cadastralMaps.get(mapId)
      setSelectedMap(detail)
      // Reset or update selected plot
      if (selectedPlot) {
        const updated = detail.plots?.find((p) => p.id === selectedPlot.id) || null
        setSelectedPlot(updated)
      }
    } catch (err) {
      console.error('Failed to load map detail', err)
    } finally {
      setMapDetailLoading(false)
    }
  }, [selectedPlot])

  // 3. Fetch Dalil records for linking
  const loadDalilRecords = useCallback(async (district?: string) => {
    setLoadingDalils(true)
    try {
      const records = await api.records.list({ district: district || undefined, q: dalilSearchQuery || undefined })
      setAvailableDalils(records)
    } catch (err) {
      console.error('Failed to load dalil records', err)
    } finally {
      setLoadingDalils(false)
    }
  }, [dalilSearchQuery])

  useEffect(() => {
    loadMaps(true)
  }, [loadMaps])

  useEffect(() => {
    if (selectedMapId) {
      loadMapDetail(selectedMapId)
    } else {
      setSelectedMap(null)
      setSelectedPlot(null)
    }
  }, [selectedMapId, loadMapDetail])

  useEffect(() => {
    if (selectedPlot) {
      setEditingPlotNumber(selectedPlot.plotNumber || '')
      loadDalilRecords(selectedMap?.district)
    }
  }, [selectedPlot, selectedMap?.district, loadDalilRecords])

  // Handle map upload & pipeline
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !formMouzaName) return

    setIsUploading(true)
    setUploadError(null)
    setUploadStage(1) // Stage 1: Cloudinary upload

    try {
      const timer1 = setTimeout(() => setUploadStage(2), 700) // Stage 2: OpenCV contours
      const res = await api.cadastralMaps.upload(uploadFile, {
        state: formState,
        district: formDistrict,
        mouza_name: formMouzaName,
        mouza_no: formMouzaNo || undefined,
      })
      clearTimeout(timer1)
      setUploadStage(3) // Stage 3: PostGIS sync
      await new Promise((r) => setTimeout(r, 400))

      setShowUploadModal(false)
      setUploadFile(null)
      setFormMouzaName('')
      setFormMouzaNo('')
      await loadMaps()
      if (res?.id) {
        setSelectedMapId(res.id)
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and process mouza map.')
    } finally {
      setIsUploading(false)
      setUploadStage(0)
    }
  }

  // Handle Re-run CV Extraction
  const handleReprocess = async () => {
    if (!selectedMapId) return
    setIsReprocessing(true)
    try {
      const updated = await api.cadastralMaps.reprocess(selectedMapId)
      setSelectedMap(updated)
      setSelectedPlot(null)
    } catch (err: any) {
      alert(`Reprocessing failed: ${err.message}`)
    } finally {
      setIsReprocessing(false)
    }
  }

  // Handle Vertex Adjustment Save (PATCH /plots/{plot_id})
  const handleSaveVertices = async (plotId: string, coordinates: [number, number][]) => {
    if (!selectedMapId) return
    try {
      const updatedPlot = await api.cadastralMaps.patchPlot(selectedMapId, plotId, {
        polygon_coordinates: coordinates,
        status: 'verified',
      })
      // Optimistic state update in memory
      setSelectedMap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          plots: prev.plots?.map((p) => (p.id === plotId ? updatedPlot : p)),
        }
      })
      setSelectedPlot(updatedPlot)
    } catch (err: any) {
      alert(`Failed to save geometry: ${err.message}`)
    }
  }

  // Handle Plot Number Save
  const handleSavePlotNumber = async () => {
    if (!selectedMapId || !selectedPlot) return
    setIsSavingPlotNumber(true)
    try {
      const updatedPlot = await api.cadastralMaps.patchPlot(selectedMapId, selectedPlot.id, {
        plot_number: editingPlotNumber,
      })
      setSelectedMap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          plots: prev.plots?.map((p) => (p.id === selectedPlot.id ? updatedPlot : p)),
        }
      })
      setSelectedPlot(updatedPlot)
    } catch (err: any) {
      alert(`Failed to update plot number: ${err.message}`)
    } finally {
      setIsSavingPlotNumber(false)
    }
  }

  // Handle Dalil Assign
  const handleAssignDalil = async (dalilId: string) => {
    if (!selectedMapId || !selectedPlot) return
    setAssigningPlotId(selectedPlot.id)
    try {
      const updatedPlot = await api.cadastralMaps.assignPlot(selectedMapId, selectedPlot.id, dalilId)
      setSelectedMap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          plots: prev.plots?.map((p) => (p.id === selectedPlot.id ? updatedPlot : p)),
        }
      })
      setSelectedPlot(updatedPlot)
    } catch (err: any) {
      alert(`Failed to assign Dalil: ${err.message}`)
    } finally {
      setAssigningPlotId(null)
    }
  }

  // Handle Dalil Unassign
  const handleUnassignDalil = async (plot: MapPlotItem) => {
    if (!selectedMapId) return
    try {
      const updatedPlot = await api.cadastralMaps.unassignPlot(selectedMapId, plot.id)
      setSelectedMap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          plots: prev.plots?.map((p) => (p.id === plot.id ? updatedPlot : p)),
        }
      })
      if (selectedPlot?.id === plot.id) {
        setSelectedPlot(updatedPlot)
      }
    } catch (err: any) {
      alert(`Failed to unassign Dalil: ${err.message}`)
    }
  }

  // Handle Delete Plot
  const handleDeletePlot = async (plotId: string) => {
    if (!selectedMapId || !confirm('Delete this plot polygon?')) return
    try {
      await api.cadastralMaps.deletePlot(selectedMapId, plotId)
      setSelectedMap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          plots: prev.plots?.filter((p) => p.id !== plotId),
        }
      })
      if (selectedPlot?.id === plotId) {
        setSelectedPlot(null)
      }
    } catch (err: any) {
      alert(`Failed to delete plot: ${err.message}`)
    }
  }

  // Handle Delete Map
  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Delete this Mouza Map sheet and all extracted plots?')) return
    try {
      await api.cadastralMaps.delete(mapId)
      setMaps((prev) => prev.filter((m) => m.id !== mapId))
      if (selectedMapId === mapId) {
        const next = maps.find((m) => m.id !== mapId)
        setSelectedMapId(next ? next.id : null)
      }
    } catch (err: any) {
      alert(`Failed to delete map: ${err.message}`)
    }
  }

  const filteredMaps = maps.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      m.mouzaName.toLowerCase().includes(q) ||
      m.district.toLowerCase().includes(q) ||
      (m.mouzaNo && m.mouzaNo.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title flex items-center gap-2">
            <Layers className="text-amber-500" size={24} /> Cadastral Mouza Map Studio
          </h1>
          <p className="dash-page-sub">
            Upload Mouza survey sheets, auto-extract parcel boundaries via OpenCV contours + OCR, adjust geometries, and link plots to Dalil deeds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="dash-primary-btn text-xs py-2 px-4 shadow-lg shadow-amber-900/20"
          >
            <Upload size={14} className="mr-1.5" /> Upload Mouza Sheet
          </Button>
          <Button
            variant="outline"
            onClick={() => loadMaps()}
            className="dash-outline-btn text-xs py-2 px-3"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Sidebar (Sheets List) + Center/Right Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Mouza Sheets Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="dash-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mouza Sheets ({maps.length})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by Mouza, JL, District..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Map List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 space-y-2">
                      <Skeleton className="w-24 h-4 rounded" />
                      <Skeleton className="w-36 h-3 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredMaps.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  <FolderOpen size={28} className="mx-auto mb-2 text-gray-400 opacity-60" />
                  No Mouza sheets found. Click <strong>Upload Mouza Sheet</strong> to begin.
                </div>
              ) : (
                filteredMaps.map((m) => {
                  const isSelected = selectedMapId === m.id
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMapId(m.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-amber-500/70 bg-amber-500/10 shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-black/5 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="truncate">
                          <div className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                            {m.mouzaName} {m.mouzaNo ? `(JL ${m.mouzaNo})` : ''}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {m.district}, {m.state}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMap(m.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-opacity"
                          title="Delete Sheet"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-200/50 dark:border-gray-800/50 text-[10px]">
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                          {m.plotsCount !== undefined ? m.plotsCount : (m as any).totalPlots !== undefined ? (m as any).totalPlots : m.plots?.length || 0} Plots
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 border-gray-300 dark:border-gray-700 uppercase"
                        >
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Center/Right: Interactive Mouza GIS Viewer + Inspector (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {mapDetailLoading ? (
            <div className="dash-card h-[680px] flex flex-col items-center justify-center p-8 text-center">
              <Loader2 size={36} className="text-amber-500 animate-spin mb-3" />
              <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                Loading Mouza Vector Geometries...
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Retrieving canonical PostGIS WKT boundaries and Dalil linkages.
              </p>
            </div>
          ) : selectedMap ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* GIS Vector Canvas (8 cols on xl) */}
              <div className="xl:col-span-8 h-[680px]">
                <MouzaMapViewer
                  mapData={selectedMap}
                  selectedPlotId={selectedPlot?.id}
                  onSelectPlot={(plot) => setSelectedPlot(plot)}
                  onPlotDeleted={handleDeletePlot}
                  onAssignClick={(plot) => setSelectedPlot(plot)}
                  onUnassignClick={handleUnassignDalil}
                  onReprocessClick={handleReprocess}
                  isReprocessing={isReprocessing}
                  onSaveVertices={handleSaveVertices}
                />
              </div>

              {/* Right Plot & Dalil Inspector (4 cols on xl) */}
              <div className="xl:col-span-4 space-y-4">
                {/* Selected Plot Panel */}
                {selectedPlot ? (
                  <div className="dash-card p-4 space-y-4 border-amber-500/40">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                          Parcel Details
                        </span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          Plot #{selectedPlot.plotNumber || 'Unassigned'}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs uppercase ${
                          selectedPlot.status === 'assigned'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : selectedPlot.status === 'verified'
                            ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                            : selectedPlot.status === 'flagged'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        }`}
                      >
                        {selectedPlot.status}
                      </Badge>
                    </div>

                    {/* Editable Plot Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-500">Edit Plot Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingPlotNumber}
                          onChange={(e) => setEditingPlotNumber(e.target.value)}
                          placeholder="e.g. 248/A"
                          className="flex-1 text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                        />
                        <Button
                          size="sm"
                          disabled={isSavingPlotNumber || editingPlotNumber === selectedPlot.plotNumber}
                          onClick={handleSavePlotNumber}
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          {isSavingPlotNumber ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                        </Button>
                      </div>
                    </div>

                    {/* Spatial Geometry Info */}
                    <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Boundary Vertices:</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200">
                          {(selectedPlot.polygonCoordinates || (selectedPlot as any).coordinates || []).length} nodes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-mono text-gray-900 dark:text-gray-200">
                          {Math.round(selectedPlot.confidenceScore * 100)}%
                        </span>
                      </div>
                      {selectedPlot.calculatedAreaPx && (
                        <div className="flex justify-between">
                          <span>Pixel Area:</span>
                          <span className="font-mono text-gray-900 dark:text-gray-200">
                            {Math.round(selectedPlot.calculatedAreaPx)} px²
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dalil Deed Assignment Flow */}
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <LinkIcon size={12} /> Dalil (Deed) Record Link
                        </h4>
                      </div>

                      {selectedPlot.linkedDalil ? (
                        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-bold text-emerald-400">
                                {selectedPlot.linkedDalil.owner || 'Unknown Owner'}
                              </div>
                              <div className="text-[11px] text-gray-300 font-mono mt-0.5">
                                Khasra: {selectedPlot.linkedDalil.khasra || 'N/A'} • {selectedPlot.linkedDalil.area || 'N/A'}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {selectedPlot.linkedDalil.mouza || selectedMap.mouzaName}, {selectedPlot.linkedDalil.district}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignDalil(selectedPlot)}
                              className="h-7 text-[11px] text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                            >
                              <Unlink size={12} className="mr-1" /> Unlink
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[11px] text-gray-500">
                            Search digitized Dalil deed records in {selectedMap.district} to assign to Plot #{selectedPlot.plotNumber}:
                          </p>

                          {/* Search Dalil Deeds */}
                          <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search Khasra or Owner..."
                              value={dalilSearchQuery}
                              onChange={(e) => setDalilSearchQuery(e.target.value)}
                              className="w-full pl-7 pr-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                            />
                          </div>

                          {/* Matching Dalil List */}
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                            {loadingDalils ? (
                              <div className="p-2 text-center text-xs text-gray-500">
                                <Loader2 size={14} className="animate-spin inline mr-1" /> Searching deeds...
                              </div>
                            ) : availableDalils.length === 0 ? (
                              <div className="p-3 text-center text-[11px] text-gray-500 italic bg-black/5 dark:bg-white/5 rounded-lg">
                                No matching deeds found. Ingest deeds in &quot;Upload Documents&quot;.
                              </div>
                            ) : (
                              availableDalils.slice(0, 5).map((dalil) => (
                                <div
                                  key={dalil.id}
                                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs hover:border-amber-500/50 transition-colors"
                                >
                                  <div className="truncate pr-2">
                                    <div className="font-semibold truncate text-gray-900 dark:text-gray-100">
                                      {dalil.owner || 'Unknown'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate">
                                      Khasra: {dalil.khasra || 'N/A'} • {dalil.area || 'N/A'}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    disabled={assigningPlotId === selectedPlot.id}
                                    onClick={() => handleAssignDalil(dalil.id)}
                                    className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium shrink-0"
                                  >
                                    <LinkIcon size={10} className="mr-1" /> Link
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="dash-card p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <Sliders size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Select a Plot Boundary</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        Click on any parcel on the map to inspect properties, adjust vertices, or link with a Dalil deed.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Extracted by OpenCV
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Linked to Dalil Deed
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Flagged / Low Confidence
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dash-card h-[600px] flex flex-col items-center justify-center p-8 text-center">
              <Layers size={40} className="text-gray-400 opacity-60 mb-3" />
              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">No Mouza Map Selected</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Select a Mouza sheet from the left sidebar or upload a new cadastral map to start interactive GIS digitization.
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 dash-primary-btn text-xs py-2 px-4"
              >
                <Upload size={14} className="mr-1.5" /> Upload Mouza Sheet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Mouza Sheet Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Upload Cadastral Mouza Map</h3>
                  <p className="text-xs text-gray-500">Auto-extract parcel polygons and synchronize with PostGIS</p>
                </div>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {isUploading ? (
              <div className="py-8 text-center space-y-4">
                <Loader2 size={32} className="animate-spin text-amber-500 mx-auto" />
                <div>
                  <h4 className="font-semibold text-sm">
                    {uploadStage === 1 && 'Uploading high-res sheet to Cloudinary CDN...'}
                    {uploadStage === 2 && 'Executing OpenCV contour detection & OCR on parcels...'}
                    {uploadStage === 3 && 'Persisting canonical PostGIS WKT polygon geometries...'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{uploadFile?.name}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      placeholder="e.g. West Bengal"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">District *</label>
                    <input
                      type="text"
                      required
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      placeholder="e.g. South 24 Parganas"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mouza Name *</label>
                    <input
                      type="text"
                      required
                      value={formMouzaName}
                      onChange={(e) => setFormMouzaName(e.target.value)}
                      placeholder="e.g. Barasat"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mouza / JL No.</label>
                    <input
                      type="text"
                      value={formMouzaNo}
                      onChange={(e) => setFormMouzaNo(e.target.value)}
                      placeholder="e.g. 112"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Mouza Sheet File (PDF, PNG, TIFF, JPEG) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.tiff"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-black/5 dark:bg-white/5 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!uploadFile || !formMouzaName}
                    className="dash-primary-btn text-xs py-1.5 px-4"
                  >
                    <Sparkles size={13} className="mr-1.5" /> Start CV Extraction
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
