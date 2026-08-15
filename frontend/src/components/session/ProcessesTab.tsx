import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { ProcessInfo } from '../../lib/types'
import ConfirmDialog from '../common/ConfirmDialog'

export default function ProcessesTab({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation()
  const [procs, setProcs] = useState<ProcessInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<'kill' | 'migrate' | null>(null)
  const [targetPid, setTargetPid] = useState(0)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await api.ps(sessionId)
      setProcs(d.processes || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    load()
  }, [load])

  const kill = async (pid: number) => {
    setBusy(true)
    try {
      await api.killProcess(sessionId, pid)
      setConfirm(null)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const migrate = async (pid: number) => {
    setBusy(true)
    try {
      await api.migrate(sessionId, pid)
      setConfirm(null)
      setError('')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const dump = async (pid: number) => {
    try {
      const res = await api.processDump(sessionId, pid)
      const bytes = atob(res.data)
      const buf = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
      const blob = new Blob([buf])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dump-${pid}.dmp`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn sm" onClick={load}>
          {t('processes.refresh')}
        </button>
      </div>
      {error && (
        <div style={{ padding: '0 16px 12px' }}>
          <div className="error-banner">{error}</div>
        </div>
      )}
      {loading ? (
        <div className="empty">{t('common.loading')}</div>
      ) : procs.length === 0 ? (
        <div className="empty">{t('processes.empty')}</div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>{t('processes.thPid')}</th>
              <th>{t('processes.thPpid')}</th>
              <th>{t('processes.thName')}</th>
              <th>{t('processes.thOwner')}</th>
              <th>{t('processes.thCmd')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {procs.map((p) => (
              <tr key={p.PID}>
                <td className="mono">{p.PID}</td>
                <td className="mono">{p.PPID}</td>
                <td>{p.Executable}</td>
                <td>{p.Owner}</td>
                <td className="mono" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.CmdLine?.join(' ') || '-'}
                </td>
                <td>
                  <div className="fs-actions">
                    <button
                      className="btn sm"
                      onClick={() => {
                        setTargetPid(p.PID)
                        setConfirm('migrate')
                      }}
                    >
                      {t('processes.migrate')}
                    </button>
                    <button className="btn sm" onClick={() => dump(p.PID)}>
                      {t('processes.dump')}
                    </button>
                    <button
                      className="btn sm danger"
                      onClick={() => {
                        setTargetPid(p.PID)
                        setConfirm('kill')
                      }}
                    >
                      {t('processes.kill')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'kill' ? t('processes.kill') : t('processes.migrate')}
        danger={confirm === 'kill'}
        busy={busy}
        confirmLabel={confirm === 'kill' ? t('processes.kill') : t('processes.migrate')}
        onConfirm={() =>
          confirm === 'kill' ? kill(targetPid) : confirm === 'migrate' ? migrate(targetPid) : undefined
        }
        onCancel={() => setConfirm(null)}
      >
        <p>
          {confirm === 'kill'
            ? t('processes.confirmKill', { pid: targetPid })
            : t('processes.confirmMigrate', { pid: targetPid })}
        </p>
      </ConfirmDialog>
    </div>
  )
}
