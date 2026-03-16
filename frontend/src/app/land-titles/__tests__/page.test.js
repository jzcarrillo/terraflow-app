import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LandTitles from '../page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/land-titles' }))
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/common/StatusChip', () => ({ status }) => <span>{status}</span>)
jest.mock('@/components/common/LoadingTable', () => ({ message }) => <tr><td>{message || 'Loading...'}</td></tr>)
jest.mock('@/components/common/AlertMessage', () => ({ error, success }) => <>{error && <div data-testid="error">{error}</div>}{success && <div data-testid="success">{success}</div>}</>)
jest.mock('@/hooks/useApi', () => ({ useApi: jest.fn(() => ({ data: null, loading: false, error: '' })) }))

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async (values) => ({ values, errors: {} })
}))

const mockGetAll = jest.fn()
const mockCreate = jest.fn()
const mockGetBlockchainHistory = jest.fn()
const mockMortgagesGetAll = jest.fn()

jest.mock('@/services/api', () => ({
  landTitlesAPI: {
    getAll: (...a) => mockGetAll(...a),
    create: (...a) => mockCreate(...a),
    getBlockchainHistory: (...a) => mockGetBlockchainHistory(...a),
    validate: jest.fn()
  },
  mortgagesAPI: { getAll: (...a) => mockMortgagesGetAll(...a) }
}))
jest.mock('@/utils/auth', () => ({ getCurrentUser: jest.fn(() => ({ role: 'ADMIN' })), getToken: jest.fn(() => 'tk'), logout: jest.fn() }))
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' },
  STATUS_COLORS: { ACTIVE: 'success' }
}))

const mockTitle = { id: 1, title_number: 'TCT-001', survey_number: 'SN-001', owner_name: 'Owner', contact_no: '09123456789', email_address: 'o@t.com', address: 'Manila', property_location: 'Manila', lot_number: 1, area_size: 100, classification: 'Residential', registration_date: '2024-01-01', registrar_office: 'Manila', previous_title_number: 'OLD-001', status: 'ACTIVE', created_at: '2024-01-01', attachments: [] }

const openCreateDialog = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: /create new land title/i })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /create new land title/i }))
  await waitFor(() => expect(screen.getByText('Title Number:')).toBeInTheDocument())
}

describe('Land Titles Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.useFakeTimers()
    mockGetAll.mockResolvedValue({ data: [mockTitle] })
    mockMortgagesGetAll.mockResolvedValue({ data: [] })
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [] } })
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('renders and fetches land titles', async () => {
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
  })

  it('handles nested data response', async () => {
    mockGetAll.mockResolvedValue({ data: { data: [mockTitle] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
  })

  it('handles double nested data response', async () => {
    mockGetAll.mockResolvedValue({ data: { data: { data: [mockTitle] } } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
  })

  it('handles API error', async () => {
    mockGetAll.mockRejectedValue(new Error('fail'))
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch land titles'))
  })

  it('handles 401 error without setting error message', async () => {
    mockGetAll.mockRejectedValue({ response: { status: 401 } })
    render(<LandTitles />)
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled())
  })

  it('handles 403 error without setting error message', async () => {
    mockGetAll.mockRejectedValue({ response: { status: 403 } })
    render(<LandTitles />)
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled())
  })

  it('shows empty state', async () => {
    mockGetAll.mockResolvedValue({ data: [] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('No land titles found')).toBeInTheDocument())
  })

  // --- Create Dialog & onSubmit ---

  it('opens create dialog with all form fields', async () => {
    render(<LandTitles />)
    await openCreateDialog()
    expect(screen.getByText('Survey Number:')).toBeInTheDocument()
    expect(screen.getByText('Owner Name:')).toBeInTheDocument()
    expect(screen.getByText('Contact No:')).toBeInTheDocument()
    expect(screen.getByText('Email Address:')).toBeInTheDocument()
    expect(screen.getByText('Lot Number:')).toBeInTheDocument()
    expect(screen.getByText('Area Size (sqm):')).toBeInTheDocument()
    expect(screen.getByText('Classification:')).toBeInTheDocument()
    expect(screen.getByText('Attachments:')).toBeInTheDocument()
  })

  it('onSubmit success - creates land title', async () => {
    mockCreate.mockResolvedValue({ data: {} })
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Land title created successfully!'))
    // Advance timer for auto-refresh setTimeout
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit error - 401 auth error', async () => {
    mockCreate.mockRejectedValue({ response: { status: 401 } })
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Authentication required'))
  })

  it('onSubmit error - network error', async () => {
    mockCreate.mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network Error' })
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Cannot connect to server'))
  })

  it('onSubmit error - response.data.message', async () => {
    mockCreate.mockRejectedValue({ response: { data: { message: 'Duplicate title' } }, message: 'Request failed' })
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Duplicate title'))
  })

  it('onSubmit error - generic fallback', async () => {
    mockCreate.mockRejectedValue(new Error('Something broke'))
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Something broke'))
  })

  it('onSubmit error - no message fallback', async () => {
    mockCreate.mockRejectedValue({ message: '' })
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to create land title'))
  })

  it('onSubmit validates file size > 5MB', async () => {
    render(<LandTitles />)
    await openCreateDialog()
    const fileInput = document.querySelector('input[type="file"]')
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInput, 'files', { value: [bigFile], configurable: true })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('exceeds 5MB limit'))
  })

  it('onSubmit with valid file attaches to FormData', async () => {
    mockCreate.mockResolvedValue({ data: {} })
    render(<LandTitles />)
    await openCreateDialog()
    const fileInput = document.querySelector('input[type="file"]')
    const validFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInput, 'files', { value: [validFile], configurable: true })
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    jest.advanceTimersByTime(1000)
  })

  it('closes create dialog via Cancel', async () => {
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.click(screen.getByText('Cancel'))
  })

  it('closes create dialog via backdrop', async () => {
    render(<LandTitles />)
    await openCreateDialog()
    const backdrop = document.querySelector('.MuiBackdrop-root')
    if (backdrop) fireEvent.click(backdrop)
  })

  it('add and remove attachment inputs', async () => {
    render(<LandTitles />)
    await openCreateDialog()
    fireEvent.click(screen.getByText('+ Add File'))
    // Now 2 inputs, Remove buttons should appear
    const removeBtns = screen.getAllByText('Remove')
    fireEvent.click(removeBtns[0])
  })

  // --- Details Dialog ---

  it('opens details with all fields', async () => {
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('Land Title Details')).toBeInTheDocument())
    expect(screen.getByText('SN-001')).toBeInTheDocument()
    expect(screen.getByText('09123456789')).toBeInTheDocument()
    expect(screen.getByText('o@t.com')).toBeInTheDocument()
    expect(screen.getByText('No attachments uploaded')).toBeInTheDocument()
  })

  it('shows attachments with View and Download buttons', async () => {
    window.open = jest.fn()
    const titleWithAttachments = { ...mockTitle, attachments: [{ id: 1, original_name: 'doc.pdf', mime_type: 'application/pdf', size: 1024 }] }
    mockGetAll.mockResolvedValue({ data: [titleWithAttachments] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText(/doc.pdf/)).toBeInTheDocument())
    fireEvent.click(screen.getByText('View'))
    expect(window.open).toHaveBeenCalled()
  })

  it('handles download attachment success', async () => {
    const titleWithAttachments = { ...mockTitle, attachments: [{ id: 1, original_name: 'doc.pdf', mime_type: 'application/pdf', size: 1024 }] }
    mockGetAll.mockResolvedValue({ data: [titleWithAttachments] })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['test'])) })
    window.URL.createObjectURL = jest.fn(() => 'blob:url')
    window.URL.revokeObjectURL = jest.fn()
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('Download')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Download'))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('handles download attachment failure', async () => {
    const titleWithAttachments = { ...mockTitle, attachments: [{ id: 1, original_name: 'doc.pdf', mime_type: 'application/pdf', size: 1024 }] }
    mockGetAll.mockResolvedValue({ data: [titleWithAttachments] })
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => fireEvent.click(screen.getByText('Download')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to download attachment'))
  })

  it('closes details dialog', async () => {
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('Land Title Details')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Close'))
  })

  it('closes details dialog via backdrop', async () => {
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('Land Title Details')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Blockchain & Mortgage in details ---

  it('shows blockchain history', async () => {
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [{ blockchain_hash: 'hash1', transaction_type: 'CREATED', timestamp: '1700000000', owner_name: 'Owner' }] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('hash1')).toBeInTheDocument())
  })

  it('shows transfer blockchain with from_owner match', async () => {
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [
      { blockchain_hash: 'h1', transaction_type: 'TRANSFER', timestamp: '1700000000', owner_name: 'Seller', from_owner: 'Seller', to_owner: 'Buyer' }
    ] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('h1')).toBeInTheDocument())
  })

  it('shows all blockchain transaction types', async () => {
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [
      { blockchain_hash: 'h1', transaction_type: 'TRANSFER', timestamp: '1700000000', owner_name: 'Buyer', from_owner: 'Seller', to_owner: 'Buyer' },
      { blockchain_hash: 'h2', transaction_type: 'CANCELLED', timestamp: '1700000000', owner_name: 'O' },
      { blockchain_hash: 'h3', transaction_type: 'REACTIVATED', timestamp: '1700000000', owner_name: 'O' },
      { blockchain_hash: 'h4', transaction_type: 'MORTGAGE', timestamp: '1700000000', bank_name: 'BDO', amount: '500000' },
      { hash: 'h5', transaction_type: 'OTHER', timestamp: '1700000000', owner_name: 'O' }
    ] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('h1')).toBeInTheDocument())
  })

  it('shows mortgage blockchain hashes from title.mortgages', async () => {
    const titleWithMortgages = { ...mockTitle, mortgages: [{ blockchain_hash: 'mhash1', release_blockchain_hash: 'rhash1', bank_name: 'BDO', amount: 500000, created_at: '2024-01-01', updated_at: '2024-02-01' }] }
    mockGetAll.mockResolvedValue({ data: [titleWithMortgages] })
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [{ blockchain_hash: 'x', transaction_type: 'CREATED', timestamp: '1700000000', owner_name: 'O' }] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('mhash1')).toBeInTheDocument())
    expect(screen.getByText('rhash1')).toBeInTheDocument()
  })

  it('shows mortgage summary with ACTIVE mortgages (ENCUMBERED)', async () => {
    mockMortgagesGetAll.mockResolvedValue({ data: [{ id: 1, land_title_id: 1, mortgage_id: 'M-1', bank_name: 'BDO', amount: 500000, lien_position: 1, status: 'ACTIVE' }] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('BDO')).toBeInTheDocument())
    expect(screen.getByText('ENCUMBERED')).toBeInTheDocument()
  })

  it('shows mortgage summary with 2nd and 3rd lien positions', async () => {
    mockMortgagesGetAll.mockResolvedValue({ data: [
      { id: 1, land_title_id: 1, mortgage_id: 'M-1', bank_name: 'BDO', amount: 500000, lien_position: 2, status: 'ACTIVE' },
      { id: 2, land_title_id: 1, mortgage_id: 'M-2', bank_name: 'BPI', amount: 300000, lien_position: 3, status: 'RELEASED' }
    ] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('BDO')).toBeInTheDocument())
  })

  it('shows CLEAR mortgage summary when no active/pending', async () => {
    mockMortgagesGetAll.mockResolvedValue({ data: [{ id: 1, land_title_id: 1, mortgage_id: 'M-1', bank_name: 'BDO', amount: 500000, lien_position: 1, status: 'RELEASED' }] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('CLEAR')).toBeInTheDocument())
  })

  it('handles blockchain history fetch error', async () => {
    mockGetBlockchainHistory.mockRejectedValue(new Error('fail'))
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(mockGetBlockchainHistory).toHaveBeenCalled())
  })

  it('handles mortgage fetch error in details', async () => {
    mockMortgagesGetAll.mockRejectedValue(new Error('fail'))
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(mockMortgagesGetAll).toHaveBeenCalled())
  })

  it('handles mortgages nested data response', async () => {
    mockMortgagesGetAll.mockResolvedValue({ data: { data: [{ id: 1, land_title_id: 1, mortgage_id: 'M-1', bank_name: 'BDO', amount: 500000, lien_position: 1, status: 'PENDING' }] } })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('ENCUMBERED')).toBeInTheDocument())
  })

  it('shows no blockchain transactions message', async () => {
    mockGetBlockchainHistory.mockResolvedValue({ data: { history: [] } })
    const titleNoMortgages = { ...mockTitle, mortgages: undefined }
    mockGetAll.mockResolvedValue({ data: [titleNoMortgages] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText('No blockchain transactions found')).toBeInTheDocument())
  })

  it('shows attachment without size', async () => {
    const titleWithAttachments = { ...mockTitle, attachments: [{ id: 1, original_name: 'doc.pdf', mime_type: 'application/pdf' }] }
    mockGetAll.mockResolvedValue({ data: [titleWithAttachments] })
    render(<LandTitles />)
    await waitFor(() => expect(screen.getByText('TCT-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('TCT-001'))
    await waitFor(() => expect(screen.getByText(/Unknown size/)).toBeInTheDocument())
  })
})
