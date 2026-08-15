import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number
  className?: string
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  searchable?: boolean
  searchPlaceholder?: string
  searchText?: (row: T) => string
  loading?: boolean
  loadingText?: string
  empty?: ReactNode
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onRowContextMenu?: (e: React.MouseEvent, row: T) => void
  onSelectedChange?: (row: T | null) => void
  navigable?: boolean
  defaultSort?: { key: string; dir?: 'asc' | 'desc' }
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable = false,
  searchPlaceholder,
  searchText,
  loading = false,
  loadingText,
  empty,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  onSelectedChange,
  navigable = false,
  defaultSort,
}: Props<T>) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    defaultSort ? { key: defaultSort.key, dir: defaultSort.dir || 'asc' } : null,
  )
  const [selected, setSelected] = useState(-1)
  const bodyRef = useRef<HTMLTableSectionElement>(null)

  const filtered = useMemo(() => {
    let out = rows
    const q = query.trim().toLowerCase()
    if (q && searchText) {
      out = out.filter((r) => searchText(r).toLowerCase().includes(q))
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      const val = (r: T) =>
        (col?.sortValue ? col.sortValue(r) : (r as Record<string, unknown>)[sort.key]) as string | number
      out = [...out].sort((a, b) => {
        const av = val(a)
        const bv = val(b)
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return out
  }, [rows, query, searchText, sort, columns])

  useEffect(() => {
    setSelected(-1)
  }, [filtered.length])

  useEffect(() => {
    onSelectedChange?.(selected >= 0 && selected < filtered.length ? filtered[selected] : null)
  }, [selected, filtered, onSelectedChange])

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' },
    )
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!navigable || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault()
      const row = filtered[selected]
      if (onRowDoubleClick) onRowDoubleClick(row)
      else if (onRowClick) onRowClick(row)
    }
  }

  useEffect(() => {
    const el = bodyRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div className="data-table" onKeyDown={onKeyDown} tabIndex={navigable ? 0 : undefined}>
      {searchable && (
        <div className="data-table-toolbar">
          <input
            className="data-table-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder || t('common.search')}
          />
        </div>
      )}
      <div className="data-table-scroll">
        <table className="data">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : undefined}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => toggleSort(col)}
                >
                  {col.label}
                  {sort?.key === col.key && <span className="sort-arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="empty">
                  {loadingText || t('common.loading')}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty">
                  {empty || t('common.empty')}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => {
                const key = rowKey(row, i)
                const isSelected = navigable && i === selected
                return (
                  <tr
                    key={key}
                    data-selected={isSelected || undefined}
                    className={isSelected ? 'selected' : undefined}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                    onContextMenu={(e) => onRowContextMenu?.(e, row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
