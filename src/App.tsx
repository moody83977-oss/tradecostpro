/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Mic, 
  Package, 
  Settings as SettingsIcon, 
  Zap, 
  Plus, 
  Sun, 
  DollarSign, 
  Sparkles, 
  Briefcase,
  Layers,
  ChevronDown,
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  X
} from 'lucide-react';
import { Job, ContractorSettings, LineItem, PaymentDetails, TradeType } from './types';
import { INITIAL_JOBS, INITIAL_SETTINGS } from './data/initialData';
import { JobList } from './components/JobList';
import { JobDetailView } from './components/JobDetailView';
import { VoiceEstimatorModal } from './components/VoiceEstimatorModal';
import { MaterialLookupModal } from './components/MaterialLookupModal';
import { TapToPayModal } from './components/TapToPayModal';
import { InvoiceViewModal } from './components/InvoiceViewModal';
import { NewJobModal } from './components/NewJobModal';
import { SettingsModal } from './components/SettingsModal';
import { MonetizationModal } from './components/MonetizationModal';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { playChime, formatCurrency, calculateJobFinancials } from './utils/calculations';

export default function App() {
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('tradecost_jobs');
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  const [settings, setSettings] = useState<ContractorSettings>(() => {
    try {
      const saved = localStorage.getItem('tradecost_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Navigation & Modals
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  const publicAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tradecostpro.app';

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('tradecost_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.error(e);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('tradecost_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  const activeJob = jobs.find(j => j.id === selectedJobId) || null;

  // Handlers
  const handleUpdateJob = (updated: Job) => {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
  };

  const handleCreateJob = (newJob: Job, openVoiceRightAway?: boolean) => {
    setJobs(prev => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
    if (openVoiceRightAway) {
      setTimeout(() => setIsVoiceOpen(true), 150);
    }
  };

  const handleApplyVoiceEstimate = (estimateData: {
    title: string;
    scopeSummary: string;
    trade: string;
    lineItems: LineItem[];
    recoveredLeakageAmount: number;
    clientNotes: string;
  }) => {
    if (activeJob) {
      // Append to active job
      const updated: Job = {
        ...activeJob,
        scopeSummary: activeJob.scopeSummary ? `${activeJob.scopeSummary}\n${estimateData.scopeSummary}` : estimateData.scopeSummary,
        lineItems: [...activeJob.lineItems, ...estimateData.lineItems],
        recoveredLeakageAmount: (activeJob.recoveredLeakageAmount || 0) + estimateData.recoveredLeakageAmount,
        clientNotes: estimateData.clientNotes || activeJob.clientNotes,
        trade: estimateData.trade || activeJob.trade
      };
      handleUpdateJob(updated);
    } else {
      // Create new job from estimate
      const newJob: Job = {
        id: 'job-' + Date.now(),
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        customerName: 'Job Site Estimate',
        customerPhone: '',
        customerEmail: '',
        jobAddress: 'Job Site',
        trade: estimateData.trade || settings.trade,
        status: 'ready_to_bill',
        title: estimateData.title,
        scopeSummary: estimateData.scopeSummary,
        createdAt: new Date().toISOString(),
        taxRate: settings.taxRate,
        discount: 0,
        clientNotes: estimateData.clientNotes || 'Work estimated and completed according to standard trade specifications.',
        technicianNotes: '',
        recoveredLeakageAmount: estimateData.recoveredLeakageAmount,
        lineItems: estimateData.lineItems
      };
      setJobs(prev => [newJob, ...prev]);
      setSelectedJobId(newJob.id);
    }
  };

  const handleAddItemFromLookup = (item: LineItem) => {
    if (activeJob) {
      const updated: Job = {
        ...activeJob,
        lineItems: [...activeJob.lineItems, item]
      };
      handleUpdateJob(updated);
    } else {
      // Create quick job
      const newJob: Job = {
        id: 'job-' + Date.now(),
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        customerName: 'Quick Material Invoice',
        customerPhone: '',
        customerEmail: '',
        jobAddress: '',
        trade: settings.trade,
        status: 'in_progress',
        title: 'Material Order',
        scopeSummary: 'Supplier item added to job.',
        createdAt: new Date().toISOString(),
        taxRate: settings.taxRate,
        discount: 0,
        clientNotes: '',
        lineItems: [item]
      };
      setJobs(prev => [newJob, ...prev]);
      setSelectedJobId(newJob.id);
    }
  };

  const handlePaymentSuccess = (jobId: string, details: PaymentDetails, signature?: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: 'paid',
          paidAt: details.timestamp,
          paymentDetails: details,
          signature: signature || j.signature
        };
      }
      return j;
    }));
  };

  // Quick stats for top bar
  const totalLeakageRecovered = jobs.reduce((sum, j) => sum + (j.recoveredLeakageAmount || 0), 0);
  const totalVolume = jobs.reduce((sum, j) => sum + calculateJobFinancials(j).finalTotal, 0);

  return (
    <div className={`min-h-screen ${settings.sunlightMode ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-950 text-slate-100'} transition-colors duration-200`}>
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo / Branding */}
          <div 
            onClick={() => setSelectedJobId(null)} 
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-100 text-base tracking-tight">TradeCost</span>
                <span className="text-[10px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block line-clamp-1">
                {settings.businessName}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            
            {/* Trade Selector Chip */}
            <select
              value={settings.trade}
              onChange={(e) => setSettings({ ...settings, trade: e.target.value as TradeType })}
              className="text-xs bg-slate-900 border border-slate-800 text-amber-400 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none hidden sm:block"
            >
              <option value="Plumbing">🔧 Plumbing</option>
              <option value="HVAC">❄️ HVAC</option>
              <option value="Electrical">⚡ Electrical</option>
              <option value="Auto Detailing">🚗 Detailing</option>
              <option value="Solar / Roofing">☀️ Solar/Roof</option>
              <option value="Handyman">🔨 Handyman</option>
            </select>

            {/* Share Public App Link */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition"
              title="Share / Make Public"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share App</span>
            </button>

            {/* Monetization / ROI indicator */}
            <button
              type="button"
              onClick={() => setIsMonetizationOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-mono">+{formatCurrency(totalLeakageRecovered + 680)}</span>
              <span className="sm:hidden">ROI</span>
            </button>

            {/* Sunlight Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, sunlightMode: !settings.sunlightMode });
                playChime('beep');
              }}
              title="Sunlight High-Contrast Mode"
              className={`p-2 rounded-lg border transition ${
                settings.sunlightMode 
                  ? 'bg-amber-400 text-slate-950 border-amber-400' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {activeJob ? (
          <JobDetailView
            job={activeJob}
            settings={settings}
            onBack={() => setSelectedJobId(null)}
            onUpdateJob={handleUpdateJob}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onOpenLookup={() => setIsLookupOpen(true)}
            onOpenPayment={() => setIsPaymentOpen(true)}
            onOpenInvoice={() => setIsInvoiceOpen(true)}
          />
        ) : (
          <JobList
            jobs={jobs}
            settings={settings}
            onSelectJob={(j) => setSelectedJobId(j.id)}
            onNewJob={() => setIsNewJobOpen(true)}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onOpenLookup={() => setIsLookupOpen(true)}
            onOpenMonetization={() => setIsMonetizationOpen(true)}
            onQuickPayment={(j) => {
              setSelectedJobId(j.id);
              setIsPaymentOpen(true);
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Dock (For field technicians holding phone with 1 hand) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          
          <button
            type="button"
            onClick={() => setSelectedJobId(null)}
            className={`py-1 flex flex-col items-center gap-1 transition ${
              !activeJob ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span className="text-[10px]">Jobs</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="py-1 flex flex-col items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 font-bold" />
            </div>
            <span className="text-[10px]">Voice AI</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLookupOpen(true)}
            className="py-1 flex flex-col items-center gap-1 text-sky-400 hover:text-sky-300 transition"
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px]">Parts</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMonetizationOpen(true)}
            className="py-1 flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px]">Fintech</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="py-1 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-[10px]">Rates</span>
          </button>

        </div>
      </nav>

      {/* Modals */}
      <VoiceEstimatorModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyEstimate={handleApplyVoiceEstimate}
        defaultTrade={settings.trade}
        defaultHourlyRate={settings.defaultHourlyRate}
        defaultMarkup={settings.defaultMaterialMarkup}
      />

      <MaterialLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onAddItemToJob={handleAddItemFromLookup}
        defaultMarkup={settings.defaultMaterialMarkup}
      />

      {activeJob && (
        <>
          <TapToPayModal
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            job={activeJob}
            onPaymentSuccess={handlePaymentSuccess}
          />

          <InvoiceViewModal
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
            job={activeJob}
            settings={settings}
            onOpenPayment={() => {
              setIsInvoiceOpen(false);
              setIsPaymentOpen(true);
            }}
          />
        </>
      )}

      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onCreateJob={handleCreateJob}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => setSettings(newSettings)}
      />

      <MonetizationModal
        isOpen={isMonetizationOpen}
        onClose={() => setIsMonetizationOpen(false)}
        settings={settings}
        onUpdateTier={(tier) => setSettings({ ...settings, subscriptionTier: tier })}
        totalRecoveredLeakage={totalLeakageRecovered}
        monthlyVolumeProcessed={totalVolume}
      />

      {/* Share / Make Public Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
            
            <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Public App & Custom Domain</h3>
                  <p className="text-xs text-slate-400">Pano ikabit ang sarili mong domain name</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Domain Setup Quick Card */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-400" />
                    Gusto mo ng sariling domain? (hal. www.tradecostpro.com)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bumili ng domain sa <strong>Namecheap, GoDaddy, o Cloudflare</strong> ($10/yr), i-export ang repo sa GitHub, at ikabit sa Vercel/Cloud Run sa loob ng 5 minuto.
                </p>
              </div>

              <div className="text-center space-y-2">
                <QRCodeDisplay value={publicAppUrl} size={150} className="mx-auto" />
                <p className="text-xs text-slate-400">
                  Kasalukuyang Live URL (Puwede nang i-share sa kliyente):
                </p>
              </div>

              {/* Public URL Box */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Live Public Web Link:
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xs font-mono text-slate-300 truncate flex-1">
                    {publicAppUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicAppUrl);
                      setCopiedAppUrl(true);
                      playChime('beep');
                      setTimeout(() => setCopiedAppUrl(false), 2000);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shrink-0 transition flex items-center gap-1"
                  >
                    {copiedAppUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAppUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Marketing Steps */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3 Mabilis na Paraan para Dumami ang Gagamit:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-slate-100">AI Studio Share Button:</strong> I-click ang <strong>&quot;Share&quot;</strong> sa kanang itaas ng AI Studio window at piliin ang <em>&quot;Anyone with the link&quot;</em> o <em>&quot;Public&quot;</em>.
                  </li>
                  <li>
                    <strong className="text-slate-100">TikTok / Reels / FB Video:</strong> I-screen record ang Voice Estimator habang nagsasalita: <em>&quot;Installed 3 PVC joints, 2 hours labor&quot;</em> → instant quote at payment QR!
                  </li>
                  <li>
                    <strong className="text-slate-100">Contractor Communities:</strong> I-post sa mga Facebook Groups ng plumbers, electricians, aircon techs, at car detailers.
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
