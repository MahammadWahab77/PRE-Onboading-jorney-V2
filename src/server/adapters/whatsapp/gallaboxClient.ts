export interface SendWhatsappOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GallaboxClient {
  private apiKey: string;
  private apiSecret: string;
  private channelId: string;
  private accountId: string;
  private baseUrl = 'https://server.gallabox.com/devapi';

  constructor() {
    this.apiKey = process.env.GALLABOX_API_KEY || '6a9e4e474e805f6c09ee72bc';
    this.apiSecret = process.env.GALLABOX_API_SECRET || '696bc82554cb408e96c12573cff8f9ef';
    this.channelId = process.env.GALLABOX_CHANNEL_ID || '691aab4f5e17927ecf92ff4a';
    this.accountId = process.env.GALLABOX_ACCOUNT_ID || '691456b958a96bd1e1b3c36b';
  }

  /**
   * Format phone number with country code (defaults to 91 for 10-digit Indian numbers)
   */
  public formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  }

  /**
   * Sends a WhatsApp OTP verification code via Gallabox API
   */
  public async sendOtp(
    phone: string,
    otpCode: string,
    recipientName?: string
  ): Promise<SendWhatsappOtpResult> {
    const formattedPhone = this.formatPhoneNumber(phone);

    if (!this.apiKey || !this.apiSecret) {
      console.warn('[Gallabox] Missing API credentials. WhatsApp OTP not sent.');
      return { success: false, error: 'Gallabox API credentials not configured' };
    }

    // 1. Primary: Use approved UTILITY WhatsApp template (bypasses Meta marketing frequency caps)
    const templatePayload = {
      channelId: this.channelId,
      channelType: 'whatsapp',
      recipient: {
        name: recipientName || 'Learner',
        phone: formattedPhone,
      },
      whatsapp: {
        type: 'template',
        template: {
          templateName: 'follow_up_msg_2',
          bodyValues: {
            name: recipientName || 'Learner',
            Learning_percent: `OTP ${otpCode} (Valid for 10 minutes)`,
          },
        },
      },
    };

    try {
      console.log(`[Gallabox] 📲 Sending WhatsApp OTP via approved template to +${formattedPhone}...`);
      const response = await fetch(`${this.baseUrl}/messages/whatsapp`, {
        method: 'POST',
        headers: {
          apiKey: this.apiKey,
          apiSecret: this.apiSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templatePayload),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'FAILED') {
        const errorMsg = data.message || `HTTP ${response.status} from Gallabox`;
        console.error('[Gallabox] Error dispatching template message:', errorMsg, data);
        return { success: false, error: errorMsg };
      }

      console.log(`[Gallabox] ✅ WhatsApp template message dispatched successfully. ID: ${data.id}`);
      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      console.error('[Gallabox] Network exception sending WhatsApp:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export const gallaboxClient = new GallaboxClient();
