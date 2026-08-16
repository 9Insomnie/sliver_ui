import { describe, it, expect } from 'vitest'
import { encodeFrame, decodeFrame, translateInput, WS_MSG_DATA, WS_MSG_RESIZE } from '../terminal'

describe('terminal frame protocol', () => {
  it('encodes data frames as [type][4-byte BE length][payload]', () => {
    const buf = encodeFrame(WS_MSG_DATA, 'ls -la')
    expect(buf.byteLength).toBe(5 + 'ls -la'.length)
    const view = new DataView(buf)
    expect(view.getUint8(0)).toBe(WS_MSG_DATA)
    expect(view.getUint32(1, false)).toBe(6)
    const bytes = new Uint8Array(buf, 5)
    expect(new TextDecoder().decode(bytes)).toBe('ls -la')
  })

  it('encodes resize frames from JSON payload', () => {
    const buf = encodeFrame(WS_MSG_RESIZE, JSON.stringify({ cols: 80, rows: 24 }))
    const frame = decodeFrame(buf)
    expect(frame).not.toBeNull()
    expect(frame!.type).toBe(WS_MSG_RESIZE)
    expect(JSON.parse(new TextDecoder().decode(frame!.payload))).toEqual({ cols: 80, rows: 24 })
  })

  it('decodes payloads with multibyte UTF-8 content', () => {
    const buf = encodeFrame(WS_MSG_DATA, '你好')
    const frame = decodeFrame(buf)
    expect(frame!.type).toBe(WS_MSG_DATA)
    expect(new TextDecoder().decode(frame!.payload)).toBe('你好')
  })

  it('returns null for truncated frames', () => {
    const buf = encodeFrame(WS_MSG_DATA, 'hello')
    const truncated = buf.slice(0, 3)
    expect(decodeFrame(truncated)).toBeNull()
  })
})

describe('translateInput', () => {
  it('maps DEL (0x7f) backspace to BS (0x08) so Windows shells edit correctly', () => {
    expect(translateInput('abc\x7f')).toBe('abc\x08')
  })

  it('leaves ordinary input unchanged', () => {
    expect(translateInput('ls -la\r')).toBe('ls -la\r')
    expect(translateInput('你好')).toBe('你好')
  })

  it('translates every DEL in the burst', () => {
    expect(translateInput('\x7f\x7f\x7f')).toBe('\x08\x08\x08')
  })

  it('does not double-translate existing BS bytes', () => {
    expect(translateInput('ab\x08\x7f')).toBe('ab\x08\x08')
  })
})
