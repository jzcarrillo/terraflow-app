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
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import { Add as AddIcon, MoreVert as MoreVertIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Layout from '@/components/Layout'
import StatusChip from '@/components/common/StatusChip'
import LoadingTable from '@/components/common/LoadingTable'
import AlertMessage from '@/components/common/AlertMessage'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { normalizeApiResponse } from '@/utils/apiHelpers'
import { mortgagesAPI } from '@/services/api'

const mortgageSchema = z.object({
  land_title_id: z.string().min(1, "Land title is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  amount: z.string().min(1, "Amount is required"),
  owner_name: z.string().min(1, "Owner name is required"),
  details: z.string().optional()
})

export default function Mortgages() {
  const [mortgages, setMortgages] = useState([])
  const [landTitles, setLandTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedMortgage, setSelectedMortgage] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [updateAmountInput, setUpdateAmountInput] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedMortgageForMenu, setSelectedMortgageForMenu] = useState(null)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [updateAttachmentFile, setUpdateAttachmentFile] = useState(null)
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(mortgageSchema)
  })

  const { register: registerUpdate, handleSubmit: handleSubmitUpdate, reset: resetUpdate, setValue: setValueUpdate, formState: { errors: errorsUpdate } } = useForm()

  const selectedLandTitleId = watch('land_title_id')

  const makeAmountChangeHandler = (setFormValue, setDisplay) => (e) => {
    const value = e.target.value.replace(/,/g, '')
    if (value === '' || !isNaN(value)) {
      setFormValue(value, { shouldValidate: true })
      setDisplay(value ? parseFloat(value).toLocaleString() : '')
    }
  }

  const handleAmountChange = makeAmountChangeHandler(
    (v, opts) => setValue('amount', v, opts),
    setAmountInput
  )

  const handleUpdateAmountChange = makeAmountChangeHandler(
    (v) => setValueUpdate('amount', v),
    setUpdateAmountInput
  )

  const fetchMortgages = async () => {
    try {
      setLoading(true)
      const response = await mortgagesAPI.getAll()
      setMortgages(normalizeApiResponse(response))
      setError('')
    } catch (error) {
      console.error('Failed to fetch mortgages:', error)
      setError(error.response?.data?.message || error.message || 'Failed to fetch mortgages')
      setMortgages([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLandTitles = async () => {
    try {
      const response = await mortgagesAPI.getLandTitlesForMortgage()
      setLandTitles(normalizeApiResponse(response))
    } catch (error) {
      console.error('Failed to fetch land titles:', error)
    }
  }

  useEffect(() => {
    fetchMortgages()
    fetchLandTitles()
  }, [])

  const handleDialogOpen = () => {
    setOpen(true)
  }

  useEffect(() => {
    if (selectedLandTitleId) {
      const selectedTitle = landTitles.find(lt => lt.id === parseInt(selectedLandTitleId))
      if (selectedTitle) {
        reset({
          ...watch(),
          owner_name: selectedTitle.owner_name
        })
      }
    }
  }, [selectedLandTitleId, landTitles])

  const onSubmit = async (data) => {
    console.log('onSubmit called with data:', data)
    try {
      setError('')
      setSuccess('')
      
      const payload = {
        land_title_id: parseInt(data.land_title_id),
        bank_name: data.bank_name,
        amount: parseFloat(data.amount),
        owner_name: data.owner_name,
        details: data.details || null,
        attachments: attachmentFile || null
      }
      
      console.log('Sending payload:', payload)
      const response = await mortgagesAPI.create(payload)
      console.log('Response:', response)
      
      setSuccess('Mortgage created successfully!')
      setOpen(false)
      reset()
      setAmountInput('')
      setAttachmentFile(null)
      
      // Auto refresh after 2 seconds
      setTimeout(() => {
        fetchMortgages()
      }, 2000)
    } catch (error) {
      console.error('Full error object:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      setError(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create mortgage')
    }
  }

  const handleMortgageClick = async (mortgage) => {
    setDetailsOpen(true)
    setSelectedMortgage({ ...mortgage, documents: [] })
    
    // Delay to allow document upload to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const attachmentsResponse = await mortgagesAPI.getAttachments(mortgage.id)
      console.log('Attachments response:', attachmentsResponse.data)
      setSelectedMortgage({ ...mortgage, documents: attachmentsResponse.data || [] })
    } catch (error) {
      setSelectedMortgage({ ...mortgage, documents: [] })
    }
  }

  const handleCancel = async () => {
    try {
      await mortgagesAPI.cancel(selectedMortgageForMenu.id)
      setSuccess('Mortgage cancelled successfully!')
      fetchMortgages()
      setCancelDialogOpen(false)
      handleMenuClose()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cancel mortgage')
      setCancelDialogOpen(false)
    }
  }

  const handleMenuOpen = (event, mortgage) => {
    setAnchorEl(event.currentTarget)
    setSelectedMortgageForMenu(mortgage)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedMortgageForMenu(null)
  }

  const handleUpdateClick = () => {
    const mortgage = selectedMortgageForMenu
    console.log('Update mortgage data:', mortgage)
    setSelectedMortgage(mortgage)
    setUpdateAmountInput(mortgage.amount.toLocaleString())
    setUpdateAttachmentFile(null)
    resetUpdate({
      bank_name: mortgage.bank_name,
      amount: mortgage.amount.toString(),
      details: mortgage.details || ''
    })
    setUpdateOpen(true)
    handleMenuClose()
  }

  const onUpdateSubmit = async (data) => {
    try {
      setError('')
      setSuccess('')
      
      const payload = {
        bank_name: data.bank_name,
        amount: parseFloat(data.amount),
        details: data.details || null,
        attachments: updateAttachmentFile ? updateAttachmentFile.name : selectedMortgage?.attachments
      }
      
      console.log('Update payload:', payload)
      await mortgagesAPI.update(selectedMortgage.id, payload)
      setSuccess('Mortgage updated successfully!')
      setUpdateOpen(false)
      resetUpdate()
      setUpdateAmountInput('')
      setUpdateAttachmentFile(null)
      fetchMortgages()
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update mortgage')
    }
  }

  const handleCancelClick = () => {
    setCancelDialogOpen(true)
  }

  const handleReleaseClick = () => {
    setReleaseDialogOpen(true)
  }

  const handleRelease = async () => {
    try {
      console.log('Releasing mortgage:', selectedMortgageForMenu)
      const response = await mortgagesAPI.createRelease(selectedMortgageForMenu.id)
      console.log('Release response:', response)
      setSuccess('Mortgage release payment created successfully! Please confirm payment to complete release.')
      fetchMortgages()
      setReleaseDialogOpen(false)
      handleMenuClose()
    } catch (error) {
      console.error('Release error:', error)
      console.error('Error response:', error.response)
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create release payment')
      setReleaseDialogOpen(false)
    }
  }

  const getLienPositionColor = (position) => {
    switch(position) {
      case 1: return 'success'
      case 2: return 'warning'
      case 3: return 'error'
      default: return 'default'
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Mortgages</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleDialogOpen}
          >
            Create Mortgage
          </Button>
        </Box>

        <AlertMessage error={error} success={success} />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mortgage ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Land Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bank Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lien Position</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <LoadingTable colSpan={8} />
              ) : mortgages.length === 0 ? (
                <LoadingTable colSpan={8} message="No mortgages found" />
              ) : (
                mortgages.map((mortgage) => (
                  <TableRow key={mortgage.id}>
                    <TableCell>
                      <Button 
                        variant="text" 
                        onClick={() => handleMortgageClick(mortgage)}
                        sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 'bold' }}
                      >
                        {mortgage.mortgage_id || `#${mortgage.id}`}
                      </Button>
                    </TableCell>
                    <TableCell>{mortgage.title_number || mortgage.land_title_id}</TableCell>
                    <TableCell>{mortgage.bank_name}</TableCell>
                    <TableCell>{formatCurrency(mortgage.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${mortgage.lien_position}${mortgage.lien_position === 1 ? 'st' : mortgage.lien_position === 2 ? 'nd' : 'rd'} Lien`}
                        color={getLienPositionColor(mortgage.lien_position)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={mortgage.status} />
                    </TableCell>
                    <TableCell>{formatDate(mortgage.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, mortgage)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog 
          open={open} 
          onClose={() => { setOpen(false); reset(); setAmountInput(''); }} 
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
          <DialogTitle>Create New Mortgage</DialogTitle>
          <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Land Title:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <select 
                      {...register('land_title_id')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', height: '48px' }}
                    >
                      <option value="">Select Land Title</option>
                      {Array.isArray(landTitles) && landTitles.map(title => (
                        <option key={title.id} value={title.id}>
                          {title.title_number} - {title.owner_name}
                        </option>
                      ))}
                    </select>
                    {errors.land_title_id && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.land_title_id.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Owner Name:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('owner_name')}
                      disabled
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px' }}
                    />
                    {errors.owner_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.owner_name.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Bank Name:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <select 
                      {...register('bank_name')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', height: '48px' }}
                    >
                      <option value="">Select Bank</option>
                      <option value="BDO">BDO</option>
                      <option value="BPI">BPI</option>
                      <option value="Metrobank">Metrobank</option>
                      <option value="Security Bank">Security Bank</option>
                      <option value="PNB">PNB</option>
                      <option value="Landbank">Landbank</option>
                    </select>
                    {errors.bank_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.bank_name.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Amount (₱):</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={amountInput}
                      onChange={handleAmountChange}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px' }}
                    />
                    <input type="hidden" {...register('amount')} />
                    {errors.amount && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.amount.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Details:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <textarea 
                      rows={4}
                      {...register('details')}
                      placeholder="Enter mortgage details (interest rate, terms, conditions, etc.)"
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px' }}
                    />
                    {errors.details && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.details.message}</Typography>}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Attachment:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setAttachmentFile(e.target.files[0])}
                      style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', fontSize: '14px' }}
                    />
                    {attachmentFile && <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#1976d2' }}>Selected: {attachmentFile.name}</Typography>}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setOpen(false); reset(); setAmountInput(''); setAttachmentFile(null); }}>Cancel</Button>
              <Button onClick={handleSubmit(onSubmit)} variant="contained">Create Mortgage</Button>
            </DialogActions>
        </Dialog>

        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)} 
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
          <DialogTitle>Mortgage Details</DialogTitle>
          <DialogContent>
            {selectedMortgage && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Mortgage ID:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedMortgage.mortgage_id || `#${selectedMortgage.id}`}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Land Title:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedMortgage.title_number || selectedMortgage.land_title_id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Owner Name:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedMortgage.owner_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Bank Name:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedMortgage.bank_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Amount:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{formatCurrency(selectedMortgage.amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Details:</Typography>
                  <Typography sx={{ p: 2, flex: 1, whiteSpace: 'pre-wrap' }}>{selectedMortgage.details || 'No details provided'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Attachment:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    {selectedMortgage.documents && selectedMortgage.documents.length > 0 ? (
                      selectedMortgage.documents.map((doc) => (
                        <Box key={doc.id} sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                            📎 {doc.original_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                            {doc.mime_type} • {(parseInt(doc.size) / 1024).toFixed(1)} KB
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const token = localStorage.getItem('token')
                                window.open(`${process.env.NEXT_PUBLIC_API_URL}/mortgages/attachments/view/${doc.id}?token=${token}`, '_blank')
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const token = localStorage.getItem('token')
                                window.open(`${process.env.NEXT_PUBLIC_API_URL}/mortgages/attachments/download/${doc.id}?token=${token}`, '_blank')
                              }}
                              sx={{ textTransform: 'none' }}
                            >
                              Download
                            </Button>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: 'text.primary' }}>No attachment</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Lien Position:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    <Chip 
                      label={`${selectedMortgage.lien_position}${selectedMortgage.lien_position === 1 ? 'st' : selectedMortgage.lien_position === 2 ? 'nd' : 'rd'} Lien`}
                      color={getLienPositionColor(selectedMortgage.lien_position)}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Status:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    <StatusChip status={selectedMortgage.status} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Created Date:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{formatDate(selectedMortgage.created_at)}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={updateOpen} 
          onClose={() => { setUpdateOpen(false); resetUpdate(); setUpdateAmountInput(''); }} 
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
          <DialogTitle>Update Mortgage Details</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Bank Name:</Typography>
                <Box sx={{ flex: 1 }}>
                  <select 
                    {...registerUpdate('bank_name', { required: true })}
                    style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', height: '48px' }}
                  >
                    <option value="">Select Bank</option>
                    <option value="BDO">BDO</option>
                    <option value="BPI">BPI</option>
                    <option value="Metrobank">Metrobank</option>
                    <option value="Security Bank">Security Bank</option>
                    <option value="PNB">PNB</option>
                    <option value="Landbank">Landbank</option>
                  </select>
                  {errorsUpdate.bank_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>Bank name is required</Typography>}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Amount (₱):</Typography>
                <Box sx={{ flex: 1 }}>
                  <input 
                    type="text" 
                    value={updateAmountInput}
                    onChange={handleUpdateAmountChange}
                    style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px' }}
                  />
                  <input type="hidden" {...registerUpdate('amount', { required: true })} />
                  {errorsUpdate.amount && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>Amount is required</Typography>}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Details:</Typography>
                <Box sx={{ flex: 1 }}>
                  <textarea 
                    rows={4}
                    {...registerUpdate('details')}
                    placeholder="Enter mortgage details"
                    style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px' }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Attachment:</Typography>
                <Box sx={{ flex: 1 }}>
                  {selectedMortgage?.attachments && !updateAttachmentFile && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>Current: {selectedMortgage.attachments}</Typography>
                  )}
                  <input 
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setUpdateAttachmentFile(e.target.files[0])}
                    style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', fontSize: '14px' }}
                  />
                  {updateAttachmentFile && <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#1976d2' }}>New: {updateAttachmentFile.name}</Typography>}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setUpdateOpen(false); resetUpdate(); setUpdateAmountInput(''); setUpdateAttachmentFile(null); }}>Cancel</Button>
            <Button onClick={handleSubmitUpdate(onUpdateSubmit)} variant="contained">Update</Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedMortgageForMenu?.status !== 'RELEASED' && (
            <MenuItem onClick={handleUpdateClick}>Update Mortgage Details</MenuItem>
          )}
          {selectedMortgageForMenu?.status === 'PENDING' && (
            <MenuItem onClick={handleCancelClick}>Cancel Mortgage</MenuItem>
          )}
          {selectedMortgageForMenu?.status === 'ACTIVE' && (
            <MenuItem onClick={handleReleaseClick}>Release Mortgage</MenuItem>
          )}
          {selectedMortgageForMenu?.status === 'RELEASED' && (
            <MenuItem disabled>No actions available</MenuItem>
          )}
        </Menu>

        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Mortgage</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to cancel this mortgage?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setCancelDialogOpen(false); handleMenuClose() }}>No</Button>
            <Button onClick={handleCancel} variant="contained" color="error">Yes</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={releaseDialogOpen} onClose={() => setReleaseDialogOpen(false)}>
          <DialogTitle>Release Mortgage</DialogTitle>
          <DialogContent>
            <Typography>This will create a release payment. You need to confirm the payment to complete the mortgage release.</Typography>
            <Typography sx={{ mt: 2, fontWeight: 'bold' }}>Mortgage: {selectedMortgageForMenu?.mortgage_id}</Typography>
            <Typography>Bank: {selectedMortgageForMenu?.bank_name}</Typography>
            <Typography>Amount: {formatCurrency(selectedMortgageForMenu?.amount || 0)}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setReleaseDialogOpen(false); handleMenuClose() }}>Cancel</Button>
            <Button onClick={handleRelease} variant="contained" color="primary">Create Release Payment</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}
