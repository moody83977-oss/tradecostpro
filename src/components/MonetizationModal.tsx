import React, { useState } from 'react';
import { 
  Zap, 
  Check, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  X,
  Sliders,
  Award,
  Layers
} from 'lucide-react';
import { ContractorSettings } from '../types';
import { formatCurrency, playChime } from '../utils/calculations';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ContractorSettings;
  onUpdateTier: (tier: 'starter' | 'pro' | 'elite') => void;
  totalRecoveredLeakage: number;
  monthlyVolumeProcessed: number;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateTier,
  totalRecoveredLeakage,
  monthlyVolumeProcessed
}) => {
  const [jobsPerMonth, setJobsPerMonth] = useState<number>(28);
  const [avgLeakagePerJob, setAvgLeakagePerJob] = useState<number>(38);
  const [hoursSavedPerJob, setHoursSavedPerJob] = useState<number>(0.5);

  if (!isOpen) return null;

  // ROI Calculations
  const monthlyPartsRecovered = jobsPerMonth * avgLeakagePerJob;
  const hoursSavedMonthly = Number((jobsPerMonth * hoursSavedPerJob).toFixed(1));
  const hourlyRate = settings.defaultHourlyRate || 115;
  const laborAdminSavings = Number((hoursSavedMonthly * hourlyRate).toFixed(2));
  const totalMonthlyGain = monthlyPartsRecovered + laborAdminSavings;

  const currentTierPrice = settings.subscriptionTier === 'starter' ? 19 : settings.subscriptionTier === 'pro' ? 29 : 49;
  const netMonthlyROI = totalMonthlyGain - currentTierPrice;
  const roiMultiplier = Math.round(totalMonthlyGain / currentTierPrice);

  // Fintech Take-Rate
  const fintechVolume = monthlyVolumeProcessed > 0 ? monthlyVolumeProcessed : jobsPerMonth * 450;
  const platformCutAmount = Number((fintechVolume * 0.0075).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 via-slate-800/60 to-emerald-500/10 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>Micro-SaaS & Fintech Economics</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dual-Engine Monetization
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Subscription ($19–$49/mo) + Stripe Connect Fintech Take-Rate (0.75%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Key Value Proposition Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Why This Micro-SaaS Wins With Contractors</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              &quot;B2B trade contractors readily pay <strong className="text-amber-400">$29/month</strong> because TradeCost Pro recovers <strong className="text-emerald-400">$200+ every single week</strong> in forgotten fittings, primer, seals, and markup leakage, while cutting 2 hours of painful evening paperwork into a 15-second voice memo.&quot;
            </p>
          </div>

          {/* Subscription Tiers */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Monthly Subscription Tiers ($19 - $49/mo per technician)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'starter',
                  name: 'Solo Tech',
                  price: 19,
                  desc: 'Independent handyman & detailer',
                  features: ['Voice-to-Estimate (15/mo)', 'Tap-to-Pay QR', 'Standard Margin Presets', '1 Technician']
                },
                {
                  id: 'pro',
                  name: 'Pro Contractor',
                  price: 29,
                  popular: true,
                  desc: 'High-volume field service pro',
                  features: ['Unlimited Voice AI Estimator', 'Real-time Supplier Scrape', 'Profit Leakage Detector', 'Stripe Connect Instant Payouts', 'Digital Signature Pad']
                },
                {
                  id: 'elite',
                  name: 'Elite Crew',
                  price: 49,
                  desc: 'Multi-van service businesses',
                  features: ['Everything in Pro', 'Multi-tech Fleet Dispatch', 'Custom Supplier Catalog API', 'Priority 24/7 Phone Support', 'Dedicated Account Manager']
                }
              ].map((tier) => {
                const isCurrent = settings.subscriptionTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`relative p-4 rounded-xl border transition flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-100">{tier.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{tier.desc}</div>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-100 font-mono">${tier.price}</span>
                        <span className="text-xs text-slate-400">/mo</span>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3">
                        {tier.features.map((f, i) => (
                          <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTier(tier.id as any);
                        playChime('success');
                      }}
                      className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrent ? 'Current Active Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive ROI & Leakage Calculator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Technician Value & ROI Simulator
              </span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {roiMultiplier}x Annualized ROI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Jobs Per Month: <strong className="text-slate-200 font-mono">{jobsPerMonth}</strong>
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={jobsPerMonth}
                  onChange={(e) => setJobsPerMonth(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Forgotten Parts/Job: <strong className="text-slate-200 font-mono">${avgLeakagePerJob}</strong>
                </label>
                <input
                  type="range"
                  min={15}
                  max={100}
                  step={5}
                  value={avgLeakagePerJob}
                  onChange={(e) => setAvgLeakagePerJob(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Admin Saved/Job: <strong className="text-slate-200 font-mono">{hoursSavedPerJob} hr</strong>
                </label>
                <input
                  type="range"
                  min={0.25}
                  max={1.5}
                  step={0.25}
                  value={hoursSavedPerJob}
                  onChange={(e) => setHoursSavedPerJob(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Simulation Results Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Recovered Parts:</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                  {formatCurrency(monthlyPartsRecovered)}/mo
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Billing Time Saved:</span>
                <span className="text-sm sm:text-base font-bold text-sky-400 font-mono">
                  {hoursSavedMonthly} hrs ({formatCurrency(laborAdminSavings)})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Net Tech Gain:</span>
                <span className="text-sm sm:text-base font-bold text-amber-400 font-mono">
                  +{formatCurrency(netMonthlyROI)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* 2. Fintech Take-Rate (Stripe Connect Engine) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                2. Fintech Take-Rate (0.75% Stripe Connect Cut)
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">
                Connected & Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              On every tap-to-pay or QR invoice transaction, TradeCost Pro earns a 0.75% platform fee via Stripe Connect Application Fees.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Monthly Invoice Volume:</span>
                <span className="font-mono font-bold text-slate-200">{formatCurrency(fintechVolume)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SaaS Fintech Earnings:</span>
                <span className="font-mono font-bold text-purple-400">+{formatCurrency(platformCutAmount)}/mo</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
