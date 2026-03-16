import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Register from '../page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))
jest.mock('next/link', () => ({ children, ...props }) => <a {...props}>{children}</a>)
jest.mock('@/utils/config', () => ({
  API_CONFIG: { BASE_URL: 'http://test/api' }
}))
jest.mock('@/components/common/AlertMessage', () => ({ error, success }) => (
  <>
    {error && <div data-testid="error">{error}</div>}
    {success && <div data-testid="success">{success}</div>}
  </>
))

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  const fillForm = () => {
    const inputs = document.querySelectorAll('input')
    const selects = document.querySelectorAll('select')
    // email, username, password, confirmPassword, firstName, lastName
    fireEvent.change(inputs[0], { target: { value: 'test@test.com' } })
    fireEvent.change(inputs[1], { target: { value: 'testuser' } })
    fireEvent.change(inputs[2], { target: { value: 'password123' } })
    fireEvent.change(inputs[3], { target: { value: 'password123' } })
    fireEvent.change(inputs[4], { target: { value: 'John' } })
    fireEvent.change(inputs[5], { target: { value: 'Doe' } })
    // location, role selects
    fireEvent.change(selects[0], { target: { value: 'Manila' } })
    fireEvent.change(selects[1], { target: { value: 'ADMIN' } })
  }

  it('renders form elements', () => {
    render(<Register />)
    expect(screen.getByText('Email Address:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
    expect(screen.getByText('Login here')).toBeInTheDocument()
  })

  it('handles successful registration', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve({ message: 'Success' })
    })

    render(<Register />)
    fillForm()
    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('Registration successful'))
    jest.advanceTimersByTime(2000)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('handles 409 conflict error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 409, json: () => Promise.resolve({ message: 'Email already exists' })
    })

    render(<Register />)
    fillForm()
    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Email already exists'))
  })

  it('handles other server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 500, json: () => Promise.resolve({ message: 'Server error' })
    })

    render(<Register />)
    fillForm()
    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Server error'))
  })

  it('handles network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    render(<Register />)
    fillForm()
    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Network error. Please try again.'))
  })
})
