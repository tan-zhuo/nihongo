// Example sentences for a dictionary entry, found in the site's own corpora:
// the textbook passages (every line translated) and the grammar examples.
// Loaded lazily — the dictionary should not pull 5MB of texts up front.

export interface Example {
  /** annotated with {漢字|かんじ} */
  ja: string
  zh: string
  en: string
  /** where it comes from, e.g. 标日 初级上 第3课 */
  source: { kind: 'textbook'; book: string; lesson: number } | { kind: 'grammar'; level: string; pattern: string }
}

const strip = (s: string) => s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1')

interface Corpus {
  lines: { plain: string; ex: Example }[]
}
let corpus: Promise<Corpus> | null = null

async function load(): Promise<Corpus> {
  const [{ books }, { grammarPoints }, textbook] = await Promise.all([
    import('../data/textbook'),
    import('../data/grammar'),
    import('../data/textbook/texts-all'),
  ])
  const lines: Corpus['lines'] = []
  for (const book of books) {
    const texts = textbook.textsOf(book.id)
    for (const t of texts) {
      for (const p of t.passages) {
        for (const l of p.lines) {
          lines.push({
            plain: strip(l.ja),
            ex: { ja: l.ja, zh: l.zh, en: l.en, source: { kind: 'textbook', book: book.id, lesson: t.n } },
          })
        }
      }
    }
  }
  for (const g of grammarPoints) {
    for (const e of g.examples) {
      lines.push({
        plain: e.ja,
        ex: { ja: e.furigana || e.ja, zh: e.zh, en: e.en, source: { kind: 'grammar', level: g.level, pattern: g.pattern } },
      })
    }
  }
  return { lines }
}

/**
 * The stem the corpus is likely to contain: dictionary forms inflect
 * (食べる → 食べます), so for verbs/adjectives drop the last kana.
 */
function probes(word: string, reading: string): string[] {
  const out = [word]
  if (word.length >= 3 && /[うくぐすつぬぶむるい]$/.test(word)) out.push(word.slice(0, -1))
  if (word !== reading && reading.length >= 3) out.push(reading)
  return out
}

export async function findExamples(word: string, reading: string, max = 4): Promise<Example[]> {
  corpus ??= load()
  const { lines } = await corpus
  const keys = probes(word, reading)
  const out: Example[] = []
  // exact surface first, then the stem
  for (const key of keys) {
    for (const l of lines) {
      if (out.length >= max) return out
      if (l.plain.includes(key) && !out.includes(l.ex) && l.plain.length <= 60) out.push(l.ex)
    }
  }
  return out
}
