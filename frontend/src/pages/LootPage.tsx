import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { LootEntry } from '../lib/types'
import { base64ToBytes, triggerDownload } from '../lib/binary'
import DataTable, { type Column } from '../components/common/DataTable'
import StatusBadge from '../components/common/StatusBadge'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DetailDrawer from '../components/common/DetailDrawer'
import { useToast } from '../components/common/Toast'
import EmptyState from '../components/common/EmptyState'
import './pages.css'

function fmtSize(size: number): string {
  if (!size) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function toneForType(t: string): 'green' | 'blue' | 'yellow' {
  if (t.includes('CREDENTIAL')) return 'green'
  if (t.includes('FILE')) return 'blue'
  return 'yellow'
}

export default function LootPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [loot, setLoot] = useState<LootEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'FILE' | 'CREDENTIAL'>('all')
  const [selected, setSelected] = useState<LootEntry | null>(null)
  const [content, setContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [removing, setRemoving] = useState<LootEntry | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setError('')
      const d = await api.lootList()
      setLoot(d.loot || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(
    () => (filter === 'all' ? loot : loot.filter((l) => (l.LootType || '').includes(filter))),
    [loot, filter],
  )

  const open = async (entry: LootEntry) => {
    setSelected(entry)
    setLoadingContent(true)
    setContent('')
    try {
      const full = await api.lootContent(entry.ID)
      const b64 = full.DataB64 || ''
      setContent(
        (entry.FileType || '').includes('TEXT') ? new TextDecoder('utf-8', { fatal: false }).decode(base64ToBytes(b64)) : `${t('loot.binaryHint')} (${fmtSize(b64.length * 0.75)})`,
      )
    } catch (e) {
      setContent(`${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setLoadingContent(false)
    }
  }

  const download = async (entry: LootEntry) => {
    try {
      const full = await api.lootContent(entry.ID)
      if (!full.DataB64) return
      triggerDownload(entry.File || entry.Name || 'loot', base64ToBytes(full.DataB64))
      toast.push('success', t('loot.downloaded', { name: entry.Name }))
    } catch (e) {
      toast.push('error', `${t('common.failed')}: ${(e as Error).message}`)
    }
  }

  const remove = async (entry: LootEntry) => {
    setBusy(true)
    try {
      await api.lootRemove(entry.ID)
      setRemoving(null)
      if (selected?.ID === entry.ID) setSelected(null)
      toast.push('success', t('loot.removed', { name: entry.Name }))
      load()
    } catch (e) {
      toast.push('error', `${t('common.failed')}: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<LootEntry>[] = [
    {
      key: 'Name',
      label: t('loot.thName'),
      sortable: true,
      render: (l) => (
        <span className="mono">
          {l.Name}
          {l.File && <span className="loot-file"> · {l.File}</span>}
        </span>
      ),
    },
    {
      key: 'LootType',
      label: t('loot.thType'),
      sortable: true,
      render: (l) => <StatusBadge tone={toneForType(l.LootType)}>{l.LootType}</StatusBadge>,
    },
    {
      key: 'FileType',
      label: t('loot.thFileType'),
      sortable: true,
      render: (l) => <span className="mono">{l.FileType}</span>,
    },
    {
      key: 'Size',
      label: t('loot.thSize'),
      sortable: true,
      sortValue: (l) => l.Size || 0,
      render: (l) => <span className="mono">{fmtSize(l.Size)}</span>,
    },
    {
      key: 'OriginHostUUID',
      label: t('loot.thOrigin'),
      sortable: true,
      render: (l) => <span className="mono">{l.OriginHostUUID ? l.OriginHostUUID.slice(0, 8) : '-'}</span>,
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{t('loot.title')}</div>
          <div className="page-sub">{t('loot.sub', { count: loot.length })}</div>
        </div>
        <div className="toolbar">
          <div className="seg">
            {(['all', 'FILE', 'CREDENTIAL'] as const).map((f) => (
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? t('loot.filterAll') : f === 'FILE' ? t('loot.filterFiles') : t('loot.filterCreds')}
              </button>
            ))}
          </div>
          <button className="btn" onClick={load}>
            {t('common.refresh')}
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {!loading && filtered.length === 0 && !error ? (
        <EmptyState title={t('loot.empty')} subtitle={t('loot.emptySub')} />
      ) : (
        <div className="card card-flush">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(l) => l.ID}
            searchable
            searchPlaceholder={t('loot.search')}
            searchText={(l) => `${l.Name} ${l.File} ${l.LootType} ${l.FileType}`}
            loading={loading}
            empty={t('loot.empty')}
            onRowClick={open}
            navigable
          />
        </div>
      )}
      <DetailDrawer
        open={!!selected}
        title={selected ? selected.Name : ''}
        subtitle={selected ? selected.ID : ''}
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <div className="drawer-actions">
              <button className="btn" onClick={() => download(selected)}>
                {t('loot.download')}
              </button>
              <button className="btn danger" onClick={() => setRemoving(selected)}>
                {t('loot.remove')}
              </button>
            </div>
          )
        }
      >
        {selected && (
          <div className="task-detail">
            <div className="kv">
              <div className="side-row">
                <span className="side-label">{t('loot.thType')}</span>
                <StatusBadge tone={toneForType(selected.LootType)}>{selected.LootType}</StatusBadge>
              </div>
              <div className="side-row">
                <span className="side-label">{t('loot.thFileType')}</span>
                <span className="side-value">{selected.FileType}</span>
              </div>
              <div className="side-row">
                <span className="side-label">{t('loot.thSize')}</span>
                <span className="side-value">{fmtSize(selected.Size)}</span>
              </div>
              {selected.File && (
                <div className="side-row">
                  <span className="side-label">{t('loot.thFile')}</span>
                  <span className="side-value mono">{selected.File}</span>
                </div>
              )}
            </div>
            <div className="task-content">
              <div className="task-content-header">
                <span>{t('loot.content')}</span>
              </div>
              {loadingContent ? <pre>{t('common.loading')}</pre> : <pre>{content || t('tasks.none')}</pre>}
            </div>
          </div>
        )}
      </DetailDrawer>
      <ConfirmDialog
        open={!!removing}
        title={t('loot.confirmRemove')}
        danger
        busy={busy}
        confirmLabel={t('loot.remove')}
        onConfirm={() => removing && remove(removing)}
        onCancel={() => setRemoving(null)}
      >
        <p>{removing ? t('loot.confirmRemoveBody', { name: removing.Name }) : ''}</p>
      </ConfirmDialog>
    </div>
  )
}
