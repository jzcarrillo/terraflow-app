import { render, screen, waitFor } from '@testing-library/react'
import { ConfigProvider, useConfig } from '../ConfigContext'

function TestConsumer() {
  const config = useConfig()
  return <div>{config ? config.apiUrl : 'no config'}</div>
}

describe('ConfigContext', () => {
  beforeEach(() => {
    delete window.__RUNTIME_CONFIG__
    localStorage.clear()
    global.fetch = jest.fn()
  })

  it('should load config from API and provide to children', async () => {
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({ apiUrl: 'http://api.test', dashboardUrl: 'http://dash.test' })
    })

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('http://api.test')).toBeInTheDocument()
    })
  })

  it('should use cached config from localStorage', async () => {
    localStorage.setItem('__APP_CONFIG__', JSON.stringify({ apiUrl: 'http://cached.test' }))
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({ apiUrl: 'http://fresh.test' })
    })

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    )

    // Initially shows cached
    await waitFor(() => {
      expect(screen.getByText(/http:\/\//)).toBeInTheDocument()
    })
  })

  it('should use fallback config on fetch error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {})) // never resolves
    localStorage.clear()

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    )

    expect(screen.getByText('Loading configuration...')).toBeInTheDocument()
  })
})
