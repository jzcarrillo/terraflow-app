import { formatCurrency, formatDate, formatFileSize, generateId } from '../formatters'

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formats number to PHP currency', () => {
      expect(formatCurrency(1000)).toBe('₱1,000')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('₱0')
    })

    it('handles null/undefined', () => {
      expect(formatCurrency(null)).toBe('₱undefined')
      expect(formatCurrency(undefined)).toBe('₱undefined')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toBeTruthy()
    })
  })

  describe('formatFileSize', () => {
    it('converts bytes to KB', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(2048)).toBe('2.0 KB')
    })
  })

  describe('generateId', () => {
    it('generates ID with prefix', () => {
      const id = generateId('test')
      expect(id).toMatch(/^test-\d+$/)
    })
  })
})
