import { Chip } from '@mui/material'
import { STATUS_COLORS } from '@/utils/config'

export default function StatusChip({ status, size = 'small' }) {
  return (
    <Chip 
      label={status} 
      color={STATUS_COLORS[status] || 'default'}
      size={size}
    />
  )
}