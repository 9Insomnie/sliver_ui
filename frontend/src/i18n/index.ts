import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import zh from './locales/zh'

const saved = localStorage.getItem('sliverui-lang')
const initial = saved === 'zh' || saved === 'en' ? saved : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
