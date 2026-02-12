import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ur from './locales/ur.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  pt: { translation: pt },
  nl: { translation: nl },
  zh: { translation: zh },
  ja: { translation: ja },
  ur: { translation: ur },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { resources };
export default i18n;
