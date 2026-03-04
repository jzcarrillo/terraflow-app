/**
 * Normalize API response to extract data array/object
 * Handles different response structures from backend
 */
export const normalizeApiResponse = (response) => {
  // Direct array
  if (Array.isArray(response)) return response
  
  // response.data is array
  if (Array.isArray(response.data)) return response.data
  
  // response.data.data is array (nested structure from backend)
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data
  }
  
  // response.data.data is object (single item)
  if (response.data?.data && typeof response.data.data === 'object') {
    return response.data.data
  }
  
  // response.data is object
  if (response.data && typeof response.data === 'object') {
    return response.data
  }
  
  // Fallback
  return []
}
