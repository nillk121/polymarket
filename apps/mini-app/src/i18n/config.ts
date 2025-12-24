import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: {
        translation: ru,
      },
    },
    lng: 'ru', // Язык по умолчанию
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },
  });

export default i18n;

