import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  User, 
  Phone, 
  MapPin, 
  Wrench, 
  DollarSign, 
  Mic, 
  Sparkles,
  Check
} from 'lucide-react';
import { Job, ContractorSettings, TradeType } from '../types';
import { playChime } from '../utils/calculations';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateJob: (newJob: Job, openVoiceRightAway?: boolean) => void;
  settings: ContractorSettings;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onCreateJob,
  settings
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [trade, setTrade] = useState<TradeType>(settings.trade);
  const [scopeSummary, setScopeSummary] = useState('');
  const [withVoice, setWithVoice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const newJob: Job = {
      id: 'job-' + Date.now(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: '',
      jobAddress: jobAddress.trim(),
      trade,
      status: 'in_progress',
      title: scopeSummary || `${trade} Service Call`,
      scopeSummary: scopeSummary.trim(),
      createdAt: new Date().toISOString(),
      taxRate: settings.taxRate,
      discount: 0,
      clientNotes: 'Thank you for choosing our trade services. Work completed per industry code.',
      technicianNotes: '',
      lineItems: []
    };

    playChime('success');
    onCreateJob(newJob, withVoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">New Field Job</h3>
              <p className="text-xs text-slate-400">Create ticket & launch instant job-costing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Customer / Homeowner Name *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. David & Sarah Miller"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Trade Type
              </label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as TradeType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Auto Detailing">Auto Detailing</option>
                <option value="Solar / Roofing">Solar / Roofing</option>
                <option value="Handyman">Handyman</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Job Site Address
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={jobAddress}
                onChange={(e) => setJobAddress(e.target.value)}
                placeholder="1234 Oak Ridge Lane, Suite 2"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              Initial Issue / Request (Optional)
            </label>
            <textarea
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              placeholder="e.g. Leaking shutoff valve under kitchen sink, low hot water pressure..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick Voice Mode toggle */}
          <div 
            onClick={() => setWithVoice(!withVoice)}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/15 transition"
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                Open Voice Estimator Immediately
              </span>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
              withVoice ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-600 bg-slate-900'
            }`}>
              {withVoice && <Check className="w-3.5 h-3.5 font-bold" />}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
