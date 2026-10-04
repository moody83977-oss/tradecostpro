import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Plus, 
  Trash2, 
  Mic, 
  Search, 
  Zap, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileText,
  Percent,
  Sliders,
  Sparkles,
  Layers,
  Wrench,
  Navigation
} from 'lucide-react';
import { Job, LineItem, ContractorSettings } from '../types';
import { calculateJobFinancials, formatCurrency, playChime } from '../utils/calculations';

interface JobDetailViewProps {
  job: Job;
  settings: ContractorSettings;
  onBack: () => void;
  onUpdateJob: (updated: Job) => void;
  onOpenVoice: () => void;
  onOpenLookup: () => void;
  onOpenPayment: () => void;
  onOpenInvoice: () => void;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  settings,
  onBack,
  onUpdateJob,
  onOpenVoice,
  onOpenLookup,
  onOpenPayment,
  onOpenInvoice
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'notes'>('items');
  const financials = calculateJobFinancials(job);
  const isPaid = job.status === 'paid';

  const handleUpdateItem = (index: number, updatedItem: LineItem) => {
    const updatedLineItems = [...job.lineItems];
    updatedLineItems[index] = updatedItem;
    onUpdateJob({
      ...job,
      lineItems: updatedLineItems
    });
  };

  const handleDeleteItem = (index: number) => {
    playChime('beep');
    const updatedLineItems = job.lineItems.filter((_, i) => i !== index);
    onUpdateJob({
      ...job,
      lineItems: updatedLineItems
    });
  };

  const handleAddBlankLineItem = (category: 'material' | 'labor' | 'service') => {
    playChime('beep');
    const newItem: LineItem = {
      id: 'li-' + Date.now(),
      name: category === 'labor' ? 'On-Site Diagnostic & Labor' : category === 'material' ? 'New Material / Part' : 'Service Dispatch Fee',
      category,
      quantity: 1,
      unit: category === 'labor' ? 'hrs' : 'ea',
      estimatedWholesaleCost: category === 'labor' ? 50 : 20,
      markupPercentage: category === 'material' ? settings.defaultMaterialMarkup : 0,
      unitPrice: category === 'labor' ? settings.defaultHourlyRate : 35,
      total: category === 'labor' ? settings.defaultHourlyRate : 35,
      taxable: category !== 'labor'
    };

    onUpdateJob({
      ...job,
      lineItems: [...job.lineItems, newItem]
    });
  };

  const handleToggleStatus = (newStatus: Job['status']) => {
    playChime('success');
    onUpdateJob({
      ...job,
      status: newStatus
    });
  };

  const openNavigation = () => {
    if (job.jobAddress) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.jobAddress)}`, '_blank');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Jobs</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={job.status}
            onChange={(e) => handleToggleStatus(e.target.value as any)}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isPaid
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : job.status === 'ready_to_bill'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
            }`}
          >
            <option value="in_progress">In Progress</option>
            <option value="ready_to_bill">Ready to Bill</option>
            <option value="paid">Paid in Full</option>
            <option value="draft">Draft Quote</option>
          </select>
        </div>
      </div>

      {/* Customer & Job Site Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400">{job.invoiceNumber}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-sky-400">{job.trade}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-0.5">
              {job.customerName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              {job.customerPhone && (
                <a 
                  href={`tel:${job.customerPhone}`}
                  className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{job.customerPhone}</span>
                </a>
              )}
              {job.jobAddress && (
                <button
                  type="button"
                  onClick={openNavigation}
                  className="flex items-center gap-1 text-slate-300 hover:text-sky-400 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{job.jobAddress}</span>
                  <Navigation className="w-3 h-3 text-slate-500 ml-0.5" />
                </button>
              )}
            </div>
          </div>

          {/* Large Total & Margin Metric */}
          <div className="sm:text-right bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800/80 flex sm:flex-col justify-between items-center sm:items-end">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Total Billed</span>
              <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {formatCurrency(financials.finalTotal)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {financials.grossMarginPercentage}% Margin
              </span>
              {job.recoveredLeakageAmount && job.recoveredLeakageAmount > 0 ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  +${job.recoveredLeakageAmount} Leakage Recovered
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Scope brief */}
        {job.scopeSummary && (
          <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
            {job.scopeSummary}
          </p>
        )}
      </div>

      {/* Primary Action Buttons (Mobile Field Optimized) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onOpenVoice}
          className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
        >
          <Mic className="w-4 h-4 shrink-0" />
          <span>Voice-to-Estimate</span>
        </button>

        <button
          type="button"
          onClick={onOpenLookup}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
        >
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Lookup Parts</span>
        </button>

        <button
          type="button"
          onClick={onOpenPayment}
          className={`p-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition ${
            isPaid
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>{isPaid ? 'Receipt / Tap-Pay' : 'Tap-to-Pay / QR'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenInvoice}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
        >
          <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
          <span>View Invoice</span>
        </button>
      </div>

      {/* Margin & Financial Breakdown Bar */}
      <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block">Materials ({financials.materialsMargin}% Markup):</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCurrency(financials.materialsRevenue)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Cost: {formatCurrency(financials.materialsCost)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Labor ({financials.laborHours} hrs):</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCurrency(financials.laborRevenue)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Cost: {formatCurrency(financials.laborCost)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Sales Tax ({job.taxRate}%):</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCurrency(financials.taxAmount)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-emerald-400 block font-semibold">Net Job Profit:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            +{formatCurrency(financials.netProfit)}
          </span>
        </div>
      </div>

      {/* Line Items Editor Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Line Items ({job.lineItems.length})
            </span>
          </div>

          {/* Quick Add Line Item Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddBlankLineItem('material')}
              className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Part</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddBlankLineItem('labor')}
              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Labor</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddBlankLineItem('service')}
              className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Trip Fee</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-slate-800/80">
          {job.lineItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <p>No line items yet for this job.</p>
              <p className="text-slate-400">
                Tap <strong className="text-amber-400">&quot;Voice-to-Estimate&quot;</strong> to speak or <strong className="text-sky-400">&quot;Lookup Parts&quot;</strong> to pull from Home Depot.
              </p>
            </div>
          ) : (
            job.lineItems.map((item, idx) => (
              <div key={item.id || idx} className="p-3.5 hover:bg-slate-850/50 transition space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(idx, { ...item, name: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                    />
                    {item.supplierNote && (
                      <span className="text-[10px] text-slate-500 italic block pl-1">
                        {item.supplierNote}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black font-mono text-slate-100">
                      {formatCurrency(item.total)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </div>
                </div>

                {/* Sub-inputs: Qty, Unit, Cost, Markup, Unit Price */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Quantity</label>
                    <input
                      type="number"
                      step="0.25"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        handleUpdateItem(idx, {
                          ...item,
                          quantity: qty,
                          total: Number((qty * item.unitPrice).toFixed(2))
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Unit (ea, hrs, ft)</label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleUpdateItem(idx, { ...item, unit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Wholesale Cost ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.estimatedWholesaleCost}
                      onChange={(e) => {
                        const cost = Number(e.target.value);
                        const unitPrice = item.markupPercentage > 0 
                          ? Number((cost * (1 + item.markupPercentage / 100)).toFixed(2)) 
                          : item.unitPrice;
                        handleUpdateItem(idx, {
                          ...item,
                          estimatedWholesaleCost: cost,
                          unitPrice,
                          total: Number((item.quantity * unitPrice).toFixed(2))
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Markup (%)</label>
                    <input
                      type="number"
                      value={item.markupPercentage}
                      onChange={(e) => {
                        const markup = Number(e.target.value);
                        const cost = Number(item.estimatedWholesaleCost) || 0;
                        const unitPrice = cost > 0 
                          ? Number((cost * (1 + markup / 100)).toFixed(2))
                          : item.unitPrice;
                        handleUpdateItem(idx, {
                          ...item,
                          markupPercentage: markup,
                          unitPrice,
                          total: Number((item.quantity * unitPrice).toFixed(2))
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Client Unit Price</label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        handleUpdateItem(idx, {
                          ...item,
                          unitPrice: price,
                          total: Number((item.quantity * price).toFixed(2))
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Client Notes & Technician Work Diary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Homeowner Invoice Notes / Warranty Notice:
          </label>
          <textarea
            value={job.clientNotes || ''}
            onChange={(e) => onUpdateJob({ ...job, clientNotes: e.target.value })}
            placeholder="Notes printed on invoice (e.g. tested pressure to 55 PSI, 1-year parts warranty included)..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Private Technician Field Notes (Not visible on customer invoice):
          </label>
          <textarea
            value={job.technicianNotes || ''}
            onChange={(e) => onUpdateJob({ ...job, technicianNotes: e.target.value })}
            placeholder="e.g. Copper pipes have minor exterior oxidation. Recommend homeowner inspect water heater anode rod in 6 months."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

    </div>
  );
};
