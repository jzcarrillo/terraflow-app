import { Alert } from '@mui/material'

export default function AlertMessage({ error, success, sx = { mb: 2 } }) {
  if (error) {
    return <Alert severity="error" sx={sx}>{error}</Alert>
  }
  if (success) {
    return <Alert severity="success" sx={sx}>{success}</Alert>
  }
  return null
}