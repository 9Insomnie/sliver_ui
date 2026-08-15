import type { ReactNode } from 'react'

export interface NavItem {
  path: string
  key: string
  icon: ReactNode
  favorite?: boolean
  disabled?: boolean
}

export interface NavSection {
  key: string
  titleKey?: string
  title?: string
  items: NavItem[]
}

export const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
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
  jobs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h16l-1.5 11h-13L4 9z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
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
  tasks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
    </svg>
  ),
  loot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      <path d="M12 12v4" />
    </svg>
  ),
  files: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
      <path d="M14 3v6h6" />
    </svg>
  ),
  processes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M12 11l-5 6M12 11l5 6" />
    </svg>
  ),
  credentials: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.5" />
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
  hosts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="7" rx="1.5" />
      <rect x="4" y="14" width="16" height="7" rx="1.5" />
      <circle cx="7" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
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

// 分组导航 — Viper 风格信息架构
export const GROUPED_NAV: NavSection[] = [
  {
    key: 'operations',
    items: [
      { path: '/', key: 'dashboard', icon: ICONS.dashboard },
      { path: '/sessions', key: 'sessions', icon: ICONS.sessions },
      { path: '/beacons', key: 'beacons', icon: ICONS.beacons },
      { path: '/listeners', key: 'listeners', icon: ICONS.listeners },
    ],
  },
  {
    key: 'payloads',
    items: [
      { path: '/implants', key: 'implants', icon: ICONS.implants },
      { path: '/socks', key: 'socks', icon: ICONS.socks },
    ],
  },
  {
    key: 'tasking',
    items: [
      { path: '/jobs', key: 'jobs', icon: ICONS.jobs },
      { path: '/tasks', key: 'tasks', icon: ICONS.tasks },
      { path: '/loot', key: 'loot', icon: ICONS.loot },
    ],
  },
  {
    key: 'host',
    items: [
      { path: '/processes', key: 'processes', icon: ICONS.processes },
      { path: '/network', key: 'network', icon: ICONS.network },
      { path: '/files', key: 'files', icon: ICONS.files },
    ],
  },
  {
    key: 'analysis',
    items: [
      { path: '/hosts', key: 'hosts', icon: ICONS.hosts },
      { path: '/events', key: 'events', icon: ICONS.events },
    ],
  },
  {
    key: 'system',
    items: [{ path: '/settings', key: 'settings', icon: ICONS.settings }],
  },
]

// 顶部 Workspace 段:主导航(Sessions / Beacons / Listeners / Implants / SOCKS / Events)
export const WORKSPACE_NAV: NavItem[] = [
  { path: '/', key: 'dashboard', icon: ICONS.dashboard },
  { path: '/sessions', key: 'sessions', icon: ICONS.sessions },
  { path: '/beacons', key: 'beacons', icon: ICONS.beacons },
  { path: '/listeners', key: 'listeners', icon: ICONS.listeners },
  { path: '/implants', key: 'implants', icon: ICONS.implants },
  { path: '/socks', key: 'socks', icon: ICONS.socks },
  { path: '/events', key: 'events', icon: ICONS.events },
  { path: '/settings', key: 'settings', icon: ICONS.settings },
]

// Favorites 段:用户常用(默认收藏 Sessions / Implants,可由用户调整)
export const FAVORITES_NAV: NavItem[] = [
  { path: '/', key: 'dashboard', icon: ICONS.dashboard, favorite: true },
  { path: '/sessions', key: 'sessions', icon: ICONS.sessions, favorite: true },
  { path: '/beacons', key: 'beacons', icon: ICONS.beacons, favorite: true },
]

// 旧版扁平结构,保留以便 palette / 其他代码继续引用
export const NAV: NavItem[] = WORKSPACE_NAV