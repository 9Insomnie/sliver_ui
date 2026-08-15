import type { ReactNode } from 'react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from './lib/api'
import type { ServerInfo } from './lib/types'
import { WORKSPACE_NAV, ICONS } from './lib/nav'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import TerminalPage from './pages/TerminalPage'
import ListenersPage from './pages/ListenersPage'
import BeaconsPage from './pages/BeaconsPage'
import ImplantsPage from './pages/ImplantsPage'
import SocksPage from './pages/SocksPage'
import EventsPage from './pages/EventsPage'
import SettingsPage from './pages/SettingsPage'
import Logo from './components/Logo'
import CommandPalette from './components/CommandPalette'
import './App.css'

export default function App() {
  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    api
      .info()
      .then((d) => setInfo({ version: d.version, connected: true }))
      .catch(() => setInfo({ version: '', connected: false }))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(next)
    localStorage.setItem('sliverui-lang', next)
  }

  // 页面转场方向 — 深入=forward(右滑入),返回=back(左滑入),同级=same(微 fade)
  const prevPathRef = useRef(location.pathname)
  const prevDepth = prevPathRef.current.split('/').filter(Boolean).length
  const currDepth = location.pathname.split('/').filter(Boolean).length
  const pageDir = currDepth > prevDepth ? 'forward' : currDepth < prevDepth ? 'back' : 'same'
  useEffect(() => {
    prevPathRef.current = location.pathname
  }, [location.pathname])

  // 收藏列表 — localStorage 持久化,默认收藏 sessions / implants / beacons
  const FAV_KEY = 'sliverui-favorites'
  const DEFAULT_FAVS = ['sessions', 'implants', 'beacons']
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAV_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_FAVS
    } catch {
      return DEFAULT_FAVS
    }
  })
  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites))
  }, [favorites])
  const toggleFav = useCallback((key: string) => {
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])
  const favoriteItems = WORKSPACE_NAV.filter((item) => favorites.includes(item.key))

  const renderNavItem = (item: { path: string; key: string; icon: ReactNode; favorite?: boolean }) => {
    const isFav = favorites.includes(item.key)
    return (
      <button
        key={item.path + item.key}
        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{t(`nav.${item.key}`)}</span>
        <span
          className={`star-toggle ${isFav ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            toggleFav(item.key)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              toggleFav(item.key)
            }
          }}
          aria-label={isFav ? t('nav.removeFav') : t('nav.addFav')}
          title={isFav ? t('nav.removeFav') : t('nav.addFav')}
        >
          {isFav ? ICONS.star : ICONS.starOutline}
        </span>
      </button>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">
            <Logo size={18} />
          </span>
          <span className="logo-text">{t('app.title')}</span>
          <span className="logo-caret">{ICONS.caret}</span>
        </div>

        <button
          className="sidebar-search"
          onClick={() => setPaletteOpen(true)}
          aria-label={t('app.search')}
        >
          <span>{ICONS.search}</span>
          <span className="sidebar-search-label">{t('app.search')}</span>
          <kbd className="kbd">⌘K</kbd>
        </button>

        <nav>
          <div className="nav-section">
            <div className="nav-section-title">
              {t('app.workspace')}
            </div>
            {WORKSPACE_NAV.map(renderNavItem)}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">
              {t('app.favorites')}
              <span className="nav-section-count">{favoriteItems.length}</span>
            </div>
            {favoriteItems.length > 0 ? (
              favoriteItems.map(renderNavItem)
            ) : (
              <div className="nav-empty">{t('nav.favEmpty')}</div>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="lang-switch" onClick={toggleLang} title={t('app.language')}>
            {ICONS.globe}
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <div className="conn-status">
            <span className={`dot ${info?.connected ? 'ok' : 'bad'}`} />
            <span>
              {info?.connected
                ? t('app.connected', { version: info.version })
                : t('app.notConnected')}
            </span>
          </div>
        </div>
      </aside>
      <main className="content">
        <div key={location.pathname} className={`page-transition ${pageDir}`}>
          <Routes location={location}>
            <Route path="/" element={<SessionsPage />} />
            <Route path="/beacons" element={<BeaconsPage />} />
            <Route path="/listeners" element={<ListenersPage />} />
            <Route path="/implants" element={<ImplantsPage />} />
            <Route path="/socks" element={<SocksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/sessions/:id/terminal" element={<TerminalPage />} />
          </Routes>
        </div>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onToggleLang={toggleLang} />
    </div>
  )
}
