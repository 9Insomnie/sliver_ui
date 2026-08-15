import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'

export default function TokensTab({ sessionId, os }: { sessionId: string; os: string }) {
  const { t } = useTranslation()
  const [action, setAction] = useState<'impersonate' | 'makeToken' | 'getSystem'>('impersonate')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [domain, setDomain] = useState('')
  const [hostingProcess, setHostingProcess] = useState('spoolsv.exe')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setError('')
    setMessage('')
    try {
      if (action === 'impersonate') {
        await api.impersonate(sessionId, username)
        setMessage(t('tokens.impersonateOk', { username }))
      } else if (action === 'makeToken') {
        await api.makeToken(sessionId, username, password, domain)
        setMessage(t('tokens.makeTokenOk'))
      } else {
        await api.getSystem(sessionId, hostingProcess)
        setMessage(t('tokens.getSystemOk'))
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const revToSelf = async () => {
    setError('')
    setMessage('')
    try {
      await api.revToSelf(sessionId)
      setMessage(t('tokens.revToSelfOk'))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (os !== 'windows') {
    return <div className="empty">{t('tokens.windowsOnly')}</div>
  }

  return (
    <div className="card">
      <div className="card-title">{t('tokens.title')}</div>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>{t('tokens.action')}</label>
          <select value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
            <option value="impersonate">{t('tokens.modeImpersonate')}</option>
            <option value="makeToken">{t('tokens.modeMakeToken')}</option>
            <option value="getSystem">{t('tokens.modeGetSystem')}</option>
          </select>
        </div>
        {(action === 'impersonate' || action === 'makeToken') && (
          <div className="field">
            <label>{t('tokens.username')}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        )}
        {action === 'makeToken' && (
          <>
            <div className="field">
              <label>{t('tokens.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('tokens.domain')}</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="DOMAIN" />
            </div>
          </>
        )}
        {action === 'getSystem' && (
          <div className="field">
            <label>{t('tokens.hostingProcess')}</label>
            <input value={hostingProcess} onChange={(e) => setHostingProcess(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={run} disabled={running}>
            {running ? t('common.loading') : t('tokens.execute')}
          </button>
        </div>
      </div>
      <div className="toolbar">
        <button className="btn sm" onClick={revToSelf}>{t('tokens.revToSelf')}</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {message && (
        <div className="error-banner" style={{ borderColor: 'var(--green)', color: 'var(--green)', background: 'rgba(63,213,143,0.08)' }}>
          {message}
        </div>
      )}
    </div>
  )
}
