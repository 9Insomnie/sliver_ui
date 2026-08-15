import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { PortForward } from '../../lib/types'

export default function PortfwdTab({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation()
  const [forwards, setForwards] = useState<PortForward[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [localPort, setLocalPort] = useState('8080')
  const [bindAddr, setBindAddr] = useState('127.0.0.1')
  const [remoteHost, setRemoteHost] = useState('127.0.0.1')
  const [remotePort, setRemotePort] = useState('22')

  const load = useCallback(async () => {
    setError('')
    try {
      const d = await api.portfwdList()
      setForwards(d.forwards || [])
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    setMessage('')
    setError('')
    try {
      const res = await api.portfwdStart({
        session_id: sessionId,
        bind_addr: bindAddr,
        bind_port: Number(localPort) || 0,
        remote_host: remoteHost,
        remote_port: Number(remotePort),
      })
      setMessage(t('portfwd.added', { port: res.localPort ?? localPort }))
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const stop = async (port: number) => {
    setError('')
    try {
      await api.portfwdStop(port)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="card">
      <div className="card-title">{t('portfwd.title')}</div>
      <p className="page-sub" style={{ marginBottom: 12 }}>
        {t('portfwd.hint')}
      </p>
      <div className="pf-form">
        <div className="field">
          <label>{t('portfwd.localPort')}</label>
          <input type="number" value={localPort} onChange={(e) => setLocalPort(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('portfwd.bindAddr')}</label>
          <input value={bindAddr} onChange={(e) => setBindAddr(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('portfwd.remoteHost')}</label>
          <input value={remoteHost} onChange={(e) => setRemoteHost(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('portfwd.remotePort')}</label>
          <input type="number" value={remotePort} onChange={(e) => setRemotePort(e.target.value)} />
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={add}>
            {t('portfwd.add')}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {message && (
        <div
          className="error-banner"
          style={{
            borderColor: 'var(--green)',
            color: 'var(--green)',
            background: 'rgba(63,213,143,0.08)',
          }}
        >
          {message}
        </div>
      )}
      <table className="data">
        <thead>
          <tr>
            <th>{t('portfwd.local')}</th>
            <th>{t('portfwd.remote')}</th>
            <th>{t('portfwd.session')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forwards.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">
                {t('portfwd.empty')}
              </td>
            </tr>
          )}
          {forwards.map((f) => (
            <tr key={f.LocalPort}>
              <td className="mono">{`${f.LocalAddr}:${f.LocalPort}`}</td>
              <td className="mono">{`${f.Host}:${f.Port}`}</td>
              <td className="mono">{f.SessionID.slice(0, 12)}</td>
              <td>
                <button className="btn sm danger" onClick={() => stop(f.LocalPort)}>
                  {t('portfwd.stop')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
