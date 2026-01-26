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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Menu
} from '@mui/material'
import { Add as AddIcon, MoreVert as MoreVertIcon, Cancel as CancelIcon, Edit as EditIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { landTitlesAPI, transfersAPI } from '@/services/api'
import Layout from '@/components/Layout'
import StatusChip from '@/components/common/StatusChip'
import LoadingTable from '@/components/common/LoadingTable'
import AlertMessage from '@/components/common/AlertMessage'
import { getCurrentUser } from '@/utils/auth'
import { formatDate, generateId } from '@/utils/formatters'

const transferSchema = z.object({
  title_number: z.string().min(1, "Please select a land title").optional(),
  buyer_name: z.string().min(1, "Buyer name is required"),
  buyer_contact: z.string().regex(/^[0-9]{11}$/, "Contact number must be exactly 11 digits"),
  buyer_email: z.string().email("Valid email address is required"),
  buyer_address: z.string().min(1, "Buyer address is required"),
  transfer_fee: z.number().positive("Transfer fee must be positive").optional()
})

export default function TransferLandTitle() {
  const [transfers, setTransfers] = useState([])
  const [landTitles, setLandTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [transferId, setTransferId] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedTransferForAction, setSelectedTransferForAction] = useState(null)
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    resolver: zodResolver(transferSchema)
  })
  
  const selectedTitleNumber = watch('title_number')
  const selectedTitle = landTitles.find(title => title.title_number === selectedTitleNumber)

  // Helper function to normalize API response
  const normalizeData = (response) => {
    if (Array.isArray(response.data)) return response.data
    if (response.data.data && Array.isArray(response.data.data)) return response.data.data
    return []
  }

  const fetchTransfers = async () => {
    try {
      const response = await transfersAPI.getAll()
      setTransfers(normalizeData(response))
    } catch (error) {
      setError('Failed to fetch transfers')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveLandTitles = async () => {
    try {
      const [titlesResponse, transfersResponse] = await Promise.all([
        landTitlesAPI.getAll(),
        transfersAPI.getAll()
      ])
      
      const titles = normalizeData(titlesResponse)
      const existingTransfers = normalizeData(transfersResponse)
      
      // Get title numbers that already have pending or completed transfers
      const transferredTitles = existingTransfers
        .filter(transfer => transfer.status === 'PENDING' || transfer.status === 'COMPLETED')
        .map(transfer => transfer.title_number)
      
      // Filter for ACTIVE titles that don't have existing transfers
      const availableTitles = titles.filter(title => 
        title.status === 'ACTIVE' && !transferredTitles.includes(title.title_number)
      )
      
      setLandTitles(availableTitles)
    } catch (error) {
      console.error('Error fetching land titles:', error)
    }
  }

  useEffect(() => {
    fetchTransfers()
    fetchActiveLandTitles()
  }, [])

  const handleDialogOpen = () => {
    setTransferId(generateId('TR'))
    setOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      setError('')
      setSuccess('')
      
      const transferData = {
        ...data,
        transfer_fee: 5000, // Default transfer fee
        created_by: getCurrentUser()?.id || 1
      }
      
      await transfersAPI.create(transferData)
      setSuccess('Transfer created successfully!')
      setOpen(false)
      reset()
      setTransferId('')
      fetchTransfers()
      
    } catch (error) {
      console.error('Transfer error:', error)
      setError(error.response?.data?.message || 'Failed to create transfer')
    }
  }

  const handleTransferClick = (transfer) => {
    setSelectedTransfer(transfer)
    setDetailsOpen(true)
  }

  const handleActionsClick = (event, transfer) => {
    setAnchorEl(event.currentTarget)
    setSelectedTransferForAction(transfer)
  }

  const handleActionsClose = () => {
    setAnchorEl(null)
    setSelectedTransferForAction(null)
  }

  const handleEditTransfer = () => {
    const transferToEdit = selectedTransferForAction
    reset({
      buyer_name: transferToEdit.buyer_name,
      buyer_contact: transferToEdit.buyer_contact,
      buyer_email: transferToEdit.buyer_email,
      buyer_address: transferToEdit.buyer_address,
      transfer_fee: transferToEdit.transfer_fee
    })
    setEditOpen(true)
    setAnchorEl(null)
  }

  const onEditSubmit = async (data) => {
    try {
      setError('')
      setSuccess('')
      
      await transfersAPI.update(selectedTransferForAction.transfer_id, data)
      setSuccess('Transfer updated successfully!')
      setEditOpen(false)
      setSelectedTransferForAction(null)
      reset()
      fetchTransfers()
    } catch (error) {
      console.error('Update transfer error:', error)
      setError(error.response?.data?.error || error.message || 'Failed to update transfer')
    }
  }

  const handleCancelTransfer = async () => {
    try {
      console.log('Cancelling transfer:', selectedTransferForAction.transfer_id)
      await transfersAPI.updateStatus(selectedTransferForAction.transfer_id, 'CANCELLED')
      setSuccess('Transfer cancelled successfully!')
      fetchTransfers()
      fetchActiveLandTitles()
    } catch (error) {
      console.error('Cancel transfer error:', error)
      setError(error.response?.data?.error || error.message || 'Failed to cancel transfer')
    }
    handleActionsClose()
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Land Transfers</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleDialogOpen}
          >
            Create New Transfer
          </Button>
        </Box>

        <AlertMessage error={error} success={success} />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Transfer ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Title Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Transfer Fee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <LoadingTable colSpan={8} />
              ) : transfers.length === 0 ? (
                <LoadingTable colSpan={8} message="No transfers found" />
              ) : (
                transfers.map((transfer) => (
                  <TableRow key={transfer.transfer_id}>
                    <TableCell>
                      <Button 
                        variant="text" 
                        onClick={() => handleTransferClick(transfer)}
                        sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 'bold' }}
                      >
                        {transfer.transfer_id}
                      </Button>
                    </TableCell>
                    <TableCell>{transfer.title_number}</TableCell>
                    <TableCell>{transfer.seller_name}</TableCell>
                    <TableCell>{transfer.buyer_name}</TableCell>
                    <TableCell>₱{transfer.transfer_fee}</TableCell>
                    <TableCell>
                      <StatusChip status={transfer.status} />
                    </TableCell>
                    <TableCell>
                      {formatDate(transfer.created_at)}
                    </TableCell>
                    <TableCell>
                      {transfer.status === 'PENDING' && (
                        <IconButton
                          onClick={(e) => handleActionsClick(e, transfer)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create Transfer Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Transfer</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Transfer ID:</Typography>
                  <input 
                    type="text" 
                    value={transferId}
                    disabled
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Select Land Title:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth error={!!errors.title_number}>
                      <Select
                        {...register('title_number')}
                        defaultValue=""
                        displayEmpty
                      >
                        <MenuItem value="">Select Land Title</MenuItem>
                        {landTitles.map((title) => (
                          <MenuItem key={title.id} value={title.title_number}>
                            {title.title_number} - {title.owner_name} ({title.property_location})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {errors.title_number && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.title_number.message}</Typography>}
                  </Box>
                </Box>

                {selectedTitle && (
                  <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>Current Property Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Owner: {selectedTitle.owner_name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Location: {selectedTitle.property_location}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Area: {selectedTitle.area_size} sqm</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Type: {selectedTitle.classification}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Name:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('buyer_name')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_name.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Contact:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('buyer_contact')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_contact && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_contact.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Email:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="email" 
                      {...register('buyer_email')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_email && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_email.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Buyer Address:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <textarea 
                      rows={3}
                      {...register('buyer_address')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_address && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_address.message}</Typography>}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create Transfer</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Transfer Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Transfer</DialogTitle>
          <form onSubmit={handleSubmit(onEditSubmit)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Transfer ID:</Typography>
                  <input 
                    type="text" 
                    value={selectedTransferForAction?.transfer_id || ''}
                    disabled
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Name:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('buyer_name')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_name.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Contact:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('buyer_contact')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_contact && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_contact.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Buyer Email:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="email" 
                      {...register('buyer_email')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_email && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_email.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Buyer Address:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <textarea 
                      rows={3}
                      {...register('buyer_address')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.buyer_address && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.buyer_address.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Transfer Fee:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="number" 
                      {...register('transfer_fee', { valueAsNumber: true })}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.transfer_fee && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.transfer_fee.message}</Typography>}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Update Transfer</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Transfer Details Modal */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Transfer Details</DialogTitle>
          <DialogContent>
            {selectedTransfer && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Transfer ID:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.transfer_id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Title Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.title_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Seller:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.seller_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Buyer:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.buyer_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Buyer Contact:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.buyer_contact}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Buyer Email:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.buyer_email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Buyer Address:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTransfer.buyer_address}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Transfer Fee:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>₱{selectedTransfer.transfer_fee}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Status:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    <StatusChip status={selectedTransfer.status} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Created Date:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{formatDate(selectedTransfer.created_at)}</Typography>
                </Box>
                {selectedTransfer.transfer_date && (
                  <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Transfer Date:</Typography>
                    <Typography sx={{ p: 2, flex: 1 }}>{formatDate(selectedTransfer.transfer_date)}</Typography>
                  </Box>
                )}
                {selectedTransfer.blockchain_hash && (
                  <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Blockchain Hash:</Typography>
                    <Typography sx={{ p: 2, flex: 1, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{selectedTransfer.blockchain_hash}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleActionsClose}
        >
          <MenuItem onClick={handleEditTransfer}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Transfer
          </MenuItem>
          <MenuItem onClick={handleCancelTransfer}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel Transfer
          </MenuItem>
        </Menu>
      </Container>
    </Layout>
  )
}