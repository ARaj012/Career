import { describe, it, expect } from 'vitest'
import { quoteStates } from './exam-rules'

describe('exam pattern reader', () => {
  it('accepts a duration written in hours or minutes', () => {
    expect(quoteStates(180, 'The duration of the examination will be 3 hours.', 'duration')).toBe(true)
    expect(quoteStates(180, 'Duration: 180 minutes', 'duration')).toBe(true)
    expect(quoteStates(120, 'The duration of the examination will be 3 hours.', 'duration')).toBe(false)
  })

  it('accepts negative marking written as a fraction, in words, or as none', () => {
    expect(quoteStates(1 / 3, 'one-third (0.33) of the marks assigned to that question will be deducted', 'fraction')).toBe(true)
    expect(quoteStates(1 / 3, '1/3 mark will be deducted for each wrong answer', 'fraction')).toBe(true)
    expect(quoteStates(0, 'There will be no negative marking.', 'fraction')).toBe(true)
    expect(quoteStates(1, 'There will be no negative marking.', 'fraction')).toBe(false)
  })

  it('needs the number itself for plain counts', () => {
    expect(quoteStates(90, 'The paper will have 90 questions carrying 300 marks.', 'plain')).toBe(true)
    expect(quoteStates(75, 'The paper will have 90 questions carrying 300 marks.', 'plain')).toBe(false)
  })
})
