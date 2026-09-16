export interface OtpSession {
  token: string;
  mobile: string;
  code: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  lastResentAt: number;
  verified: boolean;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  code?: 'INVALID_OTP' | 'EXPIRED_OTP' | 'TOO_MANY_ATTEMPTS' | 'SESSION_NOT_FOUND';
}

export class OtpStore {
  private sessions: Map<string, OtpSession> = new Map();
  private readonly defaultExpiryMs = 10 * 60 * 1000; // 10 minutes
  private readonly resendCooldownMs = 30 * 1000; // 30 seconds
  private readonly maxAttemptsAllowed = 5;

  public createOrResendOtp(token: string, mobile: string): { code: string; cooldownSeconds: number } {
    const cleanMobile = mobile.replace(/\D/g, '');
    const now = Date.now();
    const existing = this.sessions.get(token);

    if (existing && now - existing.lastResentAt < this.resendCooldownMs) {
      const waitRemaining = Math.ceil(
        (this.resendCooldownMs - (now - existing.lastResentAt)) / 1000
      );
      throw new Error(`Please wait ${waitRemaining}s before requesting a new verification code.`);
    }

    // Generate random 6-digit OTP
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    const session: OtpSession = {
      token,
      mobile: cleanMobile,
      code: generatedCode,
      attempts: 0,
      maxAttempts: this.maxAttemptsAllowed,
      createdAt: now,
      expiresAt: now + this.defaultExpiryMs,
      lastResentAt: now,
      verified: false,
    };

    this.sessions.set(token, session);

    console.log(
      `[OTP Engine] 📱 Generated verification code for token=${token} (mobile=${cleanMobile}): ${generatedCode}`
    );

    return { code: generatedCode, cooldownSeconds: 30 };
  }

  public verifyOtp(token: string, inputOtp: string): VerifyOtpResult {
    const session = this.sessions.get(token);
    const cleanCode = (inputOtp || '').trim();

    if (!session) {
      return {
        success: false,
        error: 'No active OTP session found. Please request a new code.',
        code: 'SESSION_NOT_FOUND',
      };
    }

    if (Date.now() > session.expiresAt) {
      return {
        success: false,
        error: 'Verification code has expired. Please click Resend Code.',
        code: 'EXPIRED_OTP',
      };
    }

    if (session.attempts >= session.maxAttempts) {
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a fresh OTP.',
        code: 'TOO_MANY_ATTEMPTS',
      };
    }

    if (session.code !== cleanCode) {
      session.attempts += 1;
      const attemptsRemaining = session.maxAttempts - session.attempts;
      return {
        success: false,
        error: `Incorrect verification code. ${attemptsRemaining} attempts remaining.`,
        code: 'INVALID_OTP',
      };
    }

    session.verified = true;
    return { success: true };
  }

  public getSession(token: string): OtpSession | undefined {
    return this.sessions.get(token);
  }
}

export const otpStore = new OtpStore();
