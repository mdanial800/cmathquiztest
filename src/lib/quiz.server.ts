import { GoogleGenerativeAI, SchemaType, type GenerateContentRequest } from '@google/generative-ai'
import { z } from 'zod'

import { DIFFICULTY_LEVELS, getTopic, type Difficulty, type TopicId } from './topics'
import { pickBankRound, type Question } from './question-bank'
import type { TutorMode } from './quiz.functions'

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Tries gemini-3.8-pro first; falls back to gemini-3.8-flash if overloaded (503) or rate-limited (429)
const MODEL_PRIORITY = ['gemini-3.1-pro', 'gemini-3.8-flash', 'gemini-3.5-flash-lite']

async function generateWithFallback(
  prompt: string,
  systemInstruction: string,
  generationConfig: Record<string, unknown>,
) {
  const genAI = getGenAI()
  let lastError: unknown

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig,
      })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.warn(`Model ${modelName} failed, trying next fallback...`, error)
      lastError = error
    }
  }
  throw lastError
}

const generatedSchema = z.object({
  questions: z
    .array(
      z.object({
        subskill: z.string(),
        level: z.number().int().min(1).max(3),
        prompt: z.string().min(5),
        solution_steps: z.array(z.string()).min(1).max(6),
        options: z
          .array(z.object({ text: z.string().min(1), why: z.string().min(1) }))
          .length(4),
        correct_index: z.number().int().min(0).max(3),
        hint: z.string(),
        key_idea: z.string(),
      }),
    )
    .min(1),
})

const geminiQuestionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          subskill: { type: SchemaType.STRING, description: 'One of the subskill ids provided.' },
          level: { type: SchemaType.INTEGER },
          prompt: { type: SchemaType.STRING, description: 'The question. Maths in $...$ LaTeX.' },
          solution_steps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Worked solution, 2-4 short steps, written BEFORE choosing options. Each step one line with LaTeX.',
          },
          options: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING, description: 'The answer choice, usually pure LaTeX in $...$.' },
                why: { type: SchemaType.STRING, description: 'If wrong: the specific misconception. If correct: one-line justification.' },
              },
              required: ['text', 'why'],
            },
          },
          correct_index: { type: SchemaType.INTEGER },
          hint: { type: SchemaType.STRING, description: 'A nudge towards the method that does NOT reveal the answer.' },
          key_idea: { type: SchemaType.STRING, description: 'The one rule or idea to remember, with LaTeX.' },
        },
        required: ['subskill', 'level', 'prompt', 'solution_steps', 'options', 'correct_index', 'hint', 'key_idea'],
      },
    },
  },
  required: ['questions'],
}

const CONTEXTS = [
  'game physics',
  '3D graphics',
  'machine learning',
  'robotics',
  'network traffic',
  'image processing',
  'algorithm analysis',
  'computer vision',
]

export async function generateRound(input: {
  topic: TopicId
  difficulty: Difficulty
  focus: string[]
}): Promise<Question[]> {
  const topic = getTopic(input.topic)!
  const levels = DIFFICULTY_LEVELS[input.difficulty]
  const subskills = topic.subskills
    .map((s) => `- ${s.id}: ${s.name}${input.focus.includes(s.id) ? ' (FOCUS — the student is weak here)' : ''}`)
    .join('\n')
  const context = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)]

  try {
    const prompt = `Write ${levels.length} questions on ${topic.name}.

Subskills (use these ids):
${subskills}

Levels in order: ${levels.join(', ')} (1 = Foundation: one-step recall, 2 = Apply: multi-step, 3 = Challenge: combines ideas or needs insight).
${input.focus.length ? 'At least half of the questions must target the FOCUS subskills.' : 'Cover as many different subskills as possible.'}
Frame one or two questions in a ${context} context to show why this matters in Computing; keep the rest purely mathematical.
Vary the position of the correct answer. Do not reuse textbook-standard examples verbatim.`

    const responseText = await generateWithFallback(
      prompt,
      'You are an expert university Computing mathematics lecturer who writes rigorous, diagnostic multiple-choice questions. Accuracy is paramount: solve every question fully in solution_steps before writing the options, then double-check that exactly one option matches your solution. Every distractor must come from a genuine, common student misconception or slip, and its "why" must name that misconception kindly and precisely. Use KaTeX-compatible LaTeX wrapped in $...$ for all maths (use \\begin{bmatrix} for matrices). Keep numbers clean so the question can be solved by hand in under two minutes.',
      {
        responseMimeType: 'application/json',
        responseSchema: geminiQuestionSchema,
        maxOutputTokens: 6000,
      },
    )

    const parsedJson = JSON.parse(responseText)
    const parsed = generatedSchema.safeParse(parsedJson)

    if (!parsed.success) throw new Error('Invalid question payload')

    const validSubskills = new Set(topic.subskills.map((s) => s.id))
    const stamp = Date.now().toString(36)

    return parsed.data.questions
      .map((q, i) => ({
        id: `ai-${stamp}-${i}`,
        topic: topic.id,
        subskill: validSubskills.has(q.subskill) ? q.subskill : topic.subskills[0].id,
        level: q.level as 1 | 2 | 3,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correct_index,
        hint: q.hint,
        steps: q.solution_steps,
        keyIdea: q.key_idea,
        source: 'ai' as const,
      }))
      .sort((a, b) => a.level - b.level)
  } catch (error) {
    console.error('Question generation failed, using curated bank', error)
    return pickBankRound(topic.id, levels, input.focus)
  }
}

const MODE_INSTRUCTIONS: Record<TutorMode, string> = {
  simpler: 'Re-explain the solution more simply, in plain language, as if to a peer who is meeting the idea for the first time. Avoid jargon.',
  intuition: 'Give a geometric or visual intuition for why the method works — describe what the student should picture. Connect it to Computing where natural.',
  example: 'Give ONE new, similar practice problem with different numbers. State the problem only and ask the student to try it; put the answer at the end after the word "Answer:" so they can self-check.',
  'check-reasoning': 'The student has explained their reasoning in their own words. Assess it honestly: affirm what is correct, gently pinpoint any gap or misconception, and suggest one improvement. Do not just restate the full solution.',
  ask: 'Answer the student\'s follow-up question directly. Prefer guiding questions and short steps over lectures.',
}

export async function tutorReply(input: {
  mode: TutorMode
  question: string
  options: string[]
  correctIndex: number
  chosenIndex: number | null
  steps: string[]
  message: string
}): Promise<string> {
  const chosen =
    input.chosenIndex === null
      ? 'The student has not answered yet.'
      : input.chosenIndex === input.correctIndex
        ? `The student chose the correct answer: ${input.options[input.chosenIndex]}.`
        : `The student chose ${input.options[input.chosenIndex]}, which is wrong.`

  try {
    const prompt = `Question: ${input.question}
Options: ${input.options.map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`).join('  ')}
Correct answer: ${input.options[input.correctIndex]}
Reference solution: ${input.steps.join(' → ')}
${chosen}

Task: ${MODE_INSTRUCTIONS[input.mode]}
${input.message ? `Student says: """${input.message}"""` : ''}`

    const responseText = await generateWithFallback(
      prompt,
      'You are a warm, encouraging peer tutor for university Computing mathematics. You care about understanding, not just answers. Be concise (under 150 words), use short paragraphs or numbered steps, and write all maths in KaTeX-compatible LaTeX inside $...$. Never use markdown headings or tables. Bold sparingly with **text**.',
      {
        maxOutputTokens: 700,
      },
    )

    const text = responseText.trim()
    return text || 'I could not come up with an explanation just now — try asking in a different way.'
  } catch (error) {
    console.error('Tutor request failed', error)
    throw new Error('The tutor is unavailable right now. Please try again in a moment.')
  }
}
