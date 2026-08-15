import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { base64ToBytes, triggerDownload } from '../lib/binary'
import type { CompilerInfo, ImplantBuild, ImplantConfig, ImplantProfile } from '../lib/types'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useToast } from '../components/common/Toast'
import './pages.css'

const OS_ARCHES: { os: string; arches: string[] }[] = [
  { os: 'windows', arches: ['amd64', '386', 'arm64'] },
  { os: 'linux', arches: ['amd64', '386', 'arm64', 'arm'] },
  { os: 'darwin', arches: ['amd64', 'arm64'] },
  { os: 'freebsd', arches: ['amd64', '386', 'arm64', 'arm'] },
]

const C2_TYPES = ['mtls', 'http', 'https', 'dns', 'wireguard']

export default function ImplantsPage() {
  const [builds, setBuilds] = useState<ImplantBuild[]>([])
  const [profiles, setProfiles] = useState<ImplantProfile[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [profileName, setProfileName] = useState('')

  const [name, setName] = useState('my-implant')
  const [os, setOs] = useState('windows')
  const [arch, setArch] = useState('amd64')
  const [format, setFormat] = useState('exe')
  const [c2Type, setC2Type] = useState('mtls')
  const [c2Host, setC2Host] = useState('127.0.0.1')
  const [c2Port, setC2Port] = useState('8888')
  const [reconInterval, setReconInterval] = useState('60')
  const [jitter, setJitter] = useState('20')
  const [obfuscate, setObfuscate] = useState(true)
  const [debug, setDebug] = useState(false)
  const [evasion, setEvasion] = useState(false)
  const [deleting, setDeleting] = useState<{ kind: 'build' | 'profile'; name: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [compiler, setCompiler] = useState<CompilerInfo | null>(null)
  const { t } = useTranslation()
  const toast = useToast()

  const osSummary = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of builds) {
      const key = b.OS || 'unknown'
      m.set(key, (m.get(key) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [builds])

  const load = async () => {
    try {
      setError('')
      const data = await api.builders()
      setBuilds(data.builders || [])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadProfiles = async () => {
    try {
      const data = await api.implantProfiles()
      setProfiles(data.profiles || [])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadCompiler = async () => {
    try {
      setCompiler(await api.compiler())
    } catch {
      setCompiler(null)
    }
  }

  useEffect(() => {
    load()
    loadProfiles()
    loadCompiler()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const currentOS = OS_ARCHES.find((o) => o.os === os)

  const buildConfig = (): Partial<ImplantConfig> => ({
    name,
    os,
    arch,
    format: os === 'windows' ? format : 'exe',
    target: os,
    transport: c2Type,
    c2: [{ address: `${c2Host}:${c2Port}`, protocol: c2Type }],
    mtls: c2Type === 'mtls',
    http: c2Type === 'http' || c2Type === 'https',
    dns: c2Type === 'dns',
    wireguard: c2Type === 'wireguard',
    interval: Number(reconInterval),
    jitter: Number(jitter),
    debug,
    evasion,
    obfuscate,
    maxConnectionErrors: 1000,
    limitDomainJoined: false,
  })

  const saveProfile = async () => {
    if (!profileName) return
    setMessage('')
    try {
      await api.saveImplantProfile({ name: profileName, is_beacon: false, config: buildConfig() })
      setMessage(t('profiles.saved', { name: profileName }))
      setProfileName('')
      loadProfiles()
    } catch (e) {
      setMessage(t('profiles.failed', { msg: (e as Error).message }))
    }
  }

  const deleteProfile = async (p: ImplantProfile) => {
    setBusy(true)
    try {
      await api.deleteImplantProfile(p.Name)
      setDeleting(null)
      toast.push('success', t('profiles.deleted', { name: p.Name }))
      loadProfiles()
    } catch (e) {
      toast.push('error', t('profiles.failed', { msg: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  // 复用:将 profile 的配置载入生成表单
  const loadProfile = (p: ImplantProfile) => {
    const cfg = p.Config
    if (!cfg) return
    setName(p.Name)
    if (cfg.OS) setOs(cfg.OS)
    if (cfg.Arch) setArch(cfg.Arch)
    if (cfg.Format) setFormat(cfg.Format)
    const c2 = cfg.C2?.[0]
    if (c2?.URL) {
      const proto = c2.URL.split('://')[0] || 'mtls'
      setC2Type(proto)
      const addr = c2.URL.split('://')[1] || ''
      if (addr) {
        const [h, ...portParts] = addr.split(':')
        if (h) setC2Host(h)
        const portStr = portParts.join(':')
        if (portStr) setC2Port(portStr)
      }
    }
    if (cfg.Interval) setReconInterval(String(cfg.Interval))
    if (cfg.Jitter !== undefined) setJitter(String(cfg.Jitter))
    if (cfg.Obfuscate !== undefined) setObfuscate(cfg.Obfuscate)
    if (cfg.Debug !== undefined) setDebug(cfg.Debug)
    if (cfg.Evasion !== undefined) setEvasion(cfg.Evasion)
    setMessage(t('profiles.loaded', { name: p.Name }))
  }

  const generate = async () => {
    setGenerating(true)
    setMessage('')
    try {
      const cfg = buildConfig()
      const res = await api.generate(cfg)
      if (res.success && res.data) {
        triggerDownload(res.name || name, base64ToBytes(res.data))
      }
      setMessage(
        res.success ? t('implants.generated', { msg: res.message }) : t('implants.failed', { msg: res.message }),
      )
      load()
    } catch (e) {
      setMessage(t('implants.failed', { msg: (e as Error).message }))
    } finally {
      setGenerating(false)
    }
  }

  const downloadBuild = async (b: ImplantBuild) => {
    setMessage('')
    try {
      const res = await api.regenerate(b.Name)
      if (res.data) {
        triggerDownload(res.name || b.Name, base64ToBytes(res.data))
      } else {
        setMessage(t('implants.failed', { msg: 'no file data returned' }))
      }
    } catch (e) {
      setMessage(t('implants.failed', { msg: (e as Error).message }))
    }
  }

  const regenerateBuild = async (b: ImplantBuild) => {
    setMessage('')
    try {
      const res = await api.regenerate(b.Name)
      setMessage(
        res.success ? t('implants.regenerated', { name: b.Name }) : t('implants.failed', { msg: res.message }),
      )
      load()
    } catch (e) {
      setMessage(t('implants.failed', { msg: (e as Error).message }))
    }
  }

  const deleteBuild = async (b: ImplantBuild) => {
    setBusy(true)
    try {
      await api.deleteImplantBuild(b.Name)
      setDeleting(null)
      toast.push('success', t('implants.deleted', { name: b.Name }))
      load()
    } catch (e) {
      toast.push('error', t('implants.failed', { msg: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('implants.title')}</div>
          <div className="page-sub">{t('implants.sub', { count: builds.length })}</div>
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

      {compiler && (
        <div className="compiler-strip">
          <span className="compiler-tag">
            {t('implants.compiler')}: {compiler.GOOS}/{compiler.GOARCH}
          </span>
          <span className="compiler-tag mono">{compiler.Targets?.length || 0} targets</span>
          <span className="compiler-tag mono">{compiler.CrossCompilers?.length || 0} cross-compilers</span>
          {compiler.CrossCompilers?.map((cc) => (
            <span key={`${cc.TargetGOOS}/${cc.TargetGOARCH}`} className="compiler-tag mono">
              {cc.TargetGOOS}/{cc.TargetGOARCH}
            </span>
          ))}
        </div>
      )}

      {builds.length > 0 && (
        <div className="dash-stats build-summary">
          <button className="dash-stat" onClick={() => {}}>
            <div className="dash-stat-value mono">{builds.length}</div>
            <div className="dash-stat-label">{t('implants.totalBuilds')}</div>
          </button>
          {osSummary.map(([osName, count]) => (
            <button key={osName} className="dash-stat" onClick={() => {}}>
              <div className="dash-stat-value mono">{count}</div>
              <div className="dash-stat-label">{osName}</div>
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">{t('implants.genTitle')}</div>
        <div className="form-grid">
          <div className="field">
            <label>{t('implants.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('implants.os')}</label>
            <select
              value={os}
              onChange={(e) => {
                setOs(e.target.value)
                setArch(OS_ARCHES.find((o) => o.os === e.target.value)?.arches[0] || 'amd64')
              }}
            >
              {OS_ARCHES.map((o) => (
                <option key={o.os} value={o.os}>
                  {o.os}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('implants.arch')}</label>
            <select value={arch} onChange={(e) => setArch(e.target.value)}>
              {currentOS?.arches.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('implants.format')}</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="exe">EXE</option>
              <option value="service">{t('implants.formatService')}</option>
              <option value="shellcode">{t('implants.formatShellcode')}</option>
              <option value="shared">{t('implants.formatShared')}</option>
            </select>
          </div>
          <div className="field">
            <label>{t('implants.c2Type')}</label>
            <select value={c2Type} onChange={(e) => setC2Type(e.target.value)}>
              {C2_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('implants.c2Host')}</label>
            <input value={c2Host} onChange={(e) => setC2Host(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('implants.c2Port')}</label>
            <input value={c2Port} onChange={(e) => setC2Port(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('implants.interval')}</label>
            <input type="number" value={reconInterval} onChange={(e) => setReconInterval(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('implants.jitter')}</label>
            <input type="number" value={jitter} onChange={(e) => setJitter(e.target.value)} />
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={obfuscate} onChange={(e) => setObfuscate(e.target.checked)} />
              {t('implants.obfuscate')}
            </label>
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
              {t('implants.debug')}
            </label>
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={evasion} onChange={(e) => setEvasion(e.target.checked)} />
              {t('implants.evasion')}
            </label>
          </div>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={generate} disabled={generating}>
              {generating ? t('implants.generating') : t('implants.generate')}
            </button>
          </div>
        </div>
        <div className="profile-save" style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="profile-name-input"
            type="text"
            placeholder={t('profiles.profileName')}
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text)',
              fontSize: 13,
              flex: 1,
              maxWidth: 320,
            }}
          />
          <button className="btn" onClick={saveProfile} disabled={!profileName}>
            {t('profiles.saveAs')}
          </button>
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="card card-flush">
          <div className="card-title" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', margin: 0 }}>
            {t('profiles.title')}
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>{t('profiles.thName')}</th>
                <th>{t('profiles.thOsArch')}</th>
                <th>{t('profiles.thFormat')}</th>
                <th>{t('profiles.thC2')}</th>
                <th>{t('profiles.thInterval')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.Name}>
                  <td className="mono">{p.Name}</td>
                  <td>
                    <span className="badge blue">
                      {p.Config?.OS}/{p.Config?.Arch}
                    </span>
                  </td>
                  <td>{p.Config?.Format || '-'}</td>
                  <td className="mono">{p.Config?.C2?.map((c) => c.URL).join(', ') || '-'}</td>
                  <td className="mono">
                    {p.Config?.Interval}s / {p.Config?.Jitter}%
                  </td>
                  <td>
                    <div className="fs-actions">
                      <button className="btn sm" onClick={() => loadProfile(p)}>
                        {t('profiles.load')}
                      </button>
                      <button className="btn sm danger" onClick={() => setDeleting({ kind: 'profile', name: p.Name })}>
                        {t('profiles.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th>{t('implants.thName')}</th>
              <th>{t('implants.thOsArch')}</th>
              <th>{t('implants.thFormat')}</th>
              <th>{t('implants.thC2')}</th>
              <th>{t('implants.thInterval')}</th>
              <th>{t('implants.thObfuscated')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {builds.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  {t('implants.empty')}
                </td>
              </tr>
            )}
            {builds.map((b) => (
              <tr key={b.Name}>
                <td className="mono">{b.Name}</td>
                <td>
                  <span className="badge blue">
                    {b.OS}/{b.Arch}
                  </span>
                </td>
                <td>{b.ImplantConfig?.Format || '-'}</td>
                <td className="mono">
                  {b.ImplantConfig?.C2?.map((c) => c.URL).join(', ') || '-'}
                </td>
                <td className="mono">
                  {b.ImplantConfig?.Interval}s / {b.ImplantConfig?.Jitter}%
                </td>
                <td>{b.ImplantConfig?.Obfuscate ? t('common.yes') : t('common.no')}</td>
                <td>
                  <div className="fs-actions">
                    <button className="btn sm" onClick={() => downloadBuild(b)}>
                      {t('implants.download')}
                    </button>
                    <button className="btn sm" onClick={() => regenerateBuild(b)}>
                      {t('implants.regenerate')}
                    </button>
                    <button className="btn sm danger" onClick={() => setDeleting({ kind: 'build', name: b.Name })}>
                      {t('profiles.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!deleting}
        title={deleting?.kind === 'build' ? t('implants.confirmDelete') : t('profiles.confirmDelete')}
        danger
        busy={busy}
        confirmLabel={t('profiles.delete')}
        onConfirm={() => {
          if (!deleting) return
          if (deleting.kind === 'build') {
            const b = builds.find((x) => x.Name === deleting.name)
            if (b) deleteBuild(b)
          } else {
            const p = profiles.find((x) => x.Name === deleting.name)
            if (p) deleteProfile(p)
          }
        }}
        onCancel={() => setDeleting(null)}
      >
        <p>{deleting ? t('implants.confirmDeleteBody', { name: deleting.name }) : ''}</p>
      </ConfirmDialog>
    </div>
  )
}
