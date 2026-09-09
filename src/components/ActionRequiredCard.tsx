import React from 'react';
import { AlertTriangle, ArrowRight, FileText, RefreshCw } from 'lucide-react';

interface ActionRequiredCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: string;
  requestedDocuments?: string[];
  onAction?: () => void;
  isLoading?: boolean;
}

export const ActionRequiredCard: React.FC<ActionRequiredCardProps> = ({
  title,
  description,
  actionLabel = 'Resolve & Re-Submit',
  requestedDocuments = [],
  onAction,
  isLoading = false,
}) => {
  return (
    <div className="w-full bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs mb-6 text-left">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/60 px-2 py-0.5 rounded-md border border-amber-300">
            Action Required
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 mb-1">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
            {description}
          </p>

          {requestedDocuments.length > 0 && (
            <div className="bg-white/80 border border-amber-200 rounded-xl p-3 mb-4 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Required Document(s):
              </span>
              <ul className="space-y-1">
                {requestedDocuments.map((doc, idx) => (
                  <li key={idx} className="text-xs text-slate-800 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-medium">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onAction && (
            <button
              type="button"
              onClick={onAction}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{actionLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
