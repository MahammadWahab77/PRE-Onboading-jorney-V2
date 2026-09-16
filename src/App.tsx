import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  PortalRoute,
  EnrollmentState,
  PaymentMethodType,
  EnrollmentJourney,
} from './types';
import { NxtWaveHeader } from './components/NxtWaveHeader';
import { ProgressIndicator } from './components/ProgressIndicator';
import { AuthPage } from './components/pages/AuthPage';
import { CongratulationsPage } from './components/pages/CongratulationsPage';
import { ProgramSummaryPage } from './components/pages/ProgramSummaryPage';
import { PaymentMethodPage } from './components/pages/PaymentMethodPage';
import { PaymentLinkPage } from './components/pages/PaymentLinkPage';
import { PaymentSuccessPage } from './components/pages/PaymentSuccessPage';
import { WhyNoCostEmiPage } from './components/pages/WhyNoCostEmiPage';
import { CoApplicantPage } from './components/pages/CoApplicantPage';
import { KycPage } from './components/pages/KycPage';
import { NbfcStatusPage } from './components/pages/NbfcStatusPage';
import { ClassAccessPage } from './components/pages/ClassAccessPage';
import { SupportModal } from './components/SupportModal';
import { VoiceAgent } from './components/VoiceAgent';
import { AdminPortal } from './components/admin/AdminPortal';

const DEFAULT_TOKEN = '';

const initialEnrollmentState: EnrollmentState = {
  journeyId: '',
  token: '',
  learner: {
    name: '',
    mobileMasked: '',
    emailMasked: '',
  },
  program: {
    name: 'NxtWave Program',
    price: 0,
    amountPayable: 0,
  },
  payment: {
    selectedMethod: null,
    status: 'NOT_STARTED',
    amountPaid: 0,
  },
  emi: {
    selected: false,
    amount: 0,
    tenure: '6 Months',
  },
  coApplicant: {
    exists: false,
    name: '',
    relation: '',
    mobileMasked: '',
  },
  kyc: {
    status: 'NOT_STARTED',
    appointment: null,
  },
  financing: {
    applicationId: '',
    lenderName: '',
    status: 'NOT_STARTED',
    appliedAmount: 0,
    approvedAmount: 0,
  },
  isAuthenticated: false,
};

// Normalize recommendedRoute from backend to PortalRoute
function normalizeRoute(routeStr?: string): PortalRoute {
  if (!routeStr) return 'auth';
  const clean = routeStr.replace(/^\//, '');
  switch (clean) {
    case 'auth':
      return 'auth';
    case 'program-summary':
    case 'program':
      return 'program';
    case 'congratulations':
      return 'congratulations';
    case 'payment-options':
    case 'payment':
      return 'payment';
    case 'pay':
      return 'pay';
    case 'emi':
      return 'emi';
    case 'co-applicant':
      return 'co-applicant';
    case 'kyc':
    case 'kyc-slot':
    case 'kyc-readiness':
    case 'kyc-confirmation':
      return 'kyc';
    case 'nbfc-status':
      return 'nbfc-status';
    case 'class-access':
    case 'payment-success':
      return 'class-access';
    default:
      return 'program';
  }
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    window.location.pathname.startsWith('/admin')
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<EnrollmentState>(initialEnrollmentState);
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>('auth');
  const [token, setToken] = useState<string>(DEFAULT_TOKEN);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  if (isAdminRoute) {
    return <AdminPortal />;
  }

  // Parse path & token from current URL
  const parsePath = useCallback(() => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);

    let extractedToken = '';
    let extractedRoute: PortalRoute | null = null;

    if (parts[0] === 'enrollment' && parts[1]) {
      extractedToken = parts[1];
      if (parts[2]) {
        extractedRoute = normalizeRoute(parts[2]);
      }
    }

    return { token: extractedToken, route: extractedRoute };
  }, []);

  // Update browser URL without refreshing and sync stage to Salesforce
  const navigateTo = useCallback(
    (newRoute: PortalRoute) => {
      setCurrentRoute(newRoute);
      const currentToken = token || parsePath().token;
      if (currentToken) {
        try {
          localStorage.setItem(`nw_pre_route_${currentToken}`, newRoute);
        } catch {}

        if (newRoute !== 'auth') {
          fetch(`/api/enrollment/${currentToken}/stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: newRoute }),
          }).catch((err) => console.warn('Stage sync error:', err));
        }

        const newPath = `/enrollment/${currentToken}/${newRoute}`;
        if (window.location.pathname !== newPath) {
          window.history.pushState(null, '', newPath);
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [token, parsePath]
  );

  // Helper to merge canonical journey into enrollment state
  const applyCanonicalJourney = useCallback((raw: any) => {
    if (!raw) return;
    // Normalize if wrapped in { success: true, journey: ... } or direct journey
    const journey: EnrollmentJourney = raw.journey && !raw.learner ? raw.journey : raw;
    if (!journey) return;

    const isAuthed = Boolean(journey.authenticated ?? journey.authentication?.verified);
    setState((prev) => ({
      ...prev,
      canonicalJourney: journey,
      isAuthenticated: isAuthed,
      learner: {
        ...prev.learner,
        name: journey.learner?.name ?? prev.learner?.name ?? 'Learner',
        mobileMasked: journey.learner?.mobileMasked ?? prev.learner?.mobileMasked ?? '',
        emailMasked: journey.learner?.emailMasked ?? prev.learner?.emailMasked ?? '',
        preferredLanguage: journey.learner?.preferredLanguage ?? prev.learner?.preferredLanguage ?? 'English',
      },
      program: {
        ...prev.program,
        name: journey.program?.name ?? prev.program?.name ?? 'NxtWave Program',
        price: journey.program?.amountPayable ?? prev.program?.price ?? 112000,
        amountPayable: journey.program?.amountPayable ?? prev.program?.amountPayable ?? 112000,
      },
      payment: {
        ...prev.payment,
        status: journey.payment?.status ?? prev.payment?.status ?? 'NOT_STARTED',
        amountPaid: journey.payment?.amountPaid ?? prev.payment?.amountPaid ?? 0,
        receiptId: journey.payment?.receiptId ?? prev.payment?.receiptId,
        selectedMethod:
          journey.financing && journey.financing.status !== 'NOT_STARTED'
            ? 'NO_COST_EMI'
            : prev.payment?.selectedMethod ?? 'FULL_PAYMENT',
      },
      coApplicant: {
        exists: !!(journey.coApplicant?.name || journey.financing?.coApplicantName),
        name: journey.coApplicant?.name || journey.financing?.coApplicantName || '',
        relation: journey.coApplicant?.relation || journey.financing?.coApplicantRelationship || 'Parent',
        mobileMasked: journey.coApplicant?.mobileMasked || journey.financing?.coApplicantPhone || '',
      },
      kyc: {
        status: journey.kyc?.status ?? prev.kyc?.status ?? 'NOT_STARTED',
        appointment: null,
      },
      financing: {
        applicationId: journey.financing?.applicationId || 'N/A',
        lenderName: journey.financing?.lenderName || journey.financing?.nbfcName || 'Northern Arc',
        status: journey.financing?.status || 'NOT_STARTED',
        appliedAmount: journey.financing?.appliedAmount || 0,
        approvedAmount: journey.financing?.approvedAmount || 0,
        rejectionReason: journey.financing?.rejectionReason,
      },
    }));
  }, []);

  // Initial Bootstrap: query /api/enrollment/:token/journey (Salesforce-authoritative)
  useEffect(() => {
    const { token: parsedToken, route: parsedRoute } = parsePath();
    setToken(parsedToken);

    const bootstrap = async () => {
      if (!parsedToken) {
        setIsInitializing(false);
        setCurrentRoute('auth');
        return;
      }

      try {
        const res = await fetch(`/api/enrollment/${parsedToken}/journey`);
        if (!res.ok) {
          // Token does not exist or expired
          setCurrentRoute('auth');
          return;
        }

        const data = await res.json();

        if (data && (data.journey || data.learner)) {
          const canonical: EnrollmentJourney = data.journey || data;
          applyCanonicalJourney(canonical);

          const isAuthed = Boolean(canonical.authenticated ?? canonical.authentication?.verified);
          const serverRoute = normalizeRoute(canonical.journey?.recommendedRoute);

          if (!isAuthed) {
            setCurrentRoute('auth');
            if (window.location.pathname !== `/enrollment/${parsedToken}/auth`) {
              window.history.replaceState(null, '', `/enrollment/${parsedToken}/auth`);
            }
          } else {
            const routeToStepIndex: Record<string, number> = {
              auth: 1,
              program: 2,
              congratulations: 2,
              pay: 3,
              payment: 3,
              emi: 3,
              'co-applicant': 4,
              kyc: 5,
              'nbfc-status': 6,
              'nbfc-review': 6,
              'class-access': 7,
              'payment-success': 7,
            };

            const serverIndex = routeToStepIndex[serverRoute] || 1;
            const requestedIndex = parsedRoute ? (routeToStepIndex[parsedRoute] || 1) : 1;
            const isClassUnlocked = canonical.classAccess?.status === 'ACTIVE';

            let targetRoute = serverRoute;

            // Route Guard: Prevent jumping to class-access if locked, or regressing behind server step
            if (parsedRoute && parsedRoute !== 'auth' && requestedIndex >= serverIndex) {
              if (parsedRoute === 'class-access' && !isClassUnlocked) {
                console.log(
                  `[EnrollmentSync] 🛡️ Route Guard: Class access is locked. Redirecting from '/class-access' to authoritative stage '${serverRoute}'.`
                );
                targetRoute = serverRoute;
              } else {
                targetRoute = parsedRoute;
              }
            } else {
              if (parsedRoute && requestedIndex < serverIndex) {
                console.log(
                  `[EnrollmentSync] 🛡️ Route Guard auto-redirect: URL route '${parsedRoute}' (step #${requestedIndex}) regressed behind Salesforce stage route '${serverRoute}' (step #${serverIndex}). Redirecting to '${serverRoute}'.`
                );
              }
              targetRoute = serverRoute;
            }

            setCurrentRoute(targetRoute);
            if (window.location.pathname !== `/enrollment/${parsedToken}/${targetRoute}`) {
              window.history.replaceState(null, '', `/enrollment/${parsedToken}/${targetRoute}`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to bootstrap enrollment journey:', err);
        setCurrentRoute('auth');
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();
  }, [applyCanonicalJourney, parsePath]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { route: poppedRoute } = parsePath();
      if (!state.isAuthenticated && poppedRoute !== 'auth') {
        setCurrentRoute('auth');
      } else if (poppedRoute) {
        setCurrentRoute(poppedRoute);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parsePath, state.isAuthenticated]);

  // -------------------------------------------------------------
  // Route Navigation & State Handlers
  // -------------------------------------------------------------
  const handleAuthSuccess = (payload: any) => {
    let nextRoute: PortalRoute = 'program';
    let resolvedToken = token;

    if (payload && typeof payload === 'object') {
      applyCanonicalJourney(payload);
      setState((prev) => ({ ...prev, isAuthenticated: true }));

      resolvedToken =
        payload.journeyId ||
        payload.token ||
        payload.journey?.journeyId ||
        payload.journey?.token ||
        token ||
        parsePath().token;

      if (resolvedToken && resolvedToken !== token) {
        setToken(resolvedToken);
      }

      const recommended =
        payload.journey?.journey?.recommendedRoute ||
        payload.journey?.recommendedRoute ||
        payload.recommendedRoute ||
        payload.targetRoute;

      if (recommended && recommended !== 'auth') {
        nextRoute = normalizeRoute(recommended);
      }
    } else {
      const name = typeof payload === 'string' ? payload : 'Learner';
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        learner: {
          ...prev.learner,
          name,
        },
      }));
    }

    const currentToken = resolvedToken || token || parsePath().token;
    if (currentToken) {
      // Overwrite stale localStorage with the fresh authoritative Salesforce route
      try {
        localStorage.setItem(`nw_pre_route_${currentToken}`, nextRoute);
      } catch {}

      // Update state and URL
      setCurrentRoute(nextRoute);
      const newPath = `/enrollment/${currentToken}/${nextRoute}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigateTo(nextRoute);
  };

  const handleSelectPaymentMethod = (method: PaymentMethodType) => {
    setState((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        selectedMethod: method,
      },
      emi: {
        ...prev.emi,
        selected: method === 'NO_COST_EMI',
      },
    }));

    if (method === 'NO_COST_EMI') {
      navigateTo('emi');
    } else {
      navigateTo('pay');
    }
  };

  const handlePaymentSuccess = (
    receiptId: string,
    amount: number,
    paidAt: string
  ) => {
    setState((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        status: 'SUCCESS',
        amountPaid: amount,
        receiptId,
        paidAt,
      },
    }));
    navigateTo('class-access');
  };

  const handleCoApplicantSaved = (coApplicantData: any) => {
    if (coApplicantData?.journey || coApplicantData?.learner) {
      applyCanonicalJourney(coApplicantData);
    } else {
      setState((prev) => ({
        ...prev,
        coApplicant: {
          exists: true,
          name: coApplicantData?.name || '',
          relation: coApplicantData?.relation || 'Parent',
          mobileMasked: coApplicantData?.mobile
            ? `${coApplicantData.mobile.slice(0, 2)}•••••${coApplicantData.mobile.slice(-3)}`
            : prev.coApplicant.mobileMasked,
        },
      }));
    }
    navigateTo('kyc');
  };

  const handleJourneyUpdated = (journey: EnrollmentJourney) => {
    applyCanonicalJourney(journey);
    const recRoute = normalizeRoute(journey.journey.recommendedRoute);
    navigateTo(recRoute);
  };

  const handleResetSession = () => {
    setCurrentRoute('auth');
    window.location.reload();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-[#0B63E5] animate-pulse mb-4">
          <div className="w-6 h-6 rounded-full border-3 border-[#0B63E5] border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#0A192F]">
          Loading enrollment status...
        </p>
        <span className="text-xs text-slate-400 mt-1">
          Fetching active Salesforce journey status
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* NxtWave Portal Header */}
      <NxtWaveHeader
        currentRoute={currentRoute}
        learnerName={state.learner?.name || 'Learner'}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Progress Indicator */}
      <ProgressIndicator
        currentRoute={currentRoute}
        paymentMethod={state.payment.selectedMethod}
      />

      {/* Main Page Canvas with Smooth 250-400ms Transitions */}
      <main className="flex-1 flex flex-col justify-center py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {currentRoute === 'auth' && (
            <motion.div
              key="auth"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AuthPage
                state={state}
                token={token}
                onSuccess={handleAuthSuccess}
                onTokenResolved={(resolvedToken) => setToken(resolvedToken)}
              />
            </motion.div>
          )}

          {currentRoute === 'congratulations' && (
            <motion.div
              key="congratulations"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CongratulationsPage
                state={state}
                onNext={() => navigateTo('program')}
              />
            </motion.div>
          )}

          {currentRoute === 'program' && (
            <motion.div
              key="program"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProgramSummaryPage
                state={state}
                onNext={() => navigateTo('payment')}
                onBack={() => navigateTo('congratulations')}
              />
            </motion.div>
          )}

          {currentRoute === 'payment' && (
            <motion.div
              key="payment"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentMethodPage
                state={state}
                token={token}
                onSelectMethod={handleSelectPaymentMethod}
                onBack={() => navigateTo('program')}
              />
            </motion.div>
          )}

          {currentRoute === 'pay' && (
            <motion.div
              key="pay"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentLinkPage
                state={state}
                token={token}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => navigateTo('payment')}
              />
            </motion.div>
          )}

          {currentRoute === 'payment-success' && (
            <motion.div
              key="payment-success"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PaymentSuccessPage
                state={state}
                onDone={() => navigateTo('class-access')}
              />
            </motion.div>
          )}

          {currentRoute === 'emi' && (
            <motion.div
              key="emi"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <WhyNoCostEmiPage
                state={state}
                onContinue={() => navigateTo('co-applicant')}
                onBack={() => navigateTo('payment')}
              />
            </motion.div>
          )}

          {currentRoute === 'co-applicant' && (
            <motion.div
              key="co-applicant"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CoApplicantPage
                state={state}
                token={token}
                onSuccess={handleCoApplicantSaved}
                onBack={() => navigateTo('emi')}
              />
            </motion.div>
          )}

          {currentRoute === 'kyc' && (
            <motion.div
              key="kyc"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <KycPage
                state={state}
                token={token}
                onUpdateJourney={handleJourneyUpdated}
                onContinue={() => navigateTo('nbfc-status')}
                onBack={() => navigateTo('co-applicant')}
                onSwitchToDirectPay={() => navigateTo('payment')}
                onSwitchCoApplicant={() => navigateTo('co-applicant')}
              />
            </motion.div>
          )}

          {currentRoute === 'nbfc-status' && (
            <motion.div
              key="nbfc-status"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NbfcStatusPage
                state={state}
                token={token}
                onUpdateJourney={handleJourneyUpdated}
                onComplete={() => navigateTo('class-access')}
                onBack={() => navigateTo('kyc')}
                onSwitchCoApplicant={() => navigateTo('co-applicant')}
                onSwitchToDirectPay={() => navigateTo('payment')}
              />
            </motion.div>
          )}

          {currentRoute === 'class-access' && (
            <motion.div
              key="class-access"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClassAccessPage
                state={state}
                token={token}
                onResetSession={handleResetSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Voice Agent Guide for Every Step */}
      <VoiceAgent currentRoute={currentRoute} state={state} />

      {/* Counselor Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        learnerName={state.learner?.name || 'Learner'}
      />

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} NxtWave Disruptive Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Privacy Protected</span>
            <span>•</span>
            <span>256-bit SSL Secure</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              className="hover:text-[#0B63E5] underline hover:no-underline cursor-pointer"
            >
              Support Helpline
            </button>
            <span>•</span>
            <a
              href="/admin"
              className="hover:text-[#0B63E5] underline hover:no-underline cursor-pointer font-medium"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
