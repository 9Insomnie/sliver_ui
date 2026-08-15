import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GROUPED_NAV } from '../lib/nav'
import { api } from '../lib/api'
import type { Session, Beacon } from '../lib/types'

interface PaletteCommand {
  id: string
  label: string
  icon?: React.ReactNode
  hint?: string
  run: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onToggleLang: () => void
}

export default function CommandPalette({ open, onClose, onToggleLang }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [beacons, setBeacons] = useState<Beacon[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      requestAnimationFrame(() => inputRef.current?.focus())
      Promise.allSettled([api.sessions(), api.beacons()]).then(([s, b]) => {
        if (s.status === 'fulfilled') setSessions(s.value.sessions || [])
        if (b.status === 'fulfilled') setBeacons(b.value.beacons || [])
      })
    }
  }, [open])

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const commands = useMemo<PaletteCommand[]>(() => {
    const nav: PaletteCommand[] = GROUPED_NAV.flatMap((section) =>
      section.items
        .filter((item) => !item.disabled)
        .map((item) => ({
          id: item.path,
          label: t(`nav.${item.key}`),
          icon: item.icon,
          hint: item.path,
          run: () => {
            navigate(item.path)
            onClose()
          },
        })),
    )
    const sessionCmds: PaletteCommand[] = sessions.map((s) => ({
      id: `session-${s.ID}`,
      label: `${s.Name} — ${s.Hostname}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      hint: s.RemoteAddress,
      run: () => {
        navigate(`/sessions/${s.ID}`)
        onClose()
      },
    }))
    const beaconCmds: PaletteCommand[] = beacons.map((b) => ({
      id: `beacon-${b.ID}`,
      label: `${b.Name} — ${b.Hostname}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 12a7 7 0 0 1 14 0" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      ),
      hint: b.RemoteAddress,
      run: () => {
        navigate(`/beacons/${b.ID}`)
        onClose()
      },
    }))
    const actions: PaletteCommand[] = [
      {
        id: 'toggle-lang',
        label: t('palette.toggleLang', { lang: i18n.language === 'zh' ? 'EN' : '中文' }),
        run: () => {
          onToggleLang()
          onClose()
        },
      },
    ]
    return [...nav, ...sessionCmds, ...beaconCmds, ...actions]
  }, [t, i18n.language, navigate, onClose, onToggleLang, sessions, beacons])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    setSelected(0)
  }, [query])

  if (!open) return null

  const groups = (() => {
    const nav = filtered.filter((c) => c.hint !== undefined && c.id.startsWith('/'))
    const hosts = filtered.filter((c) => c.hint !== undefined && !c.id.startsWith('/'))
    const actions = filtered.filter((c) => c.hint === undefined)
    const result: { group: string; items: PaletteCommand[] }[] = []
    if (nav.length) result.push({ group: t('palette.navigate'), items: nav })
    if (hosts.length) result.push({ group: t('palette.targets'), items: hosts })
    if (actions.length) result.push({ group: t('palette.actions'), items: actions })
    return result
  })()

  const flat = groups.flatMap((g) => g.items)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[selected]?.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
          />
          <kbd className="kbd">ESC</kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {flat.length === 0 && <div className="palette-empty">{t('palette.noResults')}</div>}
          {groups.map((g) => (
            <div key={g.group}>
              <div className="palette-group">{g.group}</div>
              {g.items.map((c) => {
                const idx = flat.indexOf(c)
                return (
                  <button
                    key={c.id}
                    className="palette-item"
                    data-active={idx === selected}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={c.run}
                  >
                    <span className="palette-item-icon">{c.icon}</span>
                    <span className="palette-item-label">{c.label}</span>
                    {c.hint && <span className="palette-item-hint">{c.hint}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
