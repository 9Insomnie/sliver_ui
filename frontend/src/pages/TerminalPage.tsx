import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { wsUrl } from '../lib/api'
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
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    const ws = new WebSocket(wsUrl(`/ws/sessions/${id}/terminal`))
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      term.writeln(t('terminal.connectedMsg'))
    }
    ws.onmessage = (e) => {
      term.write(e.data as string)
    }
    ws.onclose = () => {
      setConnected(false)
      term.writeln(t('terminal.disconnectedMsg'))
    }
    ws.onerror = () => term.writeln(t('terminal.errorMsg'))

    const onData = (data: string) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    }
    term.onData(onData)

    const onResize = () => {
      if (!fitRef.current || !termRef.current) return
      fitRef.current.fit()
      const term = termRef.current
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    }
    window.addEventListener('resize', onResize)

    const enter = () => {
      if (!fitRef.current || !termRef.current) return
      fitRef.current.fit()
      const term = termRef.current
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    }
    enter()

    return () => {
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
          <button className="btn" onClick={() => navigate('/')}>
            {t('common.back')}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="terminal-container" />
    </div>
  )
}
