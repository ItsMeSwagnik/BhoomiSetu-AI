'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/use-theme'
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  Layers,
  LogOut,
  Map,
  MapPin,
  Menu,
  Moon,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sun,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import BrandIcon from '@/components/brand-icon'
import { SYSTEM_ROLES, type UserRole } from '@/app/auth/page'

interface DashboardShellProps {
  role: UserRole
  activeSection?: string
  onSectionChange?: (section: string) => void
  children: React.ReactNode
}

export default function DashboardShell({ role, activeSection, onSectionChange, children }: DashboardShellProps) {
  const { dark, toggle: toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const roleConfig = SYSTEM_ROLES.find((r) => r.id === role)!
  const RoleIcon = roleConfig.icon
  const links = getDashboardLinks(role)

  return (
    <div className="dash-root">
      <div className="dash-bg" />
      <div className="dash-bg-overlay" />

      {sidebarOpen && <div className="dash-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-header">
          <Link href="/" className="dash-brand">
            <BrandIcon size={28} />
            <span>Bhoomi<span>Setu</span></span>
          </Link>
          <button className="dash-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="dash-role-pill">
          <RoleIcon size={14} />
          <div>
            <span className="dash-role-name">{roleConfig.name}</span>
            <span className="dash-role-title">{roleConfig.officialTitle}</span>
          </div>
        </div>

        <nav className="dash-nav">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              className={`dash-nav-link ${activeSection === link.label ? 'active' : ''}`}
              onClick={() => {
                onSectionChange?.(link.label)
                setSidebarOpen(false)
              }}
            >
              <link.icon size={15} />
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <Link href="/auth" className="dash-signout">
            <LogOut size={14} />
            <span>Sign out</span>
          </Link>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="dash-topbar-right">
            <button className="dash-icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="dash-notif-dot" />
            </button>
            <button className="dash-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/" className="dash-back-link">
              <ArrowLeft size={14} />
              <span>Home</span>
            </Link>
          </div>
        </header>

        <div className="dash-content">
          {children}
        </div>
      </div>
    </div>
  )
}

function getDashboardLinks(role: UserRole) {
  const maps: Record<UserRole, { label: string; icon: any }[]> = {
    citizen: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'My Parcels', icon: MapPin },
      { label: 'Track Requests', icon: Clock },
      { label: 'Public Records', icon: FileSearch },
    ],
    operator: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'Upload Documents', icon: Upload },
      { label: 'OCR Queue', icon: FileText },
      { label: 'Batch Status', icon: Database },
    ],
    verifier: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'Review Queue', icon: Eye },
      { label: 'OCR Corrections', icon: FileCheck2 },
      { label: 'GIS Validation', icon: Layers },
    ],
    officer: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'Adjudication', icon: UserCheck },
      { label: 'Flagged Records', icon: FileCheck2 },
      { label: 'Cadastral Map', icon: Map },
    ],
    auditor: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'Audit Trails', icon: Shield },
      { label: 'Compliance', icon: ShieldCheck },
      { label: 'Reports', icon: BarChart3 },
    ],
    admin: [
      { label: 'Overview', icon: BarChart3 },
      { label: 'User Management', icon: Users },
      { label: 'ML Pipeline', icon: Sliders },
      { label: 'System Config', icon: Settings },
    ],
  }
  return maps[role]
}
