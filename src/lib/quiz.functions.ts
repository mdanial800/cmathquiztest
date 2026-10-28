import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { generateRound, tutorReply } from './quiz.server'

export type TutorMode = 'simpler' | 'intuition' | 'example' | 'check-reasoning' | 'ask'

const roundInput = z.object({
  topic: z.enum(['vectors', 'matrices', 'limits', 'differentiation']),
  difficulty: z.enum(['warmup', 'standard', 'challenge']),
  focus: z.array(z.string().max(40)).max(4).default([]),
})

/** Generates a fresh round of AI-written questions, falling back to the curated bank. */
export const getRound = createServerFn({ method: 'POST' })
  .validator(roundInput)
  .handler(async ({ data }) => generateRound(data))

const tutorInput = z.object({
  mode: z.enum(['simpler', 'intuition', 'example', 'check-reasoning', 'ask']),
  question: z.string().max(2000),
  options: z.array(z.string().max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  chosenIndex: z.number().int().min(0).max(3).nullable(),
  steps: z.array(z.string().max(500)).max(8),
  message: z.string().trim().max(1200).default(''),
})

/** Asks the AI tutor to explain, give intuition, offer a practice problem, or assess the student's reasoning. */
export const askTutor = createServerFn({ method: 'POST' })
  .validator(tutorInput)
  .handler(async ({ data }) => ({ reply: await tutorReply(data) }))
