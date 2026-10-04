import React, { useState } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Zap, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight,
  DollarSign,
  Receipt,
  FileCheck
} from 'lucide-react';
import { Job, PaymentDetails } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { CustomerSignaturePad } from './CustomerSignaturePad';
import { calculateJobFinancials, formatCurrency, playChime } from '../utils/calculations';

interface TapToPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onPaymentSuccess: (jobId: string, paymentDetails: PaymentDetails, signature?: string) => void;
}

export const TapToPayModal: React.FC<TapToPayModalProps> = ({
  isOpen,
  onClose,
  job,
  onPaymentSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'tap' | 'qr'>('tap');
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [customTip, setCustomTip] = useState<number | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(job.signature || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<PaymentDetails | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const financials = calculateJobFinancials(job);
  const baseTotal = financials.finalTotal;

  // Tip calculation
  const calculatedTip = customTip !== null 
    ? customTip 
    : tipPercent > 0 
      ? Number(((baseTotal * tipPercent) / 100).toFixed(2)) 
      : 0;

  const totalToPay = Number((baseTotal + calculatedTip).toFixed(2));

  // Fintech fee breakdown
  const stripeFee = Number((totalToPay * 0.029 + 0.30).toFixed(2));
  const platformFee = Number((totalToPay * 0.0075).toFixed(2)); // 0.75% SaaS cut
  const netTechnicianPayout = Number((totalToPay - stripeFee - platformFee).toFixed(2));

  const invoicePayUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/pay/${job.invoiceNumber.toLowerCase()}?amt=${totalToPay}`
    : `https://tradecost.pro/pay/${job.invoiceNumber}`;

  const triggerTapPayment = async () => {
    setIsProcessing(true);
    playChime('beep');

    // Simulate haptic feedback if mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 80, 150]);
    }

    try {
      const res = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: job.invoiceNumber,
          amount: baseTotal,
          tipAmount: calculatedTip,
          customerName: job.customerName,
          paymentMethod: activeTab === 'tap' ? 'Tap-to-Pay (NFC Contactless)' : 'Instant QR Payment Link'
        })
      });

      const data = await res.json();
      if (data.success) {
        const details: PaymentDetails = {
          transactionId: data.transactionId,
          method: data.paymentMethod,
          totalPaid: data.totalCharged,
          tipAmount: data.tipAmount,
          netPayout: data.breakdown.technicianNetPayout,
          stripeFee: data.breakdown.stripeProcessingFee,
          platformFee: data.breakdown.platformTakeRateFee,
          timestamp: data.timestamp
        };

        setSuccessDetails(details);
        setIsSuccess(true);
        playChime('success');

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200]);
        }

        onPaymentSuccess(job.id, details, customerSignature || undefined);
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(invoicePayUrl);
    setCopiedLink(true);
    playChime('beep');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-slate-800/60 to-sky-500/10 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>On-Site Payment Capture</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Stripe Connect
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Invoice {job.invoiceNumber} • {job.customerName}
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

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {isSuccess && successDetails ? (
            /* Success State */
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-100">
                  {formatCurrency(successDetails.totalPaid)} Paid
                </h4>
                <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Transaction Approved & Deposited via Stripe Connect
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Tx ID: {successDetails.transactionId}
                </p>
              </div>

              {/* Receipt Summary Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Job Subtotal:</span>
                  <span className="text-slate-200 font-mono">{formatCurrency(financials.finalTotal)}</span>
                </div>
                {successDetails.tipAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Customer Tip:</span>
                    <span className="text-emerald-400 font-mono">+{formatCurrency(successDetails.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Stripe Card Fee (2.9% + $0.30):</span>
                  <span className="text-slate-400 font-mono">-{formatCurrency(successDetails.stripeFee)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TradeCost Pro Fee (0.75% SaaS cut):</span>
                  <span className="text-slate-400 font-mono">-{formatCurrency(successDetails.platformFee)}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-2 text-sm">
                  <span className="text-emerald-400">Net Instant Payout:</span>
                  <span className="text-emerald-400 font-mono">{formatCurrency(successDetails.netPayout)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition"
              >
                Close & Return to Job
              </button>
            </div>
          ) : (
            /* Active Payment Form */
            <div className="space-y-4">
              
              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('tap')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                    activeTab === 'tap'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tap-to-Pay (NFC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                    activeTab === 'qr'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Invoice Link</span>
                </button>
              </div>

              {/* Amount Display */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 font-medium block">Total Due from Customer</span>
                <div className="text-3xl font-black text-slate-100 font-mono mt-1 tracking-tight">
                  {formatCurrency(totalToPay)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Invoice {formatCurrency(baseTotal)} {calculatedTip > 0 && `+ ${formatCurrency(calculatedTip)} tip`}
                </div>
              </div>

              {/* Technician Tip Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Customer Tip / Gratuity:</span>
                  <span className="font-semibold text-emerald-400">
                    {calculatedTip > 0 ? `+${formatCurrency(calculatedTip)}` : 'No Tip'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setTipPercent(pct);
                        setCustomTip(null);
                        playChime('beep');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                        customTip === null && tipPercent === pct
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {pct === 0 ? 'No Tip' : `${pct}% (${formatCurrency((baseTotal * pct) / 100)})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signature Pad */}
              <div className="space-y-1">
                <CustomerSignaturePad
                  existingSignature={customerSignature || undefined}
                  onSave={(sigUrl) => setCustomerSignature(sigUrl)}
                  onClear={() => setCustomerSignature(null)}
                />
              </div>

              {/* Active Tab View */}
              {activeTab === 'tap' ? (
                /* Tap to Pay NFC Screen */
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                  
                  {/* Glowing NFC rings */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-emerald-500/30 animate-pulse" />
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CreditCard className="w-9 h-9" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-100 text-sm">
                      Hold Card or Phone to Top of Device
                    </h5>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Accepts Apple Pay, Google Wallet, and contactless Visa / Mastercard / Amex chip cards.
                    </p>
                  </div>

                  {/* Simulate Tap button */}
                  <button
                    type="button"
                    onClick={triggerTapPayment}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                  >
                    {isProcessing ? (
                      <span>Reading Chip / Authorizing...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Simulate NFC Tap ({formatCurrency(totalToPay)})</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* QR Invoice Code */
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="text-xs font-semibold text-slate-300">
                    Homeowner Camera QR Code
                  </div>
                  <QRCodeDisplay value={invoicePayUrl} size={180} />
                  <p className="text-xs text-slate-400 max-w-xs">
                    Customer scans this QR code with their phone camera to pay instantly on their own screen.
                  </p>

                  <div className="flex gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={copyPaymentLink}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Pay Link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerTapPayment}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm QR Paid</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Monetization / Fintech Economics Footer */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Stripe Processing (2.9% + 30¢):</span>
                  <span className="font-mono text-slate-300">-{formatCurrency(stripeFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TradeCost Pro Platform Fee (0.75%):</span>
                  <span className="font-mono text-slate-300">-{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
                  <span>Estimated Net Payout:</span>
                  <span className="font-mono">{formatCurrency(netTechnicianPayout)}</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
