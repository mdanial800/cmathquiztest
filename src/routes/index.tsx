import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Brain, Gauge, MessageCircleQuestion, RotateCcw, Target } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { MathText } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { mastery, useProgress, type Progress } from '@/lib/progress'
import { TOPICS, type Topic } from '@/lib/topics'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

const PILLARS = [
  {
    icon: Target,
    title: 'Wrong answers that teach',
    body: 'Every distractor is written by AI from a real student misconception. Pick one and you learn exactly which slip you made.',
  },
  {
    icon: Gauge,
    title: 'Confidence check',
    body: 'Lock in each answer as "sure" or "guessing". Limitless tracks how well-calibrated you are — the habit strong learners share.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Explain it back',
    body: 'Put your reasoning into your own words and the AI tutor gives feedback, or ask it for a simpler explanation, an intuition or a fresh example.',
  },
  {
    icon: RotateCcw,
    title: 'Practise weak spots',
    body: 'Mastery is tracked per subskill. One tap builds a new round aimed at the ideas you have not nailed yet.',
  },
]

function Home() {
  const { progress, loaded } = useProgress()

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="paper-grid border-b">
          <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:py-20">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
                <Brain className="size-4 text-primary" aria-hidden />
                AI-powered maths quests for Computing students
              </p>
              <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
                Maths that <span className="text-primary">clicks</span>, one question at a time.
              </h1>
              <p className="mt-6 max-w-reading text-lg text-muted-foreground">
                Limitless is a quiz game for vectors, matrices, limits and differentiation. Every round is freshly
                written by AI, and every answer — right or wrong — comes with a worked solution, the misconception
                behind it, and a tutor you can talk to.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
                  <a href="#topics">
                    Start a quest <ArrowRight aria-hidden />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base">
                  <a href="#how">How it helps you learn</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-sm">
                {TOPICS.map((t) => (
                  <span key={t.id} className={cn('rounded-full border px-3 py-1 font-medium', t.color.soft, t.color.border)}>
                    <MathText text={`$${t.symbol}$`} /> <span className="ml-1">{t.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <img
              src="/img/hero.png"
              width={1200}
              height={896}
              alt="Illustration of vector arrows, a matrix of tiles, a curve approaching its limit and a tangent line"
              className="w-full rounded-3xl border bg-card shadow-sm"
          />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-content scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="max-w-reading">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Built for understanding, not just scores</h2>
            <p className="mt-3 text-muted-foreground">
              Points keep it fun. The real goal is that you leave each round knowing <em>why</em> the answer is what it
              is.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-2xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="topics" className="border-t bg-muted/40 scroll-mt-16">
          <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Choose your quest</h2>
                <p className="mt-2 text-muted-foreground">Six questions per round, scaffolded from Foundation to Challenge.</p>
              </div>
              <StatsStrip progress={progress} loaded={loaded} />
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {TOPICS.map((topic) => (
                <TopicCard key={topic.id} topic={topic} progress={progress} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Limitless — learn the maths behind Computing.</span>
          <span>Your progress is saved on this device.</span>
        </div>
      </footer>
    </div>
  )
}

function StatsStrip({ progress, loaded }: { progress: Progress; loaded: boolean }) {
  const { sureRight, sureWrong } = progress.calibration
  const sure = sureRight + sureWrong
  const stats = [
    { label: 'Rounds played', value: loaded ? progress.rounds : '—' },
    { label: 'Best streak', value: loaded ? progress.bestStreak : '—' },
    { label: '"Sure" answers right', value: loaded && sure > 0 ? `${Math.round((sureRight / sure) * 100)}%` : '—' },
  ]
  return (
    <dl className="flex gap-6 rounded-2xl border bg-card px-5 py-3">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
          <dd className="font-display text-xl font-bold">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TopicCard({ topic, progress }: { topic: Topic; progress: Progress }) {
  const weak = topic.subskills.filter((s) => mastery(progress.skills[s.id]) < 0.6).map((s) => s.id)
  const played = topic.subskills.some((s) => progress.skills[s.id])

  return (
    <article className={cn('flex flex-col rounded-3xl border-2 bg-card p-6 transition-shadow hover:shadow-md motion-reduce:transition-none', topic.color.border)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-bold">{topic.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{topic.tagline}</p>
        </div>
        <span className={cn('grid size-14 shrink-0 place-items-center rounded-2xl text-xl', topic.color.soft, topic.color.text)}>
          <MathText text={`$${topic.symbol}$`} />
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {topic.subskills.map((s) => {
          const m = mastery(progress.skills[s.id])
          return (
            <li key={s.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{Math.round(m * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                <div className={cn('h-full rounded-full transition-all motion-reduce:transition-none', topic.color.bg)} style={{ width: `${m * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Why it matters: </span>
        {topic.whyItMatters}
      </p>

      <div className="mt-6 flex flex-wrap gap-2 pt-1">
        <Button asChild className="rounded-xl">
          <Link to="/play/$topic" params={{ topic: topic.id }}>
            Play {topic.name} <ArrowRight aria-hidden />
          </Link>
        </Button>
        {played && weak.length > 0 && (
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/play/$topic" params={{ topic: topic.id }} search={{ focus: weak.slice(0, 2).join(',') }}>
              <Target aria-hidden /> Practise weak spots
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}
