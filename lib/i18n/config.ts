import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { supportedLocales } from './locales';
import { defaultLocale } from './types';

i18n
  .use(initReactI18next)
  .use(resourcesToBackend((language: string) => import(`./locales/${language}.json`)))
  .init({
    lng: defaultLocale,
    // Fallback chain: requested locale → en-US → zh-CN.
    // Non-CN locales (ja-JP / ko-KR / etc.) without their own `classroom.*`
    // bundle resolve to en-US values until V1.1 adds per-locale translations.
    fallbackLng: ['en-US', defaultLocale],
    supportedLngs: supportedLocales.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
