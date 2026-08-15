import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom'
import CommandPalette from '../CommandPalette'
import { api } from '../../lib/api'
import type { Session } from '../../lib/types'

vi.mock('../../lib/api', () => ({
  api: {
    sessions: vi.fn(),
    beacons: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}</div>
}

function renderPalette(open = true) {
  const onClose = vi.fn()
  const onToggleLang = vi.fn()
  const view = render(
    <MemoryRouter>
      <CommandPalette open={open} onClose={onClose} onToggleLang={onToggleLang} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
  return { onClose, onToggleLang, view }
}

const session = {
  ID: 's1',
  Name: 'SESS-1',
  Hostname: 'victim-host',
  RemoteAddress: '10.0.0.5:4242',
} as Session

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.sessions.mockResolvedValue({ sessions: [session] })
    mockedApi.beacons.mockResolvedValue({ beacons: [] })
  })

  it('renders nothing when closed', () => {
    const { view } = renderPalette(false)
    expect(view.container.querySelector('.palette')).toBeNull()
    view.unmount()
  })

  it('lists navigation commands and session targets', async () => {
    const { view } = renderPalette()
    await waitFor(() => expect(screen.getByText(/SESS-1/)).toBeInTheDocument())
    expect(screen.getAllByText('Sessions').length).toBeGreaterThan(0)
    expect(mockedApi.sessions).toHaveBeenCalled()
    view.unmount()
  })

  it('filters commands by query', async () => {
    const { view } = renderPalette()
    await waitFor(() => expect(screen.getByText(/SESS-1/)).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('Search or jump to...'), {
      target: { value: 'sess' },
    })
    expect(screen.getByText(/SESS-1/)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search or jump to...'), {
      target: { value: 'zzzz-no-match' },
    })
    await waitFor(() => expect(screen.getByText('No results found')).toBeInTheDocument())
    view.unmount()
  })

  it('navigates to a session detail page when a target is clicked', async () => {
    const { onClose, view } = renderPalette()
    await waitFor(() => expect(screen.getByText(/SESS-1/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/SESS-1/))
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('/sessions/s1'))
    expect(onClose).toHaveBeenCalled()
    view.unmount()
  })

  it('closes on Escape', async () => {
    const { onClose, view } = renderPalette()
    await waitFor(() => expect(screen.getByText(/SESS-1/)).toBeInTheDocument())
    fireEvent.keyDown(screen.getByPlaceholderText('Search or jump to...'), {
      key: 'Escape',
    })
    expect(onClose).toHaveBeenCalled()
    view.unmount()
  })
})
