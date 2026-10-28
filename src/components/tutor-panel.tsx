import { useState } from 'react'
import { Bot, Eye, Lightbulb, Loader2, Repeat, Send } from 'lucide-react'

import { MathBlock } from '@/components/math-text'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { askTutor, type TutorMode } from '@/lib/quiz.functions'
import type { Question } from '@/lib/question-bank'
import { cn } from '@/lib/utils'

interface Turn {
  role: 'student' | 'tutor'
  text: string
}

const QUICK_ACTIONS: { mode: TutorMode; label: string; icon: typeof Lightbulb; studentText: string }[] = [
  { mode: 'simpler', label: 'Explain more simply', icon: Lightbulb, studentText: 'Can you explain that more simply?' },
  { mode: 'intuition', label: 'Show the intuition', icon: Eye, studentText: 'What is the intuition behind this?' },
  { mode: 'example', label: 'Give me a similar one', icon: Repeat, studentText: 'Give me a similar problem to try.' },
]

export function TutorPanel({ question, chosenIndex }: { question: Question; chosenIndex: number }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [inputMode, setInputMode] = useState<'check-reasoning' | 'ask'>('check-reasoning')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(mode: TutorMode, studentText: string, message = '') {
    setPending(true)
    setError(null)
    setTurns((t) => [...t, { role: 'student', text: studentText }])
    try {
      const { reply } = await askTutor({
        data: {
          mode,
          question: question.prompt,
          options: question.options.map((o) => o.text),
          correctIndex: question.correctIndex,
          chosenIndex,
          steps: question.steps,
          message,
        },
      })
      setTurns((t) => [...t, { role: 'tutor', text: reply }])
    } catch {
      setError('The tutor could not answer just now. Please try again.')
      setTurns((t) => t.slice(0, -1))
    } finally {
      setPending(false)
    }
  }

  function submitDraft(e: { preventDefault: () => void }) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    void send(inputMode, text, text)
  }

  return (
    <section aria-labelledby="tutor-heading" className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Bot className="size-5" aria-hidden />
        </span>
        <div>
          <h3 id="tutor-heading" className="font-display text-lg font-bold leading-tight">
            AI tutor
          </h3>
          <p className="text-xs text-muted-foreground">Ask anything about this question — or explain it back to lock it in.</p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {turns.length > 0 && (
          <ol className="space-y-3" aria-live="polite">
            {turns.map((turn, i) => (
              <li
                key={i}
                className={cn(
                  'max-w-[92%] rounded-2xl px-4 py-3 text-sm',
                  turn.role === 'student' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {turn.role === 'tutor' ? <MathBlock text={turn.text} /> : turn.text}
              </li>
            ))}
          </ol>
        )}
        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Thinking…
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ mode, label, icon: Icon, studentText }) => (
            <Button key={mode} variant="outline" size="sm" className="rounded-full" disabled={pending} onClick={() => void send(mode, studentText)}>
              <Icon aria-hidden /> {label}
            </Button>
          ))}
        </div>

        <form onSubmit={submitDraft} className="space-y-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm" role="tablist" aria-label="Message type">
            {(
              [
                ['check-reasoning', 'Explain it back'],
                ['ask', 'Ask a question'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={inputMode === mode}
                onClick={() => setInputMode(mode)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 font-medium transition-colors motion-reduce:transition-none',
                  inputMode === mode ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor="tutor-input" className="sr-only">
            {inputMode === 'check-reasoning' ? 'Explain your reasoning' : 'Ask the tutor'}
          </label>
          <div className="flex items-end gap-2">
            <Textarea
              id="tutor-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submitDraft(e)
              }}
              rows={2}
              maxLength={1200}
              placeholder={
                inputMode === 'check-reasoning'
                  ? 'In your own words, why is the correct answer right?'
                  : 'e.g. Why do we negate the off-diagonal entries?'
              }
              className="min-h-16 resize-none"
            />
            <Button type="submit" size="icon" disabled={pending || !draft.trim()} aria-label="Send to tutor">
              <Send aria-hidden />
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
