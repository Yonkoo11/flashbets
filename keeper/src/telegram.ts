import { TELEGRAM_BOT, TELEGRAM_CHAT } from './config'

export async function notify(msg: string) {
  if (!TELEGRAM_BOT || !TELEGRAM_CHAT) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: `[FlashBets Keeper] ${msg}`, parse_mode: 'Markdown' }),
    })
  } catch { /* non-fatal */ }
}
