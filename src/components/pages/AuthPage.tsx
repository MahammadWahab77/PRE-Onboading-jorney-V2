import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  Phone,
  Lock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { EnrollmentState, EnrollmentJourney } from '../../types';
import { resolveOnboarding } from '../../services/onboardingApi';
import { normalizeIndianPhone } from '../../server/domain/phoneNormalizer';

interface AuthPageProps {
  state: EnrollmentState;
  token: string;
  onSuccess: (journey: EnrollmentJourney) => void;
  onTokenResolved?: (resolvedToken: string) => void;
  onApiError?: (msg: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ state, token, onSuccess, onTokenResolved }) => {
  const prefersReducedMotion = useReducedMotion();

  // Stage 1: Mobile entry; Stage 2: OTP verification
  const [stage, setStage] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [maskedMobile, setMaskedMobile] = useState<string>('');
  const [activeToken, setActiveToken] = useState<string>(token);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // OTP inputs state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendSuccess, setResendSuccess] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  useEffect(() => {
    if (stage !== 'OTP' || resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, resendCountdown]);

  // Stage 1 submit: Resolve active Salesforce record & Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeIndianPhone(mobileNumber);
    if (!clean) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Resolve Salesforce Active Record & Target Journey
      const resolved = await resolveOnboarding(clean);
      const resolvedRecordId = resolved.salesforce?.recordId;

      if (!resolvedRecordId) {
        setErrorMessage('Unable to find active enrollment for this mobile number. Please contact your admissions counselor.');
        return;
      }

      setActiveToken(resolvedRecordId);
      if (onTokenResolved) {
        onTokenResolved(resolvedRecordId);
      }

      // 2. Dispatch OTP for this authoritative record
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: clean, token: resolvedRecordId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to dispatch verification code. Please try again.');
        return;
      }

      setMaskedMobile(data.maskedMobile || resolved.student?.maskedPhone || `+91 ${clean.slice(0, 2)}•••••${clean.slice(-3)}`);
      setResendCountdown(data.cooldownSeconds || 30);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStage('OTP');
      // Pre-focus first box
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2 OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleanValue.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < cleanValue.length && index + i < 6; i++) {
        newOtp[index + i] = cleanValue[i];
      }
      setOtp(newOtp);
      setErrorMessage(null);
      const nextFocus = Math.min(index + cleanValue.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const char = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setErrorMessage(null);

    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, overrideOtp?: string) => {
    if (e) e.preventDefault();
    const enteredOtp = overrideOtp || otp.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeToken, otp: enteredOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Verification failed. Please check the code.');
        return;
      }

      onSuccess(data.journey);
    } catch {
      setErrorMessage('Network issue during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const clean = mobileNumber.replace(/\D/g, '');
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: clean, token: activeToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to resend code');
        return;
      }
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setResendCountdown(30);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch {
      setErrorMessage('Failed to resend OTP. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 relative"
      >
        {/* Security Trust Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B63E5] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            NxtWave Secure Identity Access
          </span>
        </div>

        {stage === 'MOBILE' ? (
          /* ========================================================
             STAGE 1: Enter Registered Mobile Number
             ======================================================== */
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
              Continue your NxtWave enrollment
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Enter your 10-digit registered mobile number to securely access your reserved seat and program details.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="mobile-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Registered Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-slate-600 font-semibold text-sm select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                    <span className="text-slate-300">|</span>
                  </div>
                  <input
                    id="mobile-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, ''));
                      setErrorMessage(null);
                    }}
                    placeholder="98765 43210"
                    className="w-full pl-20 pr-4 py-3 rounded-xl border border-slate-300 focus:border-[#0B63E5] focus:ring-3 focus:ring-blue-100 font-mono text-base font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                id="btn-send-otp"
                type="submit"
                disabled={isLoading || mobileNumber.length !== 10}
                className="w-full py-3 px-4 rounded-xl bg-[#0B63E5] hover:bg-blue-600 active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Enrollment...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================
             STAGE 2: Verify 6-digit OTP
             ======================================================== */
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mb-2">
              Verify your mobile
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              We sent a 6-digit verification code to:{' '}
              <strong className="text-slate-900 font-mono font-semibold">{maskedMobile}</strong>
            </p>

            {devOtp && (
              <div className="mb-5 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-950 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    OTP Code: <strong className="font-mono text-sm tracking-widest text-blue-700">{devOtp}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtp.split('');
                    setOtp(digits);
                    handleVerifyOtp(undefined, digits.join(''));
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6-box OTP input */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl font-bold rounded-xl border border-slate-300 focus:border-[#0B63E5] focus:ring-3 focus:ring-blue-100 outline-none text-[#0A192F] transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-end text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStage('MOBILE');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Change number
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resend success toast */}
              {resendSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center">
                  A fresh verification code was sent to your phone!
                </div>
              )}

              {/* Verify & Continue CTA */}
              <button
                id="btn-verify-otp"
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-[#0B63E5] hover:bg-blue-600 active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP countdown */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Didn’t get the code?</span>
              {resendCountdown > 0 ? (
                <span className="font-medium text-slate-400">
                  Resend in <strong className="text-slate-600">{resendCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-[#0B63E5] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
