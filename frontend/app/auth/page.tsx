'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/use-theme'
import BrandIcon from '@/components/brand-icon'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileUp,
  Info,
  Layers,
  Map,
  Moon,
  ShieldCheck,
  Sliders,
  Sun,
  User,
} from 'lucide-react'

export type UserRole = 'citizen' | 'operator' | 'verifier' | 'officer' | 'auditor' | 'admin'

export interface RoleOption {
  id: UserRole
  name: string
  officialTitle: string
  icon: typeof User
  category: string
  isStaff: boolean
  description: string
  demoEmail: string
  demoPassword: string
  defaultName: string
}

export const SYSTEM_ROLES: RoleOption[] = [
  {
    id: 'citizen',
    name: 'Citizen / User',
    officialTitle: 'Public Landowner & Applicant',
    icon: User,
    category: 'Public Portal',
    isStaff: false,
    description: 'Search public cadastral records, track mutation requests, and inspect parcel boundaries.',
    demoEmail: 'citizen.rajesh@gmail.com',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'Rajesh Kumar',
  },
  {
    id: 'operator',
    name: 'Data Operator',
    officialTitle: 'Document Ingestion Clerk',
    icon: FileUp,
    category: 'Front-Line Staff',
    isStaff: true,
    description: 'Upload legacy RoR registers, scan cadastral maps, and monitor OCR batch queues.',
    demoEmail: 'data.operator@lrms.gov.in',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'Anil Verma',
  },
  {
    id: 'verifier',
    name: 'Verifier',
    officialTitle: 'Cadastral Surveyor / Reviewer',
    icon: Layers,
    category: 'Technical Review',
    isStaff: true,
    description: 'Review OCR confidence flags, correct transcriptions, and validate PostGIS ST_Area polygons.',
    demoEmail: 'cadastral.verifier@lrms.gov.in',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'Pooja Sharma',
  },
  {
    id: 'officer',
    name: 'Approving Officer',
    officialTitle: 'Revenue Officer / Tehsildar',
    icon: CheckCircle2,
    category: 'Statutory Authority',
    isStaff: true,
    description: 'Adjudicate flagged anomalies, approve final mutated records, and publish verified RoRs to LRMS.',
    demoEmail: 'officer.tehsildar@lrms.gov.in',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'Vikramaditya Sen',
  },
  {
    id: 'auditor',
    name: 'Auditor',
    officialTitle: 'Vigilance & Audit Inspector',
    icon: ShieldCheck,
    category: 'Compliance Oversight',
    isStaff: true,
    description: 'Read-only administrative oversight, compliance inspection, and relational PostgreSQL audit trails.',
    demoEmail: 'vigilance.auditor@cag.gov.in',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'Meenakshi Iyer',
  },
  {
    id: 'admin',
    name: 'System Admin',
    officialTitle: 'Platform Administrator',
    icon: Sliders,
    category: 'System Control',
    isStaff: true,
    description: 'Manage user access permissions, ML pipeline models, LRMS API nodes, and system configuration.',
    demoEmail: 'sysadmin@bhoomisetu.gov.in',
    demoPassword: 'BhoomiSetu@2026',
    defaultName: 'BhoomiSetu Root Admin',
  },
]

export default function AuthPage({ initialSignup = false }: { initialSignup?: boolean }) {
  const router = useRouter()
  const { dark, toggle: toggleTheme } = useTheme()
  const [signup, setSignup] = useState(initialSignup)
  const [selectedRole, setSelectedRole] = useState<UserRole>('officer')
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const activeRoleConfig = SYSTEM_ROLES.find((r) => r.id === selectedRole)!

  const [fullName, setFullName] = useState(activeRoleConfig.defaultName)
  const [email, setEmail] = useState(activeRoleConfig.demoEmail)
  const [password, setPassword] = useState(activeRoleConfig.demoPassword)
  const [confirmPassword, setConfirmPassword] = useState(activeRoleConfig.demoPassword)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const fillRole = (role: RoleOption) => {
    setSelectedRole(role.id)
    setFullName(role.defaultName)
    setEmail(role.demoEmail)
    setPassword(role.demoPassword)
    setConfirmPassword(role.demoPassword)
    setStatusMessage(null)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const roleParam = params.get('role') as UserRole | null

    if (tabParam === 'signup' || tabParam === 'register') setSignup(true)
    else if (tabParam === 'login' || tabParam === 'signin') setSignup(false)

    if (roleParam && SYSTEM_ROLES.some((r) => r.id === roleParam)) {
      fillRole(SYSTEM_ROLES.find((r) => r.id === roleParam)!)
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const ActiveRoleIcon = activeRoleConfig.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)
    try {
      if (signup) {
        if (password !== confirmPassword) {
          setStatusMessage({ type: 'error', text: 'Passwords do not match.' })
          return
        }
        const { api } = await import('@/lib/api')
        await api.auth.completeRegistration(fullName, selectedRole)
        if (typeof window !== 'undefined') {
          localStorage.setItem('bhoomisetu_user', JSON.stringify({
            name: fullName || activeRoleConfig.name,
            email,
            role: selectedRole,
            token: 'bs_session_' + Date.now()
          }))
        }
        setStatusMessage({ type: 'success', text: `Registered as ${activeRoleConfig.name}! Redirecting...` })
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bhoomisetu_user', JSON.stringify({
            name: activeRoleConfig.name,
            email,
            role: selectedRole,
            token: 'bs_session_' + Date.now()
          }))
        }
        setStatusMessage({ type: 'success', text: `Authenticated as ${activeRoleConfig.name}. Accessing portal...` })
      }
      setTimeout(() => router.push(`/dashboard/${selectedRole}`), 800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  const RoleDropdown = () => (
    <div className="role-dropdown-wrap" ref={dropdownRef}>
      <div className="role-dropdown-label">
        <span>Designated Role</span>
        <span className="role-demo-badge">Click to Select</span>
      </div>

      <button
        type="button"
        className={`role-select-trigger ${roleDropdownOpen ? 'is-open' : ''}`}
        onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
        aria-haspopup="listbox"
        aria-expanded={roleDropdownOpen}
      >
        <div className="role-select-trigger-info">
          <ActiveRoleIcon size={16} className="role-trigger-icon" />
          <div className="role-trigger-text">
            <span className="role-trigger-name">{activeRoleConfig.name}</span>
            <span className="role-trigger-sub">{activeRoleConfig.officialTitle}</span>
          </div>
        </div>
        <ChevronDown size={16} className={`role-chevron ${roleDropdownOpen ? 'rotated' : ''}`} />
      </button>

      {roleDropdownOpen && (
        <div className="role-select-dropdown" role="listbox">
          {SYSTEM_ROLES.map((role) => {
            const RoleIcon = role.icon
            const isSelected = selectedRole === role.id
            return (
              <button
                key={role.id}
                type="button"
                className={`role-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => { fillRole(role); setRoleDropdownOpen(false) }}
                role="option"
                aria-selected={isSelected}
              >
                <RoleIcon size={15} className="item-icon" />
                <div className="item-details">
                  <div className="item-header">
                    <span className="item-name">{role.name}</span>
                    <span className="item-badge">{role.category}</span>
                  </div>
                  <span className="item-title">{role.officialTitle}</span>
                </div>
                {isSelected && <Check size={14} className="item-check" />}
              </button>
            )
          })}
        </div>
      )}

      <div className={`role-clearance-notice compact ${activeRoleConfig.isStaff ? 'is-staff' : 'is-public'}`}>
        {activeRoleConfig.isStaff ? (
          <>
            <AlertTriangle size={13} className="notice-icon" />
            <span>
              <strong>Staff Account:</strong> DILRMP/LRMS supervisor authorization required in production.
              <i> (Demo: Pre-cleared).</i>
            </span>
          </>
        ) : (
          <>
            <Info size={13} className="notice-icon" />
            <span>
              <strong>Public Portal:</strong> Open self-service access to digitized cadastre &amp; records.
            </span>
          </>
        )}
      </div>
    </div>
  )

  return (
    <main className={`modern-auth ${signup ? 'is-signup' : ''}`}>
      <div className="auth-landscape" />
      <div className="auth-overlay" />

      <header className="auth-header">
        <Link className="auth-brand" href="/">
          <BrandIcon size={26} />
          <span>Bhoomi<span>Setu</span></span>
        </Link>
        <button className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <div className="auth-shell auth-template-shell">
        <section className="auth-visual">
          <div>
            <small>BHOOMISETU AI</small>
            <h1>
              Trust the
              <br />
              <i>record.</i>
            </h1>
            <p>
              Institutional land intelligence connecting physical archives, PostGIS parcels, and human verification.
            </p>
          </div>

          <div className="auth-role-summary-card compact">
            <div className="auth-role-summary-head">
              <ActiveRoleIcon size={16} />
              <strong>{activeRoleConfig.officialTitle}</strong>
              <span className="auth-role-badge">{activeRoleConfig.category}</span>
            </div>
            <p>{activeRoleConfig.description}</p>
          </div>

          <div className="auth-quote">
            <Map size={16} />
            <span>Every field has a source. <b>Every decision has a trail.</b></span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-tabs">
              <button
                type="button"
                className={!signup ? 'selected' : ''}
                onClick={() => { setSignup(false); setStatusMessage(null); setRoleDropdownOpen(false) }}
              >
                Log in
              </button>
              <button
                type="button"
                className={signup ? 'selected' : ''}
                onClick={() => { setSignup(true); setStatusMessage(null); setRoleDropdownOpen(false) }}
              >
                Register
              </button>
            </div>

            <div className="auth-copy">
              <h2>{signup ? 'Register.' : 'Welcome back.'}</h2>
              <p>Select a role — credentials are filled automatically.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-content">
              {signup && (
                <label>
                  Full Name
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={activeRoleConfig.defaultName}
                  />
                </label>
              )}

              <RoleDropdown />

              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeRoleConfig.demoEmail}
                />
              </label>

              <label>
                Password
                <div className="password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {signup && (
                <label>
                  Confirm Password
                  <div className="password-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                    />
                    <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>
              )}

              {!signup && (
                <a className="forgot" href="#forgot" onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              )}

              {statusMessage && (
                <div className={`auth-status-msg ${statusMessage.type}`}>
                  {statusMessage.type === 'error' ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button type="submit" className="auth-submit">
                <span>
                  {signup
                    ? `Register as ${activeRoleConfig.name.split('/')[0].trim()}`
                    : `Log in as ${activeRoleConfig.name.split('/')[0].trim()}`}
                </span>
                <ArrowRight size={15} />
              </button>
            </form>

            <div className="auth-note">Land Records Management System (LRMS) &amp; DILRMP Compatible</div>

            <Link className="back-home" href="/">
              ← Back to BhoomiSetu Overview
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
