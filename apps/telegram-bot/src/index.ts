import { Bot, Context } from 'grammy';
import { handleStart } from './commands/start.command';
import { handleMarkets } from './commands/markets.command';
import { handleBalance } from './commands/balance.command';
import { referralMiddleware } from './middleware/referral.middleware';
import { NotificationService } from './services/notifications';
import { messages, createMiniAppKeyboard } from './utils/messages';

// Инициализация бота
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = new Bot(botToken);

// Инициализация сервиса уведомлений
export const notificationService = new NotificationService(bot);

// Middleware для отслеживания рефералов
bot.use(referralMiddleware);

// Обработка команды /start
bot.command('start', handleStart);

// Обработка команды /markets
bot.command('markets', handleMarkets);

// Обработка команды /balance
bot.command('balance', handleBalance);

// Обработка команды /help
bot.command('help', async (ctx: Context) => {
  const helpMessage = (
    `📚 Помощь\n\n` +
    `Доступные команды:\n\n` +
    `/start - Главное меню\n` +
    `/markets - Список активных рынков\n` +
    `/balance - Ваш баланс\n` +
    `/help - Показать эту справку\n\n` +
    `📱 Используйте кнопку "Открыть Mini App" для полного функционала!`
  );

  await ctx.reply(helpMessage, {
    reply_markup: createMiniAppKeyboard(),
  });
});

// Обработка кнопок Mini App
bot.on('web_app_data', async (ctx: Context) => {
  const data = ctx.webAppData?.data;
  if (data) {
    // Обработка данных из Mini App
    console.log('WebApp data received:', data);
    await ctx.reply('✅ Данные получены из Mini App!');
  }
});

// Обработка неизвестных команд
bot.on('message', async (ctx: Context) => {
  if (ctx.message?.text && ctx.message.text.startsWith('/')) {
    await ctx.reply(
      '❓ Неизвестная команда. Используйте /help для списка команд.',
      {
        reply_markup: createMiniAppKeyboard(),
      },
    );
  }
});

// Обработка ошибок
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Запуск бота
const startBot = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
    // Webhook режим для production
    await bot.api.setWebhook(process.env.WEBHOOK_URL);
    console.log('🤖 Telegram bot started in webhook mode');
  } else {
    // Polling режим для development
    await bot.start();
    console.log('🤖 Telegram bot started in polling mode');
  }
};

// Экспорт для использования в других модулях
export { bot };

// Запуск бота
if (require.main === module) {
  startBot().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });
}
