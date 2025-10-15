'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Grid,
  Alert,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import { 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { paymentsAPI } from '@/services/api'
import Layout from '@/components/Layout'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const response = await paymentsAPI.getAll()
      setPayments(response.data || [])
    } catch (error) {
      setError('Failed to fetch payments')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Create new payment
  const onSubmit = async (data) => {
    try {
      setError('')
      await paymentsAPI.create(data)
      setSuccess('Payment created successfully!')
      setOpen(false)
      reset()
      fetchPayments()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create payment')
    }
  }

  // Handle payment actions
  const handleMenuClick = (event, payment) => {
    setAnchorEl(event.currentTarget)
    setSelectedPayment(payment)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPayment(null)
  }

  const handleConfirmPayment = async () => {
    try {
      await paymentsAPI.confirm(selectedPayment.id)
      setSuccess('Payment confirmed successfully!')
      fetchPayments()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to confirm payment')
    }
    handleMenuClose()
  }

  const handleCancelPayment = async () => {
    try {
      await paymentsAPI.cancel(selectedPayment.id)
      setSuccess('Payment cancelled successfully!')
      fetchPayments()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cancel payment')
    }
    handleMenuClose()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'success'
      case 'PENDING': return 'warning'
      case 'CANCELLED': return 'error'
      default: return 'default'
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Payments</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Create New Payment
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment ID</TableCell>
                <TableCell>Land Title ID</TableCell>
                <TableCell>Payer Name</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No payments found</TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.payment_id}</TableCell>
                    <TableCell>{payment.reference_id}</TableCell>
                    <TableCell>{payment.payer_name}</TableCell>
                    <TableCell>₱{payment.amount?.toLocaleString()}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status} 
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuClick(e, payment)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleConfirmPayment} disabled={selectedPayment?.status === 'PAID'}>
            <ConfirmIcon sx={{ mr: 1 }} />
            Confirm Payment
          </MenuItem>
          <MenuItem onClick={handleCancelPayment} disabled={selectedPayment?.status === 'CANCELLED'}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel Payment
          </MenuItem>
        </Menu>

        {/* Create Payment Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Payment</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Land Title ID"
                    {...register('land_title_id', { required: 'Land Title ID is required' })}
                    error={!!errors.land_title_id}
                    helperText={errors.land_title_id?.message}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payer Name"
                    {...register('payer_name', { required: 'Payer name is required' })}
                    error={!!errors.payer_name}
                    helperText={errors.payer_name?.message}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    {...register('amount', { required: 'Amount is required' })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Method"
                    {...register('payment_method', { required: 'Payment method is required' })}
                    error={!!errors.payment_method}
                    helperText={errors.payment_method?.message}
                    margin="normal"
                    defaultValue="CASH"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Layout>
  )
}