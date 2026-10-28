import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Flame,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { MathText } from '@/components/math-text'
import { TutorPanel } from '@/components/tutor-panel'
import { Button } from '@/components/ui/button'
import { Progress as ProgressBar } from '@/components/ui/progress'
import { useProgress } from '@/lib/progress'
import { getRound } from '@/lib/quiz.functions'
import type { Question } from '@/lib/question-bank'
import { DIFFICULTIES, getTopic, LEVELS, type Difficulty, type Topic } from '@/lib/topics'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/play/$topic')({
  validateSearch: (search: Record<string, unknown>): { focus?: string } => ({
    focus: typeof search.focus === 'string' && search.focus ? search.focus : undefined,
  }),
  loader: ({ params }) => {
    const topic = getTopic(params.topic)
    if (!topic) throw notFound()
    return { topicId: topic.id }
  },
  head: ({ params }) => ({
    meta: [{ title: `${getTopic(params.topic)?.name ?? 'Quest'} — Limitless` }],
  }),
  component: PlayPage,
})

type Stage = 'briefing' | 'loading' | 'question' | 'feedback' | 'summary'

interface Result {
  question: Question
  chosen: number
  correct: boolean
  confident: boolean
  hintUsed: boolean
  points: number
}

function shuffleOptions(q: Question): Question {
  const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5)
  return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) }
}

function scoreFor(q: Question, correct: boolean, confident: boolean, hintUsed: boolean, streak: number) {
  if (!correct) return 0
  let points: number = LEVELS[q.level - 1].points
  if (hintUsed) points *= 0.5
  if (confident) points *= 1.25
  points *= 1 + Math.min(streak, 5) * 0.1
  return Math.round(points)
}

function PlayPage() {
  const { topicId } = Route.useLoaderData()
  const { focus: focusParam } = Route.useSearch()
  const topic = getTopic(topicId)!
  const focus = useMemo(
    () => (focusParam ?? '').split(',').filter((id) => topic.subskills.some((s) => s.id === id)),
    [focusParam, topic],
  )
  const { recordRound } = useProgress()

  const [stage, setStage] = useState<Stage>('briefing')
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const [round, setRound] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [hintUsed, setHintUsed] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const question = round[index]
  const xp = results.reduce((sum, r) => sum + r.points, 0)

  async function startRound(nextFocus: string[] = focus) {
    setStage('loading')
    setError(null)
    try {
      const questions = await getRound({ data: { topic: topic.id, difficulty, focus: nextFocus } })
      setRound(questions.map(shuffleOptions))
      setIndex(0)
      setSelected(null)
      setHintUsed(false)
      setResults([])
      setStreak(0)
      setBestStreak(0)
      setStage('question')
      window.scrollTo({ top: 0 })
    } catch {
      setError('We could not build your round. Check your connection and try again.')
      setStage('briefing')
    }
  }

  function lockIn(confident: boolean) {
    if (selected === null || !question) return
    const correct = selected === question.correctIndex
    const points = scoreFor(question, correct, confident, hintUsed, streak)
    const nextStreak = correct ? streak + 1 : 0
    setStreak(nextStreak)
    setBestStreak((b) => Math.max(b, nextStreak))
    setResults((r) => [...r, { question, chosen: selected, correct, confident, hintUsed, points }])
    setStage('feedback')
  }

  function next() {
    if (index + 1 >= round.length) {
      recordRound(
        results.map((r) => ({ topic: topic.id, subskill: r.question.subskill, correct: r.correct, confident: r.confident })),
        xp,
        bestStreak,
      )
      setStage('summary')
    } else {
      setIndex(index + 1)
      setSelected(null)
      setHintUsed(false)
      setStage('question')
    }
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {(stage === 'briefing' || stage === 'loading') && (
          <Briefing
            topic={topic}
            focus={focus}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            loading={stage === 'loading'}
            error={error}
            onStart={() => void startRound()}
          />
        )}

        {(stage === 'question' || stage === 'feedback') && question && (
          <>
            <RoundHud topic={topic} index={index} total={round.length} xp={xp} streak={streak} answered={stage === 'feedback'} />
            {stage === 'question' ? (
              <QuestionCard
                question={question}
                selected={selected}
                onSelect={setSelected}
                hintUsed={hintUsed}
                onHint={() => setHintUsed(true)}
                onLockIn={lockIn}
              />
            ) : (
              <Feedback result={results[results.length - 1]} onNext={next} isLast={index + 1 >= round.length} />
            )}
          </>
        )}

        {stage === 'summary' && (
          <Summary
            topic={topic}
            results={results}
            xp={xp}
            bestStreak={bestStreak}
            onReplay={() => void startRound([])}
            onPractiseWeak={(ids) => void startRound(ids)}
          />
        )}
      </main>
    </div>
  )
}

function Briefing({
  topic,
  focus,
  difficulty,
  onDifficulty,
  loading,
  error,
  onStart,
}: {
  topic: Topic
  focus: string[]
  difficulty: Difficulty
  onDifficulty: (d: Difficulty) => void
  loading: boolean
  error: string | null
  onStart: () => void
}) {
  const [tip, setTip] = useState(0)
  useEffect(() => {
    if (!loading) return
    const id = window.setInterval(() => setTip((t) => (t + 1) % topic.keyIdeas.length), 2800)
    return () => window.clearInterval(id)
  }, [loading, topic.keyIdeas.length])

  return (
    <div>
      <Link to="/" hash="topics" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All topics
      </Link>

      <div className={cn('rounded-3xl border-2 bg-card p-6 sm:p-8', topic.color.border)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn('text-sm font-semibold uppercase tracking-wider', topic.color.text)}>Quest briefing</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight">{topic.name}</h1>
            <p className="mt-2 text-muted-foreground">{topic.whyItMatters}</p>
          </div>
          <span className={cn('hidden size-16 shrink-0 place-items-center rounded-2xl text-2xl sm:grid', topic.color.soft, topic.color.text)}>
            <MathText text={`$${topic.symbol}$`} />
          </span>
        </div>

        <h2 className="mt-8 font-display text-lg font-bold">Key ideas to keep in mind</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {topic.keyIdeas.map((idea) => (
            <li key={idea} className={cn('rounded-xl px-4 py-3 text-sm', topic.color.soft)}>
              <MathText text={idea} />
            </li>
          ))}
        </ul>

        {focus.length > 0 && (
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              This round targets your weak spots:{' '}
              <strong>{focus.map((id) => topic.subskills.find((s) => s.id === id)?.name).join(', ')}</strong>
            </span>
          </p>
        )}

        <fieldset className="mt-8" disabled={loading}>
          <legend className="font-display text-lg font-bold">Difficulty</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DIFFICULTIES.map((d) => (
              <label
                key={d.id}
                className={cn(
                  'cursor-pointer rounded-xl border-2 p-4 transition-colors motion-reduce:transition-none has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                  difficulty === d.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                )}
              >
                <input type="radio" name="difficulty" value={d.id} checked={difficulty === d.id} onChange={() => onDifficulty(d.id)} className="sr-only" />
                <span className="block font-semibold">{d.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{d.blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="mt-8" aria-live="polite">
          {loading ? (
            <div className="rounded-2xl bg-muted p-5">
              <p className="flex items-center gap-2 font-medium">
                <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
                AI is writing six fresh questions for you…
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                While you wait: <MathText text={topic.keyIdeas[tip]} />
              </p>
            </div>
          ) : (
            <Button size="lg" onClick={onStart} className="h-12 w-full rounded-xl text-base sm:w-auto sm:px-8">
              <Sparkles aria-hidden /> Generate my round
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function RoundHud({
  topic,
  index,
  total,
  xp,
  streak,
  answered,
}: {
  topic: Topic
  index: number
  total: number
  xp: number
  streak: number
  answered: boolean
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className={cn('font-semibold', topic.color.text)}>
          {topic.name} · Question {index + 1} of {total}
        </span>
        <span className="flex items-center gap-4 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="size-4 text-primary" aria-hidden /> {xp} XP
          </span>
          <span className={cn('flex items-center gap-1', streak >= 2 && 'text-topic-differentiation')}>
            <Flame className="size-4" aria-hidden /> {streak}
          </span>
        </span>
      </div>
      <ProgressBar value={((index + (answered ? 1 : 0)) / total) * 100} aria-label="Round progress" />
    </div>
  )
}

const LETTERS = ['A', 'B', 'C', 'D']

function QuestionCard({
  question,
  selected,
  onSelect,
  hintUsed,
  onHint,
  onLockIn,
}: {
  question: Question
  selected: number | null
  onSelect: (i: number) => void
  hintUsed: boolean
  onHint: () => void
  onLockIn: (confident: boolean) => void
}) {
  const level = LEVELS[question.level - 1]
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-foreground px-2.5 py-1 text-background">
          Level {level.level} · {level.name}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{level.points} pts</span>
      </div>

      <h1 className="mt-5 font-sans text-xl font-medium leading-relaxed sm:text-2xl">
        <MathText text={question.prompt} />
      </h1>

      <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected === i}
            onClick={() => onSelect(i)}
            className={cn(
              'flex items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none',
              selected === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50',
            )}
          >
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-lg font-mono text-sm font-medium',
                selected === i ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {LETTERS[i]}
            </span>
            <span className="min-w-0 overflow-x-auto py-1 text-lg">
              <MathText text={option.text} />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {hintUsed ? (
          <p className="flex items-start gap-2 rounded-xl bg-accent/40 px-4 py-3 text-sm">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
            <MathText text={question.hint} />
          </p>
        ) : (
          <Button variant="ghost" size="sm" onClick={onHint} className="text-muted-foreground">
            <Lightbulb aria-hidden /> Need a hint? (halves points)
          </Button>
        )}
      </div>

      <div className="mt-6 border-t pt-6">
        <p className="mb-3 text-sm text-muted-foreground">
          How confident are you? Being honest here helps you spot what you really know.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" disabled={selected === null} onClick={() => onLockIn(true)} className="h-12 rounded-xl">
            <Check aria-hidden /> Lock in — I'm sure
          </Button>
          <Button size="lg" variant="outline" disabled={selected === null} onClick={() => onLockIn(false)} className="h-12 rounded-xl">
            <CircleHelp aria-hidden /> Lock in — I'm guessing
          </Button>
        </div>
      </div>
    </div>
  )
}

function Feedback({ result, onNext, isLast }: { result: Result; onNext: () => void; isLast: boolean }) {
  const { question, chosen, correct, confident, points } = result
  const [stepsShown, setStepsShown] = useState(correct ? question.steps.length : 1)
  const chosenOption = question.options[chosen]
  const correctOption = question.options[question.correctIndex]

  const verdict = correct
    ? confident
      ? 'Correct — and you knew it.'
      : 'Correct! Your guess was right — make sure you know why.'
    : confident
      ? 'Not quite — and you felt sure, so this is a great one to learn from.'
      : 'Not quite. Good call flagging it as a guess.'

  return (
    <div className="space-y-5">
      <div className={cn('rounded-3xl border-2 p-6 sm:p-8', correct ? 'border-success/50 bg-success/5' : 'border-destructive/40 bg-destructive/5')} aria-live="polite">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={cn('grid size-10 place-items-center rounded-full text-white', correct ? 'bg-success' : 'bg-destructive')}>
              {correct ? <Check aria-hidden /> : <X aria-hidden />}
            </span>
            <p className="font-display text-xl font-bold">{verdict}</p>
          </div>
          {correct && <span className="shrink-0 rounded-full bg-success px-3 py-1 text-sm font-semibold text-success-foreground">+{points} XP</span>}
        </div>

        <div className="mt-5 text-lg">
          <MathText text={question.prompt} />
        </div>

        {!correct && (
          <div className="mt-5 rounded-2xl bg-card p-4">
            <p className="text-sm font-semibold text-destructive">
              You chose <MathText text={chosenOption.text} />
            </p>
            <p className="mt-1 text-sm">
              <span className="font-medium">Likely slip: </span>
              <MathText text={chosenOption.why} />
            </p>
          </div>
        )}
        <div className="mt-3 rounded-2xl bg-card p-4">
          <p className="text-sm font-semibold text-success">
            Correct answer: <MathText text={correctOption.text} />
          </p>
          <p className="mt-1 text-sm">
            <MathText text={correctOption.why} />
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-6" aria-labelledby="solution-heading">
        <h2 id="solution-heading" className="font-display text-lg font-bold">
          Worked solution
        </h2>
        {!correct && stepsShown < question.steps.length && (
          <p className="mt-1 text-sm text-muted-foreground">Try the next step yourself before revealing it.</p>
        )}
        <ol className="mt-4 space-y-3">
          {question.steps.slice(0, stepsShown).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs">{i + 1}</span>
              <span className="min-w-0 overflow-x-auto">
                <MathText text={step} />
              </span>
            </li>
          ))}
        </ol>
        {stepsShown < question.steps.length && (
          <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setStepsShown((n) => n + 1)}>
            Show next step
          </Button>
        )}
        <p className="mt-5 rounded-xl bg-accent/40 px-4 py-3 text-sm">
          <span className="font-semibold">Remember: </span>
          <MathText text={question.keyIdea} />
        </p>
      </section>

      <TutorPanel question={question} chosenIndex={chosen} />

      <div className="flex justify-end">
        <Button size="lg" onClick={onNext} className="h-12 rounded-xl px-8">
          {isLast ? 'See my results' : 'Next question'} <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}

function Summary({
  topic,
  results,
  xp,
  bestStreak,
  onReplay,
  onPractiseWeak,
}: {
  topic: Topic
  results: Result[]
  xp: number
  bestStreak: number
  onReplay: () => void
  onPractiseWeak: (ids: string[]) => void
}) {
  const correctCount = results.filter((r) => r.correct).length
  const sure = results.filter((r) => r.confident)
  const sureRight = sure.filter((r) => r.correct).length
  const guessRight = results.filter((r) => !r.confident && r.correct).length

  const bySkill = topic.subskills
    .map((s) => {
      const rs = results.filter((r) => r.question.subskill === s.id)
      return { ...s, total: rs.length, right: rs.filter((r) => r.correct).length }
    })
    .filter((s) => s.total > 0)
  const weak = bySkill.filter((s) => s.right < s.total).map((s) => s.id)
  const missed = results.filter((r) => !r.correct)

  let calibration = 'Your confidence matched your results well — that is a sign of solid understanding.'
  if (sure.length > 0 && sureRight < sure.length)
    calibration = `You were sure on ${sure.length} and right on ${sureRight}. Revisit the ones you felt sure about but missed — those hide misconceptions.`
  else if (guessRight > 0)
    calibration = `${guessRight} correct ${guessRight === 1 ? 'answer was a guess' : 'answers were guesses'}. Use "Explain it back" on similar questions to turn lucky guesses into real knowledge.`

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <Trophy className="mx-auto size-12 text-topic-limits" aria-hidden />
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Round complete</h1>
        <p className="mt-2 text-muted-foreground">{topic.name}</p>
        <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Score</dt>
            <dd className="font-display text-3xl font-bold">
              {correctCount}/{results.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">XP earned</dt>
            <dd className="font-display text-3xl font-bold text-primary">{xp}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Best streak</dt>
            <dd className="font-display text-3xl font-bold">{bestStreak}</dd>
          </div>
        </dl>
      </div>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-lg font-bold">By subskill</h2>
        <ul className="mt-4 space-y-3">
          {bySkill.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4">
              <span>{s.name}</span>
              <span className="flex gap-1" aria-label={`${s.right} of ${s.total} correct`}>
                {Array.from({ length: s.total }, (_, i) => (
                  <span key={i} className={cn('size-3 rounded-full', i < s.right ? 'bg-success' : 'bg-destructive/60')} />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm">
          <span className="font-semibold">Confidence check: </span>
          {calibration}
        </p>
      </section>

      {missed.length > 0 && (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Review your misses</h2>
          <ul className="mt-4 space-y-4">
            {missed.map((r) => (
              <li key={r.question.id} className="rounded-xl border p-4 text-sm">
                <MathText text={r.question.prompt} className="block" />
                <p className="mt-2 text-destructive">
                  Your answer: <MathText text={r.question.options[r.chosen].text} /> — <MathText text={r.question.options[r.chosen].why} />
                </p>
                <p className="mt-1 text-success">
                  Answer: <MathText text={r.question.options[r.question.correctIndex].text} />
                </p>
                <p className="mt-1 text-muted-foreground">
                  Remember: <MathText text={r.question.keyIdea} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {weak.length > 0 && (
          <Button size="lg" onClick={() => onPractiseWeak(weak.slice(0, 2))} className="h-12 rounded-xl">
            <Target aria-hidden /> Practise my weak spots
          </Button>
        )}
        <Button size="lg" variant={weak.length > 0 ? 'outline' : 'default'} onClick={onReplay} className="h-12 rounded-xl">
          <Sparkles aria-hidden /> New round
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-12 rounded-xl">
          <Link to="/" hash="topics">
            <ArrowLeft aria-hidden /> All topics
          </Link>
        </Button>
      </div>
    </div>
  )
}
