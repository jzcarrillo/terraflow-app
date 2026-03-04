import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Mortgages from '../page'
import { mortgagesAPI } from '@/services/api'

jest.mock('@/services/api')
jest.mock('@/components/Layout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/utils/auth', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, username: 'test', role: 'ADMIN' })),
  getToken: jest.fn(() => 'test-token')
}))

describe('Mortgages Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render mortgages page', async () => {
    mortgagesAPI.getAll.mockResolvedValue({ data: [] })
    mortgagesAPI.getLandTitlesForMortgage.mockResolvedValue({ data: [] })

    render(<Mortgages />)

    await waitFor(() => {
      expect(screen.getByText('Mortgages')).toBeInTheDocument()
    })
  })

  it('should display mortgages list', async () => {
    const mockMortgages = [
      {
        id: 1,
        land_title_id: 1,
        bank_name: 'BDO',
        amount: 500000,
        lien_position: 1,
        status: 'ACTIVE',
        created_at: '2024-02-24T00:00:00Z'
      }
    ]

    mortgagesAPI.getAll.mockResolvedValue({ data: mockMortgages })
    mortgagesAPI.getLandTitlesForMortgage.mockResolvedValue({ data: [] })

    render(<Mortgages />)

    await waitFor(() => {
      expect(screen.getByText('BDO')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    mortgagesAPI.getAll.mockRejectedValue(new Error('API Error'))
    mortgagesAPI.getLandTitlesForMortgage.mockResolvedValue({ data: [] })

    render(<Mortgages />)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })
})
