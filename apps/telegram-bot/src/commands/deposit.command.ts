import { Context, InlineKeyboard } from 'grammy';
import { apiClient } from '../services/api';
import { messages } from '../utils/messages';

/**
 * Обработка команды /deposit
 */
export async function handleDeposit(ctx: Context) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.reply(messages.errors.unauthorized);
      return;
    }

    // Получаем кошельки пользователя
    const wallets = await apiClient.getUserWallets(telegramId);
    const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
    
    if (!internalWallet) {
      await ctx.reply(
        '❌ У вас еще нет кошелька.\n\n' +
        '📱 Откройте Mini App для создания кошелька.',
      );
      return;
    }

          // Создаем клавиатуру с вариантами пополнения
          const keyboard = new InlineKeyboard()
            .text('⭐ Telegram Stars', 'deposit:stars')
            .row();
          
          // Telegram Wallet доступен только если настроен provider_token
          if (process.env.TELEGRAM_WALLET_PROVIDER_TOKEN) {
            keyboard.text('💳 Telegram Wallet', 'deposit:telegram_wallet').row();
          }
          
          keyboard
            .text('💎 TON Wallet', 'deposit:ton_wallet')
            .row()
            .text('❌ Отмена', 'deposit:cancel');

    await ctx.reply(
      '💰 Пополнение баланса\n\n' +
      'Выберите способ пополнения:',
      {
        reply_markup: keyboard,
      },
    );
  } catch (error: any) {
    console.error('Error in /deposit command:', error);
    
    let errorMessage = '❌ Ошибка. Попробуйте позже.';
    
    // Более детальные сообщения об ошибках
    if (error.response?.status === 502) {
      errorMessage = '❌ Сервер временно недоступен.\n\n' +
        'Проверьте, что бэкенд запущен на порту 3002:\n' +
        '`npm run dev` в папке apps/backend';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = '❌ Не удалось подключиться к серверу.\n\n' +
        'Убедитесь, что бэкенд запущен:\n' +
        '`npm run dev` в папке apps/backend';
    }
    
    await ctx.reply(errorMessage, {
      parse_mode: 'Markdown',
    });
  }
}

/**
 * Обработка выбора способа пополнения
 */
export async function handleDepositProvider(ctx: Context, provider: string) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.answerCallbackQuery({ text: 'Ошибка авторизации' });
      return;
    }

    if (provider === 'cancel') {
      await ctx.answerCallbackQuery({ text: 'Отменено' });
      await ctx.editMessageText('❌ Пополнение отменено.');
      return;
    }

    // Получаем кошельки пользователя
    const wallets = await apiClient.getUserWallets(telegramId);
    const internalWallet = wallets.find((w: any) => (w.type === 'internal' || w.type === 'ton') && (w.isActive !== false));
    
    if (!internalWallet) {
      await ctx.answerCallbackQuery({ text: 'Кошелек не найден' });
      await ctx.editMessageText('❌ Активный кошелек не найден. Откройте Mini App для создания кошелька.');
      return;
    }

    // В зависимости от провайдера показываем разные варианты
    if (provider === 'stars') {
      // Telegram Stars - создаем invoice
      await ctx.answerCallbackQuery({ text: 'Выберите сумму пополнения' });
      
      const amountKeyboard = new InlineKeyboard()
        .text('⭐ 1 Star (тест)', `deposit_amount:stars:1`)
        .row()
        .text('⭐ 10 Stars', `deposit_amount:stars:10`)
        .text('⭐ 50 Stars', `deposit_amount:stars:50`)
        .row()
        .text('⭐ 100 Stars', `deposit_amount:stars:100`)
        .text('⭐ 500 Stars', `deposit_amount:stars:500`)
        .row()
        .text('🔙 Назад', 'deposit:back');

      await ctx.editMessageText(
        '⭐ Пополнение через Telegram Stars\n\n' +
        'Выберите сумму пополнения:',
        {
          reply_markup: amountKeyboard,
        },
      );
    } else if (provider === 'telegram_wallet') {
      // Telegram Wallet - создаем invoice
      await ctx.answerCallbackQuery({ text: 'Выберите сумму пополнения' });
      
      const amountKeyboard = new InlineKeyboard()
        .text('💳 1 TON', `deposit_amount:telegram_wallet:1`)
        .text('💳 5 TON', `deposit_amount:telegram_wallet:5`)
        .row()
        .text('💳 10 TON', `deposit_amount:telegram_wallet:10`)
        .text('💳 50 TON', `deposit_amount:telegram_wallet:50`)
        .row()
        .text('🔙 Назад', 'deposit:back');

      await ctx.editMessageText(
        '💳 Пополнение через Telegram Wallet\n\n' +
        'Выберите сумму пополнения:',
        {
          reply_markup: amountKeyboard,
        },
      );
    } else if (provider === 'ton_wallet') {
      // TON Wallet - показываем адрес и QR код
      await ctx.answerCallbackQuery({ text: 'Получение адреса...' });
      
      // Для TON Wallet нужно выбрать сумму сначала
      const amountKeyboard = new InlineKeyboard()
        .text('💎 1 TON', `deposit_amount:ton_wallet:1`)
        .text('💎 5 TON', `deposit_amount:ton_wallet:5`)
        .row()
        .text('💎 10 TON', `deposit_amount:ton_wallet:10`)
        .text('💎 50 TON', `deposit_amount:ton_wallet:50`)
        .row()
        .text('🔙 Назад', 'deposit:back');

      await ctx.editMessageText(
        '💎 Пополнение через TON Wallet\n\n' +
        'Выберите сумму пополнения:',
        {
          reply_markup: amountKeyboard,
        },
      );
    }
  } catch (error: any) {
    console.error('Error in handleDepositProvider:', error);
    await ctx.answerCallbackQuery({ text: 'Ошибка: ' + (error.message || 'Неизвестная ошибка') });
  }
}

/**
 * Обработка выбора суммы пополнения
 */
export async function handleDepositAmount(
  ctx: Context,
  provider: string,
  amount: string,
) {
  try {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      await ctx.answerCallbackQuery({ text: 'Ошибка авторизации' });
      return;
    }

    // Маппинг провайдера
    const providerMap: Record<string, string> = {
      'stars': 'telegram_stars',
      'telegram_wallet': 'telegram_wallet',
      'ton_wallet': 'ton_wallet',
    };
    const mappedProvider = providerMap[provider] || provider;

    // Создаем платеж с выбранной суммой
    const paymentResult = await apiClient.createPayment({
      provider: mappedProvider,
      telegramId: telegramId,
      amount: parseFloat(amount),
      currency: provider === 'stars' ? 'XTR' : 'TON',
      description: `Пополнение баланса на ${amount} ${provider === 'stars' ? 'Stars' : 'TON'}`,
    });

    if (provider === 'stars') {
      // Telegram Stars - отправляем invoice через Telegram Bot API
      await ctx.answerCallbackQuery({ text: 'Создание счета...' });
      
      try {
        // Отправляем invoice для Telegram Stars
        // Grammy sendInvoice принимает параметры: chat_id, title, description, payload, currency, prices, other
        await ctx.api.sendInvoice(
          ctx.chat!.id,
          `Пополнение баланса на ${amount} Stars`,
          paymentResult.description || `Пополнение баланса на ${amount} Stars`,
          paymentResult.paymentId || paymentResult.transactionId,
          'XTR', // currency
          [
            {
              label: `${amount} Stars`,
              amount: parseInt(amount), // Stars указываются как целое число
            },
          ],
          {
            provider_token: '', // Для Stars не нужен
            provider_data: JSON.stringify({
              paymentId: paymentResult.paymentId,
              transactionId: paymentResult.transactionId,
              provider: 'telegram_stars',
            }),
          },
        );
        
        // Удаляем предыдущее сообщение (если возможно)
        try {
          await ctx.deleteMessage();
        } catch (e) {
          // Игнорируем ошибку, если сообщение уже удалено
        }
      } catch (error: any) {
        console.error('Error sending Stars invoice:', error);
        const errorMessage = error.message || 'Неизвестная ошибка';
        try {
          await ctx.editMessageText(
            `❌ Ошибка создания счета для Stars.\n\n` +
            `Ошибка: ${errorMessage}\n\n` +
            `Попробуйте позже или обратитесь в поддержку.`,
          );
        } catch (e) {
          // Если не удалось отредактировать, отправляем новое сообщение
          await ctx.reply(
            `❌ Ошибка создания счета для Stars.\n\n` +
            `Ошибка: ${errorMessage}`,
          );
        }
      }
    } else if (provider === 'telegram_wallet') {
      // Telegram Wallet - отправляем invoice через Telegram Bot API
      await ctx.answerCallbackQuery({ text: 'Создание счета...' });
      
      // Проверяем наличие provider_token
      const providerToken = process.env.TELEGRAM_WALLET_PROVIDER_TOKEN;
      if (!providerToken) {
        await ctx.editMessageText(
          '❌ Telegram Wallet недоступен.\n\n' +
          'Для использования Telegram Wallet необходимо настроить `TELEGRAM_WALLET_PROVIDER_TOKEN` в `.env` файле.\n\n' +
          'Получите токен у @BotFather, отправив команду `/newinvoice` или `/newpaymentprovider`.',
        );
        return;
      }
      
      try {
        // Отправляем invoice для Telegram Wallet
        // Grammy sendInvoice принимает параметры: chat_id, title, description, payload, currency, prices, other
        await ctx.api.sendInvoice(
          ctx.chat!.id,
          `Пополнение баланса на ${amount} TON`,
          paymentResult.description || `Пополнение баланса на ${amount} TON`,
          paymentResult.paymentId || paymentResult.transactionId,
          'TON', // currency
          [
            {
              label: `${amount} TON`,
              amount: Math.round(parseFloat(amount) * 1000000000), // TON в нанотонах (1 TON = 10^9 нанотонов)
            },
          ],
          {
            provider_token: providerToken,
          },
        );
        
        // Удаляем предыдущее сообщение (если возможно)
        try {
          await ctx.deleteMessage();
        } catch (e) {
          // Игнорируем ошибку, если сообщение уже удалено
        }
      } catch (error: any) {
        console.error('Error sending Telegram Wallet invoice:', error);
        const errorMessage = error.message || 'Неизвестная ошибка';
        try {
          await ctx.editMessageText(
            `❌ Ошибка создания счета для Telegram Wallet.\n\n` +
            `Ошибка: ${errorMessage}\n\n` +
            `Попробуйте позже или обратитесь в поддержку.`,
          );
        } catch (e) {
          // Если не удалось отредактировать, отправляем новое сообщение
          await ctx.reply(
            `❌ Ошибка создания счета для Telegram Wallet.\n\n` +
            `Ошибка: ${errorMessage}`,
          );
        }
      }
    } else if (provider === 'ton_wallet') {
      // TON Wallet - показываем адрес и deep link
      await ctx.answerCallbackQuery({ text: 'Получение адреса...' });
      
      if (paymentResult.deepLink && paymentResult.metadata?.walletAddress) {
        const walletAddress = paymentResult.metadata.walletAddress;
        const nanoAmount = paymentResult.metadata.nanoAmount || (parseFloat(amount) * 1000000000).toString();
        const description = encodeURIComponent(paymentResult.description || 'Payment');
        
        // Создаем несколько вариантов deep links для разных кошельков
        // Формат: https://my.tt/transfer/{address}?amount={nano}&text={text}
        const myTonWalletLink = `https://my.tt/transfer/${walletAddress}?amount=${nanoAmount}&text=${description}`;
        const tonhubLink = `https://tonhub.com/transfer/${walletAddress}?amount=${nanoAmount}&text=${description}`;
        const tonkeeperLink = `https://app.tonkeeper.com/transfer/${walletAddress}?amount=${nanoAmount}&text=${description}`;
        const tonTransferLink = `ton://transfer/${walletAddress}?amount=${nanoAmount}&text=${description}`;
        
        const keyboard = new InlineKeyboard()
          .url('💎 MyTonWallet', myTonWalletLink)
          .url('🌐 Tonhub', tonhubLink)
          .row()
          .url('🔷 Tonkeeper', tonkeeperLink)
          .url('📱 TON Wallet', tonTransferLink)
          .row()
          .text('📋 Скопировать адрес', `copy_address:${walletAddress}`)
          .row()
          .text('🔙 Назад', 'deposit:back');

        await ctx.editMessageText(
          `💎 Пополнение на ${amount} TON\n\n` +
          `📱 Нажмите кнопку ниже, чтобы открыть TON Wallet и отправить средства.\n\n` +
          `💰 Адрес кошелька:\n` +
          `\`${walletAddress}\`\n\n` +
          `💵 Сумма: ${amount} TON (${nanoAmount} нанотонов)\n\n` +
          `💡 После отправки средств баланс обновится автоматически.\n` +
          `⏱ Срок действия: 15 минут`,
          {
            reply_markup: keyboard,
            parse_mode: 'Markdown',
          },
        );
      } else {
        await ctx.editMessageText('❌ Ошибка создания платежа. Адрес кошелька не найден. Попробуйте позже.');
      }
    }
  } catch (error: any) {
    console.error('Error in handleDepositAmount:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
    await ctx.answerCallbackQuery({ text: 'Ошибка: ' + errorMessage });
    await ctx.editMessageText(`❌ Ошибка: ${errorMessage}`);
  }
}

