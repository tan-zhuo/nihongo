import type { Scene, SceneGroup, SceneWord, VocabWord } from '../../types'
import { vocab } from '../vocab'

export const SCENE_GROUPS: SceneGroup[] = ['home', 'people', 'town', 'food', 'nature', 'culture']

const files = import.meta.glob<Scene>('./*.json', { eager: true, import: 'default' })

// A scene word that is also in the 4200-word list borrows its id, so it gets
// the neural audio clip, the pitch accent and the JLPT level.
const byWord = new Map<string, VocabWord>()
for (const v of vocab) {
  const k = `${v.word}|${v.reading}`
  if (!byWord.has(k)) byWord.set(k, v)
  if (!byWord.has(v.word)) byWord.set(v.word, v)
}

export function vocabOf(w: SceneWord): VocabWord | undefined {
  return byWord.get(`${w.w}|${w.r}`) ?? byWord.get(w.w)
}

export const scenes: Scene[] = Object.values(files)
  .map((s) => ({
    ...s,
    words: s.words.map((w) => ({ ...w, vid: vocabOf(w)?.id })),
  }))
  .sort((a, b) => a.n - b.n)

export function findScene(id: string | undefined): Scene | undefined {
  return scenes.find((s) => s.id === id)
}

/** Scenes a dictionary word appears in — the picture-dictionary cross-reference. */
export function scenesWithWord(word: string): Scene[] {
  return scenes.filter((s) => s.words.some((w) => w.w === word))
}

const art = import.meta.glob<string>('./art/*.svg', { query: '?raw', import: 'default' })

/** The scene's illustration (inline SVG markup), loaded on demand. */
export function loadSceneArt(id: string): Promise<string> {
  const loader = art[`./art/${id}.svg`]
  return loader ? loader() : Promise.resolve('')
}
