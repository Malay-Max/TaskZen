
'use server';

import { sendTelegramReminder } from '@/lib/telegram';
import { useToast } from "@/hooks/use-toast";


export async function sendTestTelegramMessage() {
  try {
    const result = await sendTelegramReminder('✅ This is a test message from TaskZen. Your Telegram integration is working!');
    
    // The Telegram API returns `{ ok: true, ... }` on success.
    if (result && result.ok) {
      return { success: true, message: 'Test message sent successfully!' };
    } else {
      // Log the actual error from Telegram for debugging
      console.error('Telegram API error:', result);
      return { 
        success: false, 
        message: `Failed to send message: ${result.description || 'Check server logs for details.'}` 
      };
    }
  } catch (error) {
    console.error('Failed to send test Telegram message:', error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred. Check your environment variables and server logs.' };
  }
}
