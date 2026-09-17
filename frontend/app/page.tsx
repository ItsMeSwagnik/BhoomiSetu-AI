'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronDown,
  FileCheck2,
  Map,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import ParcelLifecycle from '@/components/parcel-lifecycle'
import VerificationStudio from '@/components/verification-studio'
import CadastralGis from '@/components/cadastral-gis'
import ValidationEngine from '@/components/validation-engine'
import DashboardView from '@/components/dashboard-view'
import StudyScopeMatrix from '@/components/study-scope-matrix'
import { useScrollReveal } from '@/lib/use-scroll-reveal'
import { useTheme } from '@/lib/use-theme'
import BrandIcon from '@/components/brand-icon'

const navItems = ['Home', 'About', 'Solutions', 'Specs', 'Pipeline', 'Records', 'Cadastre', 'Validation', 'Telemetry', 'Contact']
const solutions = [
  ['Digitize', 'Turn fragile paper archives into structured, searchable land records.'],
  ['Validate', 'Compare extracted details with cadastral geometry and review every mismatch.'],
  ['Assure', 'Keep people, provenance, and approvals at the center of every decision.'],
]

function RevealSection({ children, className, id, style }: {
  children: React.ReactNode
  className?: string
  id?: string
  style?: React.CSSProperties
}) {
  const { ref, visible } = useScrollReveal()
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id={id}
      className={`${className ?? ''} scroll-reveal ${visible ? 'revealed' : ''}`}
      style={style}
    >
      {children}
    </section>
  )
}

export default function Page() {
  const [active, setActive] = useState('Home')
  const [menu, setMenu] = useState(false)
  const { dark, toggle: toggleTheme } = useTheme()

  const handleNavClick = (item: string) => {
    setActive(item)
    setMenu(false)
    const target = document.getElementById(item.toLowerCase())
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="terra-page">
      <section className="terra-hero" id="home">
        <video autoPlay loop muted playsInline className="hero-video">
          <source src="/bhoomisetu bg video.mp4" type="video/mp4" />
        </video>
        <div className="hero-wash" />

        <header className="terra-header">
          <a className="terra-logo" href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('Home') }}>
            <BrandIcon size={30} />
            <span>Bhoomi<span>Setu</span></span>
          </a>

          <nav className={menu ? 'terra-nav nav-open' : 'terra-nav'}>
            {navItems.map((item) => (
              <a
                key={item}
                className={active === item ? 'active' : ''}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => { e.preventDefault(); handleNavClick(item) }}
              >
                {item}
              </a>
            ))}
            <button className="theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/auth" className="terra-pill">
              Get started <ArrowRight size={15} />
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button className="theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="terra-menu" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <div className="hero-content">
          <div className="terra-kicker">
            <span /> AI for accountable land records
          </div>
          <h1>
            Where every acre
            <br />
            has a <i>story.</i>
          </h1>
          <p>
            BhoomiSetu brings clarity to land records — transforming legacy documents into
            verified, living digital infrastructure.
          </p>
          <div className="hero-buttons">
            <Link href="/auth" className="terra-pill light">
              Get started <ArrowRight size={15} />
            </Link>
            <a className="hero-link" href="#pipeline" onClick={(e) => { e.preventDefault(); handleNavClick('Pipeline') }}>
              Explore the system <ChevronDown size={15} />
            </a>
          </div>
        </div>

        <div className="hero-scroll">
          <span /> Scroll to discover
        </div>
      </section>

      <RevealSection className="terra-section terra-intro" id="about">
        <div className="terra-eyebrow">Digital records that respect the original</div>
        <div className="intro-grid">
          <h2>
            Quietly powerful.
            <br />
            <i>Purposefully</i> human.
          </h2>
          <div>
            <p>
              Most digitization treats paper records as images to be filed away. BhoomiSetu treats
              every deed, survey, and ledger as an interconnected history — extracting details with
              precision while preserving human oversight.
            </p>
            <a className="under-link" href="#solutions" onClick={(e) => { e.preventDefault(); handleNavClick('Solutions') }}>
              Learn our approach <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="terra-section solutions" id="solutions">
        <div className="terra-eyebrow">Structured for confidence</div>
        <div className="solutions-head">
          <h2>
            Built around the ways
            <br />
            land records <i>work.</i>
          </h2>
          <p>
            From intake to cadastral alignment, every step gives revenue officers the context they
            need to verify, correct, and preserve ownership history.
          </p>
        </div>
        <div className="solution-grid">
          {solutions.map(([title, desc], i) => (
            <article key={title} style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="solution-number">0{i + 1}</span>
              <div className="solution-icon">
                {i === 0 && <FileCheck2 size={19} />}
                {i === 1 && <Map size={19} />}
                {i === 2 && <ShieldCheck size={19} />}
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </RevealSection>

      <ParcelLifecycle />
      <VerificationStudio />
      <CadastralGis />
      <ValidationEngine />
      <StudyScopeMatrix />
      <DashboardView />

      <RevealSection className="terra-section contact-section" id="contact">
        <div>
          <div className="terra-eyebrow">Begin with confidence</div>
          <h2>
            Make the record
            <br />
            <i>count.</i>
          </h2>
        </div>
        <Link href="/auth" className="terra-pill dark">
          Register for BhoomiSetu <ArrowRight size={15} />
        </Link>
      </RevealSection>

      <footer className="terra-footer">
        <a className="terra-logo dark-logo" href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('Home') }}>
          <BrandIcon size={30} />
          <span>Bhoomi<span>Setu</span></span>
        </a>
        <p>AI-powered land record intelligence for accountable digital public service.</p>
        <small>© 2026 BhoomiSetu AI</small>
      </footer>
    </main>
  )
}
