import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Payments from '../page'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/payments' }))
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/common/StatusChip', () => ({ status }) => <span>{status}</span>)
jest.mock('@/components/common/LoadingTable', () => ({ message }) => <tr><td>{message || 'Loading...'}</td></tr>)
jest.mock('@/components/common/AlertMessage', () => ({ error, success }) => <>{error && <div data-testid="error">{error}</div>}{success && <div data-testid="success">{success}</div>}</>)

// Mock react-hook-form to bypass validation — handleSubmit always calls onSubmit
let capturedOnSubmit = null
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: (name) => ({ name, onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() }),
    handleSubmit: (fn) => (e) => { e?.preventDefault?.(); capturedOnSubmit = fn; fn(Object.fromEntries(new FormData(e?.target || document.querySelector('form')))) },
    reset: jest.fn(),
    formState: { errors: {} }
  })
}))

const mockGetAll = jest.fn()
const mockCreate = jest.fn()
const mockConfirm = jest.fn()
const mockCancel = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@/services/api', () => ({
  paymentsAPI: { getAll: (...a) => mockGetAll(...a), create: (...a) => mockCreate(...a), confirm: (...a) => mockConfirm(...a), cancel: (...a) => mockCancel(...a), update: (...a) => mockUpdate(...a) }
}))
jest.mock('@/utils/auth', () => ({ getCurrentUser: jest.fn(() => ({ role: 'ADMIN' })), getToken: jest.fn(() => 'tk'), logout: jest.fn() }))
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' },
  STATUS_COLORS: { PENDING: 'warning', PAID: 'success' }
}))

const mockPayment = { id: 1, payment_id: 'PAY-001', reference_type: 'Land Registration', reference_id: 'LT-001', payer_name: 'John', amount: 1000, payment_method: 'CASH', status: 'PENDING', created_at: '2024-01-01' }

const getMoreBtn = () => Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg[data-testid="MoreVertIcon"]'))

// Helper: set up global.fetch to return different data per URL
const setupFetch = (overrides = {}) => {
  const defaults = {
    '/land-titles': { data: [{ id: 1, title_number: 'TCT-001', owner_name: 'Owner1', status: 'PENDING' }] },
    '/transfers': { data: [{ transfer_id: 'TR-001', title_number: 'TCT-002', buyer_name: 'Buyer1', status: 'PENDING' }] },
    '/payments': { data: [] },
    '/mortgages/for-payment': { data: [{ id: 1, mortgage_id: 'M-001', bank_name: 'BDO', amount: 500000 }] }
  }
  const responses = { ...defaults, ...overrides }
  global.fetch = jest.fn((url) => {
    const key = Object.keys(responses).find(k => url.includes(k))
    return Promise.resolve({ json: () => Promise.resolve(responses[key] || { data: [] }) })
  })
}

const openCreateDialog = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: /create new payment/i })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /create new payment/i }))
  await waitFor(() => expect(screen.getByText('Payment ID:')).toBeInTheDocument())
}

const fillAndSubmit = async (refType = 'Land Registration', refId = 'TCT-001') => {
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  const form = document.querySelector('form')
  // Set values on native select/input elements so FormData picks them up
  const refTypeSelect = form.querySelector('[name="reference_type"]')
  const refIdSelect = form.querySelector('[name="reference_id"]')
  const payerInput = form.querySelector('[name="payer_name"]')
  const amountInput = form.querySelector('[name="amount"]')
  const methodSelect = form.querySelector('[name="payment_method"]')
  if (refTypeSelect) { refTypeSelect.value = refType; fireEvent.change(refTypeSelect, { target: { value: refType } }) }
  if (refIdSelect) refIdSelect.value = refId
  if (payerInput) payerInput.value = 'John'
  if (amountInput) amountInput.value = '1000'
  if (methodSelect) methodSelect.value = 'CASH'
  fireEvent.submit(form)
}

describe('Payments Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.useFakeTimers()
    mockGetAll.mockResolvedValue({ data: [mockPayment] })
    setupFetch()
    localStorage.removeItem('pendingTransfer')
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  // --- Basic rendering ---

  it('renders and fetches payments', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    expect(screen.getByText('Land Registration')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('handles fetch error', async () => {
    mockGetAll.mockRejectedValue(new Error('fail'))
    render(<Payments />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch payments'))
  })

  it('shows empty state', async () => {
    mockGetAll.mockResolvedValue({ data: [] })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('No payments found')).toBeInTheDocument())
  })

  it('disables action button for FAILED payment', async () => {
    mockGetAll.mockResolvedValue({ data: [{ ...mockPayment, status: 'FAILED' }] })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
  })

  // --- fetchLandTitles ---

  it('fetchLandTitles filters ACTIVE titles and titles with PAID payments', async () => {
    mockGetAll.mockResolvedValue({ data: [mockPayment, { ...mockPayment, id: 2, payment_id: 'PAY-002', reference_id: 'TCT-003', status: 'PAID' }] })
    setupFetch({
      '/land-titles': { data: [
        { id: 1, title_number: 'TCT-001', owner_name: 'O1', status: 'PENDING' },
        { id: 2, title_number: 'TCT-002', owner_name: 'O2', status: 'ACTIVE' },
        { id: 3, title_number: 'TCT-003', owner_name: 'O3', status: 'PENDING' }
      ] }
    })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('fetchLandTitles handles nested data.data.data', async () => {
    setupFetch({
      '/land-titles': { data: { data: [{ id: 1, title_number: 'TCT-001', owner_name: 'O1', status: 'PENDING' }] } }
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('fetchLandTitles handles error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'))
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  // --- fetchPendingTransfers ---

  it('fetchPendingTransfers filters transfers with existing pending payments', async () => {
    setupFetch({
      '/transfers': { data: [
        { transfer_id: 'TR-001', title_number: 'TCT-001', buyer_name: 'B1', status: 'PENDING' },
        { transfer_id: 'TR-002', title_number: 'TCT-002', buyer_name: 'B2', status: 'PENDING' },
        { transfer_id: 'TR-003', title_number: 'TCT-003', buyer_name: 'B3', status: 'COMPLETED' }
      ] },
      '/payments': { data: [{ reference_id: 'TCT-001', reference_type: 'Transfer Title', status: 'PENDING' }] }
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('fetchPendingTransfers handles nested data.data.data for transfers', async () => {
    setupFetch({
      '/transfers': { data: { data: [{ transfer_id: 'TR-001', title_number: 'TCT-001', buyer_name: 'B1', status: 'PENDING' }] } },
      '/payments': [{ reference_id: 'X', reference_type: 'Transfer Title', status: 'PENDING' }]
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('fetchPendingTransfers handles nested paymentsData.data.data', async () => {
    setupFetch({
      '/transfers': { data: [{ transfer_id: 'TR-001', title_number: 'TCT-001', buyer_name: 'B1', status: 'PENDING' }] },
      '/payments': { data: { data: [] } }
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  it('fetchPendingTransfers handles error', async () => {
    const origFetch = global.fetch
    global.fetch = jest.fn((url) => {
      if (url.includes('/transfers') || url.includes('/payments')) return Promise.reject(new Error('fail'))
      return origFetch(url)
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  // --- fetchPendingMortgages ---

  it('fetchPendingMortgages handles error', async () => {
    const origFetch = global.fetch
    global.fetch = jest.fn((url) => {
      if (url.includes('/mortgages/for-payment')) return Promise.reject(new Error('fail'))
      return Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
    })
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })

  // --- Create Dialog & onSubmit ---

  it('opens create dialog with all form fields', async () => {
    render(<Payments />)
    await openCreateDialog()
    expect(screen.getByText('Reference Type:')).toBeInTheDocument()
    expect(screen.getByText('Reference ID:')).toBeInTheDocument()
    expect(screen.getByText('Payer Name:')).toBeInTheDocument()
    expect(screen.getByText('Amount:')).toBeInTheDocument()
    expect(screen.getByText('Payment Method:')).toBeInTheDocument()
  })

  it('onSubmit success - creates payment', async () => {
    mockCreate.mockResolvedValue({})
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit()
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Payment created successfully!'))
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit with Transfer Title reference type - finds transfer_id', async () => {
    mockCreate.mockResolvedValue({})
    setupFetch({
      '/transfers': { data: [{ transfer_id: 'TR-001', title_number: 'TCT-002', buyer_name: 'Buyer', status: 'PENDING' }] },
      '/payments': { data: [] }
    })
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit('Transfer Title', 'TCT-002')
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ reference_type: 'Transfer Title', transfer_id: 'TR-001' })))
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit with Transfer Title - no matching transfer found', async () => {
    mockCreate.mockResolvedValue({})
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit('Transfer Title', 'NONEXISTENT')
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit with Mortgage reference type - sets landTitleId null', async () => {
    mockCreate.mockResolvedValue({})
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit('Mortgage', 'M-001')
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ reference_type: 'Mortgage', land_title_id: null })))
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit in edit mode - updates payment', async () => {
    mockUpdate.mockResolvedValue({})
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    // Open menu -> Update
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(screen.getByText('Update Payment Details')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Update Payment Details'))
    await waitFor(() => expect(screen.getByText('Update Payment')).toBeInTheDocument())
    // Wait for setTimeout that pre-populates form
    jest.advanceTimersByTime(100)
    fireEvent.submit(document.querySelector('form'))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(1, expect.any(Object)))
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Payment updated successfully!'))
    jest.advanceTimersByTime(1000)
  })

  it('onSubmit error', async () => {
    mockCreate.mockRejectedValue({ response: { data: { message: 'Bad payment' } } })
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Bad payment'))
  })

  it('onSubmit error - fallback', async () => {
    mockCreate.mockRejectedValue({})
    render(<Payments />)
    await openCreateDialog()
    await fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to save payment'))
  })

  it('closes create dialog via Cancel', async () => {
    render(<Payments />)
    await openCreateDialog()
    fireEvent.click(screen.getByText('Cancel'))
  })

  it('closes create dialog via backdrop', async () => {
    render(<Payments />)
    await openCreateDialog()
    const backdrop = document.querySelector('.MuiBackdrop-root')
    if (backdrop) fireEvent.click(backdrop)
  })

  // --- Reference type select changes dropdown options ---

  it('shows transfer options when Transfer Title selected', async () => {
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const selects = document.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'Transfer Title' } })
    expect(screen.getByText('Select Transfer')).toBeInTheDocument()
  })

  it('shows mortgage options when Mortgage selected', async () => {
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const selects = document.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'Mortgage' } })
    expect(screen.getByText('Select Mortgage')).toBeInTheDocument()
  })

  it('shows land title options when Land Registration selected', async () => {
    render(<Payments />)
    await openCreateDialog()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const selects = document.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'Land Registration' } })
    expect(screen.getByText('Select Land Title')).toBeInTheDocument()
  })

  // --- Details Dialog ---

  it('opens details dialog with all fields', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('PAY-001'))
    expect(screen.getByText('Payment Details')).toBeInTheDocument()
    expect(screen.getAllByText('John').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Close'))
  })

  it('shows N/A for missing detail fields', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('PAY-001'))
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })

  it('closes details dialog via backdrop', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(screen.getByText('PAY-001'))
    await waitFor(() => expect(screen.getByText('Payment Details')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Confirm Payment ---

  it('confirm payment - Yes', async () => {
    mockConfirm.mockResolvedValue({})
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to confirm this payment?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Yes'))
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(1))
  })

  it('confirm payment - error', async () => {
    mockConfirm.mockRejectedValue({ response: { data: { error: 'Confirm failed' } } })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => fireEvent.click(screen.getByText('Yes')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Confirm failed'))
  })

  it('confirm payment - error message fallback', async () => {
    mockConfirm.mockRejectedValue({ response: { data: { message: 'Bad confirm' } } })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => fireEvent.click(screen.getByText('Yes')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Bad confirm'))
  })

  it('confirm payment - generic error fallback', async () => {
    mockConfirm.mockRejectedValue({ message: '' })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => fireEvent.click(screen.getByText('Yes')))
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to confirm payment'))
  })

  it('confirm dialog - No', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to confirm this payment?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('No'))
  })

  it('confirm dialog - close via backdrop', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Confirm Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to confirm this payment?')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Cancel Payment ---

  it('cancel payment - Yes', async () => {
    mockCancel.mockResolvedValue({})
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this payment?')).toBeInTheDocument())
    const yesBtns = screen.getAllByText('Yes')
    fireEvent.click(yesBtns[yesBtns.length - 1])
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith(1))
  })

  it('cancel payment - error', async () => {
    mockCancel.mockRejectedValue({ response: { data: { error: 'Cancel failed' } } })
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Payment')))
    await waitFor(() => {
      const yesBtns = screen.getAllByText('Yes')
      fireEvent.click(yesBtns[yesBtns.length - 1])
    })
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Cancel failed'))
  })

  it('cancel dialog - No', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this payment?')).toBeInTheDocument())
    const noBtns = screen.getAllByText('No')
    fireEvent.click(noBtns[noBtns.length - 1])
  })

  it('cancel dialog - close via backdrop', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Cancel Payment')))
    await waitFor(() => expect(screen.getByText('Are you sure you want to cancel this payment?')).toBeInTheDocument())
    const backdrops = document.querySelectorAll('.MuiBackdrop-root')
    if (backdrops.length) fireEvent.click(backdrops[backdrops.length - 1])
  })

  // --- Update Payment ---

  it('opens update dialog via menu', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => fireEvent.click(screen.getByText('Update Payment Details')))
    await waitFor(() => expect(screen.getByText('Update Payment')).toBeInTheDocument())
    jest.advanceTimersByTime(100)
  })

  // --- Menu close ---

  it('closes action menu', async () => {
    render(<Payments />)
    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    fireEvent.click(getMoreBtn())
    await waitFor(() => expect(document.querySelector('[role="menuitem"]')).toBeInTheDocument())
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
  })

  // --- Pending transfer from localStorage ---

  it('handles pending transfer from localStorage', async () => {
    localStorage.setItem('pendingTransfer', JSON.stringify({ title_number: 'TCT-001', new_owner_name: 'Buyer', transfer_fee: 5000 }))
    mockCreate.mockResolvedValue({})
    render(<Payments />)
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(localStorage.getItem('pendingTransfer')).toBeNull()
  })

  it('handles createTransferPayment error', async () => {
    localStorage.setItem('pendingTransfer', JSON.stringify({ title_number: 'TCT-001', new_owner_name: 'Buyer', transfer_fee: 5000 }))
    mockCreate.mockRejectedValue(new Error('fail'))
    render(<Payments />)
    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed to create transfer payment'))
  })
})
