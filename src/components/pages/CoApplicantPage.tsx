import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  GraduationCap,
  Users,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileCheck,
  Info,
  BadgePercent,
} from 'lucide-react';
import type { EnrollmentState } from '../../types';
import { CoApplicantVideoPlayer } from '../CoApplicantVideoPlayer';

interface CoApplicantPageProps {
  state: EnrollmentState;
  token: string;
  onSuccess: (data: any) => void;
  onBack: () => void;
}

export const CoApplicantPage: React.FC<CoApplicantPageProps> = ({
  state,
  token,
  onSuccess,
  onBack,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // 1. Relationship
  const [relation, setRelation] = useState<string>(
    state.coApplicant?.relation || 'Father'
  );
  const [otherRelation, setOtherRelation] = useState<string>('');

  // 2. Basic Details
  const [name, setName] = useState<string>(state.coApplicant?.name || 'Ramesh Kumar');
  const [mobile, setMobile] = useState<string>(
    state.coApplicant?.mobileMasked?.replace(/\D/g, '').length === 10
      ? state.coApplicant.mobileMasked.replace(/\D/g, '')
      : '9848012345'
  );
  const [age, setAge] = useState<string>('48');

  // 3. Professional & Financial Profile
  const [employmentType, setEmploymentType] = useState<string>('Salaried');
  const [monthlyIncomeRange, setMonthlyIncomeRange] = useState<string>('₹50,000 - ₹75,000');
  const [cibilScoreRange, setCibilScoreRange] = useState<string>('750+');

  // 4. Address
  const [addressState, setAddressState] = useState<string>('Telangana');
  const [address, setAddress] = useState<string>('H.No 4-12, Madhapur, Hyderabad');

  // 5. Document readiness checklist
  const [docsReady, setDocsReady] = useState<{ [key: string]: boolean }>({
    pan: true,
    aadhaar: true,
    bankStatement: true,
    incomeProof: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationshipOptions = [
    { id: 'Father', label: 'Father' },
    { id: 'Mother', label: 'Mother' },
    { id: 'Sibling', label: 'Sibling (Employed)' },
    { id: 'Spouse', label: 'Spouse' },
    { id: 'Other', label: 'Other' },
  ];

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, '');
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!relation) newErrors.relation = 'Please select a relation.';
    if (relation === 'Other' && !otherRelation.trim()) {
      newErrors.otherRelation = 'Please specify the relationship.';
    }
    if (!name.trim()) newErrors.name = 'Full legal name as per PAN is required.';
    if (!validatePhone(mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number starting with 6-9.';
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 21) {
      newErrors.age = 'Co-applicant must be at least 21 years of age for RBI compliance.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const finalRelation = relation === 'Other' ? otherRelation.trim() : relation;

    const payload = {
      relation: finalRelation,
      name: name.trim(),
      mobile: mobile.trim(),
      age: ageNum,
      employmentType,
      monthlyIncomeRange,
      cibilScoreRange,
      state: addressState,
      address: address.trim(),
    };

    try {
      const res = await fetch(`/api/enrollment/${token}/co-applicant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error || 'Failed to save co-applicant details.' });
        setIsSubmitting(false);
        return;
      }
      onSuccess(data.journey || payload);
    } catch {
      onSuccess(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-bold text-[#0B63E5] uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Financing Support • Co-Applicant Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight mt-2.5 mb-2">
            Co-Applicant Eligibility &amp; Details
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Because students typically lack an independent income history, an earning co-applicant (parent or working guardian) supports the NBFC financing application.
          </p>
        </div>

        {/* Video Guide Accordion / Compact Player */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0B63E5]" />
              <span>Video Guide • కో-అప్లికెంట్ ఎంపిక &amp; రూల్స్</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">54 seconds</span>
          </div>
          <CoApplicantVideoPlayer />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section 1: Relationship */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Relationship with Learner
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {relationshipOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setRelation(opt.id);
                    setErrors((prev) => ({ ...prev, relation: '' }));
                  }}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    relation === opt.id
                      ? 'border-[#0B63E5] bg-[#F4F8FF] text-[#0A192F] font-bold ring-1 ring-[#0B63E5]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {relation === 'Other' && (
              <input
                type="text"
                value={otherRelation}
                onChange={(e) => setOtherRelation(e.target.value)}
                placeholder="Specify relationship (e.g. Uncle)"
                className="w-full mt-2 p-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#0B63E5] outline-none"
              />
            )}
            {errors.relation && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.relation}</p>
            )}
          </div>

          {/* Section 2: Basic Details */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              2. Basic Identity Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Full Legal Name (as per PAN)
                </label>
                <input
                  id="co-applicant-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#0B63E5] outline-none"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Co-Applicant Mobile (+91)
                </label>
                <input
                  id="co-applicant-mobile-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ''));
                    setErrors((prev) => ({ ...prev, mobile: '' }));
                  }}
                  placeholder="98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-[#0B63E5] outline-none"
                />
                {errors.mobile && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Age (Minimum 21 Years)
                </label>
                <input
                  type="number"
                  min="21"
                  max="75"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    setErrors((prev) => ({ ...prev, age: '' }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#0B63E5] outline-none"
                />
                {errors.age && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.age}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Professional & Financial Profile */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              3. Professional &amp; Financial Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-[#0B63E5] outline-none bg-white"
                >
                  <option value="Salaried">Salaried (Private / Govt)</option>
                  <option value="Self-Employed">Self-Employed Professional</option>
                  <option value="Business">Business Owner / Merchant</option>
                  <option value="Other">Other Regular Income</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Monthly Income Range
                </label>
                <select
                  value={monthlyIncomeRange}
                  onChange={(e) => setMonthlyIncomeRange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-[#0B63E5] outline-none bg-white"
                >
                  <option value="< ₹25,000">&lt; ₹25,000</option>
                  <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                  <option value="₹50,000 - ₹75,000">₹50,000 - ₹75,000</option>
                  <option value="> ₹75,000">&gt; ₹75,000</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Approx CIBIL Score
                </label>
                <select
                  value={cibilScoreRange}
                  onChange={(e) => setCibilScoreRange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-[#0B63E5] outline-none bg-white"
                >
                  <option value="750+">750+ (Excellent)</option>
                  <option value="700 - 750">700 - 750 (Good)</option>
                  <option value="650 - 700">650 - 700 (Fair)</option>
                  <option value="< 650">&lt; 650 (Needs Review)</option>
                  <option value="Do not know">Do not know</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Address & Residence */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              4. Address &amp; Residence
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Current State
                </label>
                <select
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-[#0B63E5] outline-none bg-white"
                >
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Other">Other State</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Pincode"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#0B63E5] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Document Readiness Checklist */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              5. Document Readiness Checklist
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { key: 'pan', label: 'PAN Card' },
                { key: 'aadhaar', label: 'Aadhaar Card' },
                { key: 'bankStatement', label: '3-Mo Bank Stmt' },
                { key: 'incomeProof', label: 'Salary/ITR Proof' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 select-none"
                >
                  <input
                    type="checkbox"
                    checked={docsReady[item.key]}
                    onChange={(e) =>
                      setDocsReady({ ...docsReady, [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#0B63E5] accent-[#0B63E5]"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 6: Guidance & Transparency Card */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="w-4 h-4 text-[#0B63E5]" />
              <span>Important Financing Guidance &amp; Rights</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              • The co-applicant is a joint applicant for this educational facility.<br />
              • Partner NBFCs independently verify bureau records and banking.<br />
              • If an applicant is rejected by an NBFC, you can nominate an alternate co-applicant or switch to direct payment without losing your seat.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              id="co-applicant-back-btn"
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              id="continue-to-kyc-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B63E5] text-white text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Continue to KYC Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
