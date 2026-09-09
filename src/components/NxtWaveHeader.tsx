import React from 'react';
import { ShieldCheck, PhoneCall, Sparkles } from 'lucide-react';
import type { PortalRoute } from '../types';

interface HeaderProps {
  currentRoute: PortalRoute;
  learnerName?: string;
  onOpenSupport?: () => void;
}

export const NxtWaveHeader: React.FC<HeaderProps> = ({
  currentRoute,
  learnerName,
  onOpenSupport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* NxtWave Brand Identity */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-95"
            aria-label="NxtWave Academy Portal"
          >
            <img
              id="nxtwave-academy-header-logo"
              src="/assets/nxtwave_academy_logo.png"
              alt="NXT WAVE ACADEMY"
              className="h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[190px] object-contain select-none"
              referrerPolicy="no-referrer"
            />
          </a>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Enrollment Portal
          </span>
        </div>

        {/* Right Info: Security & Support */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Official Portal</span>
          </div>

          {onOpenSupport && (
            <button
              id="header-support-btn"
              type="button"
              onClick={onOpenSupport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0B63E5] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Counselor Support</span>
              <span className="sm:hidden">Help</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
