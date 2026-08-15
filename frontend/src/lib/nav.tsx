import type { ReactNode } from 'react'

export interface NavItem {
  path: string
  key: string
  icon: ReactNode
  favorite?: boolean
}

export interface NavSection {
  key: string
  titleKey?: string
  title?: string
  items: NavItem[]
}

export const ICONS: Record<string, ReactNode> = {
  sessions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  beacons: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  listeners: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16" />
      <path d="M12 4v16" />
    </svg>
  ),
  implants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  socks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h11" />
      <path d="M4 12h7" />
      <path d="M4 17h9" />
      <path d="M17 4l3 16" />
      <path d="M17 6l3-2" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  caret: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2.5 14.94 8.5 21.5 9.46l-4.75 4.62L17.88 21 12 17.77 6.12 21l1.13-6.92L2.5 9.46 9.06 8.5 12 2.5z" />
    </svg>
  ),
  starOutline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 14.94 8.5 21.5 9.46l-4.75 4.62L17.88 21 12 17.77 6.12 21l1.13-6.92L2.5 9.46 9.06 8.5 12 2.5z" />
    </svg>
  ),
}

// 顶部 Workspace 段:主导航(Sessions / Beacons / Listeners / Implants / SOCKS / Events)
export const WORKSPACE_NAV: NavItem[] = [
  { path: '/', key: 'sessions', icon: ICONS.sessions },
  { path: '/beacons', key: 'beacons', icon: ICONS.beacons },
  { path: '/listeners', key: 'listeners', icon: ICONS.listeners },
  { path: '/implants', key: 'implants', icon: ICONS.implants },
  { path: '/socks', key: 'socks', icon: ICONS.socks },
  { path: '/events', key: 'events', icon: ICONS.events },
]

// Favorites 段:用户常用(默认收藏 Sessions / Implants,可由用户调整)
export const FAVORITES_NAV: NavItem[] = [
  { path: '/', key: 'sessions', icon: ICONS.sessions, favorite: true },
  { path: '/implants', key: 'implants', icon: ICONS.implants, favorite: true },
  { path: '/beacons', key: 'beacons', icon: ICONS.beacons, favorite: true },
]

// 旧版扁平结构,保留以便 palette / 其他代码继续引用
export const NAV: NavItem[] = WORKSPACE_NAV