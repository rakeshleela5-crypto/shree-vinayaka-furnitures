interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALERT_WEBHOOK_URL?: string;
}

/**
 * Cloudflare Pages Function — Real-Time Telemetry & Dead-Letter Alert Dispatcher
 * Route: POST /api/telemetry/alert & POST /api/v1/telemetry/dead-letter
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const alertData = await context.request.json() as any;
    const { terminalId, eventType, severity, reference, reason, timestamp } = alertData || {};

    const formattedMessage = [
      `🚨 *[SVF ERP TELEMETRY ALERT]*`,
      `*Severity:* \`${severity || 'ERROR'}\``,
      `*Event:* \`${eventType || 'GENERIC'}\``,
      `*Terminal ID:* \`${terminalId || 'UNKNOWN'}\``,
      reference ? `*Reference:* \`${reference}\`` : null,
      `*Reason:* ${reason || 'No description provided'}`,
      `*Time:* \`${timestamp || new Date().toISOString()}\``
    ].filter(Boolean).join('\n');

    let telegramSent = false;
    let webhookSent = false;

    // 1. Dispatch to Telegram if bot token and chat ID are configured in Cloudflare environment
    if (context.env.TELEGRAM_BOT_TOKEN && context.env.TELEGRAM_CHAT_ID) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: context.env.TELEGRAM_CHAT_ID,
            text: formattedMessage,
            parse_mode: 'Markdown'
          })
        });
        telegramSent = tgRes.ok;
      } catch (tgErr) {
        console.warn('[Telemetry Alert] Telegram dispatch error:', tgErr);
      }
    }

    // 2. Dispatch to custom alert webhook (Slack / WhatsApp Gateway / Discord)
    if (context.env.ALERT_WEBHOOK_URL) {
      try {
        const hookRes = await fetch(context.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: formattedMessage,
            alertData
          })
        });
        webhookSent = hookRes.ok;
      } catch (hookErr) {
        console.warn('[Telemetry Alert] Webhook dispatch error:', hookErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      delivered: { telegram: telegramSent, webhook: webhookSent },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'Failed to process alert'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
