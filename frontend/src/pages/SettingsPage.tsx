import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useConnection } from '../lib/connection'
import './pages.css'

interface LoadedConfig {
  operator: string
  lhost: string
  lport: number
  hasCerts: boolean
}

const CONFIG_KEY = 'sliverui.config'
const PROFILE_KEY = 'sliverui.activeProfile'

function parseConfig(text: string): LoadedConfig {
  const data = JSON.parse(text)
  const lport = Number(data.lport) || 0
  const hasCerts = Boolean(data.ca_certificate && data.certificate && data.private_key)
  return {
    operator: data.operator || '',
    lhost: data.lhost || '',
    lport,
    hasCerts,
  }
}

export default function SettingsPage() {
  const { connected, version, refresh } = useConnection()
  const [profiles, setProfiles] = useState<string[]>([])
  const [activeProfile, setActiveProfile] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const { t } = useTranslation()

  const [configContent, setConfigContent] = useState('')
  const [configInfo, setConfigInfo] = useState<LoadedConfig | null>(null)
  const [connecting, setConnecting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    try {
      const saved = localStorage.getItem(CONFIG_KEY)
      if (saved) {
        setConfigContent(saved)
        setConfigInfo(parseConfig(saved))
      }
    } catch {
      localStorage.removeItem(CONFIG_KEY)
    }
    const profile = localStorage.getItem(PROFILE_KEY)
    if (profile) setActiveProfile(profile)
  }, [])

  const useProfile = async (name: string) => {
    setLoadingProfiles(true)
    setError('')
    setSuccess('')
    try {
      await api.useProfile(name)
      setSuccess(t('settings.usingProfile', { name }))
      setActiveProfile(name)
      localStorage.setItem(PROFILE_KEY, name)
      refresh()
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setError('')
    setSuccess('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      try {
        const info = parseConfig(text)
        setConfigContent(text)
        setConfigInfo(info)
        localStorage.setItem(CONFIG_KEY, text)
      } catch (err) {
        setConfigContent('')
        setConfigInfo(null)
        localStorage.removeItem(CONFIG_KEY)
        setError(`${t('settings.invalidConfig')}: ${(err as Error).message}`)
      }
    }
    reader.onerror = () => {
      setConfigContent('')
      setConfigInfo(null)
      setError(t('settings.readError'))
    }
    reader.readAsText(file)
  }

  const connectFromFile = async () => {
    if (!configContent) {
      setError(t('settings.noConfigLoaded'))
      return
    }
    setConnecting(true)
    setError('')
    setSuccess('')
    try {
      await api.connect({ content: configContent })
      setSuccess(t('settings.connectedMsg'))
      refresh()
      loadProfiles()
    } catch (e) {
      setError(`${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setConnecting(false)
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
            <button type="button" className="btn danger" onClick={disconnect}>
              {t('settings.disconnect')}
            </button>
          ) : (
            <span className="empty" style={{ padding: 0 }}>
              {t('settings.connectHint')}
            </span>
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
            <button type="button"
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
        <div className="card-title">{t('settings.loadConfigTitle')}</div>
        <p className="page-sub" style={{ marginBottom: 12 }}>
          {t('settings.loadConfigSub')}
        </p>
        <div className="toolbar">
          <label className="btn">
            {t('settings.selectFile')}
            <input
              ref={fileRef}
              type="file"
              accept=".json,.cfg,application/json"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </label>
        </div>

        {configInfo && (
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="field">
              <label>{t('settings.configOperator')}</label>
              <input value={configInfo.operator} readOnly />
            </div>
            <div className="field">
              <label>{t('settings.configLhost')}</label>
              <input value={configInfo.lhost} readOnly />
            </div>
            <div className="field">
              <label>{t('settings.configLport')}</label>
              <input value={configInfo.lport} readOnly />
            </div>
            <div className="field">
              <label>{t('settings.configCerts')}</label>
              <input
                value={configInfo.hasCerts ? t('settings.configHasCerts') : t('settings.configNoCerts')}
                readOnly
              />
            </div>
          </div>
        )}

        <div className="toolbar" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn primary"
            onClick={connectFromFile}
            disabled={!configContent || connecting}
          >
            {t('settings.connect')}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div
          className="error-banner"
          style={{
            borderColor: 'var(--green)',
            color: 'var(--green)',
            background: 'var(--success-bg)',
          }}
        >
          {success}
        </div>
      )}
    </div>
  )
}
