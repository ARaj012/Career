import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from './safe-redirect'

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/admin')).toBe('/admin')
    expect(safeRedirectPath('/exams/jee?tab=dates#top')).toBe('/exams/jee?tab=dates#top')
  })

  it('falls back for missing or off-site targets', () => {
    for (const bad of [null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '\\\\evil.com', 'javascript:alert(1)', '/%0a//evil.com\t']) {
      expect(safeRedirectPath(bad as string | null)).toBe('/dashboard')
    }
  })
})
