'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sprout,
  User,
  X,
} from 'lucide-react'

interface AuthSlidingProps {
  onClose?: () => void
  isModal?: boolean
  defaultSignUp?: boolean
}

type UserRole = 'Officer' | 'Verifier' | 'Auditor' | 'Admin'

export default function AuthSliding({
  onClose,
  isModal = false,
  defaultSignUp = false,
}: AuthSlidingProps) {
  const [isSignUp, setIsSignUp] = useState(defaultSignUp)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('Officer')
  const [signInEmail, setSignInEmail] = useState('officer.patna@bihar.gov.in')
  const [signInPassword, setSignInPassword] = useState('••••••••••••')
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpDistrict, setSignUpDistrict] = useState('Gaya / Rampur')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'Officer', title: 'Revenue Officer', desc: 'Approve parcels, correct anomalies, sign RoRs' },
    { role: 'Verifier', title: 'Cadastral Verifier', desc: 'Inspect bounding boxes & review low confidence' },
    { role: 'Auditor', title: 'Land Auditor', desc: 'Read-only access to tamper-evident audit logs' },
    { role: 'Admin', title: 'System Admin', desc: 'Manage access, PostGIS layers & DILRMP sync' },
  ]

  const handleQuickDemo = (role: UserRole) => {
    setSelectedRole(role)
    if (role === 'Officer') {
      setSignInEmail('officer.rajesh@bihar.gov.in')
    } else if (role === 'Verifier') {
      setSignInEmail('verifier.priya@wb.gov.in')
    } else if (role === 'Auditor') {
      setSignInEmail('auditor.national@nic.in')
    } else {
      setSignInEmail('admin.bhoomi@digitalindia.gov.in')
    }
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthSuccess(`Authenticated as ${selectedRole}: ${signInEmail}`)
    setTimeout(() => {
      if (onClose) onClose()
      else window.location.href = '/'
    }, 1200)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthSuccess(`Registration submitted for ${signUpName || 'Officer'} (${selectedRole}). Pending supervisor clearance.`)
    setTimeout(() => {
      setIsSignUp(false)
      setAuthSuccess(null)
    }, 1800)
  }

  return (
    <div className={`relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/20 bg-stone-900/90 shadow-2xl backdrop-blur-2xl transition-all duration-700 ${isModal ? 'my-4' : ''}`}>
      {/* Background ambient texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
        style={{ backgroundImage: "url('/auth-landscape.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-stone-900/80 to-stone-950/90" />

      {/* Close button for modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-stone-300 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
        >
          <X size={18} />
        </button>
      )}

      {/* Mobile Tab Switcher (< md) */}
      <div className="relative z-30 flex md:hidden border-b border-white/10 p-2 bg-stone-950/60">
        <button
          type="button"
          onClick={() => setIsSignUp(false)}
          className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-xl transition ${
            !isSignUp ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(true)}
          className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-xl transition ${
            isSignUp ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      {/* Main Split Container */}
      <div className="relative z-10 grid min-h-[640px] grid-cols-1 md:grid-cols-2">
        {/* ================= LEFT HALF ================= */}
        <div
          className={`flex flex-col justify-center px-6 py-10 sm:px-10 transition-all duration-700 ease-in-out ${
            isSignUp ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto md:translate-x-0' : 'opacity-100'
          }`}
        >
          {/* SIGN IN FORM CONTENT */}
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Sprout size={14} /> Official Portal Authentication
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back
              </h2>
              <p className="mt-1 text-xs text-stone-400 sm:text-sm">
                Access your verified land record workspace and cadastral inspection queue.
              </p>
            </div>

            {/* Quick Demo Role Fillers */}
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-stone-300 uppercase">
                <span>Quick Demo Role</span>
                <span className="text-emerald-400">1-Click Fill</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleQuickDemo(r.role)}
                    className={`rounded-lg py-1.5 text-[11px] font-medium transition ${
                      selectedRole === r.role
                        ? 'bg-emerald-600 text-white font-semibold shadow'
                        : 'bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {r.role}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="officer@nic.in"
                    className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-400 outline-none transition focus:border-emerald-500 focus:bg-white/15"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-stone-300">
                    Security Password
                  </label>
                  <a href="#forgot" className="text-xs text-emerald-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder-stone-400 outline-none transition focus:border-emerald-500 focus:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 text-emerald-600 focus:ring-0" />
                  <span>Remember my workstation</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90">
                  <ShieldCheck size={13} /> 256-bit Audit
                </span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/60"
              >
                <span>Sign in as {selectedRole}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Government SSO Divider */}
            <div className="relative my-5 text-center text-xs">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-stone-900 px-3 text-stone-400">
                or federated identity
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAuthSuccess('Connecting to e-Pramaan Single Sign-On...')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10 hover:text-white"
              >
                <Fingerprint size={15} className="text-emerald-400" />
                <span>e-Pramaan SSO</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthSuccess('Authenticating via DILRMP National Land ID...')}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10 hover:text-white"
              >
                <FileCheck2 size={15} className="text-teal-400" />
                <span>DILRMP Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT HALF ================= */}
        <div
          className={`flex flex-col justify-center px-6 py-10 sm:px-10 transition-all duration-700 ease-in-out ${
            !isSignUp ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'
          }`}
        >
          {/* SIGN UP FORM CONTENT */}
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400">
                <ShieldCheck size={14} /> New Officer Registration
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Create Account
              </h2>
              <p className="mt-1 text-xs text-stone-400 sm:text-sm">
                Request access to modern cadastral validation & audit infrastructure.
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Full Name & Designation
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Shri Rajesh Sharma"
                    className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder-stone-400 outline-none transition focus:border-teal-500 focus:bg-white/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Official Government Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="r.sharma@revenue.bihar.gov.in"
                    className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder-stone-400 outline-none transition focus:border-teal-500 focus:bg-white/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    System Role (RBAC)
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-white/15 bg-stone-800 px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  >
                    {roles.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Jurisdiction / Tehsil
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                    <input
                      type="text"
                      value={signUpDistrict}
                      onChange={(e) => setSignUpDistrict(e.target.value)}
                      placeholder="Gaya Tehsil"
                      className="w-full rounded-xl border border-white/15 bg-white/10 pl-7 pr-2 py-2 text-xs text-white placeholder-stone-400 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-10 py-2 text-sm text-white placeholder-stone-400 outline-none transition focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[11px] text-stone-400">
                <span className="font-semibold text-emerald-400">Role Policy:</span> All {selectedRole} accounts require supervisory verification per DILRMP protocol.
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/50 transition hover:from-teal-500 hover:to-emerald-500"
              >
                <span>Submit Authorization Request</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* ================= DESKTOP SLIDING OVERLAY PANEL ================= */}
        {/* Slides left <-> right on desktop with smooth cubic-bezier */}
        <div
          className={`hidden md:block absolute top-0 bottom-0 w-1/2 z-30 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            isSignUp ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="relative h-full w-full overflow-hidden border-x border-white/20 bg-stone-900 shadow-2xl">
            {/* Background image & gradient overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: "url('/auth-landscape.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-emerald-950/80 to-stone-950/70" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />

            {/* Overlay Inner Content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
              {/* Top brand */}
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
                  <Sprout size={18} />
                </span>
                <span className="text-lg font-bold tracking-tight">
                  <span className="text-emerald-400">Bhoomi</span>Setu <span className="text-xs px-1.5 py-0.5 rounded bg-white/20 font-mono">AI</span>
                </span>
              </div>

              {/* Center dynamic pitch */}
              <div className="my-auto space-y-4">
                <span className="inline-block rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold tracking-wider text-emerald-300 uppercase border border-emerald-500/30">
                  {isSignUp ? 'Already Authorized?' : 'Modernizing Indian Cadastre'}
                </span>

                <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-4xl">
                  {isSignUp ? (
                    <>
                      Sign in to your <br />
                      <span className="text-emerald-300 font-serif italic">verified desk</span>
                    </>
                  ) : (
                    <>
                      We don&apos;t just digitize. <br />
                      <span className="text-emerald-300 font-serif italic">We make records trustworthy.</span>
                    </>
                  )}
                </h3>

                <p className="text-sm leading-relaxed text-stone-300">
                  {isSignUp
                    ? 'Access pending verification queues, compare historical mutations, and inspect PostGIS cadastral parcel overlays with instant audit tracking.'
                    : 'Transform legacy handwritten RoRs, cadastral maps, and mutation orders into mathematically validated PostGIS parcel truth.'}
                </p>

                {/* Key feature pills */}
                <div className="pt-2 flex flex-col gap-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>PostGIS spatial truth & polygon overlap detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Multilingual TrOCR for Hindi, Bengali & English</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Cryptographic audit trail with human-in-the-loop control</span>
                  </div>
                </div>
              </div>

              {/* Bottom Sliding Toggle Button */}
              <div className="pt-6 border-t border-white/15">
                <p className="mb-3 text-xs text-stone-400">
                  {isSignUp
                    ? 'Already have an officer account?'
                    : 'New officer, verifier, or department auditor?'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-6 py-2.5 text-xs font-semibold text-emerald-200 backdrop-blur-md transition hover:bg-emerald-500/30 hover:text-white"
                >
                  <span>{isSignUp ? 'Switch to Sign In' : 'Create an Account'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success banner toast */}
      {authSuccess && (
        <div className="absolute inset-x-4 top-4 z-50 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>{authSuccess}</span>
        </div>
      )}
    </div>
  )
}
