import { Job, LineItem } from '../types';

export interface JobFinancials {
  materialsCost: number;
  materialsRevenue: number;
  materialsMargin: number;
  laborCost: number;
  laborRevenue: number;
  laborHours: number;
  consumablesRevenue: number;
  subtotal: number;
  taxableSubtotal: number;
  taxAmount: number;
  discount: number;
  finalTotal: number;
  totalContractorCost: number;
  netProfit: number;
  grossMarginPercentage: number;
  leakageRecovered: number;
}

export function calculateJobFinancials(job: Job): JobFinancials {
  let materialsCost = 0;
  let materialsRevenue = 0;
  let laborCost = 0;
  let laborRevenue = 0;
  let laborHours = 0;
  let consumablesRevenue = 0;
  let subtotal = 0;
  let taxableSubtotal = 0;

  for (const item of job.lineItems) {
    const itemTotal = Number(item.total) || (Number(item.quantity) * Number(item.unitPrice)) || 0;
    const itemCost = (Number(item.estimatedWholesaleCost) || 0) * (Number(item.quantity) || 1);

    subtotal += itemTotal;
    if (item.taxable) {
      taxableSubtotal += itemTotal;
    }

    if (item.category === 'material') {
      materialsCost += itemCost;
      materialsRevenue += itemTotal;
    } else if (item.category === 'labor') {
      laborCost += itemCost;
      laborRevenue += itemTotal;
      laborHours += Number(item.quantity) || 0;
    } else if (item.category === 'consumable') {
      materialsCost += itemCost;
      consumablesRevenue += itemTotal;
    }
  }

  const discount = Number(job.discount) || 0;
  const taxableAfterDiscount = Math.max(0, taxableSubtotal - discount);
  const taxAmount = Number(((taxableAfterDiscount * (Number(job.taxRate) || 0)) / 100).toFixed(2));
  const finalTotal = Math.max(0, subtotal - discount + taxAmount);

  const totalContractorCost = materialsCost + laborCost;
  const netProfit = Math.max(0, finalTotal - taxAmount - totalContractorCost);
  const grossMarginPercentage = finalTotal > 0 ? Number(((netProfit / (finalTotal - taxAmount)) * 100).toFixed(1)) : 0;
  const materialsMargin = materialsRevenue > 0 ? Number((((materialsRevenue - materialsCost) / materialsRevenue) * 100).toFixed(1)) : 0;

  return {
    materialsCost: Number(materialsCost.toFixed(2)),
    materialsRevenue: Number(materialsRevenue.toFixed(2)),
    materialsMargin,
    laborCost: Number(laborCost.toFixed(2)),
    laborRevenue: Number(laborRevenue.toFixed(2)),
    laborHours: Number(laborHours.toFixed(1)),
    consumablesRevenue: Number(consumablesRevenue.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    taxableSubtotal: Number(taxableSubtotal.toFixed(2)),
    taxAmount,
    discount,
    finalTotal: Number(finalTotal.toFixed(2)),
    totalContractorCost: Number(totalContractorCost.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    grossMarginPercentage,
    leakageRecovered: job.recoveredLeakageAmount || 0,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// Play pleasant field sound chime using standard Web Audio API
export function playChime(type: 'beep' | 'success' | 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6 triumphant POS chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // audio context might require user interaction or not supported
  }
}
