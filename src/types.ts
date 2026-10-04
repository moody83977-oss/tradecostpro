export type TradeType = 
  | 'Plumbing' 
  | 'HVAC' 
  | 'Electrical' 
  | 'Auto Detailing' 
  | 'Solar / Roofing' 
  | 'Handyman';

export interface LineItem {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'service' | 'consumable' | 'discount';
  quantity: number;
  unit: string;
  estimatedWholesaleCost: number;
  markupPercentage: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
  supplierNote?: string;
}

export interface LeakageAlert {
  title: string;
  reason: string;
  suggestedCost: number;
  suggestedPrice: number;
  category: 'material' | 'consumable' | 'service';
}

export interface PaymentDetails {
  transactionId: string;
  method: string;
  totalPaid: number;
  tipAmount: number;
  netPayout: number;
  stripeFee: number;
  platformFee: number;
  timestamp: string;
}

export interface Job {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  jobAddress: string;
  trade: TradeType | string;
  status: 'draft' | 'in_progress' | 'ready_to_bill' | 'paid';
  title: string;
  scopeSummary: string;
  createdAt: string;
  dueDate?: string;
  lineItems: LineItem[];
  taxRate: number; // percentage (e.g. 8.25)
  discount: number; // dollar amount
  clientNotes: string;
  technicianNotes?: string;
  signature?: string; // data URI or SVG string
  paidAt?: string;
  paymentDetails?: PaymentDetails;
  recoveredLeakageAmount?: number;
}

export interface SupplierPart {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  wholesaleCost: number;
  retailPrice: number;
  unit: string;
  recommendedMarkup: number;
  inStock: boolean;
  localAisle?: string;
  specs?: string;
}

export interface ContractorSettings {
  businessName: string;
  technicianName: string;
  phone: string;
  email: string;
  trade: TradeType;
  defaultHourlyRate: number;
  defaultMaterialMarkup: number;
  taxRate: number;
  dispatchFee: number;
  subscriptionTier: 'starter' | 'pro' | 'elite';
  stripeConnectActive: boolean;
  sunlightMode: boolean;
}
