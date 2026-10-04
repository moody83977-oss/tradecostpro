import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  Check, 
  Volume2, 
  Wrench, 
  X, 
  DollarSign, 
  Percent, 
  Clock, 
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react';
import { LineItem, LeakageAlert, TradeType, Job } from '../types';
import { formatCurrency, playChime } from '../utils/calculations';

interface VoiceEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEstimate: (data: {
    title: string;
    scopeSummary: string;
    trade: string;
    lineItems: LineItem[];
    recoveredLeakageAmount: number;
    clientNotes: string;
  }) => void;
  defaultTrade: TradeType;
  defaultHourlyRate: number;
  defaultMarkup: number;
}

const TRADE_PRESETS = [
  {
    label: 'Plumbing Job',
    trade: 'Plumbing',
    transcript: 'Replaced cracked 2-inch PVC drain trap under master sink, installed 3 PVC schedule 40 elbows, 6 feet of pipe, and replaced the leaking angle stop shutoff valve with a 1/2 inch brass quarter-turn. Spent 2.25 hours labor troubleshooting and leak testing.'
  },
  {
    label: 'HVAC AC Repair',
    trade: 'HVAC',
    transcript: 'Outdoor condensing unit was humming but compressor would not kick on. Tested and replaced bad 45/5 dual round run capacitor, cleaned severe dirt from condenser coils, and charged 2 pounds of virgin R-410A refrigerant. 1.75 hours on site in attic and outside.'
  },
  {
    label: 'Electrical Circuit',
    trade: 'Electrical',
    transcript: 'Diagnosed intermittent tripping on master bedroom branch. Replaced standard 20A breaker with a Square D AFCI combination breaker, rewired 2 loose burnt receptacles, 2 hours labor plus standard truck dispatch fee.'
  },
  {
    label: 'Ceramic Auto Detail',
    trade: 'Auto Detailing',
    transcript: 'Completed interior deep steam extraction, leather seat reconditioning, single-stage machine paint polish on mid-size SUV, and applied 50ml ceramic shield coating. 4.5 hours full mobile detail labor.'
  }
];

export const VoiceEstimatorModal: React.FC<VoiceEstimatorModalProps> = ({
  isOpen,
  onClose,
  onApplyEstimate,
  defaultTrade,
  defaultHourlyRate,
  defaultMarkup
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>(defaultTrade);
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [markup, setMarkup] = useState<number>(defaultMarkup);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<{
    detectedTrade: string;
    jobSummary: string;
    lineItems: LineItem[];
    leakageAlerts: LeakageAlert[];
    potentialSavingsRecovered: number;
    clientNotes: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          playChime('beep');
        } catch (e) {
          // If already running or permission denied
          setIsRecording(false);
        }
      } else {
        // Fallback for browsers without Web Speech
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          if (!transcript) {
            setTranscript('Replaced 3/4" brass sweat ball valve, installed 2 PVC elbows, and 2 hours on-site labor.');
          }
        }, 3000);
      }
    }
  };

  const handleParseEstimate = async () => {
    if (!transcript.trim()) {
      setErrorMsg('Please speak or type a brief description of the job first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/parse-voice-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript,
          trade: selectedTrade,
          hourlyRate: Number(hourlyRate) || 115,
          defaultMarkup: Number(markup) || 45
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse estimate.');
      }

      const json = await res.json();
      if (json.data) {
        setParseResult(json.data);
        playChime('success');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing estimate. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLeakageItem = (alert: LeakageAlert, index: number) => {
    if (!parseResult) return;
    
    playChime('beep');
    const newItem: LineItem = {
      id: 'leakage-' + Date.now() + '-' + index,
      name: alert.title,
      category: alert.category as any || 'consumable',
      quantity: 1,
      unit: 'item',
      estimatedWholesaleCost: alert.suggestedCost,
      markupPercentage: Math.round(((alert.suggestedPrice - alert.suggestedCost) / alert.suggestedCost) * 100) || 50,
      unitPrice: alert.suggestedPrice,
      total: alert.suggestedPrice,
      taxable: true,
      supplierNote: 'Recovered via AI Leakage Detector'
    };

    const updatedItems = [...parseResult.lineItems, newItem];
    const updatedAlerts = parseResult.leakageAlerts.filter((_, i) => i !== index);
    const recovered = (parseResult.potentialSavingsRecovered || 0) + alert.suggestedPrice;

    setParseResult({
      ...parseResult,
      lineItems: updatedItems,
      leakageAlerts: updatedAlerts,
      potentialSavingsRecovered: recovered
    });
  };

  const handleConfirmAndApply = () => {
    if (!parseResult) return;

    onApplyEstimate({
      title: parseResult.jobSummary || 'Field Service Estimate',
      scopeSummary: parseResult.jobSummary,
      trade: parseResult.detectedTrade || selectedTrade,
      lineItems: parseResult.lineItems,
      recoveredLeakageAmount: parseResult.potentialSavingsRecovered || 0,
      clientNotes: parseResult.clientNotes || ''
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 via-slate-800/60 to-sky-500/10 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">Voice-to-Estimate</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Speak on-site in natural technician language to auto-build line items & recover lost margin
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

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Trade Presets for easy one-tap testing */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Test Scenarios (Tap to Load Voice Prompt)</span>
              <span className="text-[11px] text-amber-400 font-normal">Real Job Site Examples</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TRADE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(p.transcript);
                    setSelectedTrade(p.trade);
                    setParseResult(null);
                    playChime('beep');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {p.trade}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Mic Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {isRecording && (
              <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
            )}

            <button
              type="button"
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-rose-500/50 scale-105 animate-pulse'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 hover:shadow-amber-500/30 hover:scale-105'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="mt-3">
              <span className={`text-sm font-semibold ${isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                {isRecording ? 'Listening... Speak naturally (parts, hours, tasks)' : 'Tap to Start Voice Dictation'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Microphone audio transcribed instantly into editable text below
              </p>
            </div>
          </div>

          {/* Transcript input */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Technician Voice Transcript / Job Notes:</span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder='e.g., "Replaced 3/4 inch ball valve, installed 2 PVC elbows, and spent 2 hours fixing main water line leak..."'
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Pricing Parameters */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Trade Focus</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Auto Detailing">Auto Detailing</option>
                <option value="Solar / Roofing">Solar / Roofing</option>
                <option value="Handyman">Handyman</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Labor Rate ($/hr)</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Material Markup</label>
              <div className="relative">
                <input
                  type="number"
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-500 absolute right-2 top-2">%</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleParseEstimate}
            disabled={isLoading || !transcript.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Parsing Voice into Line Items & Detecting Leakage...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Generate Line Items & Leakage Check</span>
              </>
            )}
          </button>

          {/* AI Parsing Output */}
          {parseResult && (
            <div className="space-y-4 pt-3 border-t border-slate-800 animate-fadeIn">
              
              {/* Profit Leakage Alert Box */}
              {parseResult.leakageAlerts && parseResult.leakageAlerts.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-slate-900 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wide uppercase">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Profit Leakage Alert: Commonly Forgotten Items</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      +${parseResult.potentialSavingsRecovered} Recoverable Margin
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Technicians often forget small consumables, trip fees, or prep supplies. Tap to bill them:
                  </p>
                  <div className="space-y-2 pt-1">
                    {parseResult.leakageAlerts.map((alert, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/50 transition"
                      >
                        <div className="pr-2">
                          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{alert.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({alert.reason})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Wholesale: {formatCurrency(alert.suggestedCost)} → Bill Client: <strong className="text-emerald-400">{formatCurrency(alert.suggestedPrice)}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddLeakageItem(alert, i)}
                          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Quote</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Line Items */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Parsed Line Items ({parseResult.lineItems.length})</span>
                  <span className="text-amber-400 font-mono">
                    Total: {formatCurrency(parseResult.lineItems.reduce((acc, it) => acc + (it.total || 0), 0))}
                  </span>
                </div>
                <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                  {parseResult.lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-slate-900/50">
                      <div>
                        <div className="font-medium text-slate-100 flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                            item.category === 'material' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                            item.category === 'labor' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            item.category === 'consumable' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Qty: {item.quantity} {item.unit}</span>
                          <span>•</span>
                          <span>Cost: {formatCurrency(item.estimatedWholesaleCost)}</span>
                          <span>•</span>
                          <span>Markup: +{item.markupPercentage}%</span>
                          {item.supplierNote && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 italic">{item.supplierNote}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <div className="font-bold text-slate-100 text-sm font-mono">
                          {formatCurrency(item.total)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(item.unitPrice)}/{item.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope summary */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400 block font-semibold mb-1">Customer Scope of Work:</span>
                <p className="text-slate-200">{parseResult.jobSummary}</p>
                {parseResult.clientNotes && (
                  <p className="text-slate-400 italic text-[11px] mt-1.5">Note: {parseResult.clientNotes}</p>
                )}
              </div>

              {/* Confirm button */}
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <Check className="w-4 h-4" />
                <span>Apply Estimate to Job & Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
