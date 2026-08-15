import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdvancedTab({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'assembly' | 'sideload' | 'spawndll'>('assembly')
  const [file, setFile] = useState<File | null>(null)
  const [args, setArgs] = useState('')
  const [process, setProcess] = useState('')
  const [entryPoint, setEntryPoint] = useState('main')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const run = async () => {
    if (!file) return
    setRunning(true)
    setError('')
    setOutput('')
    try {
      const b64 = await toBase64(file)
      let res: { output?: string; result?: string }
      if (mode === 'assembly') {
        const r = await api.execAssembly(sessionId, b64, args, process)
        res = { output: r.output }
      } else if (mode === 'sideload') {
        const r = await api.sideload(sessionId, b64, process, args, entryPoint)
        res = { result: r.result }
      } else {
        const r = await api.spawnDll(sessionId, b64, process, args, entryPoint)
        res = { result: r.result }
      }
      setOutput(res.output || res.result || '(no output)')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card">
      <div className="card-title">{t('advanced.title')}</div>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>{t('advanced.mode')}</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="assembly">.NET Assembly</option>
            <option value="sideload">Sideload DLL</option>
            <option value="spawndll">Spawn DLL</option>
          </select>
        </div>
        <div className="field">
          <label>{t('advanced.file')}</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="field">
          <label>{t('advanced.args')}</label>
          <input value={args} onChange={(e) => setArgs(e.target.value)} placeholder="arg1 arg2" />
        </div>
        <div className="field">
          <label>{t('advanced.process')}</label>
          <input value={process} onChange={(e) => setProcess(e.target.value)} placeholder="notepad.exe" />
        </div>
        {mode !== 'assembly' && (
          <div className="field">
            <label>{t('advanced.entryPoint')}</label>
            <input value={entryPoint} onChange={(e) => setEntryPoint(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={run} disabled={!file || running}>
            {running ? t('common.loading') : t('advanced.run')}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {output && (
        <div className="exec-output">
          <div className="exec-output-header">
            <span>{t('exec.output')}</span>
          </div>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}
