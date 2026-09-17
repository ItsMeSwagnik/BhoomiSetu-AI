'use client'

import React, { useState, useEffect } from 'react'
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  Copy,
  Check,
  X,
  Layers,
  FileText,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      const mobileView = window.innerWidth < 1024
      setIsMobile(mobileView)

      // If on mobile and hasn't dismissed the modal in current session
      if (mobileView) {
        const dismissed = sessionStorage.getItem('bhoomisetu-mobile-warning-dismissed')
        if (!dismissed) {
          setShowModal(true)
        }
      } else {
        setShowModal(false)
      }
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const handleDismissModal = () => {
    setShowModal(false)
    sessionStorage.setItem('bhoomisetu-mobile-warning-dismissed', 'true')
  }

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch {
      // Fallback if clipboard API is blocked
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  if (!isMobile) return null

  return (
    <>
      {/* 1. Slim Persistent Warning Banner (when modal is dismissed) */}
      {!showModal && !bannerDismissed && (
        <aside
          aria-label="Mobile viewport warning"
          className="fixed top-0 left-0 right-0 z-[9999] bg-amber-950/95 border-b border-amber-600/40 text-amber-100 px-3 py-2 text-xs backdrop-blur-md shadow-lg flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Monitor size={12} />
            </div>
            <p className="truncate text-[11px] leading-tight text-amber-200">
              <strong className="font-semibold text-white">Desktop / PC Recommended:</strong> GIS vector maps and dual-pane OCR inspection are designed for large screens.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 underline hover:text-white px-1.5 py-0.5"
            >
              Details
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-amber-400/80 hover:text-white rounded"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X size={12} />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Comprehensive Workstation Warning Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-warning-title"
          className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-[#111a14] border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Ambient amber glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Badges */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Monitor size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <AlertTriangle size={10} /> PC Workstation Required
                    </span>
                  </div>
                  <h2 id="mobile-warning-title" className="text-lg sm:text-xl font-bold text-white mt-1">
                    Please Use a Desktop / PC
                  </h2>
                </div>
              </div>
              <button
                onClick={handleDismissModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
                title="Dismiss and view anyway"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4">
              <strong className="text-white font-semibold">BhoomiSetu AI</strong> is an enterprise cadastral intelligence and land records modernization suite. Its core geospatial, OCR audit, and revenue adjudication interfaces are architected specifically for desktop workstations (<span className="font-mono text-amber-300 font-medium">1280×720+</span>).
            </p>

            {/* Feature Constraints Grid */}
            <div className="bg-[#17241c]/80 border border-stone-700/60 rounded-xl p-3.5 space-y-2.5 mb-5 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <Layers size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-100">199-Parcel Cadastral GIS Vector Engine:</strong> Multi-polygon spatial canvas requires high-resolution display and precision mouse/pointer interaction.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-100">Dual-Pane Ground Truth OCR Inspector:</strong> Side-by-side scanned deed PDF renderer with discrepancy bounding box layers cannot fit on mobile screens.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={15} className="text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-100">Multi-Role Adjudication Consoles:</strong> Complex multi-column tables, audit trails, and pagination controls are disabled or constrained on small viewports.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-emerald-200" /> Link Copied! Paste on your PC / Laptop
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Copy Site Link to Open on Desktop
                  </>
                )}
              </button>

              <button
                onClick={handleDismissModal}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 hover:text-white text-xs font-medium border border-stone-700/60 transition-colors cursor-pointer"
              >
                <span>Continue on Mobile (Restricted View)</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 text-center">
              <span className="text-[11px] text-stone-400">
                Digital India Land Records Modernization Programme (DILRMP) Standard
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
