import { Link } from '@tanstack/react-router'
import { Flame, Sparkles } from 'lucide-react'

import { useProgress } from '@/lib/progress'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none">
      <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background font-display text-xl font-bold leading-none">
        ∞
      </span>
      <span className="font-display text-xl font-bold tracking-tight">Limitless</span>
    </Link>
  )
}

export function SiteHeader() {
  const { progress, loaded } = useProgress()
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <a href="/#how" className="hidden rounded-md px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">
            How it works
          </a>
          <a href="/#topics" className="hidden rounded-md px-2 py-1 text-muted-foreground hover:text-foreground sm:inline">
            Topics
          </a>
          <div
            className="flex items-center gap-3 rounded-full border bg-card px-3 py-1.5 font-medium"
            aria-label="Your stats"
          >
            <span className="flex items-center gap-1" title="Total XP">
              <Sparkles className="size-4 text-primary" aria-hidden />
              {loaded ? progress.xp.toLocaleString() : '—'} XP
            </span>
            <span className="flex items-center gap-1" title="Best streak">
              <Flame className="size-4 text-topic-differentiation" aria-hidden />
              {loaded ? progress.bestStreak : '—'}
            </span>
          </div>
        </nav>
      </div>
    </header>
  )
}
