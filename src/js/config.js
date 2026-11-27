/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

const STORAGE_KEY = 'haha_replace_v22_projects';
const ACTIVE_KEY  = 'haha_replace_v22_active';
const LANG_KEY    = 'haha_replace_v22_lang';

const MODELS = [
  { id: 'mini360',    name: 'Mini 360',    msrp: 2999, tag: 'compact' },
  { id: 'plus440',    name: 'Plus 440',    msrp: 3499, tag: 'standard' },
  { id: 'pro542',     name: 'Pro 542',     msrp: 4499, tag: 'bestseller' },
  { id: 'max620s',    name: 'Max 620S',    msrp: 5499, tag: 'flagship' },
  { id: 'max660',     name: 'Max 660',     msrp: 5099, tag: 'large' },
  { id: 'ultra1200',  name: 'Ultra 1200',  msrp: 6999, tag: 'double' },
  { id: 'freezer550', name: 'Freezer 550', msrp: 4999, tag: 'frozen' }
];

const QUADRANT_BASE = {
  1: { variety: 12, basket: 10, stock: 8, payment: 5 },
  2: { variety: 7,  basket: 5,  stock: 5, payment: 3 },
  3: { variety: 10, basket: 8,  stock: 7, payment: 4 },
  4: { variety: 4,  basket: 3,  stock: 3, payment: 2 }
};

const FREIGHT_FEE = 250;
const REVENUE_LINE = 1200;
const URGENCY_HIGH_LINE = 60;

function createBlankProject(locationName) {
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    schemaVersion: 2,
    scoringVersion: 2,
    updatedAt: new Date().toISOString(),
    meta: {
      locationName: locationName || '',
      venue: 'office',
      city: '',
      state: '',
      date: todayStr()
    },
    machine: {
      type: 'snack',
      age: '',
      condition: '',
      monitoring: '',
      payments: []
    },
    diag: { q1: null, q2: null, q3: null, q4: null, q5: null, q6: null },
    baseline: {
      monthlySales: '',
      monthlyOrders: '',
      ordersEstimated: false,
      profitMode: 'actual', // 'actual' | 'margin' | 'detail'
      actualProfit: '',
      estMarginPct: 28,
      cogsRate: 45,
      cashlessShare: 78,
      cardFee: 5.95,
      readerFee: 9.95,
      platform: 0,
      other: 0
    },
    site: {
      deal: 'share', // 'share' | 'rent' | 'combo' | 'none'
      share: 10,
      rent: 0,
      overrideDeal: false,
      hahaShare: 10,
      hahaRent: 0
    },
    uplift: {
      initialized: false,
      _baseQ: 0,
      variety: { accept: 'partial', pct: 6, custom: false },
      basket:  { accept: 'partial', pct: 5, custom: false },
      stock:   { accept: 'partial', pct: 4, custom: false },
      payment: { accept: 'partial', pct: 2.5, custom: false }
    },
    haha: {
      cogsRate: 45,
      processing: 5.95,
      shrinkage: 1.5,
      saas: 15,
      sim: 15,
      pos: 10,
      aiPerOrder: 0.05,
      maintenance: 15,
      other: 0
    },
    invest: {
      modelId: 'pro542',
      modelManual: false,
      freight: true,
      install: 0,
      removal: 0,
      tradeIn: 0,
      finance: {
        enabled: false,
        downPct: 10,
        term: 12,
        apr: 0,
        docFee: 50
      }
    }
  };
}

function createSampleProject() {
  const p = createBlankProject('Breakroom #1 — Bldg A');
  p.meta = {
    locationName: 'Breakroom #1 — Bldg A',
    venue: 'office',
    city: 'Austin',
    state: 'TX',
    date: todayStr()
  };
  p.machine = {
    type: 'snack',
    age: 9,
    condition: 'fair',
    monitoring: 'no',
    payments: ['coin', 'bill']
  };
  p.diag = { q1: 10, q2: 10, q3: 5, q4: 10, q5: 10, q6: 10 };
  p.baseline.monthlySales = 1800;
  p.baseline.monthlyOrders = 720;
  p.baseline.profitMode = 'actual';
  p.baseline.actualProfit = 500;
  p.site = { deal: 'share', share: 10, rent: 0, overrideDeal: false, hahaShare: 10, hahaRent: 0 };
  p.uplift = {
    initialized: true,
    _baseQ: 1,
    variety: { accept: 'yes', pct: 12, custom: false },
    basket:  { accept: 'yes', pct: 10, custom: false },
    stock:   { accept: 'yes', pct: 8, custom: false },
    payment: { accept: 'yes', pct: 5, custom: false }
  };
  p.invest.modelId = 'pro542';
  p.invest.modelManual = false;
  p.invest.freight = true;
  p.invest.finance = { enabled: false, downPct: 10, term: 12, apr: 0, docFee: 50 };
  return p;
}

function dealTerms(deal, share, rent) {
  const shareOn = deal === 'share' || deal === 'combo';
  const rentOn = deal === 'rent' || deal === 'combo';
  return {
    share: shareOn ? clamp(num(share), 0, 100) : 0,
    rent: rentOn ? Math.max(0, num(rent)) : 0
  };
}

function amortize(principal, aprPct, months) {
  const p = Math.max(0, num(principal));
  const n = Math.max(1, Math.round(num(months)));
  const r = Math.max(0, num(aprPct)) / 100 / 12;
  if (p === 0) return 0;
  if (r === 0) return p / n;
  const f = Math.pow(1 + r, n);
  return (p * r * f) / (f - 1);
}

function recommendedModel(dailyOrders, machineType) {
  if (machineType === 'frozen') return 'freezer550';
  if (dailyOrders > 50) return 'ultra1200';
  if (dailyOrders >= 35) return 'max620s';
  if (dailyOrders >= 15) return 'pro542';
  return 'mini360';
}
