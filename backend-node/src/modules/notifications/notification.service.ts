/**
 * Notification Service - Twilio SMS/WhatsApp integration
 */

import { config } from '../../config/index.js';

interface TwilioMessageResponse {
  sid: string;
  status: string;
}

let twilioClient: {
  messages: {
    create: (params: {
      body: string;
      from: string;
      to: string;
    }) => Promise<TwilioMessageResponse>;
  };
} | null = null;

// Initialize Twilio client if credentials are configured
async function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
    try {
      // Dynamic import to avoid issues if twilio is not installed
      const twilio = await import('twilio');
      twilioClient = twilio.default(
        config.TWILIO_ACCOUNT_SID,
        config.TWILIO_AUTH_TOKEN
      );
      console.log('[Notifications] Twilio client initialized');
      return twilioClient;
    } catch (error) {
      console.error('[Notifications] Failed to initialize Twilio:', error);
      return null;
    }
  }

  console.log('[Notifications] Twilio credentials not configured');
  return null;
}

export async function sendSMS(to: string, message: string): Promise<TwilioMessageResponse | null> {
  const client = await getTwilioClient();

  if (!client || !config.TWILIO_PHONE_NUMBER) {
    console.log(`[Notifications] SMS (simulated) to ${to}: ${message}`);
    return { sid: 'simulated', status: 'sent' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: config.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log(`[Notifications] SMS sent to ${to}, SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`[Notifications] Failed to send SMS to ${to}:`, error);
    throw error;
  }
}

export async function sendWhatsApp(to: string, message: string): Promise<TwilioMessageResponse | null> {
  const client = await getTwilioClient();

  if (!client || !config.TWILIO_WHATSAPP_NUMBER) {
    console.log(`[Notifications] WhatsApp (simulated) to ${to}: ${message}`);
    return { sid: 'simulated', status: 'sent' };
  }

  try {
    // Ensure the number starts with "whatsapp:"
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = config.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? config.TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${config.TWILIO_WHATSAPP_NUMBER}`;

    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
    });

    console.log(`[Notifications] WhatsApp sent to ${to}, SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`[Notifications] Failed to send WhatsApp to ${to}:`, error);
    throw error;
  }
}
