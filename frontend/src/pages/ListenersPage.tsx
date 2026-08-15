import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Job } from '../lib/types'
import './pages.css'

export default function ListenersPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState('')
  const [type, setType] = useState('mtls')
  const [addr, setAddr] = useState('0.0.0.0')
  const [port, setPort] = useState('8888')
  const [tls, setTls] = useState(false)
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')
  const { t } = useTranslation()

  const load = async () => {
    try {
      setError('')
      const data = await api.jobs()
      setJobs(data.jobs || [])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const start = async () => {
    setStarting(true)
    setMessage('')
    try {
      const res = await api.startListener({ type, addr, port: Number(port), tls })
      setMessage(res.error ? `${t('common.failed')}: ${res.error}` : t('listeners.started'))
      load()
    } catch (e) {
      setMessage(`${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setStarting(false)
    }
  }

  const stop = async (id: number) => {
    try {
      const res = await api.stopListener(id)
      setMessage(
        res.error ? `${t('common.failed')}: ${res.error}` : t('listeners.stopped', { id }),
      )
      load()
    } catch (e) {
      setMessage(`${t('common.failed')}: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('listeners.title')}</div>
          <div className="page-sub">{t('listeners.sub', { count: jobs.length })}</div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={load}>
            {t('common.refresh')}
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

      <div className="card">
        <div className="card-title">{t('listeners.startTitle')}</div>
        <div className="form-grid">
          <div className="field">
            <label>{t('listeners.protocol')}</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="mtls">mTLS</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="dns">DNS</option>
              <option value="wireguard">WireGuard</option>
            </select>
          </div>
          <div className="field">
            <label>{t('listeners.address')}</label>
            <input value={addr} onChange={(e) => setAddr(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('listeners.port')}</label>
            <input value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} />
              {t('listeners.enableTls')}
            </label>
            <button className="btn primary" onClick={start} disabled={starting}>
              {starting ? t('listeners.starting') : t('listeners.start')}
            </button>
          </div>
        </div>
      </div>

      <div className="card card-flush">
        <table className="data">
          <thead>
            <tr>
              <th>{t('listeners.thId')}</th>
              <th>{t('listeners.thName')}</th>
              <th>{t('listeners.thProtocol')}</th>
              <th>{t('listeners.thPort')}</th>
              <th>{t('listeners.thDomains')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  {t('listeners.empty')}
                </td>
              </tr>
            )}
            {jobs.map((j) => (
              <tr key={j.ID}>
                <td className="mono">{j.ID}</td>
                <td className="mono">{j.Name}</td>
                <td>
                  <span className="badge blue">{j.Protocol}</span>
                </td>
                <td className="mono">{j.Port}</td>
                <td className="mono">{j.Domains?.join(', ') || '-'}</td>
                <td>
                  <button className="btn sm danger" onClick={() => stop(j.ID)}>
                    {t('listeners.stop')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
