import { useCallback, useEffect, useState } from 'react'

import type { TopicId } from './topics'

export interface SkillStat {
  correct: number
  attempts: number
}

export interface Progress {
  xp: number
  bestStreak: number
  rounds: number
  skills: Record<string, SkillStat>
  /** Confidence calibration: how often "I'm sure" answers were actually right. */
  calibration: { sureRight: number; sureWrong: number; unsureRight: number; unsureWrong: number }
}

export interface AnswerRecord {
  topic: TopicId
  subskill: string
  correct: boolean
  confident: boolean
}

const KEY = 'limitless-progress-v1'
const EVENT = 'limitless-progress'

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  bestStreak: 0,
  rounds: 0,
  skills: {},
  calibration: { sureRight: 0, sureWrong: 0, unsureRight: 0, unsureWrong: 0 },
}

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Progress) } : EMPTY_PROGRESS
  } catch {
    return EMPTY_PROGRESS
  }
}

/** Mastery of a skill from 0–1, damped so one lucky answer doesn't read as 100%. */
export function mastery(stat: SkillStat | undefined): number {
  if (!stat || stat.attempts === 0) return 0
  return stat.correct / (stat.attempts + 1)
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const sync = () => setProgress(read())
    sync()
    setLoaded(true)
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const recordRound = useCallback(
    (answers: AnswerRecord[], xpEarned: number, bestStreak: number) => {
      const next = structuredClone(read())
      next.xp += xpEarned
      next.rounds += 1
      next.bestStreak = Math.max(next.bestStreak, bestStreak)
      for (const a of answers) {
        const s = (next.skills[a.subskill] ??= { correct: 0, attempts: 0 })
        s.attempts += 1
        if (a.correct) s.correct += 1
        const c = next.calibration
        if (a.confident && a.correct) c.sureRight += 1
        else if (a.confident) c.sureWrong += 1
        else if (a.correct) c.unsureRight += 1
        else c.unsureWrong += 1
      }
      window.localStorage.setItem(KEY, JSON.stringify(next))
      window.dispatchEvent(new Event(EVENT))
    },
    [],
  )

  const reset = useCallback(() => {
    window.localStorage.removeItem(KEY)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { progress, loaded, recordRound, reset }
}
