import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { Event } from '../lib/types'
import './pages.css'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(50)
  const { t } = useTranslation()

  const load = async () => {
    try {
      setError('')
      const data = await api.events()
      setEvents(data.events || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const badgeClass = (type: string) => {
    if (type.includes('SessionOpened') || type.includes('Started')) return 'green'
    if (type.includes('SessionClosed') || type.includes('Stopped') || type.includes('Error')) return 'red'
    if (type.includes('Listener') || type.includes('Job')) return 'blue'
    return 'yellow'
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('events.title')}</div>
          <div className="page-sub">{t('events.sub')}</div>
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
      ) : events.length === 0 ? (
        <div className="empty">{t('events.empty')}</div>
      ) : (
        <div className="card card-flush">
          <table className="data">
            <thead>
              <tr>
                <th>{t('events.thType')}</th>
                <th>{t('events.thDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, visible).map((e, i) => (
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
              {events.length > visible && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '10px' }}>
                    <button className="btn sm" onClick={() => setVisible((v) => v + 50)}>
                      {t('common.loadMore', { count: events.length - visible })}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
