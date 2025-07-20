// src/lib/telegram.ts
'use server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramReminder(message: string): Promise<any> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Telegram Bot Token or Chat ID is not configured.');
    // Silently fail in production if not configured
    return Promise.resolve({ ok: false, error: 'Not configured' });
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send Telegram message:', errorData);
        return errorData;
    }
    
    return await response.json();

  } catch (error) {
    console.error('Error sending Telegram reminder:', error);
    return Promise.resolve({ ok: false, error: 'Fetch failed' });
  }
}
