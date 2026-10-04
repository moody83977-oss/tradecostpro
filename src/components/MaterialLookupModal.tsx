import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  TrendingUp, 
  Plus, 
  Check, 
  MapPin, 
  ExternalLink, 
  X, 
  Sliders, 
  Percent, 
  DollarSign, 
  Sparkles,
  Building,
  Info,
  Loader2
} from 'lucide-react';
import { SupplierPart, LineItem } from '../types';
import { formatCurrency, playChime } from '../utils/calculations';

interface MaterialLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItemToJob: (item: LineItem) => void;
  defaultMarkup: number;
}

const QUICK_SEARCH_CHIPS = [
  'SharkBite 3/4',
  '3/4 Ball Valve',
  '2 in. PVC Elbow',
  '45/5 Capacitor',
  'R-410A Refrigerant',
  '20A AFCI Breaker',
  'Romex 12/2 Wire',
  'Ceramic Coating'
];

export const MaterialLookupModal: React.FC<MaterialLookupModalProps> = ({
  isOpen,
  onClose,
  onAddItemToJob,
  defaultMarkup = 45
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [parts, setParts] = useState<SupplierPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SupplierPart | null>(null);
  const [markupPercent, setMarkupPercent] = useState<number>(defaultMarkup);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Fetch catalog on mount or search
  useEffect(() => {
    if (!isOpen) return;
    loadCatalog(searchQuery, selectedCategory);
  }, [isOpen, selectedCategory]);

  const loadCatalog = async (query: string, category: string) => {
    setIsLoading(true);
    try {
      const url = new URL('/api/supplier-catalog', window.location.origin);
      if (query) url.searchParams.set('q', query);
      if (category && category !== 'all') url.searchParams.set('category', category);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setParts(data.parts || []);
      }
    } catch (err) {
      console.error('Failed to load supplier catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveAILookup = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/lookup-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setParts(data.results);
          playChime('beep');
        }
      }
    } catch (err) {
      console.error('Live AI material search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPart = (part: SupplierPart) => {
    setSelectedPart(part);
    setMarkupPercent(part.recommendedMarkup || defaultMarkup);
    setQuantity(1);
    playChime('beep');
  };

  const handleCommitItem = () => {
    if (!selectedPart) return;

    const wholesale = Number(selectedPart.wholesaleCost) || 0;
    const unitPrice = Number((wholesale * (1 + markupPercent / 100)).toFixed(2));
    const total = Number((unitPrice * quantity).toFixed(2));

    const lineItem: LineItem = {
      id: 'part-' + Date.now(),
      name: selectedPart.name,
      category: 'material',
      quantity,
      unit: selectedPart.unit || 'ea',
      estimatedWholesaleCost: wholesale,
      markupPercentage: markupPercent,
      unitPrice,
      total,
      taxable: true,
      supplierNote: `${selectedPart.supplier} (SKU: ${selectedPart.sku})`
    };

    onAddItemToJob(lineItem);
    playChime('success');
    setAddedItemName(selectedPart.name);
    setTimeout(() => {
      setAddedItemName(null);
    }, 2000);
  };

  if (!isOpen) return null;

  // Selected part calculations
  const wholesale = selectedPart ? Number(selectedPart.wholesaleCost) : 0;
  const unitPrice = Number((wholesale * (1 + markupPercent / 100)).toFixed(2));
  const profitPerUnit = Number((unitPrice - wholesale).toFixed(2));
  const profitMarginPercent = unitPrice > 0 ? Number(((profitPerUnit / unitPrice) * 100).toFixed(1)) : 0;
  const lineTotal = Number((unitPrice * quantity).toFixed(2));
  const totalProfit = Number((profitPerUnit * quantity).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 via-slate-800/60 to-emerald-500/10 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>Material Price & Margin Lookup</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Home Depot • Lowe&apos;s • Ferguson
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Instant contractor cost vs big-box retail markup optimizer
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

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Search bar */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    loadCatalog(e.target.value, selectedCategory);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLiveAILookup();
                  }}
                  placeholder="Search SKU, part name, or supplier (e.g. SharkBite, 2in PVC, 45/5 cap)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition"
                />
              </div>
              <button
                type="button"
                onClick={handleLiveAILookup}
                disabled={isLoading}
                className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Live Lookup</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-500 shrink-0">Popular:</span>
              {QUICK_SEARCH_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                    loadCatalog(chip, selectedCategory);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white shrink-0 text-xs transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier Grid & Selected Part Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Parts Catalog List */}
            <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Verified Supplier Inventory ({parts.length})</span>
                <span className="text-[11px] text-slate-500">Tap item to calculate margin</span>
              </div>

              <div className="divide-y divide-slate-800/70 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <span>Pulling real-time supplier databases...</span>
                  </div>
                ) : parts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No matching parts found. Try typing a SKU or click &quot;AI Live Lookup&quot;.
                  </div>
                ) : (
                  parts.map((part) => {
                    const isSelected = selectedPart?.id === part.id || selectedPart?.sku === part.sku;
                    return (
                      <div
                        key={part.id || part.sku}
                        onClick={() => handleSelectPart(part)}
                        className={`p-3 text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-sky-500/10 border-l-4 border-l-sky-400'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-100 line-clamp-2">
                            {part.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-medium text-sky-400 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {part.supplier}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">SKU: {part.sku}</span>
                            {part.localAisle && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {part.localAisle}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-slate-400">
                            Cost: <span className="text-slate-200 font-semibold">{formatCurrency(part.wholesaleCost)}</span>
                          </div>
                          <div className="text-xs font-bold text-amber-400 font-mono">
                            Retail: {formatCurrency(part.retailPrice)}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            +{Math.round(((part.retailPrice - part.wholesaleCost) / part.wholesaleCost) * 100)}% Markup
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Margin Optimizer & Add To Job Form */}
            <div className="lg:col-span-5 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              {selectedPart ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-mono text-sky-400 tracking-wider font-bold block mb-1">
                      Margin Optimizer
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm line-clamp-2 leading-tight">
                      {selectedPart.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Supplier: <strong className="text-slate-300">{selectedPart.supplier}</strong>
                    </p>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Wholesale Cost:</span>
                      <span className="text-base font-bold text-slate-200 font-mono">
                        {formatCurrency(wholesale)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Client Unit Price:</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {formatCurrency(unitPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Markup Slider & Quick Preset Buttons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        Target Markup:
                      </span>
                      <span className="font-bold font-mono text-amber-400 text-sm">
                        +{markupPercent}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />

                    {/* Presets */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[
                        { label: 'Pass-Thru', pct: 25 },
                        { label: 'Standard', pct: 45 },
                        { label: 'Urgent/High', pct: 75 }
                      ].map((preset) => (
                        <button
                          key={preset.pct}
                          type="button"
                          onClick={() => setMarkupPercent(preset.pct)}
                          className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold transition border ${
                            markupPercent === preset.pct
                              ? 'bg-amber-400 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {preset.label} (+{preset.pct}%)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Profit Metrics */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Gross Margin %:</span>
                      <span className="font-bold text-emerald-400 font-mono">{profitMarginPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Technician Profit / Unit:</span>
                      <span className="font-bold text-emerald-400 font-mono">+{formatCurrency(profitPerUnit)}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Quantity Needed:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-12 bg-slate-950 border border-slate-700 text-center text-slate-100 font-bold rounded-lg py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Job Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCommitItem}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Job ({formatCurrency(lineTotal)})</span>
                    </button>
                    {addedItemName && (
                      <p className="text-[11px] text-emerald-400 text-center mt-2 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Added to invoice line items!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <Package className="w-10 h-10 text-slate-700" />
                  <p className="text-xs text-slate-400">Select any material on the left to configure real-time margin & markup.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
