import { GET } from '../route'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data, data }))
  }
}))

describe('api/config/route', () => {
  it('should return config with defaults', async () => {
    const response = await GET()
    const data = response.data
    expect(data.apiUrl).toBeDefined()
    expect(data.dashboardUrl).toBeDefined()
    expect(data.environment).toBeDefined()
  })
})
