import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UsersPage from '../page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/users'
}))
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)

const mockHasRole = jest.fn(() => true)
jest.mock('@/utils/auth', () => ({
  getCurrentUser: jest.fn(() => ({ role: 'ADMIN' })),
  hasRole: (...args) => mockHasRole(...args),
  logout: jest.fn(),
  getToken: jest.fn(() => 'token')
}))
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' },
  STATUS_COLORS: {}
}))

const mockUsers = [
  { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User', email_address: 'admin@test.com', role: 'ADMIN', status: 'ACTIVE' },
  { id: 2, username: 'cashier', first_name: 'Cash', last_name: 'Ier', email_address: 'cash@test.com', role: 'CASHIER', status: 'ACTIVE' }
]

describe('Users Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasRole.mockReturnValue(true)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve({ users: mockUsers })
    })
  })

  it('renders and displays users', async () => {
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())
    expect(screen.getByText('cashier')).toBeInTheDocument()
  })

  it('shows access denied for non-admin', () => {
    mockHasRole.mockReturnValue(false)
    render(<UsersPage />)
    expect(screen.getByText(/Access denied/)).toBeInTheDocument()
  })

  it('shows empty state when no users', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ users: [] }) })
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('No users found')).toBeInTheDocument())
  })

  it('handles fetch error', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Error' })
    jest.spyOn(console, 'error').mockImplementation()
    render(<UsersPage />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    jest.restoreAllMocks()
  })

  it('handles fetch exception', async () => {
    global.fetch.mockRejectedValue(new Error('Network'))
    jest.spyOn(console, 'error').mockImplementation()
    render(<UsersPage />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    jest.restoreAllMocks()
  })

  it('opens edit modal and updates user', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ users: mockUsers }) })
    window.alert = jest.fn()

    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(screen.getByText('Edit User Details')).toBeInTheDocument()

    // Change role select to cover line 233
    const roleSelect = screen.getByDisplayValue('ADMIN')
    fireEvent.change(roleSelect, { target: { value: 'USER' } })

    // Click Update
    fireEvent.click(screen.getByText('Update'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('User updated successfully!'))
  })

  it('handles update failure', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ users: mockUsers }) })
      .mockResolvedValueOnce({ ok: false })
    window.alert = jest.fn()

    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    fireEvent.click(screen.getAllByText('Edit')[0])
    fireEvent.click(screen.getByText('Update'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to update user'))
  })

  it('handles update exception', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ users: mockUsers }) })
      .mockRejectedValueOnce(new Error('fail'))
    window.alert = jest.fn()
    jest.spyOn(console, 'error').mockImplementation()

    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    fireEvent.click(screen.getAllByText('Edit')[0])
    fireEvent.click(screen.getByText('Update'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Error updating user'))
    jest.restoreAllMocks()
  })

  it('closes edit modal on cancel', async () => {
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    fireEvent.click(screen.getAllByText('Edit')[0])
    expect(screen.getByText('Edit User Details')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Edit User Details')).not.toBeInTheDocument()
  })

  it('updates edit form fields', async () => {
    render(<UsersPage />)
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument())

    fireEvent.click(screen.getAllByText('Edit')[0])
    const inputs = document.querySelectorAll('.fixed input')
    fireEvent.change(inputs[0], { target: { value: 'NewFirst' } })
    fireEvent.change(inputs[1], { target: { value: 'NewLast' } })
    fireEvent.change(inputs[2], { target: { value: 'new@test.com' } })
  })
})
