import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Session } from '../lib/types'
import InlineEdit from '../components/InlineEdit'
import './pages.css'

type TFunc = ReturnType<typeof useTranslation>['t']

function fmtTime(ts: string, t: TFunc): string {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const now = Date.now()
  const diff = Math.round((now - d.getTime()) / 1000)
  if (diff < 0) return t('time.justNow')
  if (diff < 60) return t('time.secondsAgo', { count: diff })
  if (diff < 3600) return t('time.minutesAgo', { count: Math.round(diff / 60) })
  if (diff < 86400) return t('time.hoursAgo', { count: Math.round(diff / 3600) })
  return t('time.daysAgo', { count: Math.round(diff / 86400) })
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  const load = async () => {
    try {
      setError('')
      const data = await api.sessions()
      setSessions(data.sessions || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const rename = async (s: Session, name: string) => {
    try {
      await api.renameSession(s.ID, name)
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('sessions.title')}</div>
          <div className="page-sub">{t('sessions.sub', { count: sessions.length })}</div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={load}>
            {t('common.refresh')}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : sessions.length === 0 ? (
        <div className="empty">{t('sessions.empty')}</div>
      ) : (
        <div className="card card-flush">
          <table className="data">
            <thead>
              <tr>
                <th>{t('sessions.thName')}</th>
                <th>{t('sessions.thHost')}</th>
                <th>{t('sessions.thUser')}</th>
                <th>{t('sessions.thOsArch')}</th>
                <th>{t('sessions.thTransport')}</th>
                <th>{t('sessions.thRemote')}</th>
                <th>{t('sessions.thCheckin')}</th>
                <th>{t('sessions.thPid')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.UUID || s.ID}>
                  <td className="mono">
                    <InlineEdit value={s.Name} onSave={(name) => rename(s, name)} mono />
                  </td>
                  <td>{s.Hostname}</td>
                  <td>{s.Username}</td>
                  <td>
                    <span className="badge blue">
                      {s.OS}/{s.Arch}
                    </span>
                  </td>
                  <td>{s.Transport}</td>
                  <td className="mono">{s.RemoteAddress}</td>
                  <td>{fmtTime(s.LastCheckin, t)}</td>
                  <td className="mono">{s.PID}</td>
                  <td>
                    <div className="fs-actions">
                      <button
                        className="btn sm"
                        onClick={() => navigate(`/sessions/${s.ID}`)}
                      >
                        {t('sessions.open')}
                      </button>
                      <button
                        className="btn sm primary"
                        onClick={() => navigate(`/sessions/${s.ID}/terminal`)}
                      >
                        {t('common.terminal')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
