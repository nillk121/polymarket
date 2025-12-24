/**
 * Утилиты для форматирования сообщений бота
 */

export const messages = {
  start: (username?: string) => {
    const greeting = username ? `Привет, ${username}! 👋` : 'Привет! 👋';
    return (
      `${greeting}\n\n` +
      `🎯 Добро пожаловать в платформу прогнозных рынков!\n\n` +
      `📱 Используйте Mini App для торговли на рынках.\n` +
      `💰 Делайте ставки и выигрывайте!\n\n` +
      `📊 Доступные команды:\n` +
      `/markets - Список активных рынков\n` +
      `/balance - Ваш баланс\n` +
      `/start - Главное меню`
    );
  },

  startWithReferral: (username?: string, referralCode?: string) => {
    const greeting = username ? `Привет, ${username}! 👋` : 'Привет! 👋';
    return (
      `${greeting}\n\n` +
      `🎯 Добро пожаловать в платформу прогнозных рынков!\n\n` +
      `🎁 Вы перешли по реферальной ссылке${referralCode ? ` (код: ${referralCode})` : ''}!\n\n` +
      `📱 Используйте Mini App для торговли на рынках.\n` +
      `💰 Делайте ставки и выигрывайте!\n\n` +
      `📊 Доступные команды:\n` +
      `/markets - Список активных рынков\n` +
      `/balance - Ваш баланс\n` +
      `/start - Главное меню`
    );
  },

  markets: {
    list: (markets: any[]) => {
      if (markets.length === 0) {
        return '📊 Нет активных рынков в данный момент.';
      }

      let message = '📊 Активные рынки:\n\n';
      markets.forEach((market, index) => {
        message += `${index + 1}. ${market.title}\n`;
        message += `   💰 Объем: ${parseFloat(market.totalVolume).toFixed(2)} TON\n`;
        message += `   📈 Ставок: ${market.totalBets}\n`;
        if (market.endDate) {
          const endDate = new Date(market.endDate);
          const now = new Date();
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          message += `   ⏰ Осталось: ${daysLeft} дн.\n`;
        }
        message += `\n`;
      });

      message += `\n📱 Откройте Mini App для размещения ставок!`;
      return message;
    },

    error: '❌ Ошибка загрузки рынков. Попробуйте позже.',
  },

  balance: {
    show: (balance: { amount: string; availableAmount: string; lockedAmount: string }) => {
      const total = parseFloat(balance.amount).toFixed(2);
      const available = parseFloat(balance.availableAmount).toFixed(2);
      const locked = parseFloat(balance.lockedAmount).toFixed(2);

      return (
        `💰 Ваш баланс:\n\n` +
        `💵 Всего: ${total} TON\n` +
        `✅ Доступно: ${available} TON\n` +
        (parseFloat(locked) > 0 ? `🔒 Заблокировано: ${locked} TON\n` : '') +
        `\n📱 Откройте Mini App для пополнения баланса!`
      );
    },

    noWallet: '❌ У вас еще нет кошелька. Откройте Mini App для создания кошелька.',

    error: '❌ Ошибка загрузки баланса. Попробуйте позже.',
  },

  notifications: {
    newMarket: (market: any) => {
      return (
        `🆕 Новый рынок!\n\n` +
        `📊 ${market.title}\n` +
        `📝 ${market.description.substring(0, 100)}${market.description.length > 100 ? '...' : ''}\n\n` +
        `💰 Начальная ликвидность: ${parseFloat(market.liquidity || '0').toFixed(2)} TON\n\n` +
        `📱 Откройте Mini App, чтобы сделать ставку!`
      );
    },

    marketResolved: (market: any, outcome: any) => {
      return (
        `✅ Рынок разрешен!\n\n` +
        `📊 ${market.title}\n` +
        `🏆 Победитель: ${outcome.name}\n\n` +
        `💰 Выплаты будут произведены автоматически.\n` +
        `📱 Проверьте баланс в Mini App!`
      );
    },

    betWon: (bet: any, payout: string) => {
      return (
        `🎉 Поздравляем! Вы выиграли!\n\n` +
        `📊 Рынок: ${bet.market?.title || 'Неизвестно'}\n` +
        `🎯 Исход: ${bet.outcome?.name || 'Неизвестно'}\n` +
        `💰 Выплата: ${parseFloat(payout).toFixed(2)} TON\n\n` +
        `📱 Проверьте баланс в Mini App!`
      );
    },

    betLost: (bet: any) => {
      return (
        `😔 Ставка проиграна\n\n` +
        `📊 Рынок: ${bet.market?.title || 'Неизвестно'}\n` +
        `🎯 Исход: ${bet.outcome?.name || 'Неизвестно'}\n\n` +
        `💪 Удачи в следующий раз!`
      );
    },
  },

  errors: {
    generic: '❌ Произошла ошибка. Попробуйте позже.',
    notFound: '❌ Не найдено.',
    unauthorized: '❌ Необходима авторизация. Откройте Mini App.',
  },
};

/**
 * Создание кнопки для открытия Mini App
 */
export function createMiniAppButton(text: string, path: string = '') {
  return {
    text,
    web_app: {
      url: `${process.env.MINI_APP_URL || 'https://your-mini-app.com'}${path}`,
    },
  };
}

/**
 * Создание inline клавиатуры с кнопкой Mini App
 */
export function createMiniAppKeyboard(path: string = '') {
  return {
    inline_keyboard: [
      [
        createMiniAppButton('📱 Открыть Mini App', path),
      ],
    ],
  };
}

