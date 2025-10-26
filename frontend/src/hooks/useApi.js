import { useState, useEffect } from 'react'

export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiCall()
      setData(response.data)
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

export const useForm = (initialState = {}) => {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const reset = () => {
    setFormData(initialState)
    setErrors({})
  }

  return {
    formData,
    errors,
    loading,
    setLoading,
    setErrors,
    updateField,
    reset
  }
}