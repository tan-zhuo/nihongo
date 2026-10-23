export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export const LEVELS: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export interface Article {
  id: string
  level: Level
  title: string
  content: string
  /** content with kanji runs annotated as {漢字|かんじ} for ruby display */
  furigana?: string
  /** 'story' = classic folktale (昔話); absent = regular essay */
  kind?: 'story'
  /** per-article glossary: surface form, reading, zh/en meanings */
  words?: ArticleWord[]
  /** sentence-aligned translations; joining every `ja` reproduces `content` */
  trans?: Sentence[]
  title_zh?: string
  title_en?: string
}

export interface Sentence {
  ja: string
  zh: string
  en: string
}

export interface GrammarExample {
  ja: string
  /** ja with kanji runs annotated as {漢字|かんじ} */
  furigana: string
  zh: string
  en: string
}

export interface GrammarPoint {
  id: string
  level: Level
  track: 'grammar' | 'keigo'
  group: string
  pattern: string
  meaning_zh: string
  meaning_en: string
  /** how the pattern attaches to the preceding word */
  formation: string
  explain_zh: string
  explain_en: string
  examples: GrammarExample[]
  note_zh?: string
  note_en?: string
}

export interface ArticleWord {
  w: string
  r: string
  zh: string
  en: string
}

export interface VocabWord {
  id: string
  word: string
  reading: string
  meaning_zh: string
  meaning_en: string
  level: Level
  pos: string
}

export type QuizSection = 'vocab' | 'grammar' | 'reading' | 'listening'

export type QuizType =
  | 'kanji-reading'
  | 'orthography'
  | 'context'
  | 'paraphrase'
  | 'usage'
  | 'grammar-form'
  | 'sentence-order'
  | 'reading'
  | 'listening-task'
  | 'listening-point'
  | 'listening-response'
  | 'listening-expression'

/** One line of a listening script: F = woman, M = man, N = narrator. */
export interface ScriptLine {
  s: 'F' | 'M' | 'N'
  t: string
}

export interface QuizQuestion {
  id: string
  level: Level
  section: QuizSection
  type: QuizType
  /** short reading passage, only for type 'reading' */
  passage?: string
  /** audio script, only for the listening types; hidden until answered */
  script?: ScriptLine[]
  /** stem; target word wrapped in 【】, blanks as （　）, star slot as ★ */
  question: string
  options: string[]
  /** index into options */
  answer: number
  expl_zh: string
  expl_en: string
}

/** 《新版中日交流标准日本语》— six volumes, lesson-by-lesson vocabulary. */
export type BookId =
  | 'elementary-1'
  | 'elementary-2'
  | 'intermediate-1'
  | 'intermediate-2'
  | 'advanced-1'
  | 'advanced-2'

export type BookSeries = 'elementary' | 'intermediate' | 'advanced'

export const BOOK_IDS: BookId[] = [
  'elementary-1',
  'elementary-2',
  'intermediate-1',
  'intermediate-2',
  'advanced-1',
  'advanced-2',
]

export interface TextbookWord {
  /** `${bookId}-${lesson}-${index}`, e.g. elementary-1-03-12 */
  id: string
  /** surface form as printed in the book */
  w: string
  /** kana reading; equals `w` for words already written in kana */
  r: string
  p: string
  zh: string
  en: string
  /** verb conjugation group as the book marks it: 動1 / 動2 / 動3 */
  g?: 1 | 2 | 3
}

export interface TextbookLesson {
  n: number
  title: string
  title_zh: string
  words: TextbookWord[]
}

/**
 * One line of a lesson text. The passages are ORIGINAL prose written to use
 * only that lesson's vocabulary and grammar — they are not the textbook's own
 * 本文/会話, which is copyrighted. The UI says so on every lesson.
 */
export interface TextbookLine {
  /** speaker label on a 会話 turn, e.g. 小野; absent for narration */
  sp?: string
  /** the line, with kanji runs annotated as {漢字|かんじ} */
  ja: string
  zh: string
  en: string
  /** sentence analysis: why this line is built the way it is */
  note_zh?: string
  note_en?: string
}

export interface TextbookPassage {
  /** 本文 = the lesson's reading, 会話 = its dialogue */
  kind: 'honbun' | 'kaiwa'
  lines: TextbookLine[]
}

/** A grammar pattern the lesson teaches, in the book's own teaching order. */
export interface TextbookPoint {
  pattern: string
  explain_zh: string
  explain_en: string
  /** short illustrations, annotated like `ja` */
  examples: string[]
}

export interface TextbookText {
  /** lesson number within its own volume */
  n: number
  passages: TextbookPassage[]
  points: TextbookPoint[]
}

export interface TextbookBook {
  id: BookId
  series: BookSeries
  volume: 1 | 2
  title: string
  title_zh: string
  title_en: string
  /**
   * true when the lessons are grouped by topic rather than carrying the
   * textbook's own lesson titles — the UI says so on those volumes.
   */
  themed: boolean
  lessons: TextbookLesson[]
}

/**
 * Picture scenes (場面で覚える単語): one flat illustration with the things in
 * it labelled in Japanese, like a picture dictionary. The art lives in
 * src/data/scenes/art/<id>.svg; the words and sentences in <id>.json.
 */
export type SceneGroup = 'home' | 'people' | 'town' | 'food' | 'nature' | 'culture'

export interface SceneWord {
  w: string
  r: string
  zh: string
  en: string
  /** label anchor in the art's 800×500 viewBox */
  x: number
  y: number
  /** id in the 4200-word vocabulary when the word is in it (audio, accent, level) */
  vid?: string
}

export interface SceneSentence {
  /** with kanji runs annotated as {漢字|かんじ} */
  ja: string
  zh: string
  en: string
}

export interface Scene {
  id: string
  /** display order, 1-based */
  n: number
  group: SceneGroup
  title: string
  title_zh: string
  title_en: string
  words: SceneWord[]
  sentences: SceneSentence[]
}
