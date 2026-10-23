import type { QuizQuestion } from '../../types'
import n5 from './n5.json'
import n5b from './n5-b.json'
import n5c from './n5-c.json'
import n4 from './n4.json'
import n3 from './n3.json'
import n2 from './n2.json'
import n1 from './n1.json'
import l5 from './listening-n5.json'
import l4 from './listening-n4.json'
import l3 from './listening-n3.json'
import l2 from './listening-n2.json'
import l1 from './listening-n1.json'

export const quizQuestions: QuizQuestion[] = [
  ...(n5 as QuizQuestion[]),
  ...(n5b as QuizQuestion[]),
  ...(n5c as QuizQuestion[]),
  ...(n4 as QuizQuestion[]),
  ...(n3 as QuizQuestion[]),
  ...(n2 as QuizQuestion[]),
  ...(n1 as QuizQuestion[]),
  ...(l5 as QuizQuestion[]),
  ...(l4 as QuizQuestion[]),
  ...(l3 as QuizQuestion[]),
  ...(l2 as QuizQuestion[]),
  ...(l1 as QuizQuestion[]),
]
