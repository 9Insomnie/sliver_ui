import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../../pages/SettingsPage'
import { ConnectionProvider } from '../../lib/connection'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    info: vi.fn(),
    overview: vi.fn(),
    listProfiles: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    useProfile: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

function renderPage() {
  return render(
    <MemoryRouter>
      <ConnectionProvider>
        <SettingsPage />
      </ConnectionProvider>
    </MemoryRouter>,
  )
}

function mockConnected(connected: boolean) {
  mockedApi.info.mockResolvedValue(connected ? { connected: true, version: '1.15.16' } : { connected: false, version: '' })
  mockedApi.overview.mockResolvedValue({
    counts: { sessions: 0, beacons: 0, jobs: 0, builders: 0, socks: 0 },
  })
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.listProfiles.mockResolvedValue({ profiles: ['local', 'lab'] })
    mockConnected(false)
  })

  it('renders saved profiles', async () => {
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('local')).toBeInTheDocument())
    expect(screen.getByText('lab')).toBeInTheDocument()
    view.unmount()
  })

  it('connects and shows the success message', async () => {
    mockedApi.connect.mockResolvedValue({ success: true })
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('Connect')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Connect'))
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument())
    expect(mockedApi.connect).toHaveBeenCalledWith({ name: 'local', lhost: '', lport: 0 })
    view.unmount()
  })

  it('shows an error banner when connect fails', async () => {
    mockedApi.connect.mockResolvedValue({ success: false, error: 'boom' })
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('Connect')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Connect'))
    await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument())
    view.unmount()
  })

  it('shows an error banner when profile loading fails', async () => {
    mockedApi.listProfiles.mockRejectedValue(new Error('profile service down'))
    const view = renderPage()
    await waitFor(() => expect(screen.getByText(/profile service down/)).toBeInTheDocument())
    view.unmount()
  })

  it('uses a profile and confirms', async () => {
    mockedApi.useProfile.mockResolvedValue({ success: true })
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('lab')).toBeInTheDocument())
    fireEvent.click(screen.getByText('lab'))
    await waitFor(() => expect(screen.getByText('Using profile lab')).toBeInTheDocument())
    expect(mockedApi.useProfile).toHaveBeenCalledWith('lab')
    view.unmount()
  })

  it('shows the disconnect button when connected', async () => {
    mockConnected(true)
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('Disconnect')).toBeInTheDocument())
    view.unmount()
  })

  it('disconnects and confirms', async () => {
    mockConnected(true)
    mockedApi.disconnect.mockResolvedValue({ success: true })
    const view = renderPage()
    await waitFor(() => expect(screen.getByText('Disconnect')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Disconnect'))
    await waitFor(() => expect(screen.getByText('Disconnected')).toBeInTheDocument())
    expect(mockedApi.disconnect).toHaveBeenCalled()
    view.unmount()
  })
})
