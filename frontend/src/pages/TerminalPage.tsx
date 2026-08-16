import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { wsUrl } from '../lib/api'
import { encodeFrame, decodeFrame, translateInput, WS_MSG_DATA, WS_MSG_RESIZE, WS_MSG_CLOSE } from '../lib/terminal'
import './pages.css'
import './terminal.css'

export default function TerminalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [connected, setConnected] = useState(false)
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
      cursorBlink: true,
      theme: {
        background: '#0a0a0b',
        foreground: '#d5dae5',
        cursor: '#5e6ad2',
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    const fitTerminal = () => {
      try {
        fit.fit()
      } catch {
        // container not laid out yet; retry on next frame
      }
    }
    fitTerminal()
    termRef.current = term
    fitRef.current = fit

    const ws = new WebSocket(wsUrl(`/ws/sessions/${id}/terminal`))
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws
    let wsClosed = false
    ws.onopen = () => {
      if (wsClosed) return
      setConnected(true)
      term.writeln(t('terminal.connectedMsg'))
      sendResize()
    }
    ws.onmessage = (e) => {
      if (wsClosed) return
      const frame = decodeFrame(e.data)
      if (!frame) return
      if (frame.type === WS_MSG_DATA) {
        term.write(frame.payload)
      } else if (frame.type === WS_MSG_CLOSE) {
        setConnected(false)
        term.writeln(t('terminal.disconnectedMsg'))
      }
    }
    ws.onclose = () => {
      if (wsClosed) return
      setConnected(false)
      term.writeln(t('terminal.disconnectedMsg'))
    }
    ws.onerror = () => {
      if (!wsClosed) term.writeln(t('terminal.errorMsg'))
    }

    const onData = (data: string) => {
      if (!wsClosed && ws.readyState === WebSocket.OPEN)
        ws.send(encodeFrame(WS_MSG_DATA, translateInput(data)))
    }
    term.onData(onData)

    const sendResize = () => {
      if (!fitRef.current || !termRef.current) return
      try {
        fitRef.current.fit()
      } catch {
        return
      }
      const term = termRef.current
      if (term.cols > 0 && term.rows > 0 && !wsClosed && ws.readyState === WebSocket.OPEN) {
        ws.send(encodeFrame(WS_MSG_RESIZE, JSON.stringify({ cols: term.cols, rows: term.rows })))
      }
    }

    const onResize = sendResize
    window.addEventListener('resize', onResize)

    const enter = sendResize
    enter()

    return () => {
      wsClosed = true
      window.removeEventListener('resize', onResize)
      ws.close()
      term.dispose()
    }
  }, [id])

  return (
    <div className="page page-terminal">
      <div className="page-header">
        <div>
          <div className="page-title">{t('terminal.title')}</div>
          <div className="page-sub">{t('terminal.session', { id })}</div>
        </div>
        <div className="toolbar">
          <span className={`badge ${connected ? 'green' : 'red'}`}>
            {connected ? t('terminal.connected') : t('terminal.disconnected')}
          </span>
          <button type="button" className="btn" onClick={() => navigate('/')}>
            {t('common.back')}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="terminal-container" />
    </div>
  )
}
