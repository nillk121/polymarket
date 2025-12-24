import 'dotenv/config';
import { Bot, Context } from 'grammy';
import { handleStart } from './commands/start.command';
import { handleMarkets } from './commands/markets.command';
import { handleBalance } from './commands/balance.command';
import { referralMiddleware } from './middleware/referral.middleware';
import { NotificationService } from './services/notifications';
import { messages, createMiniAppKeyboard } from './utils/messages';

// Инициализация бота
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: Bot;
let notificationService: NotificationService;

if (!botToken) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram bot will not start.');
  // Создаем заглушку для экспорта
  bot = {} as any;
  notificationService = {} as any;
} else {
  bot = new Bot(botToken);

  // Инициализация сервиса уведомлений
  notificationService = new NotificationService(bot);

  // Middleware для отслеживания рефералов
  bot.use(referralMiddleware);

  // Логирование всех сообщений для отладки
  bot.use(async (ctx, next) => {
    if (ctx.message?.text) {
      console.log(`📨 Received message: ${ctx.message.text} from user ${ctx.from?.id}`);
    }
    return next();
  });

  // Обработка команды /start
  bot.command('start', async (ctx: Context) => {
    console.log('✅ /start command received');
    await handleStart(ctx);
  });

  // Обработка команды /markets
  bot.command('markets', handleMarkets);

  // Обработка команды /balance
  bot.command('balance', handleBalance);

  // Обработка команды /deposit
  bot.command('deposit', async (ctx: Context) => {
    const { handleDeposit } = await import('./commands/deposit.command');
    await handleDeposit(ctx);
  });

  // Обработка команды /test_deposit - быстрое тестовое пополнение на 1 звезду
  bot.command('test_deposit', async (ctx: Context) => {
    try {
      const telegramId = ctx.from?.id.toString();
      if (!telegramId) {
        await ctx.reply('❌ Ошибка авторизации');
        return;
      }

      // Получаем кошельки пользователя
      const { apiClient } = await import('./services/api');
      const wallets = await apiClient.getUserWallets(telegramId);
      const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
      
      if (!internalWallet) {
        await ctx.reply(
          '❌ У вас еще нет кошелька.\n\n' +
          '📱 Откройте Mini App для создания кошелька.',
        );
        return;
      }

      await ctx.reply('⏳ Создаю тестовое пополнение на 1 ⭐...');

      // Создаем платеж на 1 звезду
      const paymentResult = await apiClient.createPayment({
        provider: 'telegram_stars',
        telegramId: telegramId,
        amount: 1,
        currency: 'XTR',
        description: 'Тестовое пополнение на 1 звезду',
      });

      // Отправляем invoice
      await ctx.api.sendInvoice(
        ctx.chat!.id,
        'Тестовое пополнение на 1 ⭐',
        'Тестовое пополнение баланса на 1 звезду',
        paymentResult.paymentId || paymentResult.transactionId,
        'XTR',
        [
          {
            label: '1 Star',
            amount: 1,
          },
        ],
        {
          provider_token: '',
          provider_data: JSON.stringify({
            paymentId: paymentResult.paymentId,
            transactionId: paymentResult.transactionId,
            provider: 'telegram_stars',
          }),
        },
      );
    } catch (error: any) {
      console.error('Error in /test_deposit command:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      await ctx.reply(`❌ Ошибка: ${errorMessage}`);
    }
  });

  // Обработка команды /help
  bot.command('help', async (ctx: Context) => {
    const helpMessage = (
      `📚 Помощь\n\n` +
      `Доступные команды:\n\n` +
      `/start - Главное меню\n` +
      `/markets - Список активных рынков\n` +
      `/balance - Ваш баланс\n` +
      `/deposit - Пополнить баланс\n` +
      `/test_deposit - Тестовое пополнение (1 ⭐)\n` +
      `/help - Показать эту справку\n\n` +
      `📱 Используйте кнопку "Открыть Mini App" для полного функционала!`
    );

    await ctx.reply(helpMessage, {
      reply_markup: createMiniAppKeyboard(),
    });
  });

  // Обработка нажатия на кнопку Mini App (для dev режима)
  bot.callbackQuery('open_mini_app', async (ctx: Context) => {
    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5173';
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📱 Mini App в режиме разработки\n\n` +
      `Для запуска Mini App откройте в браузере:\n` +
      `${miniAppUrl}\n\n` +
      `⚠️ В production режиме кнопка будет открывать приложение автоматически.`,
    );
  });

  // Обработка нажатия на кнопку Mini App с путем
  bot.callbackQuery(/^open_mini_app:(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery.data.match(/^open_mini_app:(.+)$/);
    const path = match ? match[1] : '';
    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:5173';
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📱 Mini App в режиме разработки\n\n` +
      `Для запуска Mini App откройте в браузере:\n` +
      `${miniAppUrl}${path}\n\n` +
      `⚠️ В production режиме кнопка будет открывать приложение автоматически.`,
    );
  });

  // Обработка пополнения баланса
  bot.callbackQuery(/^deposit:(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery.data.match(/^deposit:(.+)$/);
    const action = match ? match[1] : '';
    
    if (action === 'start' || action === 'back') {
      const { handleDeposit } = await import('./commands/deposit.command');
      await ctx.answerCallbackQuery();
      await handleDeposit(ctx);
    } else if (action === 'cancel') {
      const { handleDepositProvider } = await import('./commands/deposit.command');
      await handleDepositProvider(ctx, 'cancel');
    } else {
      const { handleDepositProvider } = await import('./commands/deposit.command');
      await handleDepositProvider(ctx, action);
    }
  });

  // Обработка выбора суммы пополнения
  bot.callbackQuery(/^deposit_amount:(.+):(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery.data.match(/^deposit_amount:(.+):(.+)$/);
    if (match) {
      const provider = match[1];
      const amount = match[2];
      const { handleDepositAmount } = await import('./commands/deposit.command');
      await handleDepositAmount(ctx, provider, amount);
    }
  });

  // Обработка кнопки "Скопировать адрес" для TON Wallet
  bot.callbackQuery(/^copy_address:(.+)$/, async (ctx: Context) => {
    const match = ctx.callbackQuery.data.match(/^copy_address:(.+)$/);
    if (match) {
      const address = match[1];
      await ctx.answerCallbackQuery({
        text: `Адрес скопирован: ${address}`,
        show_alert: false,
      });
      // Отправляем адрес как текст для копирования
      await ctx.reply(
        `💰 Адрес TON кошелька для пополнения:\n\n` +
        `\`${address}\`\n\n` +
        `💡 Скопируйте адрес и отправьте средства через ваш TON кошелек.`,
        {
          parse_mode: 'Markdown',
        },
      );
    }
  });

  // Обработка успешной оплаты (pre_checkout_query и successful_payment)
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      const query = ctx.preCheckoutQuery;
      const payload = query.invoice_payload;
      
      // Проверяем платеж через API (опционально)
      // В реальной реализации здесь должна быть проверка через API
      // Для Stars и Telegram Wallet подтверждаем автоматически
      console.log(`✅ Pre-checkout query approved for payment: ${payload}`);
      
      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      console.error('Error in pre_checkout_query:', error);
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'Ошибка обработки платежа',
      });
    }
  });

  bot.on('message:successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    const telegramId = ctx.from?.id.toString();
    
    if (!telegramId) {
      return;
    }

    try {
      // Обрабатываем успешную оплату
      // Webhook от Telegram автоматически обработает платеж через PaymentGatewayService
      // Правильная конвертация: XTR - целое число, TON - нанотоны (1 TON = 10^9 нанотонов)
      const amount = payment.currency === 'XTR' 
        ? payment.total_amount 
        : payment.total_amount / 1000000000; // TON из нанотонов
      
      console.log(`✅ Payment successful: ${amount} ${payment.currency}, payload: ${payment.invoice_payload}`);
      
      await ctx.reply(
        `✅ Платеж успешно обработан!\n\n` +
        `💰 Сумма: ${amount} ${payment.currency}\n\n` +
        `💡 Ваш баланс будет обновлен автоматически через несколько секунд.\n` +
        `Используйте /balance для проверки баланса.`,
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      await ctx.reply('❌ Ошибка обработки платежа. Обратитесь в поддержку.');
    }
  });

  // Обработка данных из Mini App (через message с web_app_data)
  bot.on('message', async (ctx: Context) => {
    // Пропускаем команды - они обрабатываются отдельно
    if (ctx.message?.text && ctx.message.text.startsWith('/')) {
      return;
    }

    // Проверяем, есть ли данные из Mini App
    if (ctx.message && 'web_app_data' in ctx.message) {
      const webAppData = (ctx.message as any).web_app_data;
      if (webAppData?.data) {
        try {
          const data = JSON.parse(webAppData.data);
          console.log('WebApp data received:', data);
          await ctx.reply('✅ Данные получены из Mini App!');
        } catch (error) {
          console.error('Error parsing web app data:', error);
        }
      }
      return;
    }
  });

  // Обработка ошибок
  bot.catch((err) => {
    console.error('Bot error:', err);
  });
}

// Экспорт для использования в других модулях
export { bot, notificationService };

// Запуск бота
const startBot = async () => {
  if (!botToken) {
    console.log('ℹ️  Skipping bot startup - token not configured');
    console.log('💡 Add TELEGRAM_BOT_TOKEN to apps/telegram-bot/.env to enable bot');
    return;
  }

  try {
    // Установка кнопки меню (слева в чате)
    const miniAppUrl = process.env.MINI_APP_URL;
    if (miniAppUrl) {
      // Проверяем, является ли URL HTTPS (Cloudflare Tunnel, ngrok и т.д.)
      const isHttps = miniAppUrl.startsWith('https://');
      
      if (isHttps) {
        try {
          await bot.api.setChatMenuButton({
            menu_button: {
              type: 'web_app',
              text: '🚀 Запустить приложение',
              web_app: {
                url: miniAppUrl,
              },
            },
          });
          console.log(`✅ Кнопка меню установлена: ${miniAppUrl}`);
        } catch (error: any) {
          console.warn('⚠️  Не удалось установить кнопку меню:', error.message);
          console.warn('💡 Убедитесь, что URL доступен и использует HTTPS');
        }
      } else {
        console.log('ℹ️  Кнопка меню не установлена (требуется HTTPS)');
        console.log('💡 Используйте Cloudflare Tunnel для получения HTTPS в dev режиме');
        console.log('   См. docs/CLOUDFLARE_TUNNEL_SETUP.md');
      }
    } else {
      console.log('ℹ️  MINI_APP_URL не установлен');
      console.log('💡 Установите MINI_APP_URL в apps/telegram-bot/.env');
    }

    if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
      // Webhook режим для production
      await bot.api.setWebhook(process.env.WEBHOOK_URL);
      console.log('🤖 Telegram bot started in webhook mode');
    } else {
      // Polling режим для development
      await bot.start();
      console.log('🤖 Telegram bot started in polling mode');
      console.log(`✅ Bot is ready! Try /start command in Telegram`);
    }
  } catch (error: any) {
    console.error('❌ Failed to start bot:', error.message);
    if (error.message?.includes('token')) {
      console.error('💡 Check your TELEGRAM_BOT_TOKEN in .env file');
    }
    throw error;
  }
};

// Запуск бота
if (require.main === module) {
  if (botToken) {
    startBot().catch((error) => {
      console.error('Failed to start bot:', error);
      process.exit(1);
    });
  } else {
    // Если токена нет, просто выходим без ошибки
    console.log('ℹ️  Bot module loaded but not started (no token)');
    console.log('💡 Add TELEGRAM_BOT_TOKEN to apps/telegram-bot/.env to enable bot');
  }
}
