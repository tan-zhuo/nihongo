/**
 * Readings for numbers, clock times, dates, durations and counters.
 *
 * Generated from rules plus the irregularities that break them, rather than
 * stored as a question bank: 4 is よん but 4時 is よじ and 4日 is よっか, 300
 * is さんびゃく, 8本 is はっぽん, 20日 is はつか. Keeping each irregular table
 * next to the regular rule also hands the drill its best distractor — the
 * regular-but-wrong reading a learner reaches for is exactly `naive()`.
 */

export type Topic = 'number' | 'time' | 'date' | 'counter'

export const TOPICS: Topic[] = ['number', 'time', 'date', 'counter']

const ONES = ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう']
/** The second reading a bare digit also has. */
const ONES_ALT: Record<number, string> = { 0: 'れい', 4: 'し', 7: 'しち', 9: 'く' }
/** 100s that change sound; the rest are just digit + ひゃく. */
const HYAKU: Record<number, string> = { 1: 'ひゃく', 3: 'さんびゃく', 6: 'ろっぴゃく', 8: 'はっぴゃく' }
const SEN: Record<number, string> = { 1: 'せん', 3: 'さんぜん', 8: 'はっせん' }

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

function under10k(n: number, naive: boolean): string {
  const th = Math.floor(n / 1000)
  const hu = Math.floor((n % 1000) / 100)
  const te = Math.floor((n % 100) / 10)
  const on = n % 10
  let s = ''
  if (th) s += th === 1 ? 'せん' : naive ? ONES[th] + 'せん' : SEN[th] ?? ONES[th] + 'せん'
  if (hu) s += hu === 1 ? 'ひゃく' : naive ? ONES[hu] + 'ひゃく' : HYAKU[hu] ?? ONES[hu] + 'ひゃく'
  if (te) s += te === 1 ? 'じゅう' : ONES[te] + 'じゅう'
  if (on) s += ONES[on]
  return s
}

/** Reading of a plain number. `naive` keeps the digits but drops the sound changes. */
export function readNumber(n: number, naive = false): string {
  if (n === 0) return 'ゼロ'
  let rest = n
  let s = ''
  const oku = Math.floor(rest / 1e8)
  if (oku) {
    s += under10k(oku, naive) + 'おく'
    rest %= 1e8
  }
  const man = Math.floor(rest / 1e4)
  if (man) {
    s += under10k(man, naive) + 'まん'
    rest %= 1e4
  }
  return s + under10k(rest, naive)
}

/** Every accepted reading of a plain number: the ones digit may have a second form. */
export function numberReadings(n: number): string[] {
  if (n === 0) return ['ゼロ', 'れい']
  const primary = readNumber(n)
  // Only a trailing digit takes its second reading — the ゼロ/れい pair never
  // applies here, a number ending in 0 ends in じゅう/ひゃく/せん/まん.
  const ones = n % 10
  const alt = ones === 0 ? undefined : ONES_ALT[ones]
  return alt ? [primary, primary.slice(0, -ONES[ones].length) + alt] : [primary]
}

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

export interface Unit {
  id: string
  /** written after the numeral: 7月, 8本 */
  suffix: string
  /** i18n key under numbers.units */
  key: string
  topic: Topic
  /** accepted readings of n + suffix; [0] is the model answer */
  read(n: number): string[]
  /** regular composition — wrong wherever the real reading is irregular */
  naive(n: number): string
  /** the values this counter is drilled on */
  values: number[]
}

type Table = Record<number, string | string[]>
const list = (v: string | string[]): string[] => (Array.isArray(v) ? v : [v])

function unit(u: {
  id: string
  suffix: string
  key: string
  kana: string
  table: Table
  values: number[]
  topic?: Topic
}): Unit {
  const { table, kana } = u
  return {
    id: u.id,
    suffix: u.suffix,
    key: u.key,
    topic: u.topic ?? 'counter',
    values: u.values,
    naive: (n) => readNumber(n) + kana,
    read(n) {
      const hit = table[n]
      if (hit) return list(hit)
      // Past the table the tens carry the ones-digit form: 21分 → にじゅう +
      // いっぷん, and a round 20分 → に + じゅっぷん (the 10 form itself).
      const ones = n % 10
      const tens = Math.floor(n / 10)
      if (ones === 0) return list(table[10]).map((r) => (tens === 1 ? r : ONES[tens] + r))
      const head = tens === 1 ? 'じゅう' : ONES[tens] + 'じゅう'
      return list(table[ones]).map((r) => head + r)
    },
  }
}

export const HOUR = unit({
  id: 'hour', suffix: '時', key: 'hour', kana: 'じ', topic: 'time', values: range(1, 12),
  table: {
    1: 'いちじ', 2: 'にじ', 3: 'さんじ', 4: 'よじ', 5: 'ごじ', 6: 'ろくじ',
    7: ['しちじ', 'ななじ'], 8: 'はちじ', 9: 'くじ', 10: 'じゅうじ',
    11: 'じゅういちじ', 12: 'じゅうにじ',
  },
})

export const MINUTE = unit({
  id: 'minute', suffix: '分', key: 'minute', kana: 'ふん', topic: 'time',
  values: [...range(1, 12), 15, 16, 18, 20, 21, 25, 26, 30, 33, 35, 40, 45, 48, 50, 55, 57],
  table: {
    1: 'いっぷん', 2: 'にふん', 3: 'さんぷん', 4: 'よんぷん', 5: 'ごふん', 6: 'ろっぷん',
    7: ['ななふん', 'しちふん'], 8: ['はっぷん', 'はちふん'], 9: 'きゅうふん',
    10: ['じゅっぷん', 'じっぷん'],
  },
})

export const MONTH = unit({
  id: 'month', suffix: '月', key: 'month', kana: 'がつ', topic: 'date', values: range(1, 12),
  table: {
    1: 'いちがつ', 2: 'にがつ', 3: 'さんがつ', 4: 'しがつ', 5: 'ごがつ', 6: 'ろくがつ',
    7: 'しちがつ', 8: 'はちがつ', 9: 'くがつ', 10: 'じゅうがつ',
    11: 'じゅういちがつ', 12: 'じゅうにがつ',
  },
})

export const DAY = unit({
  id: 'day', suffix: '日', key: 'day', kana: 'にち', topic: 'date', values: range(1, 31),
  table: {
    1: 'ついたち', 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか',
    6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか',
    11: 'じゅういちにち', 12: 'じゅうににち', 13: 'じゅうさんにち', 14: 'じゅうよっか',
    15: 'じゅうごにち', 16: 'じゅうろくにち', 17: ['じゅうしちにち', 'じゅうななにち'],
    18: 'じゅうはちにち', 19: ['じゅうくにち', 'じゅうきゅうにち'], 20: 'はつか',
    21: 'にじゅういちにち', 22: 'にじゅうににち', 23: 'にじゅうさんにち', 24: 'にじゅうよっか',
    25: 'にじゅうごにち', 26: 'にじゅうろくにち', 27: ['にじゅうしちにち', 'にじゅうななにち'],
    28: 'にじゅうはちにち', 29: ['にじゅうくにち', 'にじゅうきゅうにち'], 30: 'さんじゅうにち',
    31: 'さんじゅういちにち',
  },
})

export interface Weekday {
  /** i18n key under numbers.wd */
  key: string
  ja: string
  reading: string
}

export const WEEKDAYS: Weekday[] = [
  { key: 'mon', ja: '月曜日', reading: 'げつようび' },
  { key: 'tue', ja: '火曜日', reading: 'かようび' },
  { key: 'wed', ja: '水曜日', reading: 'すいようび' },
  { key: 'thu', ja: '木曜日', reading: 'もくようび' },
  { key: 'fri', ja: '金曜日', reading: 'きんようび' },
  { key: 'sat', ja: '土曜日', reading: 'どようび' },
  { key: 'sun', ja: '日曜日', reading: 'にちようび' },
]

export const COUNTERS: Unit[] = [
  unit({
    id: 'people', suffix: '人', key: 'people', kana: 'にん', values: range(1, 10),
    table: {
      1: 'ひとり', 2: 'ふたり', 3: 'さんにん', 4: 'よにん', 5: 'ごにん', 6: 'ろくにん',
      7: ['しちにん', 'ななにん'], 8: 'はちにん', 9: ['きゅうにん', 'くにん'], 10: 'じゅうにん',
    },
  }),
  unit({
    id: 'ko', suffix: '個', key: 'ko', kana: 'こ', values: range(1, 10),
    table: {
      1: 'いっこ', 2: 'にこ', 3: 'さんこ', 4: 'よんこ', 5: 'ごこ', 6: 'ろっこ',
      7: 'ななこ', 8: 'はっこ', 9: 'きゅうこ', 10: ['じゅっこ', 'じっこ'],
    },
  }),
  unit({
    id: 'hon', suffix: '本', key: 'hon', kana: 'ほん', values: range(1, 10),
    table: {
      1: 'いっぽん', 2: 'にほん', 3: 'さんぼん', 4: 'よんほん', 5: 'ごほん', 6: 'ろっぽん',
      7: 'ななほん', 8: ['はっぽん', 'はちほん'], 9: 'きゅうほん', 10: ['じゅっぽん', 'じっぽん'],
    },
  }),
  unit({
    id: 'hiki', suffix: '匹', key: 'hiki', kana: 'ひき', values: range(1, 10),
    table: {
      1: 'いっぴき', 2: 'にひき', 3: 'さんびき', 4: 'よんひき', 5: 'ごひき', 6: 'ろっぴき',
      7: 'ななひき', 8: ['はっぴき', 'はちひき'], 9: 'きゅうひき', 10: ['じゅっぴき', 'じっぴき'],
    },
  }),
  unit({
    id: 'satsu', suffix: '冊', key: 'satsu', kana: 'さつ', values: range(1, 10),
    table: {
      1: 'いっさつ', 2: 'にさつ', 3: 'さんさつ', 4: 'よんさつ', 5: 'ごさつ', 6: 'ろくさつ',
      7: 'ななさつ', 8: 'はっさつ', 9: 'きゅうさつ', 10: ['じゅっさつ', 'じっさつ'],
    },
  }),
  unit({
    id: 'kai', suffix: '回', key: 'kai', kana: 'かい', values: range(1, 10),
    table: {
      1: 'いっかい', 2: 'にかい', 3: 'さんかい', 4: 'よんかい', 5: 'ごかい', 6: 'ろっかい',
      7: 'ななかい', 8: 'はっかい', 9: 'きゅうかい', 10: ['じゅっかい', 'じっかい'],
    },
  }),
  unit({
    id: 'sai', suffix: '歳', key: 'sai', kana: 'さい', values: [...range(1, 10), 20],
    table: {
      1: 'いっさい', 2: 'にさい', 3: 'さんさい', 4: 'よんさい', 5: 'ごさい', 6: 'ろくさい',
      7: 'ななさい', 8: 'はっさい', 9: 'きゅうさい', 10: ['じゅっさい', 'じっさい'],
      20: ['はたち', 'にじゅっさい'],
    },
  }),
  unit({
    id: 'mai', suffix: '枚', key: 'mai', kana: 'まい', values: range(1, 10),
    table: {
      1: 'いちまい', 2: 'にまい', 3: 'さんまい', 4: 'よんまい', 5: 'ごまい', 6: 'ろくまい',
      7: 'ななまい', 8: 'はちまい', 9: 'きゅうまい', 10: 'じゅうまい',
    },
  }),
  unit({
    id: 'dai', suffix: '台', key: 'dai', kana: 'だい', values: range(1, 10),
    table: {
      1: 'いちだい', 2: 'にだい', 3: 'さんだい', 4: 'よんだい', 5: 'ごだい', 6: 'ろくだい',
      7: 'ななだい', 8: 'はちだい', 9: 'きゅうだい', 10: 'じゅうだい',
    },
  }),
]

export const DURATIONS: Unit[] = [
  unit({
    id: 'jikan', suffix: '時間', key: 'jikan', kana: 'じかん', values: range(1, 10),
    table: {
      1: 'いちじかん', 2: 'にじかん', 3: 'さんじかん', 4: 'よじかん', 5: 'ごじかん',
      6: 'ろくじかん', 7: ['しちじかん', 'ななじかん'], 8: 'はちじかん',
      9: ['くじかん', 'きゅうじかん'], 10: 'じゅうじかん',
    },
  }),
  unit({
    id: 'nichikan', suffix: '日間', key: 'nichikan', kana: 'にちかん', values: range(2, 10),
    table: {
      2: 'ふつかかん', 3: 'みっかかん', 4: 'よっかかん', 5: 'いつかかん', 6: 'むいかかん',
      7: 'なのかかん', 8: 'ようかかん', 9: 'ここのかかん', 10: 'とおかかん',
    },
  }),
  unit({
    id: 'shukan', suffix: '週間', key: 'shukan', kana: 'しゅうかん', values: range(1, 10),
    table: {
      1: 'いっしゅうかん', 2: 'にしゅうかん', 3: 'さんしゅうかん', 4: 'よんしゅうかん',
      5: 'ごしゅうかん', 6: 'ろくしゅうかん', 7: ['ななしゅうかん', 'しちしゅうかん'],
      8: ['はっしゅうかん', 'はちしゅうかん'], 9: 'きゅうしゅうかん',
      10: ['じゅっしゅうかん', 'じっしゅうかん'],
    },
  }),
  unit({
    id: 'kagetsu', suffix: 'か月', key: 'kagetsu', kana: 'かげつ', values: range(1, 10),
    table: {
      1: 'いっかげつ', 2: 'にかげつ', 3: 'さんかげつ', 4: 'よんかげつ', 5: 'ごかげつ',
      6: ['ろっかげつ', 'ろくかげつ'], 7: ['ななかげつ', 'しちかげつ'],
      8: ['はちかげつ', 'はっかげつ'], 9: 'きゅうかげつ', 10: ['じゅっかげつ', 'じっかげつ'],
    },
  }),
  unit({
    id: 'nen', suffix: '年', key: 'nen', kana: 'ねん', values: range(1, 10),
    table: {
      1: 'いちねん', 2: 'にねん', 3: 'さんねん', 4: 'よねん', 5: 'ごねん', 6: 'ろくねん',
      7: ['ななねん', 'しちねん'], 8: 'はちねん', 9: ['きゅうねん', 'くねん'], 10: 'じゅうねん',
    },
  }),
]

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface Question {
  key: string
  topic: Topic
  /** the numerals to read off the screen: 7月20日 / 4時30分 / 8本 / 3,000 */
  prompt: string
  /** accepted readings; [0] is the model answer */
  answers: string[]
  /** four options for the choice drill, the model answer among them */
  options: string[]
  /** the reverse drill asks for this number back; absent → compound, skipped there */
  reverse?: { value: number; suffix: string }
}

/** Keep the first `want` candidates that are not right answers or duplicates. */
function wrongOnes(answers: string[], candidates: string[], want = 3): string[] {
  const out: string[] = []
  for (const c of candidates) {
    if (!c || answers.includes(c) || out.includes(c)) continue
    out.push(c)
    if (out.length === want) break
  }
  return out
}

/** Values worth confusing with n: neighbours and shared digits first. */
function related(u: Unit, n: number): number[] {
  const near = [n - 1, n + 1, n % 10, Math.floor(n / 10), n + 2, n - 2, n + 10, n - 10]
  return [...new Set([...near, ...shuffle([...u.values])])].filter(
    (v) => v !== n && u.values.includes(v),
  )
}

function unitQuestion(u: Unit, n: number): Question {
  const answers = u.read(n)
  const others = related(u, n)
  const wrong = wrongOnes(answers, [
    u.naive(n),
    ...others.map((m) => u.read(m)[0]),
    ...others.map((m) => u.naive(m)),
  ])
  return {
    key: `${u.id}-${n}`,
    topic: u.topic,
    prompt: `${n}${u.suffix}`,
    answers,
    options: shuffle([answers[0], ...wrong]),
    reverse: { value: n, suffix: u.suffix },
  }
}

const cross = (a: string[], b: string[]): string[] => a.flatMap((x) => b.map((y) => x + y))

function randomNumber(): number {
  const r = Math.random()
  if (r < 0.22) return Math.floor(Math.random() * 11)
  if (r < 0.42) return 11 + Math.floor(Math.random() * 89)
  if (r < 0.62) return pick([1, 2, 3, 4, 6, 7, 8, 9]) * 100 + pick([0, 0, 0, 5, 12, 40, 68])
  if (r < 0.8) return pick([1, 2, 3, 4, 6, 7, 8, 9]) * 1000 + pick([0, 0, 0, 300, 600, 800, 25])
  return pick([10000, 12000, 35000, 80000, 100000, 306000, 1200000, 30000000, 100000000])
}

/** Numbers a learner might read this one as: wrong magnitude or one digit off. */
function nearNumbers(n: number): number[] {
  const out = [n * 10, Math.floor(n / 10), n + 1, n - 1]
  const s = String(n)
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i])
    out.push(Number(s.slice(0, i) + (d === 9 ? 8 : d + 1) + s.slice(i + 1)))
  }
  return out.filter((v) => v > 0 && v !== n)
}

function numberQuestion(): Question {
  const n = randomNumber()
  const answers = numberReadings(n)
  const wrong = wrongOnes(answers, [
    readNumber(n, true),
    ...shuffle(nearNumbers(n)).map((v) => readNumber(v)),
  ])
  return {
    key: `num-${n}`,
    topic: 'number',
    prompt: n.toLocaleString('en-US'),
    answers,
    options: shuffle([answers[0], ...wrong]),
    reverse: { value: n, suffix: '' },
  }
}

function timeQuestion(reverseOnly: boolean): Question {
  const r = Math.random()
  if (reverseOnly || r < 0.45) {
    return r < 0.5 ? unitQuestion(HOUR, pick(HOUR.values)) : unitQuestion(MINUTE, pick(MINUTE.values))
  }
  const h = pick(HOUR.values)
  const m = pick(MINUTE.values)
  const answers = cross(HOUR.read(h), MINUTE.read(m))
  if (m === 30) answers.push(...HOUR.read(h).map((x) => x + 'はん'))
  const wrong = wrongOnes(answers, [
    HOUR.naive(h) + MINUTE.read(m)[0],
    HOUR.read(h)[0] + MINUTE.naive(m),
    HOUR.naive(h) + MINUTE.naive(m),
    ...related(HOUR, h).map((x) => HOUR.read(x)[0] + MINUTE.read(m)[0]),
    ...related(MINUTE, m).map((x) => HOUR.read(h)[0] + MINUTE.read(x)[0]),
  ])
  return {
    key: `time-${h}-${m}`,
    topic: 'time',
    prompt: `${h}時${m}分`,
    answers,
    options: shuffle([answers[0], ...wrong]),
  }
}

function weekdayQuestion(): Question {
  const w = pick(WEEKDAYS)
  const wrong = shuffle(WEEKDAYS.filter((x) => x.key !== w.key)).slice(0, 3)
  return {
    key: `wd-${w.key}`,
    topic: 'date',
    prompt: w.ja,
    answers: [w.reading],
    options: shuffle([w.reading, ...wrong.map((x) => x.reading)]),
  }
}

function dateQuestion(reverseOnly: boolean): Question {
  const r = Math.random()
  if (reverseOnly) {
    return r < 0.35 ? unitQuestion(MONTH, pick(MONTH.values)) : unitQuestion(DAY, pick(DAY.values))
  }
  if (r < 0.15) return unitQuestion(MONTH, pick(MONTH.values))
  if (r < 0.45) return unitQuestion(DAY, pick(DAY.values))
  if (r < 0.6) return weekdayQuestion()
  const m = pick(MONTH.values)
  const d = pick(DAY.values)
  const answers = cross(MONTH.read(m), DAY.read(d))
  const wrong = wrongOnes(answers, [
    MONTH.read(m)[0] + DAY.naive(d),
    MONTH.naive(m) + DAY.read(d)[0],
    MONTH.naive(m) + DAY.naive(d),
    ...related(DAY, d).map((x) => MONTH.read(m)[0] + DAY.read(x)[0]),
    ...related(MONTH, m).map((x) => MONTH.read(x)[0] + DAY.read(d)[0]),
  ])
  return {
    key: `date-${m}-${d}`,
    topic: 'date',
    prompt: `${m}月${d}日`,
    answers,
    options: shuffle([answers[0], ...wrong]),
  }
}

function counterQuestion(): Question {
  const u = pick([...COUNTERS, ...DURATIONS])
  return unitQuestion(u, pick(u.values))
}

function generate(topic: Topic, reverseOnly: boolean): Question {
  switch (topic) {
    case 'number':
      return numberQuestion()
    case 'time':
      return timeQuestion(reverseOnly)
    case 'date':
      return dateQuestion(reverseOnly)
    case 'counter':
      return counterQuestion()
  }
}

/**
 * One drill question. `reverseOnly` restricts to single-unit questions, the
 * only ones that can be asked backwards (a compound 7月20日 would need two
 * numbers typed back).
 */
export function nextQuestion(topic: Topic, opts: { reverseOnly?: boolean; avoid?: string[] } = {}): Question {
  const avoid = opts.avoid ?? []
  let q = generate(topic, opts.reverseOnly ?? false)
  for (let i = 0; i < 12 && avoid.includes(q.key); i++) {
    q = generate(topic, opts.reverseOnly ?? false)
  }
  return q
}

/** A session of unique-as-possible questions. */
export function makeSession(topic: Topic, size: number, reverseOnly: boolean): Question[] {
  const out: Question[] = []
  for (let i = 0; i < size; i++) {
    out.push(nextQuestion(topic, { reverseOnly, avoid: out.map((q) => q.key) }))
  }
  return out
}

// ---------------------------------------------------------------------------
// Reference tables
// ---------------------------------------------------------------------------

export interface RefRow {
  label: string
  reading: string
  /** the reading breaks the regular pattern — worth a highlight */
  tricky: boolean
}

export function unitRows(u: Unit, values: number[] = u.values): RefRow[] {
  return values.map((n) => {
    const readings = u.read(n)
    return {
      label: `${n}${u.suffix}`,
      reading: readings.join(' / '),
      tricky: !readings.includes(u.naive(n)),
    }
  })
}

const NUMBER_SAMPLE = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 20, 40, 70, 90, 100, 300, 600, 800,
  1000, 3000, 8000, 10000, 100000, 1000000, 100000000,
]

export const NUMBER_ROWS: RefRow[] = NUMBER_SAMPLE.map((n) => ({
  label: n.toLocaleString('en-US'),
  reading: numberReadings(n).join(' / '),
  tricky: readNumber(n) !== readNumber(n, true) || numberReadings(n).length > 1,
}))

/** Minutes worth showing in the table — every shape of the ふん/ぷん split. */
export const MINUTE_SAMPLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 45]
