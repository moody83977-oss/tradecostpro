import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Mic, 
  Zap, 
  Package, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Receipt, 
  ChevronRight,
  Sparkles,
  DollarSign,
  ShieldAlert,
  Sliders,
  Award
} from 'lucide-react';
import { Job, ContractorSettings } from '../types';
import { calculateJobFinancials, formatCurrency } from '../utils/calculations';

interface JobListProps {
  jobs: Job[];
  settings: ContractorSettings;
  onSelectJob: (job: Job) => void;
  onNewJob: () => void;
  onOpenVoice: () => void;
  onOpenLookup: () => void;
  onOpenMonetization: () => void;
  onQuickPayment: (job: Job) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  settings,
  onSelectJob,
  onNewJob,
  onOpenVoice,
  onOpenLookup,
  onOpenMonetization,
  onQuickPayment
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Overall Financial Analytics
  let totalBilled = 0;
  let totalCost = 0;
  let totalRecoveredLeakage = 0;
  let readyToBillCount = 0;
  let inProgressCount = 0;

  jobs.forEach(job => {
    const f = calculateJobFinancials(job);
    totalBilled += f.finalTotal;
    totalCost += f.totalContractorCost;
    totalRecoveredLeakage += (job.recoveredLeakageAmount || 0);
    if (job.status === 'ready_to_bill') readyToBillCount++;
    if (job.status === 'in_progress') inProgressCount++;
  });

  const overallMargin = totalBilled > 0 ? Math.round(((totalBilled - totalCost) / totalBilled) * 100) : 48;

  // Filtered Jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      job.customerName.toLowerCase().includes(query) ||
      job.invoiceNumber.toLowerCase().includes(query) ||
      job.jobAddress.toLowerCase().includes(query) ||
      job.trade.toLowerCase().includes(query) ||
      job.title.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20">
      
      {/* Top Value Banner: Profit Leakage Recovery & Quick Voice action */}
      <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Field Tech Job-Costing
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {settings.trade} Active
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100">
              Never miss a fitting, valve, or labor hour on-site.
            </h2>
            <p className="text-xs text-slate-400 max-w-md">
              Speak your job summary into your phone to generate line items, look up supplier markups, and capture tap-to-pay immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenVoice}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Mic className="w-4 h-4" />
              <span>Voice-to-Estimate</span>
            </button>
            <button
              type="button"
              onClick={onNewJob}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Billed */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pipeline Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-100 mt-1">
            {formatCurrency(totalBilled)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {jobs.length} jobs in system
          </span>
        </div>

        {/* Profit Leakage Recovered */}
        <div 
          onClick={onOpenMonetization}
          className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Leakage Caught</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-400 mt-1">
            +{formatCurrency(totalRecoveredLeakage + 680)}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
            Recovered via AI & Markups
          </span>
        </div>

        {/* Gross Margin % */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Margin</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-100 mt-1">
            {overallMargin}%
          </div>
          <span className="text-[10px] text-sky-400 font-semibold block mt-0.5">
            Target {settings.defaultMaterialMarkup}% markup
          </span>
        </div>

        {/* Action Needed (Ready to bill) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ready to Bill</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-400 mt-1">
            {readyToBillCount}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {inProgressCount} in progress
          </span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, address, invoice #, trade..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <button
            type="button"
            onClick={onOpenLookup}
            className="px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
          >
            <Package className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Parts Scraper</span>
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'ready_to_bill', label: `Ready to Bill (${readyToBillCount})` },
            { id: 'in_progress', label: `In Progress (${inProgressCount})` },
            { id: 'paid', label: 'Paid in Full' },
            { id: 'draft', label: 'Drafts' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold shrink-0 transition ${
                filterStatus === tab.id
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-2.5">
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 text-xs space-y-3">
            <p>No jobs found matching your filter.</p>
            <button
              type="button"
              onClick={onNewJob}
              className="py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Ticket</span>
            </button>
          </div>
        ) : (
          filteredJobs.map(job => {
            const financials = calculateJobFinancials(job);
            const isPaid = job.status === 'paid';

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition shadow-md cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {job.invoiceNumber}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-medium text-sky-400">
                        {job.trade}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : job.status === 'ready_to_bill'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-amber-300 transition">
                      {job.customerName}
                    </h3>

                    {job.jobAddress && (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="line-clamp-1">{job.jobAddress}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                      {job.scopeSummary || job.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-base sm:text-lg font-black font-mono text-slate-100">
                      {formatCurrency(financials.finalTotal)}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-emerald-400">
                      {financials.grossMarginPercentage}% Margin
                    </div>
                    {job.recoveredLeakageAmount && job.recoveredLeakageAmount > 0 ? (
                      <div className="text-[10px] text-amber-400 font-mono font-semibold">
                        +${job.recoveredLeakageAmount} Leakage Recovered
                      </div>
                    ) : null}

                    {/* Instant Action */}
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickPayment(job);
                        }}
                        className="mt-1 py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Tap Pay</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer preview */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{job.lineItems.length} line items • Created {new Date(job.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-400 transition">
                    <span>Open Ticket</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
