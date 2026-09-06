'use client'

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
} from 'lucide-react'

export default function DashboardView() {
  const metrics = [
    { label: 'Documents Processed', value: '1,250', icon: BarChart3 },
    { label: 'Verified Records', value: '1,130', icon: CheckCircle2 },
    { label: 'Pending Verification', value: '120', icon: Clock },
    { label: 'Average Confidence', value: '91.4%', icon: TrendingUp },
    { label: 'Validation Errors Flagged', value: '86', icon: AlertTriangle },
    { label: 'GIS Discrepancies', value: '31', icon: Layers },
  ]

  const districts = [
    { name: 'Gaya', state: 'Bihar', processed: 420, verified: 390, pct: 92.8 },
    { name: 'Patna', state: 'Bihar', processed: 310, verified: 285, pct: 91.9 },
    { name: 'Nadia', state: 'West Bengal', processed: 280, verified: 245, pct: 87.5 },
    { name: 'Varanasi', state: 'Uttar Pradesh', processed: 240, verified: 210, pct: 87.5 },
  ]

  return (
    <section className="terra-section" id="telemetry" style={{ background: 'var(--cream)' }}>
      <div className="terra-eyebrow">Administrative Monitoring</div>
      <div className="solutions-head">
        <h2>
          Operational clarity &amp;
          <br />
          <i>telemetry.</i>
        </h2>
        <p>
          Real-time metrics on digitization pace, supervisor adjudication queues, and state-wise
          land record integrity.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="p-5 rounded-2xl border border-stone-300 dark:border-white/10 shadow-sm flex flex-col justify-between"
            style={{ background: 'var(--paper)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-stone-500 font-bold leading-tight">{m.label}</span>
              <m.icon size={15} style={{ color: 'var(--ochre)' }} />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-white" style={{ margin: 0 }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Rows */}
      <div
        className="rounded-3xl border border-stone-300 dark:border-white/10 p-6 sm:p-8 shadow-lg"
        style={{ background: 'var(--paper)' }}
      >
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', margin: '0 0 16px' }}>
          District Modernization Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {districts.map((d) => (
            <div key={d.name} className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>
                  {d.name} ({d.state})
                </span>
                <span className="font-mono text-emerald-800 dark:text-amber-400">
                  {d.verified} / {d.processed} ({d.pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 bg-emerald-700 dark:bg-amber-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
