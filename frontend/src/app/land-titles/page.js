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
  Alert
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { landTitlesAPI } from '@/services/api'
import Layout from '@/components/Layout'
import StatusChip from '@/components/common/StatusChip'
import LoadingTable from '@/components/common/LoadingTable'
import AlertMessage from '@/components/common/AlertMessage'
import { useApi } from '@/hooks/useApi'
import { getCurrentUser } from '@/utils/auth'
import { formatDate, generateId } from '@/utils/formatters'
import { API_CONFIG } from '@/utils/config'

const landTitleSchema = z.object({
  owner_name: z.string().min(1, "Owner name is required"),
  contact_no: z.string().regex(/^[0-9]{11}$/, "Contact number must be exactly 11 digits"),
  email_address: z.string().email("Valid email address is required"),
  address: z.string().min(1, "Address is required"),
  property_location: z.string().min(1, "Property location is required"),
  lot_number: z.string().min(1, "Lot number is required").transform(val => parseInt(val, 10)).refine(val => val <= 2147483647, "Lot number cannot exceed 2,147,483,647"),
  area_size: z.string().min(1, "Area size is required").transform(val => parseFloat(val)).refine(val => val <= 99999999, "Area size cannot exceed 99,999,999 sqm"),
  classification: z.string().min(1, "Classification is required"),
  registration_date: z.string().min(1, "Registration date is required"),
  registrar_office: z.string().min(1, "Registrar office is required"),
  previous_title_number: z.string().optional(),
  encumbrances: z.string().optional()
})

export default function LandTitles() {
  const [landTitles, setLandTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [titleNumber, setTitleNumber] = useState('')
  const [surveyNumber, setSurveyNumber] = useState('')
  const [attachments, setAttachments] = useState([{ id: 1 }])
  const [blockchainHistory, setBlockchainHistory] = useState([])
  const [loadingBlockchain, setLoadingBlockchain] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(landTitleSchema)
  })
  
  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  // TEMP: Commented out for testing backend 403 error
  // if (currentUser?.role === 'CASHIER') {
  //   return (<Layout>Access Denied</Layout>)
  // }

  // Fetch land titles
  const fetchLandTitles = async () => {
    try {
      const response = await landTitlesAPI.getAll()
      console.log('API Response:', response.data)
      
      // Handle different response structures
      let titles = []
      if (Array.isArray(response.data)) {
        titles = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        titles = response.data.data
      } else if (response.data.data && Array.isArray(response.data.data.data)) {
        titles = response.data.data.data
      }
      
      setLandTitles(titles)
      setError('')
    } catch (error) {
      console.error('❌ Failed to fetch land titles:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error - redirecting to login')
      } else {
        setError('Failed to fetch land titles')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLandTitles()
  }, [])

  const handleDialogOpen = () => {
    setTitleNumber(generateId('LT'))
    setSurveyNumber(generateId('SN'))
    setOpen(true)
  }

  const onSubmit = async (data) => {
    console.log('=== FORM SUBMIT STARTED ===')
    console.log('Raw form data:', data)
    
    try {
      setError('')
      setSuccess('')
      
      // Use current user's token (no token replacement)
      
      // Collect all files from attachment inputs
      const allFiles = []
      attachments.forEach((_, index) => {
        const fileInput = document.querySelector(`input[name="attachment_${index}"]`)
        if (fileInput && fileInput.files[0]) {
          allFiles.push(fileInput.files[0])
        }
      })
      
      // Validate files
      if (allFiles.length > 5) {
        setError('Maximum 5 files allowed')
        return
      }
      
      for (let file of allFiles) {
        if (file.size > 5 * 1024 * 1024) { // 5MB
          setError(`File ${file.name} exceeds 5MB limit`)
          return
        }
      }
      
      const formData = {
        ...data,
        title_number: titleNumber,
        survey_number: surveyNumber,
        registration_date: new Date().toISOString()
      }
      
      console.log('Raw data from form:', data)
      console.log('Final form data to submit:', formData)
      console.log('FormData entries:')
      
      // Debug FormData contents
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        if (key !== 'attachments') {
          const value = formData[key] || ''
          console.log(`${key}: '${value}'`)
          submitData.append(key, value)
        }
      })
      console.log('API URL:', 'http://localhost:30081/api/land-titles')
      

      
      // Add files
      if (allFiles.length > 0) {
        for (let file of allFiles) {
          submitData.append('attachments', file)
        }
      }
      
      const response = await landTitlesAPI.create(submitData)
      console.log('API Response:', response)
      
      setSuccess('Land title created successfully!')
      setError('')
      setOpen(false)
      reset()
      setTitleNumber('')
      setSurveyNumber('')
      setAttachments([{ id: 1 }])
      
      // Auto refresh after create
      setTimeout(() => {
        fetchLandTitles()
      }, 1000)
      
      console.log('=== FORM SUBMIT SUCCESS ===')
    } catch (error) {
      console.log('=== FORM SUBMIT ERROR ===')
      console.error('Full error object:', error)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      console.error('Error message:', error.message)
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please login first.')
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        setError('Cannot connect to server. Please check if API Gateway is running on port 30081.')
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to create land title')
      }
    }
  }



  const handleTitleClick = async (title) => {
    setSelectedTitle(title)
    setDetailsOpen(true)
    setBlockchainHistory([])
    await fetchBlockchainHistory(title.title_number)
  }

  const handleViewAttachment = (documentId, fileName) => {
    const token = localStorage.getItem('token')
    const url = `${API_CONFIG.BASE_URL}/attachments/view/${documentId}?token=${token}`
    window.open(url, '_blank')
  }

  const handleDownloadAttachment = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/attachments/download/${documentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download attachment')
    }
  }

  const fetchBlockchainHistory = async (titleNumber) => {
    try {
      setLoadingBlockchain(true)
      const response = await landTitlesAPI.getBlockchainHistory(titleNumber)
      console.log('🔍 Blockchain transactions:', response.data?.history)
      setBlockchainHistory(response.data?.history || [])
    } catch (error) {
      console.error('❌ Failed to fetch blockchain history:', error)
      setBlockchainHistory([])
    } finally {
      setLoadingBlockchain(false)
    }
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Land Titles</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleDialogOpen}
          >
            Create New Land Title
          </Button>
        </Box>

        <AlertMessage error={error} success={success} />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Title Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Owner Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Property Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Area Size</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <LoadingTable colSpan={6} />
              ) : landTitles.length === 0 ? (
                <LoadingTable colSpan={6} message="No land titles found" />
              ) : (
                landTitles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell>
                      <Button 
                        variant="text" 
                        onClick={() => handleTitleClick(title)}
                        sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 'bold' }}
                      >
                        {title.title_number}
                      </Button>
                    </TableCell>
                    <TableCell>{title.owner_name}</TableCell>
                    <TableCell>{title.property_location}</TableCell>
                    <TableCell>{title.area_size} sqm</TableCell>
                    <TableCell>
                      <StatusChip status={title.status} />
                    </TableCell>
                    <TableCell>
                      {formatDate(title.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create Land Title Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Land Title</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Title Number:</Typography>
                  <input 
                    type="text" 
                    value={titleNumber}
                    disabled
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Survey Number:</Typography>
                  <input 
                    type="text" 
                    value={surveyNumber}
                    disabled
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: '#f5f5f5', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Owner Name:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('owner_name')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.owner_name && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.owner_name.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Contact No:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="text" 
                      {...register('contact_no')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.contact_no && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.contact_no.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Email Address:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="email" 
                      {...register('email_address')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.email_address && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.email_address.message}</Typography>}
                  </Box>
                </Box>
                

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Address:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <textarea 
                      rows={3}
                      {...register('address')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.address && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.address.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Property Location:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <select 
                      {...register('property_location')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    >
                      <option value="">Select City</option>
                      <option value="Caloocan">Caloocan</option>
                      <option value="Las Piñas">Las Piñas</option>
                      <option value="Makati">Makati</option>
                      <option value="Malabon">Malabon</option>
                      <option value="Mandaluyong">Mandaluyong</option>
                      <option value="Manila">Manila</option>
                      <option value="Marikina">Marikina</option>
                      <option value="Muntinlupa">Muntinlupa</option>
                      <option value="Navotas">Navotas</option>
                      <option value="Parañaque">Parañaque</option>
                      <option value="Pasay">Pasay</option>
                      <option value="Pasig">Pasig</option>
                      <option value="Pateros">Pateros</option>
                      <option value="Quezon City">Quezon City</option>
                      <option value="San Juan">San Juan</option>
                      <option value="Taguig">Taguig</option>
                      <option value="Valenzuela">Valenzuela</option>
                    </select>
                    {errors.property_location && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.property_location.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Lot Number:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="number" 
                      {...register('lot_number')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.lot_number && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.lot_number.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Area Size (sqm):</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="number" 
                      {...register('area_size')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.area_size && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.area_size.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Classification:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <select 
                      {...register('classification')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    >
                      <option value="">Select Classification</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Agricultural">Agricultural</option>
                      <option value="Institutional">Institutional</option>
                    </select>
                    {errors.classification && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.classification.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Registration Date:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <input 
                      type="date" 
                      {...register('registration_date')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    />
                    {errors.registration_date && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.registration_date.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Registrar Office:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <select 
                      {...register('registrar_office')}
                      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                    >
                    <option value="">Select Registrar Office</option>
                    <option value="Caloocan">Caloocan</option>
                    <option value="Las Piñas">Las Piñas</option>
                    <option value="Makati">Makati</option>
                    <option value="Malabon">Malabon</option>
                    <option value="Mandaluyong">Mandaluyong</option>
                    <option value="Manila">Manila</option>
                    <option value="Marikina">Marikina Registry</option>
                    <option value="Muntinlupa">Muntinlupa</option>
                    <option value="Navotas">Navotas</option>
                    <option value="Parañaque">Parañaque</option>
                    <option value="Pasay">Pasay</option>
                    <option value="Pasig">Pasig</option>
                    <option value="Pateros">Pateros</option>
                    <option value="Quezon City">Quezon City</option>
                    <option value="San Juan">San Juan</option>
                    <option value="Taguig">Taguig</option>
                      <option value="Valenzuela">Valenzuela</option>
                    </select>
                    {errors.registrar_office && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.registrar_office.message}</Typography>}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, fontSize: '16px', fontWeight: 500 }}>Previous Title Number:</Typography>
                  <input 
                    type="text" 
                    {...register('previous_title_number')}
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Encumbrances:</Typography>
                  <textarea 
                    rows={4}
                    {...register('encumbrances')}
                    style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Attachments:</Typography>
                  <Box sx={{ flex: 1 }}>
                    {attachments.map((attachment, index) => (
                      <Box key={attachment.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <input 
                          type="file" 
                          name={`attachment_${index}`}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          style={{ flex: 1, padding: '12px', border: '2px solid #ddd', backgroundColor: 'white', outline: 'none', color: 'black', fontSize: '16px', borderRadius: '4px' }}
                        />
                        {attachments.length > 1 && (
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    ))}
                    
                    {attachments.length < 5 && (
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => setAttachments([...attachments, { id: Date.now() }])}
                        sx={{ mb: 1 }}
                      >
                        + Add File
                      </Button>
                    )}
                    
                    <Typography variant="caption" sx={{ color: 'gray', display: 'block', fontSize: '14px' }}>
                      Maximum 5 files, 5MB each. Supported: PDF, DOC, DOCX, JPG, PNG
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create</Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Land Title Details Modal */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Land Title Details</DialogTitle>
          <DialogContent>
            {selectedTitle && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Title Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.title_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Survey Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.survey_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Owner Name:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.owner_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Contact Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.contact_no}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Email Address:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.email_address}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Address:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.address}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Property Location:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.property_location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Lot Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.lot_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Area Size:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.area_size} sqm</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Classification:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.classification}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Registration Date:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{formatDate(selectedTitle.registration_date)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Registrar Office:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.registrar_office}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Previous Title Number:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.previous_title_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Encumbrances:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{selectedTitle.encumbrances}</Typography>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Status:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    <StatusChip status={selectedTitle.status} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Created Date:</Typography>
                  <Typography sx={{ p: 2, flex: 1 }}>{formatDate(selectedTitle.created_at)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Attachments:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    {selectedTitle.attachments && selectedTitle.attachments.length > 0 ? (
                      selectedTitle.attachments.map((attachment, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            📎 {attachment.original_name || `Document ${index + 1}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'gray', display: 'block', mb: 1 }}>
                            {attachment.mime_type} • {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<span></span>}
                              onClick={() => handleViewAttachment(attachment.id, attachment.original_name)}
                            >
                              View
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              startIcon={<span></span>}
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                            >
                              Download
                            </Button>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic' }}>
                        No attachments uploaded
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                {/* BLOCKCHAIN TABLE */}
                <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Blockchain:</Typography>
                  <Box sx={{ p: 2, flex: 1 }}>
                    {loadingBlockchain ? (
                      <Typography>Loading blockchain history...</Typography>
                    ) : blockchainHistory.length > 0 ? (
                      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '2px solid #ccc' }}>
                        <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #ccc' } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Blockchain Hash</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Action</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Timestamp</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {blockchainHistory.map((tx, index) => (
                              <TableRow key={index} sx={{ '&:hover': { backgroundColor: tx.transaction_type === 'CREATED' ? '#f0f8ff' : '#fff8f0' } }}>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', maxWidth: '200px', wordBreak: 'break-all', border: '1px solid #ccc' }}>
                                  {tx.transaction_type === 'TRANSFER' && (
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                      {tx.owner_name === tx.from_owner ? 'Seller Hash:' : 'Buyer Hash:'}
                                    </Typography>
                                  )}
                                  {tx.blockchain_hash || tx.hash}
                                </TableCell>
                                <TableCell sx={{ border: '1px solid #ccc' }}>
                                  <Chip 
                                    label={
                                      tx.transaction_type === 'CREATED' ? 'Create' : 
                                      tx.transaction_type === 'TRANSFER' ? 'Transfer' :
                                      tx.transaction_type === 'CANCELLED' ? 'Cancelled' :
                                      tx.transaction_type === 'REACTIVATED' ? 'Reactivated' : 'Other'
                                    } 
                                    size="small" 
                                    color={
                                      tx.transaction_type === 'TRANSFER' ? 'primary' :
                                      tx.transaction_type === 'CANCELLED' ? 'error' :
                                      tx.transaction_type === 'REACTIVATED' ? 'warning' : 'success'
                                    }
                                  />
                                </TableCell>
                                <TableCell sx={{ border: '1px solid #ccc' }}>
                                  {formatDate(parseInt(tx.timestamp) || tx.recorded_at || tx.created_at)}
                                </TableCell>
                                <TableCell sx={{ border: '1px solid #ccc' }}>
                                  {tx.transaction_type === 'CREATED' ? (
                                    <Typography variant="caption">
                                      {tx.owner_name || 'N/A'}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption">
                                      {tx.owner_name === tx.from_owner ? tx.from_owner : tx.to_owner}
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'gray', fontStyle: 'italic' }}>
                        No blockchain transactions found
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  )
}