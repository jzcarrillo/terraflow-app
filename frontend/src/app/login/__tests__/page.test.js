import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../page'

const mockLogin = jest.fn()
jest.mock('@/services/api', () => ({
  authAPI: { login: (...args) => mockLogin(...args) }
}))

const mockGetCurrentUser = jest.fn()
jest.mock('@/utils/auth', () => ({
  getCurrentUser: (...args) => mockGetCurrentUser(...args)
}))

jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api', DASHBOARD_URL: 'http://test/' },
  ROLES: { ADMIN: 'ADMIN', CASHIER: 'CASHIER', LAND_TITLE_PROCESSOR: 'LAND_TITLE_PROCESSOR' }
}))
jest.mock('next/link', () => ({ children, ...props }) => <a {...props}>{children}</a>)

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })
  afterEach(() => jest.restoreAllMocks())

  const fillAndSubmit = () => {
    const inputs = document.querySelectorAll('input')
    fireEvent.change(inputs[0], { target: { value: 'testuser' } })
    fireEvent.change(inputs[1], { target: { value: 'password123' } })
    fireEvent.submit(document.querySelector('form'))
  }

  it('renders login form elements', () => {
    render(<Login />)
    expect(screen.getByText('Username:')).toBeInTheDocument()
    expect(screen.getByText('Password:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText('Register here')).toBeInTheDocument()
  })

  it('handles successful login - ADMIN redirects to dashboard', async () => {
    mockLogin.mockResolvedValue({ ok: true, data: { user: 'test' } })
    mockGetCurrentUser.mockReturnValue({ role: 'ADMIN' })

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' }))
  })

  it('handles successful login - CASHIER redirects to payments', async () => {
    mockLogin.mockResolvedValue({ ok: true, data: { user: 'test' } })
    mockGetCurrentUser.mockReturnValue({ role: 'CASHIER' })

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(mockLogin).toHaveBeenCalled())
  })

  it('handles successful login - LAND_TITLE_PROCESSOR redirects to land-titles', async () => {
    mockLogin.mockResolvedValue({ ok: true, data: { user: 'test' } })
    mockGetCurrentUser.mockReturnValue({ role: 'LAND_TITLE_PROCESSOR' })

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(mockLogin).toHaveBeenCalled())
  })

  it('handles login failure with error message', async () => {
    mockLogin.mockResolvedValue({ ok: false, error: { error: 'Invalid credentials' } })

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })

  it('handles login failure with fallback message', async () => {
    mockLogin.mockResolvedValue({ ok: false, error: {} })

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Login failed')).toBeInTheDocument())
  })

  it('handles login exception', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Login service unavailable')).toBeInTheDocument())
  })

  it('shows loading state during submit', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}))

    render(<Login />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Signing in...')).toBeInTheDocument())
  })

  it('updates credentials on input change', () => {
    render(<Login />)
    const inputs = document.querySelectorAll('input')
    fireEvent.change(inputs[0], { target: { value: 'newuser' } })
    expect(inputs[0].value).toBe('newuser')
    fireEvent.change(inputs[1], { target: { value: 'newpass' } })
    expect(inputs[1].value).toBe('newpass')
  })
})
