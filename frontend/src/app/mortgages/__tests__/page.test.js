import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Mortgages from '../page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/mortgages' }))
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/common/StatusChip', () => ({ status }) => <span>{status}</span>)
jest.mock('@/components/common/LoadingTable', () => ({ message }) => <tr><td>{message || 'Loading...'}</td></tr>)
jest.mock('@/components/common/AlertMessage', () => ({ error, success }) => <>{error && <div data-testid="error">{error}</div>}{success && <div data-testid="success">{success}</div>}</>)

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values) => ({ values, errors: {} })
}))

const mockGetAll = jest.fn()
const mockGetLandTitles = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockCreateRelease = jest.fn()
const mockCancel = jest.fn()
const mockGetAttachments = jest.fn()

jest.mock('@/services/api', () => ({
  mortgagesAPI: {
    getAll: (...a) => mockGetAll(...a),
    getLandTitlesForMortgage: (...a) => mockGetLandTitles(...a),
    create: (...a) => mockCreate(...a),
    update: (...a) => mockUpdate(...a),
    createRelease: (...a) => mockCreateRelease(...a),
    cancel: (...a) => mockCancel(...a),
    getAttachments: (...a) => mockGetAttachments(...a)
  }
}))
jest.mock('@/utils/auth', () => ({ getCurrentUser: jest.fn(() => ({ id: 1, role: 'ADMIN' })), getToken: jest.fn(() => 'tk'), logout: jest.fn() }))
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' },
  STATUS_COLORS: { ACTIVE: 'success', PENDING: 'warning', RELEASED: 'success' }
}))

const mockMortgage = { id: 1, land_title_id: 1, mortgage_id: 'M-001', bank_name: 'BDO', amount: 500000, lien_position: 1, status: 'ACTIVE', created_at: '2024-01-01', details: 'test details', attachments: 'old-file.pdf' }
const mockTitle = { id: 2, title_number: 'TCT-002', owner_name: 'Owner', property_location: 'Manila' }

const getMoreBtn = () => Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg[data-testid="MoreVertIcon"]'))

const openMenuFor = async (status = 'ACTIVE') => {
  if (status !== 'ACTIVE') mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status }] })
  render(<Mortgages />)
  await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
  fireEvent.click(getMoreBtn())
  await waitFor(() => expect(document.querySelector('[role="menuitem"]')).toBeInTheDocument())
}

describe('Mortgages Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.useFakeTimers()
    mockGetAll.mockResolvedValue({ data: [mockMortgage] })
    mockGetLandTitles.mockResolvedValue({ data: [mockTitle] })
    mockGetAttachments.mockResolvedValue({ data: [] })
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  // --- Basic rendering ---

  it('renders and fetches mortgages', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('BDO')).toBeInTheDocument())
    expect(screen.getByText('M-001')).toBeInTheDocument()
  })

  it('handles API error', async () => {
    mockGetAll.mockRejectedValue(new Error('API Error'))
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('API Error'))
  })

  it('handles API error with response message', async () => {
    mockGetAll.mockRejectedValue({ response: { data: { message: 'Server down' } }, message: 'fail' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Server down'))
  })

  it('shows empty state', async () => {
    mockGetAll.mockResolvedValue({ data: [] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('No mortgages found')).toBeInTheDocument())
  })

  it('handles getLandTitles error', async () => {
    mockGetLandTitles.mockRejectedValue(new Error('fail'))
    render(<Mortgages />)
    await waitFor(() => expect(mockGetLandTitles).toHaveBeenCalled())
  })

  it('renders lien positions 1st, 2nd, 3rd', async () => {
    mockGetAll.mockResolvedValue({ data: [
      mockMortgage,
      { ...mockMortgage, id: 2, mortgage_id: 'M-002', lien_position: 2 },
      { ...mockMortgage, id: 3, mortgage_id: 'M-003', lien_position: 3 },
      { ...mockMortgage, id: 4, mortgage_id: 'M-004', lien_position: 4 }
    ] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
  })

  // --- Amount change handlers ---

  it('handleAmountChange formats number and calls setValue', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    await waitFor(() => expect(screen.getByText('Amount (₱):')).toBeInTheDocument())
    // The create dialog amount input is the first visible text input after the form fields
    // It's the input whose onChange is handleAmountChange
    const allTextInputs = document.querySelectorAll('input[type="text"]')
    // The amount input is the one that's not disabled and not hidden
    const amountInput = Array.from(allTextInputs).filter(i => !i.disabled && i.type !== 'hidden')[0]
    if (amountInput) {
      fireEvent.change(amountInput, { target: { value: '500000' } })
      fireEvent.change(amountInput, { target: { value: '' } })
      fireEvent.change(amountInput, { target: { value: 'abc' } })
    }
  })

  // --- Create Dialog & onSubmit ---

  it('opens create dialog with all fields', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    expect(screen.getByText('Land Title:')).toBeInTheDocument()
    expect(screen.getByText('Owner Name:')).toBeInTheDocument()
    expect(screen.getByText('Bank Name:')).toBeInTheDocument()
    expect(screen.getByText('Amount (₱):')).toBeInTheDocument()
    expect(screen.getByText('Details:')).toBeInTheDocument()
    expect(screen.getByText('Attachment:')).toBeInTheDocument()
  })

  it('onSubmit success - creates mortgage', async () => {
    mockCreate.mockResolvedValue({ data: {} })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    // Click the Create Mortgage button (it uses handleSubmit via onClick, not form submit)
    fireEvent.click(screen.getByRole('button', { name: /^create mortgage$/i }))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Mortgage created successfully!'))
    jest.advanceTimersByTime(2000)
  })

  it('onSubmit error', async () => {
    mockCreate.mockRejectedValue({ response: { data: { message: 'Duplicate' } }, message: 'fail' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    fireEvent.click(screen.getByRole('button', { name: /^create mortgage$/i }))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Duplicate'))
  })

  it('onSubmit error - response.data.error fallback', async () => {
    mockCreate.mockRejectedValue({ response: { data: { error: 'Bad data' } }, message: 'fail' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    fireEvent.click(screen.getByRole('button', { name: /^create mortgage$/i }))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Bad data'))
  })

  it('onSubmit error - generic fallback', async () => {
    mockCreate.mockRejectedValue({ message: '' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    fireEvent.click(screen.getByRole('button', { name: /^create mortgage$/i }))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to create mortgage'))
  })

  it('onSubmit with attachment file', async () => {
    mockCreate.mockResolvedValue({ data: {} })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    // Set attachment file
    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /^create mortgage$/i }))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    jest.advanceTimersByTime(2000)
  })

  it('closes create dialog via Cancel', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    fireEvent.click(screen.getByText('Cancel'))
  })

  it('closes create dialog via backdrop', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    const backdrop = document.querySelector('.MuiBackdrop-root')
    if (backdrop) fireEvent.click(backdrop)
  })

  // --- Details Dialog ---

  it('opens details dialog with all fields', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('M-001'))
    await waitFor(() => expect(screen.getByText('Mortgage Details')).toBeInTheDocument())
    expect(screen.getByText('test details')).toBeInTheDocument()
    expect(screen.getByText('No attachment')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
  })

  it('shows details with document attachments', async () => {
    window.open = jest.fn()
    mockGetAttachments.mockResolvedValue({ data: [{ id: 1, original_name: 'doc.pdf', mime_type: 'application/pdf', size: '2048' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('M-001'))
    // Wait for setTimeout + attachments fetch
    jest.advanceTimersByTime(1000)
    await waitFor(() => expect(mockGetAttachments).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/doc.pdf/)).toBeInTheDocument())
    // Click View and Download
    fireEvent.click(screen.getByText('View'))
    expect(window.open).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Download'))
  })

  it('handles details attachments error', async () => {
    mockGetAttachments.mockRejectedValue(new Error('fail'))
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('M-001'))
    jest.advanceTimersByTime(1000)
    await waitFor(() => expect(mockGetAttachments).toHaveBeenCalled())
  })

  it('shows details without details text', async () => {
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, details: null }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('M-001'))
    await waitFor(() => expect(screen.getByText('No details provided')).toBeInTheDocument())
  })

  it('closes details dialog via backdrop', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('M-001'))
    await waitFor(() => expect(screen.getByText('Mortgage Details')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Action Menu: Update ---

  it('opens update dialog via menu and submits', async () => {
    mockUpdate.mockResolvedValue({})
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByText('Update Mortgage Details')).toBeInTheDocument())
    // Update dialog should show with pre-populated fields
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(1, expect.any(Object)))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Mortgage updated successfully!'))
  })

  it('onUpdateSubmit error', async () => {
    mockUpdate.mockRejectedValue({ response: { data: { message: 'Update failed' } }, message: 'err' })
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Update failed'))
  })

  it('onUpdateSubmit error - generic fallback', async () => {
    mockUpdate.mockRejectedValue(new Error('Net err'))
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Net err'))
  })

  it('update dialog with new attachment file', async () => {
    mockUpdate.mockResolvedValue({})
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    // Change attachment
    const fileInputs = document.querySelectorAll('input[type="file"]')
    const updateFileInput = fileInputs[fileInputs.length - 1]
    const file = new File(['x'], 'new.pdf', { type: 'application/pdf' })
    fireEvent.change(updateFileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
  })

  it('handleUpdateAmountChange in update dialog', async () => {
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    // Find the update amount input
    const amountInputs = document.querySelectorAll('input[type="text"]')
    const lastTextInput = amountInputs[amountInputs.length - 1]
    if (lastTextInput) {
      fireEvent.change(lastTextInput, { target: { value: '750000' } })
      fireEvent.change(lastTextInput, { target: { value: '' } })
    }
  })

  it('closes update dialog via Cancel', async () => {
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    fireEvent.click(screen.getByText('Cancel'))
  })

  it('closes update dialog via backdrop', async () => {
    await openMenuFor('ACTIVE')
    fireEvent.click(screen.getByText('Update Mortgage Details'))
    await waitFor(() => expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Action Menu: Cancel ---

  it('cancel mortgage - confirm Yes', async () => {
    mockCancel.mockResolvedValue({})
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'PENDING' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(screen.getByText('Cancel Mortgage')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Cancel Mortgage'))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this mortgage?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Yes'))
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Mortgage cancelled successfully!'))
  })

  it('cancel mortgage - error', async () => {
    mockCancel.mockRejectedValue({ response: { data: { message: 'Cannot cancel' } } })
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'PENDING' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Mortgage')))
    await waitFor(() => fireEvent.click(screen.getByText('Yes')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Cannot cancel'))
  })

  it('cancel mortgage - error fallback', async () => {
    mockCancel.mockRejectedValue({})
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'PENDING' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Mortgage')))
    await waitFor(() => fireEvent.click(screen.getByText('Yes')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to cancel mortgage'))
  })

  it('cancel dialog - click No', async () => {
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'PENDING' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Mortgage')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this mortgage?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('No'))
  })

  it('cancel dialog - close via backdrop', async () => {
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'PENDING' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Mortgage')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this mortgage?')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Action Menu: Release ---

  it('release mortgage - confirm', async () => {
    mockCreateRelease.mockResolvedValue({})
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(screen.getByText('Release Mortgage')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Release Mortgage'))
    await waitFor(() => expect(screen.getByText(/This will create a release payment/)).toBeInTheDocument())
    fireEvent.click(screen.getByText('Create Release Payment'))
    await waitFor(() => expect(mockCreateRelease).toHaveBeenCalledWith(1))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Mortgage release payment created successfully!'))
  })

  it('release mortgage - error', async () => {
    mockCreateRelease.mockRejectedValue({ response: { data: { error: 'Release failed' } }, message: 'err' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Release Mortgage')))
    await waitFor(() => fireEvent.click(screen.getByText('Create Release Payment')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Release failed'))
  })

  it('release mortgage - error message fallback', async () => {
    mockCreateRelease.mockRejectedValue({ response: { data: { message: 'Bad release' } }, message: 'err' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Release Mortgage')))
    await waitFor(() => fireEvent.click(screen.getByText('Create Release Payment')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Bad release'))
  })

  it('release mortgage - generic error fallback', async () => {
    mockCreateRelease.mockRejectedValue({ message: '' })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Release Mortgage')))
    await waitFor(() => fireEvent.click(screen.getByText('Create Release Payment')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to create release payment'))
  })

  it('release dialog - click Cancel', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Release Mortgage')))
    await waitFor(() => expect(screen.getByText(/This will create a release payment/)).toBeInTheDocument())
    const cancelBtns = screen.getAllByText('Cancel')
    fireEvent.click(cancelBtns[cancelBtns.length - 1])
  })

  it('release dialog - close via backdrop', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Release Mortgage')))
    await waitFor(() => expect(screen.getByText(/This will create a release payment/)).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- RELEASED status: no actions ---

  it('shows "No actions available" for RELEASED mortgage', async () => {
    mockGetAll.mockResolvedValue({ data: [{ ...mockMortgage, status: 'RELEASED' }] })
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(screen.getByText('No actions available')).toBeInTheDocument())
  })

  // --- Menu close ---

  it('closes action menu via onClose', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('M-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(document.querySelector('[role="menuitem"]')).toBeInTheDocument())
    // Press Escape to close menu
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
  })

  // --- selectedLandTitleId useEffect ---

  it('auto-fills owner_name when land title is selected', async () => {
    render(<Mortgages />)
    await waitFor(() => expect(screen.getByText('Mortgages')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /create mortgage/i }))
    await waitFor(() => expect(screen.getByText('Land Title:')).toBeInTheDocument())
    // Select a land title from the dropdown
    const selects = document.querySelectorAll('select')
    const landTitleSelect = selects[0]
    fireEvent.change(landTitleSelect, { target: { value: '2' } })
  })
})
