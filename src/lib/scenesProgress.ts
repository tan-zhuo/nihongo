// Which picture scenes the learner has opened — the gallery ticks them off.
const KEY = 'nihongo.scenes.seen.v1'

export function loadSeenScenes(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // unavailable storage → nothing seen
  }
  return new Set()
}

export function markSceneSeen(id: string) {
  try {
    const seen = loadSeenScenes()
    seen.add(id)
    localStorage.setItem(KEY, JSON.stringify([...seen]))
  } catch {
    // best-effort
  }
}

// Best typing run per scene — time and how many words were typed flawlessly.
const TYPING_KEY = 'nihongo.scenes.typing.v1'

export interface TypingBest {
  ms: number
  perfect: number
  total: number
  ts: number
}

export function loadTypingBests(): Record<string, TypingBest> {
  try {
    const raw = localStorage.getItem(TYPING_KEY)
    if (raw) return JSON.parse(raw) as Record<string, TypingBest>
  } catch {
    // unavailable storage → no records
  }
  return {}
}

/** Store the run if it beats the previous best (more flawless words, then faster); returns true when it did. */
export function saveTypingBest(id: string, run: Omit<TypingBest, 'ts'>): boolean {
  try {
    const all = loadTypingBests()
    const prev = all[id]
    const better = !prev || run.perfect > prev.perfect || (run.perfect === prev.perfect && run.ms < prev.ms)
    if (!better) return false
    all[id] = { ...run, ts: Date.now() }
    localStorage.setItem(TYPING_KEY, JSON.stringify(all))
    return true
  } catch {
    return false
  }
}
