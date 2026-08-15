import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Session, Job, Event } from '../lib/types'
import './pages.css'

type TFunc = ReturnType<typeof useTranslation>['t']

function fmtTime(ts: string, t: TFunc): string {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const diff = Math.round((Date.now() - d.getTime()) / 1000)
  if (diff < 0) return t('time.justNow')
  if (diff < 60) return t('time.secondsAgo', { count: diff })
  if (diff < 3600) return t('time.minutesAgo', { count: Math.round(diff / 60) })
  if (diff < 86400) return t('time.hoursAgo', { count: Math.round(diff / 3600) })
  return t('time.daysAgo', { count: Math.round(diff / 86400) })
}

function badgeClass(type: string): string {
  if (type.includes('SessionOpened') || type.includes('Started')) return 'green'
  if (type.includes('SessionClosed') || type.includes('Stopped') || type.includes('Error')) return 'red'
  if (type.includes('Listener') || type.includes('Job')) return 'blue'
  return 'yellow'
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ sessions: 0, beacons: 0, jobs: 0, builders: 0, socks: 0 })
  const [sessions, setSessions] = useState<Session[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      const info = await api.info()
      setConnected(!!info.connected)
      if (!info.connected) {
        setCounts({ sessions: 0, beacons: 0, jobs: 0, builders: 0, socks: 0 })
        setSessions([])
        setJobs([])
        setEvents([])
        return
      }
      const [ov, ss, js] = await Promise.all([api.overview(), api.sessions(), api.jobs()])
      setCounts(ov.counts)
      setSessions(ss.sessions || [])
      setJobs(js.jobs || [])
      try {
        const ev = await api.events()
        setEvents((ev.events || []).slice(0, 8))
      } catch {
        // Recent activity is auxiliary; a failure must not break the overview.
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  const statCards: { label: string; value: number; to: string }[] = [
    { label: t('dashboard.sessions'), value: counts.sessions, to: '/sessions' },
    { label: t('dashboard.beacons'), value: counts.beacons, to: '/beacons' },
    { label: t('dashboard.listeners'), value: counts.jobs, to: '/listeners' },
    { label: t('dashboard.builders'), value: counts.builders, to: '/implants' },
    { label: t('dashboard.socks'), value: counts.socks, to: '/socks' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('dashboard.title')}</div>
          <div className="page-sub">
            {connected ? t('dashboard.sub') : t('dashboard.disconnected')}
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={load}>
            {t('common.refresh')}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="dash-stats">
        {statCards.map((c) => (
          <button key={c.label} className="dash-stat" onClick={() => navigate(c.to)}>
            <div className="dash-stat-value mono">{c.value}</div>
            <div className="dash-stat-label">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card card-flush">
          <div className="card-title" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', margin: 0 }}>
            {t('dashboard.activeSessions')}
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>{t('sessions.thName')}</th>
                <th>{t('sessions.thHost')}</th>
                <th>{t('sessions.thUser')}</th>
                <th>{t('sessions.thOsArch')}</th>
                <th>{t('sessions.thCheckin')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    {t('sessions.empty')}
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.UUID || s.ID} onClick={() => navigate(`/sessions/${s.ID}`)} style={{ cursor: 'pointer' }}>
                  <td className="mono">{s.Name}</td>
                  <td>{s.Hostname}</td>
                  <td>{s.Username}</td>
                  <td>
                    <span className="badge blue">
                      {s.OS}/{s.Arch}
                    </span>
                  </td>
                  <td>{fmtTime(s.LastCheckin, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-flush">
          <div className="card-title" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', margin: 0 }}>
            {t('dashboard.listeners')}
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>{t('listeners.thName')}</th>
                <th>{t('listeners.thProtocol')}</th>
                <th>{t('listeners.thPort')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty">
                    {t('listeners.empty')}
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.ID}>
                  <td className="mono">{j.Name || '-'}</td>
                  <td>
                    <span className="badge blue">{j.Protocol}</span>
                  </td>
                  <td className="mono">{j.Port}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-title" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', margin: 0 }}>
          {t('dashboard.recentActivity')}
          <button className="card-link" onClick={() => navigate('/events')}>
            {t('common.viewAll')}
          </button>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>{t('events.thType')}</th>
              <th>{t('events.thDetails')}</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={2} className="empty">
                  {t('events.empty')}
                </td>
              </tr>
            )}
            {events.map((e, i) => (
              <tr key={i}>
                <td>
                  <span className={`badge ${badgeClass(e.Type)}`}>{e.Type}</span>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>
                  {e.Session
                    ? `${e.Session.Name} @ ${e.Session.Hostname} (${e.Session.RemoteAddress})`
                    : e.Beacon
                      ? `${e.Beacon.Name} @ ${e.Beacon.Hostname} (${e.Beacon.RemoteAddress})`
                      : e.Job
                        ? `${e.Job.Name} (${e.Job.Protocol}:${e.Job.Port})`
                        : e.Err
                          ? e.Err
                          : JSON.stringify(e.Data || {}).slice(0, 120)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
