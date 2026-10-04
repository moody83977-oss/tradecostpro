import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI();

const SUPPLIER_PARTS_DATABASE = [
  {
    id: 'plumb-01',
    sku: 'SHKB-34-TEE',
    name: 'SharkBite 3/4 in. Push-to-Connect Brass Tee',
    category: 'Plumbing',
    supplier: 'The Home Depot',
    wholesaleCost: 12.48,
    retailPrice: 16.98,
    unit: 'ea',
    inStock: true,
    localAisle: 'Aisle 14, Bay 08'
  },
  {
    id: 'plumb-02',
    sku: 'COP-34-BALL',
    name: 'Apollo 3/4 in. Brass Sweat Ball Valve (Lead Free)',
    category: 'Plumbing',
    supplier: 'Ferguson Supply',
    wholesaleCost: 14.20,
    retailPrice: 22.50,
    unit: 'ea',
    inStock: true,
    localAisle: 'Plumbing Valves Section'
  },
  {
    id: 'plumb-03',
    sku: 'PVC-2-ELB40',
    name: '2 in. PVC Schedule 40 90-Degree DWV Elbow',
    category: 'Plumbing',
    supplier: "Lowe's Home Improvement",
    wholesaleCost: 2.15,
    retailPrice: 4.48,
    unit: 'ea',
    inStock: true,
    localAisle: 'Aisle 18, Rack 03'
  },
  {
    id: 'plumb-04',
    sku: 'PVC-2-PIPE10',
    name: '2 in. x 10 ft. Schedule 40 Solid Core PVC Pipe',
    category: 'Plumbing',
    supplier: 'The Home Depot',
    wholesaleCost: 13.90,
    retailPrice: 21.98,
    unit: '10ft stick',
    inStock: true,
    localAisle: 'Lumber/Pipe Yard Bay 4'
  },
  {
    id: 'hvac-01',
    sku: 'CAP-45-5-RND',
    name: 'Titan Pro 45/5 MFD 440/370V Round Dual Run Capacitor',
    category: 'HVAC',
    supplier: 'Johnstone Supply',
    wholesaleCost: 11.85,
    retailPrice: 38.00,
    unit: 'ea',
    inStock: true,
    localAisle: 'Electrical Components Bay 2'
  },
  {
    id: 'hvac-02',
    sku: 'REF-R410A-25',
    name: 'R-410A Refrigerant Cylinder 25 lb. Virgin Gas',
    category: 'HVAC',
    supplier: 'United Refrigeration',
    wholesaleCost: 135.00,
    retailPrice: 245.00,
    unit: 'tank',
    inStock: true,
    localAisle: 'EPA Certified Cage'
  },
  {
    id: 'elec-01',
    sku: 'SQD-HOM-20AFCI',
    name: 'Square D Homeline 20 Amp Single-Pole Combination AFCI Circuit Breaker',
    category: 'Electrical',
    supplier: 'The Home Depot',
    wholesaleCost: 38.50,
    retailPrice: 56.97,
    unit: 'ea',
    inStock: true,
    localAisle: 'Aisle 05, Bay 11'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverless: true, time: new Date().toISOString() });
});

app.get('/api/supplier-catalog', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  let results = SUPPLIER_PARTS_DATABASE;

  if (query) {
    results = results.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.supplier.toLowerCase().includes(query)
    );
  }

  res.json({ count: results.length, parts: results });
});

app.post('/api/parse-voice-estimate', async (req, res) => {
  try {
    const { text, trade = 'General Trade', hourlyRate = 110, defaultMarkup = 40 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text transcript required' });

    const prompt = `You are TradeCost Pro's AI Job Estimator & Leakage Detector for field trade technicians.
Job summary: "${text}". Trade: ${trade}. Labor rate: $${hourlyRate}/hr. Markup: ${defaultMarkup}%.
Output JSON with:
1. "detectedTrade"
2. "jobSummary"
3. "lineItems": array of objects with id, name, category, quantity, unit, estimatedWholesaleCost, markupPercentage, unitPrice, total, taxable
4. "leakageAlerts": array of objects with title, reason, suggestedCost, suggestedPrice, category
5. "potentialSavingsRecovered": number
6. "clientNotes": string
Return JSON only.`;

    let responseText = '';
    const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    for (const m of models) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.2 },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Vercel model ${m} failed:`, err);
      }
    }

    if (responseText) {
      return res.json({ success: true, data: JSON.parse(responseText) });
    }

    // Heuristic fallback
    return res.json({
      success: true,
      data: {
        detectedTrade: trade,
        jobSummary: text.slice(0, 100) + '...',
        lineItems: [
          {
            id: 'li-v1',
            name: `${trade} Field Labor`,
            category: 'labor',
            quantity: 2,
            unit: 'hrs',
            estimatedWholesaleCost: hourlyRate * 0.5,
            markupPercentage: 0,
            unitPrice: hourlyRate,
            total: 2 * hourlyRate,
            taxable: false
          }
        ],
        leakageAlerts: [
          {
            title: 'Shop Consumables & Truck Roll',
            reason: 'Consumables often left off quote',
            suggestedCost: 15,
            suggestedPrice: 45,
            category: 'service'
          }
        ],
        potentialSavingsRecovered: 45,
        clientNotes: 'Work completed per code specifications.'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/lookup-materials', async (req, res) => {
  const query = (req.body.query || '').toLowerCase();
  const matched = SUPPLIER_PARTS_DATABASE.filter(p => p.name.toLowerCase().includes(query));
  return res.json({ query, count: matched.length, results: matched });
});

app.post('/api/process-payment', (req, res) => {
  const { invoiceId, amount, tipAmount = 0, customerName, paymentMethod } = req.body;
  const totalCharged = Number(amount) + Number(tipAmount);
  const stripeFee = Number((totalCharged * 0.029 + 0.30).toFixed(2));
  const platformFee = Number((totalCharged * 0.0075).toFixed(2));
  const netPayout = Number((totalCharged - stripeFee - platformFee).toFixed(2));

  res.json({
    success: true,
    transactionId: 'ch_' + Math.random().toString(36).substring(2, 11),
    invoiceId,
    customerName: customerName || 'Customer',
    totalCharged,
    tipAmount,
    breakdown: {
      invoiceAmount: Number(amount),
      tipAmount: Number(tipAmount),
      stripeProcessingFee: stripeFee,
      platformTakeRateFee: platformFee,
      technicianNetPayout: netPayout
    },
    paymentMethod: paymentMethod || 'tap_to_pay_contactless',
    status: 'succeeded',
    timestamp: new Date().toISOString()
  });
});

export default app;
