// Romaji → hiragana, for looking words up by typing "gakkou" or "shinbun".
// Greedy longest-match over Hepburn and the common kunrei/wāpuro spellings.

const TABLE: Record<string, string> = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  sa: 'さ', shi: 'し', si: 'し', su: 'す', se: 'せ', so: 'そ',
  ta: 'た', chi: 'ち', ti: 'ち', tsu: 'つ', tu: 'つ', te: 'て', to: 'と',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  wa: 'わ', wo: 'を', nn: 'ん',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
  va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  wi: 'うぃ', we: 'うぇ', she: 'しぇ', che: 'ちぇ', je: 'じぇ',
  tsa: 'つぁ', tse: 'つぇ', tso: 'つぉ', dyu: 'でゅ', thi: 'てぃ', dhi: 'でぃ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', xtsu: 'っ', xtu: 'っ',
  '-': 'ー',
}

const VOWELS = 'aiueo'
const KEYS = Object.keys(TABLE)

/** True when `tail` could still grow into a romaji syllable ("k", "sh", "ky" — but not "q" or "kx"). */
export const isRomajiPrefix = (tail: string) => tail === '' || KEYS.some((k) => k.startsWith(tail))

/** True when the string is plain ASCII letters (so romaji conversion applies). */
export const isRomaji = (s: string) => /^[a-z'\- ]+$/i.test(s)

export function romajiToHiragana(input: string): string {
  const s = input.toLowerCase().replace(/\s+/g, '')
  let out = ''
  let i = 0
  while (i < s.length) {
    const c = s[i]
    // ん: n before a consonant / apostrophe / end, or "nn"
    if (c === 'n') {
      const next = s[i + 1]
      if (next === "'") { out += 'ん'; i += 2; continue }
      if (next === 'n') {
        // "nn" is ん; in "nna" / "nnya" the second n belongs to the next kana (こんにちは)
        const after = s[i + 2]
        out += 'ん'
        i += after !== undefined && (VOWELS.includes(after) || after === 'y') ? 1 : 2
        continue
      }
      if (next === undefined || (!VOWELS.includes(next) && next !== 'y')) {
        out += 'ん'; i += 1; continue
      }
    }
    // っ: doubled consonant (except n)
    if (c !== 'n' && !VOWELS.includes(c) && s[i + 1] === c && /[a-z]/.test(c)) {
      out += 'っ'; i += 1; continue
    }
    let matched = false
    for (const len of [4, 3, 2, 1]) {
      const chunk = s.slice(i, i + len)
      if (TABLE[chunk]) { out += TABLE[chunk]; i += len; matched = true; break }
    }
    if (!matched) { out += c; i += 1 }
  }
  return out
}

/**
 * Convert romaji as it is being typed: the kana finished so far plus the
 * tail that is still waiting for its vowel ("k", "sh", a lone "n"). Kana or
 * kanji typed directly pass through untouched.
 */
export function liveRomajiToKana(raw: string): { kana: string; pending: string } {
  let s = raw.toLowerCase().replace(/\s+/g, '')
  let pending = ''
  // a lone trailing n may still become な/に/…, so hold it back
  if (/(^|[^n])n$/.test(s)) {
    pending = 'n'
    s = s.slice(0, -1)
  }
  const out = romajiToHiragana(s)
  const m = /[a-z']+$/.exec(out)
  if (m && m[0].length <= 3) return { kana: out.slice(0, m.index), pending: m[0] + pending }
  return { kana: out, pending }
}
