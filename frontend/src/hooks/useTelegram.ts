import { useEffect, useState } from 'react';

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      setTg(telegram);
    }
  }, []);

  const initTelegram = () => {
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      setTg(telegram);
    }
  };

  return { tg, initTelegram };
}

