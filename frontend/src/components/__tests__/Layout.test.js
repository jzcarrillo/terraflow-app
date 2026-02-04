import { render, screen, fireEvent } from '@testing-library/react'
import Layout from '../Layout'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}))

jest.mock('@/utils/auth', () => ({
  getCurrentUser: jest.fn(() => ({ username: 'testuser', role: 'admin' })),
  logout: jest.fn(),
}))

describe('Layout Component', () => {
  it('renders layout with children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('displays user info when logged in', () => {
    render(<Layout><div>Content</div></Layout>)
    expect(screen.getByText(/Welcome, testuser/)).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Layout><div>Content</div></Layout>)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout when logout button clicked', () => {
    const { logout } = require('@/utils/auth')
    render(<Layout><div>Content</div></Layout>)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(logout).toHaveBeenCalled()
  })

  it('renders app title', () => {
    render(<Layout><div>Content</div></Layout>)
    expect(screen.getByText('Land Registration System')).toBeInTheDocument()
  })
})
