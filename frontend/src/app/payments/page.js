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
  Cancel as CancelIcon,
  Edit as EditIcon
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
  const [paymentId, setPaymentId] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [landTitles, setLandTitles] = useState([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Fetch land titles for reference dropdown
  const fetchLandTitles = async () => {
    try {
      const response = await fetch('http://localhost:30081/api/land-titles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      let titles = []
      if (Array.isArray(data.data)) {
        titles = data.data
      } else if (data.data && Array.isArray(data.data.data)) {
        titles = data.data.data
      }
      
      // Filter out land titles that already have PAID payments or are ACTIVE
      const availableTitles = titles.filter(title => {
        // Check if title is already ACTIVE
        if (title.status === 'ACTIVE') {
          return false
        }
        
        // Check if there's already a PAID payment for this title
        const hasPaidPayment = payments.some(payment => 
          payment.reference_id === title.title_number && payment.status === 'PAID'
        )
        
        return !hasPaidPayment
      })
      
      setLandTitles(availableTitles)
    } catch (error) {
      console.error('Failed to fetch land titles:', error)
    }
  }

  // Generate payment ID when dialog opens
  const handleDialogOpen = () => {
    const timestamp = Date.now()
    setPaymentId(`PAY-${timestamp}`)
    fetchLandTitles()
    setOpen(true)
  }

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

  // Create or update payment
  const onSubmit = async (data) => {
    try {
      setError('')
      const formData = {
        ...data,
        payment_id: paymentId,
        land_title_id: isEditMode ? 
          // For edit: use numeric ID
          (landTitles.find(title => title.title_number === data.reference_id)?.id || parseInt(data.reference_id)) :
          // For create: use string (title number)
          data.reference_id,
        amount: parseFloat(data.amount)
      }
      
      if (isEditMode) {
        console.log('=== UPDATE PAYMENT DEBUG ===')
        console.log('Editing payment ID:', editingPaymentId)
        console.log('Form data:', formData)
        await paymentsAPI.update(editingPaymentId, formData)
        setSuccess('Payment updated successfully!')
      } else {
        await paymentsAPI.create(formData)
        setSuccess('Payment created successfully!')
      }
      
      setOpen(false)
      reset()
      setPaymentId('')
      setIsEditMode(false)
      setEditingPaymentId(null)
      fetchPayments()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save payment')
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

  const handleConfirmPayment = () => {
    setConfirmDialogOpen(true)
    // Don't close menu yet, keep selectedPayment
  }

  const handleCancelPayment = () => {
    setCancelDialogOpen(true)
    // Don't close menu yet, keep selectedPayment
  }

  const confirmPayment = async () => {
    try {
      console.log('=== CONFIRM PAYMENT DEBUG ===')
      console.log('Selected payment for confirm:', selectedPayment)
      console.log('Using payment ID:', selectedPayment.id)
      console.log('API URL will be:', `http://localhost:30081/api/payments/${selectedPayment.id}/confirm`)
      console.log('Making API call...')
      
      const response = await paymentsAPI.confirm(selectedPayment.id)
      console.log('Confirm payment response:', response)
      setSuccess('Payment confirmation request submitted successfully!')
      fetchPayments()
    } catch (error) {
      console.error('Confirm payment error:', error)
      console.error('Error details:', error.response)
      console.error('Error message:', error.message)
      console.error('Error status:', error.response?.status)
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to confirm payment')
    }
  }

  const cancelPayment = async () => {
    try {
      console.log('Selected payment for cancel:', selectedPayment)
      console.log('Using payment ID:', selectedPayment.id)
      const response = await paymentsAPI.cancel(selectedPayment.id)
      console.log('Cancel payment response:', response)
      setSuccess('Payment cancellation request submitted successfully!')
      fetchPayments()
    } catch (error) {
      console.error('Cancel payment error:', error)
      console.error('Error details:', error.response)
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to cancel payment')
    }
  }

  const handleUpdatePayment = () => {
    setIsEditMode(true)
    setEditingPaymentId(selectedPayment.id)
    setPaymentId(selectedPayment.payment_id)
    fetchLandTitles()
    setOpen(true)
    
    // Pre-populate form with existing payment data after dialog opens
    setTimeout(() => {
      reset({
        reference_type: selectedPayment.reference_type,
        reference_id: selectedPayment.reference_id,
        payer_name: selectedPayment.payer_name,
        amount: selectedPayment.amount,
        payment_method: selectedPayment.payment_method
      })
    }, 100)
    
    handleMenuClose()
  }

  const handlePaymentClick = (payment) => {
    setSelectedPaymentDetails(payment)
    setDetailsOpen(true)
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
            onClick={handleDialogOpen}
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
                <TableCell sx={{ fontWeight: 'bold' }}>Payment ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reference ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payer Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                    <TableCell>
                      <Button 
                        variant="text" 
                        onClick={() => handlePaymentClick(payment)}
                        sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 'bold' }}
                      >
                        {payment.payment_id}
                      </Button>
                    </TableCell>
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
          <MenuItem onClick={handleUpdatePayment} disabled={selectedPayment?.status === 'CANCELLED' || selectedPayment?.status === 'PAID'}>
            <EditIcon sx={{ mr: 1 }} />
            Update Payment Details
          </MenuItem>
          <MenuItem onClick={handleConfirmPayment} disabled={selectedPayment?.status === 'PAID' || selectedPayment?.status === 'CANCELLED'}>
            <ConfirmIcon sx={{ mr: 1 }} />
            Confirm Payment
          </MenuItem>
          <MenuItem onClick={handleCancelPayment} disabled={selectedPayment?.status === 'CANCELLED'}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel Payment
          </MenuItem>
        </Menu>

        {/* Create Payment Dialog */}
        <Dialog 
          open={open} 
          onClose={() => setOpen(false)} 
          maxWidth="md" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              backdropFilter: 'blur(10px)',
              border: '2px solid #1976d2',
              borderRadius: '8px'
            }
          }}
        >
          <DialogTitle>{isEditMode ? 'Update Payment' : 'Create New Payment'}</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Payment ID:</Typography>
                    <input 
                      type="text" 
                      value={paymentId}
                      disabled
                      style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Reference Type:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <select 
                        {...register('reference_type', { required: 'Reference type is required' })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                      >
                        <option value="">Select Reference Type</option>
                        <option value="Land Registration">Land Registration</option>
                        <option value="Mortgage">Mortgage</option>
                        <option value="Transfer Title">Transfer Title</option>
                        <option value="Others">Others</option>
                      </select>
                      {errors.reference_type && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.reference_type.message}</Typography>}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Reference ID:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <select 
                        {...register('reference_id', { required: 'Reference ID is required' })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                      >
                        <option value="">Select Land Title</option>
                        {landTitles.map((title) => (
                          <option key={title.id} value={title.title_number}>
                            {title.title_number} - {title.owner_name}
                          </option>
                        ))}
                      </select>
                      {errors.reference_id && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.reference_id.message}</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Payer Name:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <input 
                        type="text" 
                        {...register('payer_name', { required: 'Payer name is required' })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                      />
                      {errors.payer_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.payer_name.message}</Typography>}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Amount:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <input 
                        type="number" 
                        {...register('amount', { required: 'Amount is required' })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                      />
                      {errors.amount && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.amount.message}</Typography>}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 120, fontSize: '16px', fontWeight: 500 }}>Payment Method:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <select 
                        {...register('payment_method', { required: 'Payment method is required' })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                      >
                        <option value="">Select Payment Method</option>
                        <option value="CASH">Cash</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                      </select>
                      {errors.payment_method && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.payment_method.message}</Typography>}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">{isEditMode ? 'Update' : 'Create'}</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Payment Details Modal */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogContent>
            {selectedPaymentDetails && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Payment ID:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.payment_id}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Reference Type:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.reference_type}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Reference ID:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.reference_id}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Payer Name:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.payer_name}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Amount:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>₱{selectedPaymentDetails.amount?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Payment Method:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.payment_method}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Status:</Typography>
                    <Box sx={{ p: 2, flex: 1 }}>
                      <Chip 
                        label={selectedPaymentDetails.status} 
                        color={getStatusColor(selectedPaymentDetails.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Created Date:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{new Date(selectedPaymentDetails.created_at).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Created by:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.created_by || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Updated by:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.updated_by || 'N/A'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Box sx={{ flex: 1, display: 'flex' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Confirmed by:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.confirmed_by || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', borderLeft: '1px solid #ddd' }}>
                    <Typography sx={{ width: 110, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Cancelled by:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{selectedPaymentDetails.cancelled_by || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Payment Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to confirm this payment?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setConfirmDialogOpen(false); handleMenuClose() }}>No</Button>
            <Button onClick={() => { confirmPayment(); setConfirmDialogOpen(false); handleMenuClose() }} variant="contained">Yes</Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Payment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Payment</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to cancel this payment?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setCancelDialogOpen(false); handleMenuClose() }}>No</Button>
            <Button onClick={() => { cancelPayment(); setCancelDialogOpen(false); handleMenuClose() }} variant="contained" color="error">Yes</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}