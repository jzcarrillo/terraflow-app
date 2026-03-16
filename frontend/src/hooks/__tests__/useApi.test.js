import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi, useForm } from '../useApi'

describe('hooks/useApi', () => {
  describe('useApi', () => {
    it('should fetch data successfully', async () => {
      const mockApi = jest.fn().mockResolvedValue({ data: [{ id: 1 }] })
      const { result } = renderHook(() => useApi(mockApi))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.data).toEqual([{ id: 1 }])
      expect(result.current.error).toBe('')
    })

    it('should handle error with response message', async () => {
      const mockApi = jest.fn().mockRejectedValue({
        response: { data: { message: 'Not found' } }
      })
      const { result } = renderHook(() => useApi(mockApi))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBe('Not found')
    })

    it('should handle error with error.message', async () => {
      const mockApi = jest.fn().mockRejectedValue(new Error('Network fail'))
      const { result } = renderHook(() => useApi(mockApi))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBe('Network fail')
    })

    it('should handle error with fallback message', async () => {
      const mockApi = jest.fn().mockRejectedValue({})
      const { result } = renderHook(() => useApi(mockApi))

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.error).toBe('Request failed')
    })

    it('should refetch data', async () => {
      const mockApi = jest.fn().mockResolvedValue({ data: 'initial' })
      const { result } = renderHook(() => useApi(mockApi))

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockApi.mockResolvedValue({ data: 'refreshed' })
      await act(async () => { await result.current.refetch() })

      expect(result.current.data).toBe('refreshed')
    })
  })

  describe('useForm', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useForm({ name: '' }))
      expect(result.current.formData).toEqual({ name: '' })
      expect(result.current.errors).toEqual({})
      expect(result.current.loading).toBe(false)
    })

    it('should update field', () => {
      const { result } = renderHook(() => useForm({ name: '' }))
      act(() => result.current.updateField('name', 'John'))
      expect(result.current.formData.name).toBe('John')
    })

    it('should clear field error on update', () => {
      const { result } = renderHook(() => useForm({ name: '' }))
      act(() => result.current.setErrors({ name: 'Required' }))
      act(() => result.current.updateField('name', 'John'))
      expect(result.current.errors.name).toBe('')
    })

    it('should reset form', () => {
      const { result } = renderHook(() => useForm({ name: '' }))
      act(() => result.current.updateField('name', 'John'))
      act(() => result.current.reset())
      expect(result.current.formData).toEqual({ name: '' })
      expect(result.current.errors).toEqual({})
    })

    it('should set loading', () => {
      const { result } = renderHook(() => useForm())
      act(() => result.current.setLoading(true))
      expect(result.current.loading).toBe(true)
    })
  })
})
