import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useConnection } from '../lib/connection'
import './pages.css'

export default function SettingsPage() {
  const { connected, version, refresh } = useConnection()
  const [profiles, setProfiles] = useState<string[]>([])
  const [activeProfile, setActiveProfile] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileName, setProfileName] = useState('local')
  const [lhost, setLhost] = useState('')
  const [lport, setLport] = useState(0)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const { t } = useTranslation()

  const loadProfiles = async () => {
    try {
      const data = await api.listProfiles()
      setProfiles(data.profiles || [])
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const useProfile = async (name: string) => {
    setLoadingProfiles(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.useProfile(name)
      if (res.error) {
        setError(`${t('common.failed')}: ${res.error}`)
      } else {
        setSuccess(t('settings.usingProfile', { name }))
      }
      setActiveProfile(name)
      refresh()
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const connect = async () => {
    setError('')
    setSuccess('')
    try {
      const res = await api.connect({
        name: profileName,
        lhost,
        lport,
      })
      if (res.error) {
        setError(`${t('common.failed')}: ${res.error}`)
      } else {
        setSuccess(t('settings.connectedMsg'))
      }
      refresh()
      loadProfiles()
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    }
  }

  const disconnect = async () => {
    setError('')
    setSuccess('')
    try {
      await api.disconnect()
      setSuccess(t('settings.disconnectedMsg'))
      refresh()
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('settings.title')}</div>
          <div className="page-sub">{t('settings.sub')}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('settings.connTitle')}</div>
        <p style={{ marginBottom: 8 }}>
          {t('settings.status')}:{' '}
          <span className={`badge ${connected ? 'green' : 'red'}`}>
            {connected ? t('app.connected', { version }) : t('app.notConnected')}
          </span>
        </p>
        <div className="toolbar">
          {connected ? (
            <button className="btn danger" onClick={disconnect}>
              {t('settings.disconnect')}
            </button>
          ) : (
            <button className="btn primary" onClick={connect}>
              {t('settings.connect')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('settings.profilesTitle')}</div>
        <p className="page-sub" style={{ marginBottom: 12 }}>
          {t('settings.profilesSub')}
        </p>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          {profiles.map((p) => (
            <button
              key={p}
              className={`btn ${activeProfile === p ? 'primary' : ''}`}
              onClick={() => useProfile(p)}
              disabled={loadingProfiles}
            >
              {p}
            </button>
          ))}
          {profiles.length === 0 && (
            <span className="empty" style={{ padding: 0 }}>
              {t('settings.noProfiles')}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('settings.manualTitle')}</div>
        <div className="form-grid">
          <div className="field">
            <label>{t('settings.profileName')}</label>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('settings.lhost')}</label>
            <input value={lhost} onChange={(e) => setLhost(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('settings.lport')}</label>
            <input
              type="number"
              value={lport}
              onChange={(e) => setLport(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="page-sub" style={{ marginTop: 12, lineHeight: 1.6 }}>
          {t('settings.note')}
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div
          className="error-banner"
          style={{
            borderColor: 'var(--green)',
            color: 'var(--green)',
            background: 'rgba(63,213,143,0.08)',
          }}
        >
          {success}
        </div>
      )}
    </div>
  )
}
