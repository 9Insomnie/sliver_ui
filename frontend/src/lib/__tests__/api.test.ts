import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, wsUrl } from '../../lib/api'

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function mockFetch(status: number, body: unknown) {
    const fn = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
    vi.stubGlobal('fetch', fn)
    return fn
  }

  it('info() returns version', async () => {
    mockFetch(200, { version: '1.5.30', connected: true })
    const result = await api.info()
    expect(result).toEqual({ version: '1.5.30', connected: true })
  })

  it('sessions() GETs /api/sessions and returns list', async () => {
    const fn = mockFetch(200, {
      sessions: [
        { ID: 'abc', Name: 'S1', Hostname: 'h1' },
        { ID: 'def', Name: 'S2', Hostname: 'h2' },
      ],
    })
    const result = await api.sessions()
    expect(result.sessions).toHaveLength(2)
    expect(fn).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({ headers: expect.any(Object) }))
  })

  it('throws error with server message on non-2xx', async () => {
    mockFetch(500, { error: 'boom' })
    await expect(api.sessions()).rejects.toThrow('boom')
  })

  it('connect() POSTs config as JSON', async () => {
    const fn = mockFetch(200, { success: true })
    await api.connect({ name: 'local', lhost: '127.0.0.1', lport: 31337 })
    const [, opts] = fn.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toMatchObject({ name: 'local', lport: 31337 })
  })

  it('stopListener() sends DELETE', async () => {
    const fn = mockFetch(200, { success: true })
    await api.stopListener(7)
    expect(fn).toHaveBeenCalledWith('/api/listeners/7', expect.objectContaining({ method: 'DELETE' }))
  })

  it('socksStop() sends the proxy id', async () => {
    const fn = mockFetch(200, { success: true })
    await api.socksStop(42)
    expect(fn).toHaveBeenCalledWith('/api/socks/42', expect.objectContaining({ method: 'DELETE' }))
  })

  it('execAssembly() sends the argument string as arguments', async () => {
    const fn = mockFetch(200, { output: 'ok' })
    await api.execAssembly('session-1', 'aGk=', 'whoami', 'notepad.exe')
    const [, opts] = fn.mock.calls[0]
    expect(fn).toHaveBeenCalledWith('/api/sessions/session-1/exec-assembly', expect.any(Object))
    expect(JSON.parse(opts.body)).toEqual({
      assembly: 'aGk=',
      arguments: 'whoami',
      process: 'notepad.exe',
    })
  })

  it('generate() POSTs implant config', async () => {
    const fn = mockFetch(200, { success: true, message: 'built x' })
    const res = await api.generate({ name: 'implant', os: 'windows' })
    expect(res.success).toBe(true)
    const [, opts] = fn.mock.calls[0]
    expect(JSON.parse(opts.body)).toMatchObject({ name: 'implant', os: 'windows' })
  })

  it('wsUrl uses ws protocol for http pages', () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:5173' },
      writable: true,
    })
    expect(wsUrl('/ws/sessions/1/terminal')).toBe('ws://localhost:5173/ws/sessions/1/terminal')
  })
})
