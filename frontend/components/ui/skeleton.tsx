import React from 'react'

export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="dash-stat-card">
      <div className="flex items-center justify-between w-full mb-2">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="w-10 h-3 rounded" />
      </div>
      <Skeleton className="w-20 h-7 rounded my-1" />
      <Skeleton className="w-28 h-3 rounded mt-1" />
    </div>
  )
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800/60 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-3">
          <Skeleton
            className={`h-4 ${
              i === 0
                ? 'w-36'
                : i === 1
                ? 'w-24'
                : i === cols - 1
                ? 'w-16 ml-auto'
                : 'w-20'
            }`}
          />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({
  rows = 5,
  cols = 6,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="w-36 h-4 rounded" />
              <Skeleton className="w-52 h-3 rounded" />
            </div>
          </div>
          <Skeleton className="w-16 h-6 rounded-md" />
        </div>
      ))}
    </div>
  )
}
