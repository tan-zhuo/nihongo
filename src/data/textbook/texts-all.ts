import type { TextbookText } from '../../types'
import textE1 from './texts/elementary-1.json'
import textE2 from './texts/elementary-2.json'
import textI1 from './texts/intermediate-1.json'
import textI2 from './texts/intermediate-2.json'
import textA1 from './texts/advanced-1.json'
import textA2 from './texts/advanced-2.json'

const texts: Record<string, TextbookText[]> = {
  'elementary-1': textE1 as TextbookText[],
  'elementary-2': textE2 as TextbookText[],
  'intermediate-1': textI1 as TextbookText[],
  'intermediate-2': textI2 as TextbookText[],
  'advanced-1': textA1 as TextbookText[],
  'advanced-2': textA2 as TextbookText[],
}

/** All written passages of a volume (empty when none yet). */
export function textsOf(bookId: string): TextbookText[] {
  return texts[bookId] ?? []
}
