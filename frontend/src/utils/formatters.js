export const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

export const formatCurrency = (amount) => {
  return `₱${amount?.toLocaleString()}`
}

export const formatFileSize = (bytes) => {
  return `${(bytes / 1024).toFixed(1)} KB`
}

export const generateId = (prefix) => {
  return `${prefix}-${Date.now()}`
}