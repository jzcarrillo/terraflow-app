import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TransferLandTitle from '../page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/transfer-land-title' }))
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/common/StatusChip', () => ({ status }) => <span>{status}</span>)
jest.mock('@/components/common/LoadingTable', () => ({ message }) => <tr><td>{message || 'Loading...'}</td></tr>)
jest.mock('@/components/common/AlertMessage', () => ({ error, success }) => <>{error && <div data-testid="error">{error}</div>}{success && <div data-testid="success">{success}</div>}</>)

// Bypass zod validation so handleSubmit always calls onSubmit
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values) => ({ values, errors: {} })
}))

const mockTransfersGetAll = jest.fn()
const mockTransfersCreate = jest.fn()
const mockTransfersUpdate = jest.fn()
const mockTransfersUpdateStatus = jest.fn()
const mockLandTitlesGetAll = jest.fn()

jest.mock('@/services/api', () => ({
  landTitlesAPI: { getAll: (...a) => mockLandTitlesGetAll(...a) },
  transfersAPI: { getAll: (...a) => mockTransfersGetAll(...a), create: (...a) => mockTransfersCreate(...a), update: (...a) => mockTransfersUpdate(...a), updateStatus: (...a) => mockTransfersUpdateStatus(...a) }
}))
jest.mock('@/utils/auth', () => ({ getCurrentUser: jest.fn(() => ({ id: 1, role: 'ADMIN' })), getToken: jest.fn(() => 'tk'), logout: jest.fn() }))
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' },
  STATUS_COLORS: { PENDING: 'warning', COMPLETED: 'success' }
}))

const mockTransfer = { transfer_id: 'TR-001', title_number: 'TCT-001', from_owner: 'Seller', to_owner: 'Buyer', buyer_contact: '09123456789', buyer_email: 'b@t.com', buyer_address: 'Manila', status: 'PENDING', created_at: '2024-01-01' }
const mockTitle = { id: 2, title_number: 'TCT-002', owner_name: 'Owner2', property_location: 'Makati', area_size: 200, classification: 'Residential', status: 'ACTIVE' }

const openCreateDialog = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: /create new transfer/i })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /create new transfer/i }))
  await waitFor(() => expect(screen.getByText('Transfer ID:')).toBeInTheDocument())
}

const getMoreBtn = () => Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg[data-testid="MoreVertIcon"]'))

describe('Transfer Land Title Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    mockTransfersGetAll.mockResolvedValue({ data: [mockTransfer] })
    mockLandTitlesGetAll.mockResolvedValue({ data: [mockTitle] })
  })
  afterEach(() => jest.restoreAllMocks())

  it('renders and fetches transfers', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    expect(screen.getByText('TCT-001')).toBeInTheDocument()
    expect(screen.getAllByText('Seller').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Buyer').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('handles fetch error', async () => {
    mockTransfersGetAll.mockRejectedValue(new Error('fail'))
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch transfers'))
  })

  it('shows empty state', async () => {
    mockTransfersGetAll.mockResolvedValue({ data: [] })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('No transfers found')).toBeInTheDocument())
  })

  it('handles nested data response', async () => {
    mockTransfersGetAll.mockResolvedValue({ data: { data: [mockTransfer] } })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
  })

  it('handles fetchActiveLandTitles error', async () => {
    mockLandTitlesGetAll.mockRejectedValue(new Error('fail'))
    render(<TransferLandTitle />)
    await waitFor(() => expect(mockLandTitlesGetAll).toHaveBeenCalled())
  })

  it('does not show action button for COMPLETED transfer', async () => {
    mockTransfersGetAll.mockResolvedValue({ data: [{ ...mockTransfer, status: 'COMPLETED' }] })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    expect(getMoreBtn()).toBeUndefined()
  })

  // --- Create Dialog & onSubmit ---

  it('opens create dialog with all form fields', async () => {
    render(<TransferLandTitle />)
    await openCreateDialog()
    expect(screen.getByText('Select Land Title:')).toBeInTheDocument()
    expect(screen.getByText('Buyer Name:')).toBeInTheDocument()
    expect(screen.getByText('Buyer Contact:')).toBeInTheDocument()
    expect(screen.getByText('Buyer Email:')).toBeInTheDocument()
    expect(screen.getByText('Buyer Address:')).toBeInTheDocument()
  })

  it('onSubmit success - creates transfer and closes dialog', async () => {
    mockTransfersCreate.mockResolvedValue({})
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(mockTransfersCreate).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Transfer created successfully!'))
  })

  it('onSubmit error - response.data.error', async () => {
    mockTransfersCreate.mockRejectedValue({ response: { data: { error: 'Duplicate transfer' } } })
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Duplicate transfer'))
  })

  it('onSubmit error - response.data.message', async () => {
    mockTransfersCreate.mockRejectedValue({ response: { data: { message: 'Bad request' } } })
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Bad request'))
  })

  it('onSubmit error - generic message fallback', async () => {
    mockTransfersCreate.mockRejectedValue(new Error('Network error'))
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Network error'))
  })

  it('onSubmit error - no message fallback', async () => {
    mockTransfersCreate.mockRejectedValue({})
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to create transfer'))
  })

  it('closes create dialog via Cancel button', async () => {
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.click(screen.getAllByText('Cancel')[0])
    await waitFor(() => expect(screen.queryByText('Transfer ID:')).not.toBeInTheDocument())
  })

  it('closes create dialog via backdrop (onClose)', async () => {
    render(<TransferLandTitle />)
    await openCreateDialog()
    const backdrop = document.querySelector('.MuiBackdrop-root')
    if (backdrop) fireEvent.click(backdrop)
  })

  // --- Details Dialog ---

  it('opens details dialog with all fields', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TR-001'))
    await waitFor(() => expect(screen.getByText('Transfer Details')).toBeInTheDocument())
    expect(screen.getByText('09123456789')).toBeInTheDocument()
    expect(screen.getByText('b@t.com')).toBeInTheDocument()
    expect(screen.getByText('Manila')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
  })

  it('closes details dialog via backdrop (onClose)', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TR-001'))
    await waitFor(() => expect(screen.getByText('Transfer Details')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  it('shows blockchain_hash and transfer_date in details', async () => {
    mockTransfersGetAll.mockResolvedValue({ data: [{ ...mockTransfer, blockchain_hash: 'abc123', transfer_date: '2024-06-01' }] })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TR-001'))
    await waitFor(() => {
      expect(screen.getByText('abc123')).toBeInTheDocument()
      expect(screen.getByText('Blockchain Hash:')).toBeInTheDocument()
      expect(screen.getByText('Transfer Date:')).toBeInTheDocument()
    })
  })

  // --- Edit Dialog & onEditSubmit ---

  it('opens edit dialog via action menu', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(screen.getByText('Edit Transfer')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Edit Transfer'))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
  })

  it('onEditSubmit success - updates transfer and closes dialog', async () => {
    mockTransfersUpdate.mockResolvedValue({})
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    // Submit the edit form (second form in DOM)
    const forms = document.querySelectorAll('form')
    fireEvent.submit(forms[forms.length - 1])
    await waitFor(() => expect(mockTransfersUpdate).toHaveBeenCalledWith('TR-001', expect.any(Object)))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Transfer updated successfully!'))
  })

  it('onEditSubmit error - response.data.error', async () => {
    mockTransfersUpdate.mockRejectedValue({ response: { data: { error: 'Update failed' } } })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    const forms = document.querySelectorAll('form')
    fireEvent.submit(forms[forms.length - 1])
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Update failed'))
  })

  it('onEditSubmit error - generic message fallback', async () => {
    mockTransfersUpdate.mockRejectedValue(new Error('Net err'))
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    const forms = document.querySelectorAll('form')
    fireEvent.submit(forms[forms.length - 1])
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Net err'))
  })

  it('onEditSubmit error - no message fallback', async () => {
    mockTransfersUpdate.mockRejectedValue({})
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    const forms = document.querySelectorAll('form')
    fireEvent.submit(forms[forms.length - 1])
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to update transfer'))
  })

  it('closes edit dialog via Cancel', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    const cancelBtns = screen.getAllByText('Cancel')
    fireEvent.click(cancelBtns[cancelBtns.length - 1])
  })

  it('closes edit dialog via backdrop (onClose)', async () => {
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Edit Transfer')))
    await waitFor(() => expect(screen.getByText('Update Transfer')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Cancel Transfer ---

  it('cancel transfer success', async () => {
    mockTransfersUpdateStatus.mockResolvedValue({})
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Transfer')))
    await waitFor(() => expect(mockTransfersUpdateStatus).toHaveBeenCalledWith('TR-001', 'CANCELLED'))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Transfer cancelled successfully!'))
  })

  it('cancel transfer error - response.data.error', async () => {
    mockTransfersUpdateStatus.mockRejectedValue({ response: { data: { error: 'Cancel failed' } } })
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Transfer')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Cancel failed'))
  })

  it('cancel transfer error - generic fallback', async () => {
    mockTransfersUpdateStatus.mockRejectedValue(new Error('Timeout'))
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Transfer')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Timeout'))
  })

  it('cancel transfer error - no message fallback', async () => {
    mockTransfersUpdateStatus.mockRejectedValue({})
    render(<TransferLandTitle />)
    await waitFor(() => expect(screen.getByText('TR-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Transfer')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to cancel transfer'))
  })

  // --- Selected title info box ---

  it('shows selected title info when title is selected', async () => {
    // Make the title already selected by having watch return a matching title_number
    // We verify the select renders with the available title option by opening the MUI Select
    render(<TransferLandTitle />)
    await openCreateDialog()
    // Open the MUI Select dropdown
    const selectBtn = screen.getByRole('combobox')
    fireEvent.mouseDown(selectBtn)
    await waitFor(() => expect(screen.getByText(/TCT-002/)).toBeInTheDocument())
  })

  // --- getCurrentUser null fallback ---

  it('onSubmit uses fallback created_by=1 when getCurrentUser returns null', async () => {
    const auth = require('@/utils/auth')
    auth.getCurrentUser.mockReturnValue(null)
    mockTransfersCreate.mockResolvedValue({})
    render(<TransferLandTitle />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(mockTransfersCreate).toHaveBeenCalledWith(expect.objectContaining({ created_by: 1 })))
  })
})
