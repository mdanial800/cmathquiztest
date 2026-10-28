# AGENTS.md

Limitless is an AI-powered maths quiz game for Computing students (vectors, matrices, limits, differentiation). The design goal is **learning**, not just a working quiz: diagnostic distractors, confidence calibration, step-by-step solutions, and an AI tutor.

## Stack

TanStack Start (React 19) on Netlify · Tailwind CSS 4 with theme variables in `src/styles.css` · shadcn/ui in `src/components/ui` · KaTeX · Anthropic SDK through Netlify AI Gateway (zero-config, never pass API keys).

## Layout

```
src/
├── routes/
│   ├── __root.tsx        # HTML shell, fonts (Fraunces/IBM Plex Sans/JetBrains Mono), KaTeX CSS, metadata
│   ├── index.tsx         # Landing: hero, learning pillars, topic cards with per-subskill mastery
│   └── play.$topic.tsx   # The game: briefing → loading → question → feedback → summary (one state machine)
├── components/
│   ├── math-text.tsx     # MathText / MathBlock: renders $...$, $$...$$ and **bold** with KaTeX
│   ├── tutor-panel.tsx   # AI tutor chat (quick actions, "explain it back", free questions)
│   └── site-header.tsx   # Logo + live XP/streak chip
└── lib/
    ├── topics.ts         # Topics, subskills, key ideas, levels, difficulty presets (shared client/server)
    ├── question-bank.ts  # Question type + hand-checked fallback bank (6 per topic)
    ├── quiz.functions.ts # createServerFn wrappers with zod validation (getRound, askTutor)
    ├── quiz.server.ts    # Anthropic calls: question generation (forced tool use → structured JSON) and tutor
    └── progress.ts       # useProgress(): localStorage mastery, XP, streak, calibration; syncs via window event
```

## Non-obvious decisions

- **Question generation uses forced tool use** (`submit_questions`) and the schema puts `solution_steps` *before* `options`, so the model solves the problem before writing choices. Output is validated with zod; any failure (timeout, bad JSON) falls back to `pickBankRound`, so a round always loads.
- **Every option carries a `why`** — the misconception for wrong options, the justification for the right one. Feedback and the summary depend on this field.
- **Options are shuffled client-side** after a round is fetched (`shuffleOptions`), so bank questions don't have fixed answer positions.
- **Subskill ids are the unit of mastery.** AI output with an unknown subskill is coerced to the topic's first subskill. Adding a subskill means updating `topics.ts` (and ideally the bank).
- **Progress lives in localStorage** (`limitless-progress-v1`) and is read in `useEffect` to avoid hydration mismatches. There is no server-side persistence yet; if accounts are added, move `Progress` into Netlify Database keyed by user.
- Client code must never import `quiz.server.ts` directly; shared constants belong in `topics.ts`.
- All maths strings are KaTeX LaTeX inside `$...$`. Escape backslashes in TS string literals (`'\\frac'`).

## Conventions

Use theme classes (`bg-primary`, `text-topic-vectors`, `bg-success`…) rather than raw colours. Per-topic colours come from `topic.color` in `topics.ts`. Headings use `font-display`. Respect `motion-reduce` on animations.
