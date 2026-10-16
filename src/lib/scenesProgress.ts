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
