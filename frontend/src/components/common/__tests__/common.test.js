import { render, screen } from '@testing-library/react'
import AlertMessage from '../AlertMessage'
import StatusChip from '../StatusChip'
import LoadingTable from '../LoadingTable'

describe('AlertMessage', () => {
  it('renders error alert', () => {
    render(<AlertMessage error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders success alert', () => {
    render(<AlertMessage success="Operation successful" />)
    expect(screen.getByText('Operation successful')).toBeInTheDocument()
  })

  it('renders nothing when no props', () => {
    const { container } = render(<AlertMessage />)
    expect(container.firstChild).toBeNull()
  })

  it('prioritizes error over success', () => {
    render(<AlertMessage error="Error" success="Success" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()
  })
})

describe('StatusChip', () => {
  it('renders with known status color', () => {
    render(<StatusChip status="ACTIVE" />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('renders with unknown status as default', () => {
    render(<StatusChip status="UNKNOWN" />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
  })
})

describe('LoadingTable', () => {
  it('renders default loading message', () => {
    render(<table><tbody><LoadingTable colSpan={3} /></tbody></table>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<table><tbody><LoadingTable colSpan={3} message="No data" /></tbody></table>)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })
})
