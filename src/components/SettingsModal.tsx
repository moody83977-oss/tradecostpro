import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Save, 
  Building, 
  User, 
  Phone, 
  Mail, 
  Wrench, 
  Sun, 
  DollarSign, 
  Percent, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { ContractorSettings, TradeType } from '../types';
import { playChime } from '../utils/calculations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ContractorSettings;
  onSave: (newSettings: ContractorSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<ContractorSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    playChime('success');
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                Contractor Profile & Rates
              </h3>
              <p className="text-xs text-slate-400">
                Configure your business info, trade rates, and field preferences
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Business Info */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Business Identity
            </span>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Company / DBA Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Technician Name</label>
                <input
                  type="text"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Primary Trade</label>
                <select
                  value={formData.trade}
                  onChange={(e) => setFormData({ ...formData, trade: e.target.value as TradeType })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Billing Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Pricing Presets */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Default Job-Costing Rates
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Labor Rate ($/hr)</label>
                <div className="relative">
                  <span className="text-xs text-slate-500 absolute left-2.5 top-2">$</span>
                  <input
                    type="number"
                    value={formData.defaultHourlyRate}
                    onChange={(e) => setFormData({ ...formData, defaultHourlyRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Material Markup</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.defaultMaterialMarkup}
                    onChange={(e) => setFormData({ ...formData, defaultMaterialMarkup: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-6 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-500 absolute right-2.5 top-2">%</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Sales Tax (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-6 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-500 absolute right-2.5 top-2">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Field Display Mode */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Field Visibility
            </span>
            <div 
              onClick={() => setFormData({ ...formData, sunlightMode: !formData.sunlightMode })}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
            >
              <div className="flex items-center gap-2.5">
                <Sun className={`w-4 h-4 ${formData.sunlightMode ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Sunlight / High-Contrast Mode</div>
                  <div className="text-[11px] text-slate-400">Maximizes visibility when working outdoors on sunny job sites</div>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition ${formData.sunlightMode ? 'bg-amber-400' : 'bg-slate-800'}`}>
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition transform ${formData.sunlightMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
