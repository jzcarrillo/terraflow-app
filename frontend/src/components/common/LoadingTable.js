import { TableRow, TableCell } from '@mui/material'

export default function LoadingTable({ colSpan, message = 'Loading...' }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center">{message}</TableCell>
    </TableRow>
  )
}