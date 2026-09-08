'use client'

import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { api } from '@/lib/api'

interface PdfViewerProps {
  documentId?: string
  fileUrl?: string | null
  originalFilename?: string
}

export default function PdfViewer({ documentId, fileUrl, originalFilename }: PdfViewerProps) {
  const [pages, setPages] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!documentId) return
    setLoading(true)
    api.documents.pages(documentId)
      .then((data) => {
        if (data?.pages && data.pages.length > 0) {
          setPages(data.pages)
          setCurrentPage(1)
        }
      })
      .catch((err) => {
        console.warn('Could not load rendered pages, falling back to object embed:', err)
      })
      .finally(() => setLoading(false))
  }, [documentId])

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 250))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50))
  const handleResetZoom = () => setZoom(100)
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  const directUrl = fileUrl 
    ? (fileUrl.startsWith('http') || fileUrl.startsWith('blob:') ? fileUrl : `${apiBase}${fileUrl}`)
    : (documentId ? `${apiBase}/api/documents/${documentId}/file` : null)

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-gray-800 text-gray-200">
      {/* Viewer Toolbar */}
      <div className="px-4 py-2 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-gray-400 truncate max-w-[200px]">
          <FileText size={14} className="text-amber-500 flex-shrink-0" />
          <span className="truncate">{originalFilename || 'Document.pdf'}</span>
        </div>

        {/* Page Switcher */}
        {pages.length > 1 && (
          <div className="flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded-lg">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 hover:text-white disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-[11px] px-1">
              {currentPage} / {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pages.length))}
              disabled={currentPage === pages.length}
              className="p-1 hover:text-white disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded hover:bg-gray-800 font-mono text-[11px] text-gray-300"
            title="Reset Zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white"
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-amber-400 ml-1"
              title="Open Raw File"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-950">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <span className="text-xs">Rendering document pages...</span>
          </div>
        ) : pages.length > 0 ? (
          <div
            className="transition-transform duration-150 ease-out origin-center flex items-center justify-center"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={pages[currentPage - 1]}
              alt={`Page ${currentPage}`}
              className="max-w-full rounded shadow-2xl border border-gray-800 bg-white"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        ) : directUrl ? (
          <object
            data={directUrl}
            type="application/pdf"
            className="w-full h-full rounded border border-gray-800 bg-white"
          >
            <div className="text-center p-8 text-gray-400">
              <FileText size={48} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs mb-3">PDF inline preview not supported by browser.</p>
              <a href={directUrl} target="_blank" rel="noopener noreferrer" className="dash-primary-btn text-xs py-1.5 px-3">
                <Download size={14} /> Download Document
              </a>
            </div>
          </object>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No document source available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
