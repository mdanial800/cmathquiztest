# Limitless — AI Maths Quest

Limitless is a quiz-based learning game for the maths behind Computing: **vectors, matrices, limits and differentiation**. Every round is written fresh by generative AI, and the whole experience is built around understanding rather than scores:

- **Diagnostic distractors** – each wrong option comes from a real misconception, and picking one tells you exactly which slip you made.
- **Confidence lock-in** – learners commit to each answer as "I'm sure" or "I'm guessing"; the game tracks calibration and flags confident mistakes as the most valuable things to review.
- **Worked solutions, step by step** – after a wrong answer, steps are revealed one at a time so the learner can try the next step first.
- **AI tutor** – explain it back in your own words and get feedback, or ask for a simpler explanation, a visual intuition, or a similar problem to try.
- **Mastery per subskill** – four subskills per topic, with a one-tap "Practise weak spots" round.
- **Game layer** – levels (Foundation → Apply → Challenge), XP, streak multipliers and hint costs.

## Tech

- TanStack Start (React 19, TanStack Router) on Netlify
- Tailwind CSS 4 + shadcn/ui components
- KaTeX for maths rendering
- Netlify AI Gateway with the Anthropic SDK (Claude Sonnet writes questions, Claude Haiku powers the tutor) — no API keys needed
- A hand-checked question bank as a fallback when AI generation is unavailable
- Netlify Image CDN for the hero illustration

## Run locally

```bash
pnpm install
netlify dev   # emulates AI Gateway and other Netlify features
```

AI Gateway needs the site to be linked to Netlify and to have at least one production deploy. Without it, rounds fall back to the curated bank and the tutor shows a friendly error.

## Ideas for later

- Optional accounts so progress follows a learner across devices (today it is stored in the browser)
- Class leaderboards and peer challenges
- Spaced-repetition scheduling of missed questions
- More topics (integration, complex numbers, probability)
