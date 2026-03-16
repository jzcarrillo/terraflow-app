import { normalizeApiResponse } from '../apiHelpers'

describe('apiHelpers', () => {
  describe('normalizeApiResponse', () => {
    it('returns direct array', () => {
      expect(normalizeApiResponse([1, 2])).toEqual([1, 2])
    })

    it('returns response.data when array', () => {
      expect(normalizeApiResponse({ data: [1, 2] })).toEqual([1, 2])
    })

    it('returns response.data.data when nested array', () => {
      expect(normalizeApiResponse({ data: { data: [1, 2] } })).toEqual([1, 2])
    })

    it('returns response.data.data when nested object', () => {
      expect(normalizeApiResponse({ data: { data: { id: 1 } } })).toEqual({ id: 1 })
    })

    it('returns response.data when object', () => {
      expect(normalizeApiResponse({ data: { id: 1 } })).toEqual({ id: 1 })
    })

    it('returns empty array as fallback', () => {
      expect(normalizeApiResponse({})).toEqual([])
    })

    it('returns empty array for string data', () => {
      expect(normalizeApiResponse({ data: 'string' })).toEqual([])
    })
  })
})
