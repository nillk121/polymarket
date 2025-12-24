import WebApp from '@twa-dev/sdk';

// Расширяем тип Window для поддержки Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

/**
 * Проверяет, доступен ли Telegram WebApp
 */
export function isWebAppAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Безопасный вызов WebApp.ready()
 */
export function safeWebAppReady(): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.ready();
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.ready():', error);
    }
  }
}

/**
 * Безопасный вызов WebApp.expand()
 */
export function safeWebAppExpand(): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.expand();
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.expand():', error);
    }
  }
}

/**
 * Безопасный вызов WebApp.showAlert()
 */
export function safeWebAppShowAlert(message: string): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.showAlert(message);
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.showAlert():', error);
      // Fallback на обычный alert
      alert(message);
    }
  } else {
    // Fallback на обычный alert в режиме разработки
    alert(message);
  }
}

/**
 * Безопасный вызов WebApp.openTelegramLink()
 */
export function safeWebAppOpenTelegramLink(url: string): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.openTelegramLink(url);
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.openTelegramLink():', error);
      // Fallback на window.open
      window.open(url, '_blank');
    }
  } else {
    // Fallback на window.open в режиме разработки
    window.open(url, '_blank');
  }
}

/**
 * Безопасный вызов WebApp.close()
 */
export function safeWebAppClose(): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.close();
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.close():', error);
    }
  }
}

/**
 * Безопасное получение initData
 */
export function safeGetInitData(): string | null {
  if (isWebAppAvailable()) {
    try {
      const initData = WebApp.initData;
      if (initData && initData.trim() !== '') {
        return initData;
      } else {
        console.warn('⚠️ WebApp.initData пустой или отсутствует');
        // В dev режиме можно использовать initDataUnsafe для отладки
        if (process.env.NODE_ENV === 'development') {
          const unsafeData = WebApp.initDataUnsafe;
          if (unsafeData && unsafeData.user) {
            console.warn('💡 Используйте реальный Telegram WebApp для получения валидного initData');
          }
        }
        return null;
      }
    } catch (error) {
      console.warn('Ошибка при получении WebApp.initData:', error);
      return null;
    }
  }
  return null;
}

/**
 * Безопасное получение user из WebApp
 */
export function safeGetWebAppUser(): any {
  if (isWebAppAvailable()) {
    try {
      return WebApp.initDataUnsafe?.user || null;
    } catch (error) {
      console.warn('Ошибка при получении WebApp.initDataUnsafe.user:', error);
      return null;
    }
  }
  return null;
}

/**
 * Безопасный вызов WebApp.openInvoice()
 */
export function safeWebAppOpenInvoice(invoiceUrl: string): void {
  if (isWebAppAvailable()) {
    try {
      WebApp.openInvoice(invoiceUrl);
    } catch (error) {
      console.warn('Ошибка при вызове WebApp.openInvoice():', error);
      // Fallback - открываем в новой вкладке
      window.open(invoiceUrl, '_blank');
    }
  } else {
    // Fallback в режиме разработки
    window.open(invoiceUrl, '_blank');
  }
}

