/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

function num(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function round1(v) { return Math.round(v * 10) / 10; }

function interestPaidWithin(principal, aprPct, months, horizon) {
  const p = Math.max(0, num(principal));
  const n = Math.max(1, Math.round(num(months)));
  const r = Math.max(0, num(aprPct)) / 100 / 12;
  if (p === 0 || r === 0) return 0;
  const pmt = amortize(p, aprPct, n);
  let balance = p;
  let interest = 0;
  const count = Math.min(Math.max(0, Math.round(num(horizon))), n);
  for (let i = 0; i < count; i++) {
    const part = balance * r;
    interest += part;
    balance = Math.max(0, balance - (pmt - part));
  }
  return interest;
}

function compute(p) {
  /* 1. Replacement Urgency Score (0–100): Hardware Pain (0–40) + 6 Diagnostics (0–60) */
  const ageKnown = p.machine.age !== '' && p.machine.age !== null && p.machine.age !== undefined;
  const ageVal = num(p.machine.age);
  const agePts = !ageKnown ? 0 : (ageVal >= 7 ? 12 : ageVal >= 4 ? 6 : 0);
  const pays = Array.isArray(p.machine.payments) ? p.machine.payments : [];
  const payAnswered = pays.length > 0;
  const hasCard = pays.includes('card');
  const hasMobile = pays.includes('mobile');
  const payPts = !payAnswered ? 0 : ((!hasCard && !hasMobile) ? 12 : (!hasMobile ? 5 : 0));
  const monPts = p.machine.monitoring === 'no' ? 8 : 0;
  const condPts = p.machine.condition === 'poor' ? 8 : (p.machine.condition === 'fair' ? 4 : 0);
  const hwPts = clamp(agePts + payPts + monPts + condPts, 0, 40);

  const diagKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  const diagValues = diagKeys.map(k => p.diag[k]);
  const diagAnswered = diagValues.every(v => v === 0 || v === 5 || v === 10);
  const offensePts = num(p.diag.q1) + num(p.diag.q2) + num(p.diag.q3); // 0–30
  const defensePts = num(p.diag.q4) + num(p.diag.q5) + num(p.diag.q6); // 0–30
  const commercialPts = clamp(offensePts + defensePts, 0, 60);
  const urgencyTotal = clamp(hwPts + commercialPts, 0, 100);
  const urgencyTier = urgencyTotal >= 75 ? 'strong' : urgencyTotal >= 50 ? 'model' : 'low';
  const step1Complete = !!(String(p.meta.locationName || '').trim() && ageKnown &&
    ['good', 'fair', 'poor'].includes(p.machine.condition) &&
    ['yes', 'no'].includes(p.machine.monitoring) &&
    payAnswered && diagAnswered);

  const hiddenRepairRisk = (ageKnown && ageVal >= 7) || p.machine.condition === 'poor';

  const rationale = [];
  if (ageKnown && ageVal >= 7) rationale.push({ code: 'age', vars: { years: Math.round(ageVal) } });
  if (p.machine.condition === 'poor') rationale.push({ code: 'condition' });
  if (payAnswered && !hasCard && !hasMobile) rationale.push({ code: 'noCashless' });
  else if (payAnswered && !hasMobile) rationale.push({ code: 'noMobile' });
  if (p.machine.monitoring === 'no') rationale.push({ code: 'monitoring' });
  if (num(p.diag.q1) === 10) rationale.push({ code: 'marginCeiling' });
  if (num(p.diag.q5) === 10) rationale.push({ code: 'retention' });
  if (num(p.diag.q4) === 10) rationale.push({ code: 'friction' });
  if (!rationale.length && step1Complete) rationale.push({ code: 'default' });

  /* 2. Single-Source Sales Baseline (30-day backend basis) */
  const b = p.baseline;
  const oldSales = Math.max(0, num(b.monthlySales));
  const oldMonthlyOrders = Math.max(0, num(b.monthlyOrders));
  const oldOrdersEstimated = !!b.ordersEstimated;
  const oldDailyOrders = oldMonthlyOrders / 30;
  const oldAov = oldMonthlyOrders > 0 ? oldSales / oldMonthlyOrders : 0;

  const siteTerms = dealTerms(p.site.deal, p.site.share, p.site.rent);
  const oldSiteFee = oldSales * siteTerms.share / 100 + siteTerms.rent;

  const oldDetail = {
    cogs: oldSales * clamp(num(b.cogsRate), 0, 100) / 100,
    commission: oldSiteFee,
    processing: oldSales * clamp(num(b.cashlessShare), 0, 100) / 100 * clamp(num(b.cardFee), 0, 100) / 100,
    reader: Math.max(0, num(b.readerFee)),
    platform: Math.max(0, num(b.platform)),
    other: Math.max(0, num(b.other))
  };

  let oldProfit = 0;
  let oldCost = 0;
  if (b.profitMode === 'actual') {
    oldProfit = num(b.actualProfit);
    oldCost = oldSales - oldProfit;
  } else if (b.profitMode === 'detail') {
    oldCost = oldDetail.cogs + oldDetail.commission + oldDetail.processing + oldDetail.reader + oldDetail.platform + oldDetail.other;
    oldProfit = oldSales - oldCost;
  } else {
    oldProfit = oldSales * clamp(num(b.estMarginPct), 0, 100) / 100;
    oldCost = oldSales - oldProfit;
  }
  const oldMargin = oldSales > 0 ? (oldProfit / oldSales) * 100 : 0;

  /* 3. Silent Quadrant Derivation (Sales >= $1,200 & Urgency >= 60) */
  const highRev = oldSales >= REVENUE_LINE;
  const highUrg = urgencyTotal >= URGENCY_HIGH_LINE;
  const quadrantId = highRev ? (highUrg ? 1 : 2) : (highUrg ? 3 : 4);

  /* 4. Growth Consensus with Exact Pro-Rata Cap Scaling */
  const up = p.uplift;
  const vPct = Math.max(0, num(up.variety.pct));
  const sPct = Math.max(0, num(up.stock.pct));
  const pPct = Math.max(0, num(up.payment.pct));
  const bPct = Math.max(0, num(up.basket.pct));

  const orderRaw = vPct + sPct + pPct;
  const orderCapped = orderRaw > 40;
  const orderPct = clamp(orderRaw, 0, 40);
  const orderScale = orderRaw > 0 ? (orderPct / orderRaw) : 1;

  const aovCapped = bPct > 25;
  const aovPct = clamp(bPct, 0, 25);

  const hahaMonthlyOrders = oldMonthlyOrders * (1 + orderPct / 100);
  const hahaDailyOrders = hahaMonthlyOrders / 30;
  const hahaAov = oldAov * (1 + aovPct / 100);
  const hahaSales = hahaMonthlyOrders * hahaAov;

  const varietyRev = ((vPct * orderScale) / 100) * oldSales;
  const stockRev   = ((sPct * orderScale) / 100) * oldSales;
  const paymentRev = ((pPct * orderScale) / 100) * oldSales;
  const basketRev  = hahaMonthlyOrders * (hahaAov - oldAov);
  const totalRevenueGrowth = hahaSales - oldSales;
  const totalRevenueGrowthPct = oldSales > 0 ? (totalRevenueGrowth / oldSales) * 100 : 0;
  const appliedPct = {
    variety: vPct * orderScale,
    basket: aovPct,
    stock: sPct * orderScale,
    payment: pPct * orderScale
  };

  /* 5. HAHA P&L */
  const h = p.haha;
  const hahaTerms = p.site.overrideDeal
    ? dealTerms(p.site.deal, p.site.hahaShare, p.site.hahaRent)
    : siteTerms;

  const cogsRate = clamp(num(h.cogsRate), 0, 100);
  const procRate = clamp(num(h.processing), 0, 100);
  const shrinkRate = clamp(num(h.shrinkage), 0, 100);
  const aiPerOrder = Math.max(0, num(h.aiPerOrder));

  const hahaCogs = hahaSales * cogsRate / 100;
  const hahaShareCost = hahaSales * hahaTerms.share / 100;
  const hahaRent = hahaTerms.rent;
  const hahaSiteFee = hahaShareCost + hahaRent;
  const hahaProcessing = hahaSales * procRate / 100;
  const hahaShrinkage = hahaSales * shrinkRate / 100;
  const hahaFixed = Math.max(0, num(h.saas)) + Math.max(0, num(h.sim)) + Math.max(0, num(h.pos)) + Math.max(0, num(h.maintenance)) + Math.max(0, num(h.other));
  const hahaAi = hahaMonthlyOrders * aiPerOrder;

  const hahaCost = hahaCogs + hahaSiteFee + hahaProcessing + hahaShrinkage + hahaFixed + hahaAi;
  const hahaProfit = hahaSales - hahaCost;
  const hahaMargin = hahaSales > 0 ? (hahaProfit / hahaSales) * 100 : 0;

  const varRateSum = (cogsRate + hahaTerms.share + procRate + shrinkRate) / 100;
  const fixedTotal = hahaFixed + hahaRent;
  const zeroGrowthProfit = oldSales - (oldSales * varRateSum) - fixedTotal - (oldMonthlyOrders * aiPerOrder);

  /* 6. Model Recommendation (Daily Orders + Frozen Machine Type) & Net Investment */
  const basisDailyOrders = hahaDailyOrders > 0 ? hahaDailyOrders : oldDailyOrders;
  const recModelId = recommendedModel(basisDailyOrders, p.machine.type);
  const effectiveModelId = p.invest.modelManual ? p.invest.modelId : recModelId;
  const activeModel = MODELS.find(m => m.id === effectiveModelId) || MODELS[2];

  const equipment = activeModel.msrp;
  const freight = p.invest.freight ? FREIGHT_FEE : 0;
  const install = Math.max(0, num(p.invest.install));
  const removal = Math.max(0, num(p.invest.removal));
  const tradeIn = Math.max(0, num(p.invest.tradeIn));
  const investment = Math.max(0, equipment + freight + install + removal - tradeIn);

  const delta = hahaProfit - oldProfit;
  const annualDelta = delta * 12;
  const payback = delta > 0 ? investment / delta : Infinity;
  const standalonePayback = hahaProfit > 0 ? investment / hahaProfit : Infinity;

  /* 7. Financing (CRITICAL: docFee ONLY at signing, NEVER inside principal) */
  const f = p.invest.finance;
  const financed = !!(f.enabled && investment > 0);
  const down = investment * clamp(num(f.downPct), 0, 100) / 100;
  const docFee = Math.max(0, num(f.docFee));
  const principal = Math.max(0, investment - down);
  const finMonths = clamp(Math.round(num(f.term) || 12), 1, 120);
  const apr = Math.max(0, num(f.apr));
  const payment = amortize(principal, apr, finMonths);
  const cashDueAtSigning = financed ? (down + docFee) : investment;
  const totalPaid = financed ? (payment * finMonths + down + docFee) : investment;
  const totalInterest = financed ? Math.max(0, payment * finMonths - principal) : 0;
  const coverage = payment > 0 ? hahaProfit / payment : Infinity;
  const cashAfter = hahaProfit - payment;
  const vsOldCash = cashAfter - oldProfit;
  const selfFunding = financed && payment > 0 && hahaProfit >= payment && delta > 0 && vsOldCash >= 0;
  const financingCost36 = financed ? interestPaidWithin(principal, apr, finMonths, 36) + docFee : 0;
  const threeYearNet = delta * 36 - investment - financingCost36;
  const roi3 = investment > 0 ? (threeYearNet / investment) * 100 : 0;

  /* 8. Stress Test (100% / 80% / 60% of projected sales) */
  const stress = [1, 0.8, 0.6].map(scale => {
    const sSales = hahaSales * scale;
    const sOrders = hahaMonthlyOrders * scale;
    const sProfit = sSales - (sSales * varRateSum) - fixedTotal - (sOrders * aiPerOrder);
    const sDelta = sProfit - oldProfit;
    return {
      scale,
      sales: sSales,
      profit: sProfit,
      delta: sDelta,
      payback: sDelta > 0 ? investment / sDelta : Infinity,
      coverage: payment > 0 ? sProfit / payment : Infinity
    };
  });

  /* 9. Business Viability Verdict (No internal A/B grade jargon) */
  const hasData = oldSales > 0 && oldMonthlyOrders > 0;
  const relGain = oldProfit > 0 ? delta / oldProfit : (delta >= 200 ? 1 : 0);
  let verdict = 'defer'; // 'strong' | 'positive' | 'conditional' | 'defer'
  if (hasData && delta > 0) {
    if (payback <= 24 && relGain >= 0.2 && (!financed || coverage >= 1.5)) verdict = 'strong';
    else if (payback <= 36 && (!financed || coverage >= 1.2)) verdict = 'positive';
    else if (payback <= 48) verdict = 'conditional';
  }
  const viable = verdict === 'strong' || verdict === 'positive';

  /* 10. Warnings */
  const warnings = [];
  if (!hasData) warnings.push({ level: 'info', code: 'noSales' });
  if (orderCapped) warnings.push({ level: 'warn', code: 'orderCap' });
  if (aovCapped) warnings.push({ level: 'warn', code: 'aovCap' });
  if (financed && coverage < 1.25) warnings.push({ level: 'warn', code: 'coverageLow', vars: { coverage: coverage.toFixed(2) } });
  if (financed && vsOldCash < 0) warnings.push({ level: 'warn', code: 'cashBelowOld' });
  if (hasData && delta > 0 && payback > 36) warnings.push({ level: 'warn', code: 'longPayback', vars: { months: payback.toFixed(0) } });

  return {
    hasData,
    step1Complete,
    urgency: { total: urgencyTotal, hwPts, commercialPts, offensePts, defensePts, tier: urgencyTier, complete: step1Complete, diagAnswered, payAnswered, ageKnown },
    hiddenRepairRisk,
    rationale,
    quadrantId,
    siteTerms,
    hahaTerms,
    old: { sales: oldSales, monthlyOrders: oldMonthlyOrders, dailyOrders: oldDailyOrders, aov: oldAov, siteFee: oldSiteFee, profit: oldProfit, cost: oldCost, margin: oldMargin, detail: oldDetail, ordersEstimated: oldOrdersEstimated },
    growth: { orderRaw, orderPct, orderScale, aovPct, orderCapped, aovCapped, appliedPct, varietyRev, stockRev, paymentRev, basketRev, totalRevenueGrowth, totalRevenueGrowthPct },
    haha: { sales: hahaSales, monthlyOrders: hahaMonthlyOrders, dailyOrders: hahaDailyOrders, aov: hahaAov, cogs: hahaCogs, shareCost: hahaShareCost, rent: hahaRent, siteFee: hahaSiteFee, processing: hahaProcessing, shrinkage: hahaShrinkage, fixed: hahaFixed, ai: hahaAi, cost: hahaCost, profit: hahaProfit, margin: hahaMargin, zeroGrowthProfit },
    invest: { recModelId, effectiveModelId, model: activeModel, equipment, freight, install, removal, tradeIn, total: investment, delta, annualDelta, payback, standalonePayback, threeYearNet, roi3 },
    finance: { enabled: financed, down, docFee, principal, months: finMonths, apr, payment, cashDueAtSigning, totalPaid, totalInterest, financingCost36, coverage, cashAfter, vsOldCash, selfFunding },
    stress,
    verdict,
    viable,
    warnings,
    siteEarnings: { monthly: hahaSiteFee, annual: hahaSiteFee * 12 }
  };
}

function syncUpliftBase(p, force) {
  const q = compute(p).quadrantId;
  if (!force && p.uplift.initialized && p.uplift._baseQ === q) return;
  ['variety', 'basket', 'stock', 'payment'].forEach(k => {
    if (force || !p.uplift[k].custom) {
      const f = p.uplift[k].accept === 'yes' ? 1 : p.uplift[k].accept === 'partial' ? 0.5 : 0;
      p.uplift[k].pct = round1(QUADRANT_BASE[q][k] * f);
      if (force) p.uplift[k].custom = false;
    }
  });
  p.uplift.initialized = true;
  p.uplift._baseQ = q;
}

/* Step completion is based on the current data, not on a "visited" flag.
   Clearing a required field re-locks the forward action. */
function validateStep1(p) {
  if (!p) return { ok: false, missing: ['project'] };
  const missing = [];
  if (!String(p.meta.locationName || '').trim()) missing.push('locationName');
  if (p.machine.age === '' || p.machine.age === null || p.machine.age === undefined) missing.push('machineAge');
  if (!['good', 'fair', 'poor'].includes(p.machine.condition)) missing.push('condition');
  if (!['yes', 'no'].includes(p.machine.monitoring)) missing.push('monitoring');
  if (!Array.isArray(p.machine.payments) || !p.machine.payments.length) missing.push('payments');
  const diagOk = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].every(k => [0, 5, 10].includes(p.diag[k]));
  if (!diagOk) missing.push('diag');
  return { ok: missing.length === 0, missing };
}

function validateStep2(p) {
  if (!p) return { ok: false, missing: ['project'] };
  const b = p.baseline;
  const f = p.invest.finance;
  const missing = [];

  if (!(num(b.monthlySales) > 0)) missing.push('monthlySales');
  if (!(num(b.monthlyOrders) > 0)) missing.push('monthlyOrders');
  if (!['actual', 'margin', 'detail'].includes(b.profitMode)) missing.push('profitMode');
  if (b.profitMode === 'actual' && (b.actualProfit === '' || b.actualProfit === null || b.actualProfit === undefined)) missing.push('actualProfit');
  if (b.profitMode === 'margin' && !(num(b.estMarginPct) >= 0 && num(b.estMarginPct) <= 100)) missing.push('estMarginPct');

  if (!['share', 'rent', 'combo', 'none'].includes(p.site.deal)) missing.push('siteDeal');
  if ((p.site.deal === 'share' || p.site.deal === 'combo') && !(num(p.site.share) >= 0 && num(p.site.share) <= 100)) missing.push('siteShare');
  if ((p.site.deal === 'rent' || p.site.deal === 'combo') && !(num(p.site.rent) >= 0)) missing.push('siteRent');

  if (!MODELS.some(m => m.id === p.invest.modelId)) missing.push('model');

  if (f.enabled) {
    if (!(num(f.downPct) >= 0 && num(f.downPct) <= 100)) missing.push('downPct');
    if (!(num(f.term) >= 1 && num(f.term) <= 72)) missing.push('term');
    if (!(num(f.apr) >= 0)) missing.push('apr');
    if (!(num(f.docFee) >= 0)) missing.push('docFee');
  }

  return { ok: missing.length === 0, missing };
}

function canEnterStep(step, p) {
  if (!p) return false;
  if (step === 'step1' || step === 'dashboard' || step === 'projects') return true;
  const s1 = validateStep1(p);
  if (step === 'step2') return s1.ok;
  if (step === 'step3') return s1.ok && validateStep2(p).ok;
  return true;
}

function stepMissingText(step, p) {
  if (!p) return t('validate.project');
  if (step === 'step1') {
    const s1 = validateStep1(p);
    return s1.ok ? t('s1.footerReady') : t('validate.need', { items: s1.missing.map(k => t('validate.' + k)).join(' · ') });
  }
  if (step === 'step2') {
    const s1 = validateStep1(p);
    if (!s1.ok) return t('validate.step1First');
    const s2 = validateStep2(p);
    return s2.ok ? t('s2.footerReady') : t('validate.need', { items: s2.missing.map(k => t('validate.' + k)).join(' · ') });
  }
  return '';
}

function newCashAtMonth(m, i) {
  const f = m.finance;
  if (f.enabled) {
    const paidMonths = Math.min(i, f.months);
    return m.haha.profit * i - f.cashDueAtSigning - f.payment * paidMonths;
  }
  return m.haha.profit * i - m.invest.total;
}

function cumulativeSvg(m, w, h) {
  w = w || 680;
  h = h || 215;
  const months = 36;
  const oldEnd = m.old.profit * months;
  const newStart = newCashAtMonth(m, 0);
  const newEnd = newCashAtMonth(m, months);
  const vals = [0, oldEnd, newEnd, newStart];
  let max = Math.max.apply(null, vals);
  let min = Math.min.apply(null, vals);
  if (max === min) { max += 500; min -= 500; }
  const range = max - min;
  const rawStep = range / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const step = ([1, 2, 2.5, 5, 10].find(c => range / (c * pow) <= 5) || 10) * pow;
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  const ticks = Math.max(1, Math.round((max - min) / step));

  const pad = { l: 58, r: 16, t: 16, b: 26 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const X = i => pad.l + (i / months) * iw;
  const Y = v => pad.t + ((max - v) / (max - min)) * ih;

  let grid = '';
  for (let k = 0; k <= ticks; k++) {
    const v = min + step * k;
    const y = Y(v);
    const lbl = Math.abs(v) >= 1000 ? (v < 0 ? '-$' : '$') + (Math.abs(v) / 1000).toFixed(1) + 'k' : money(v, 0);
    grid += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8e8e5" stroke-width="1"/>`;
    grid += `<text x="${pad.l - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#777">${lbl}</text>`;
  }
  if (min < 0 && max > 0) {
    grid += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" stroke="#bcbcb8" stroke-width="1"/>`;
  }

  let xLbl = '';
  [0, 6, 12, 18, 24, 30, 36].forEach(i => {
    xLbl += `<text x="${X(i).toFixed(1)}" y="${h - 7}" text-anchor="middle" font-size="9" fill="#777">${i === 0 ? '0' : i + 'm'}</text>`;
  });

  let oldPath = '';
  let newPath = '';
  for (let i = 0; i <= months; i++) {
    oldPath += `${i === 0 ? 'M' : 'L'} ${X(i).toFixed(1)} ${Y(m.old.profit * i).toFixed(1)} `;
    newPath += `${i === 0 ? 'M' : 'L'} ${X(i).toFixed(1)} ${Y(newCashAtMonth(m, i)).toFixed(1)} `;
  }

  /* Cash-flow crossover, including down payment / monthly payments when financed. */
  let cashPayback = Infinity;
  if (newCashAtMonth(m, 0) >= 0) {
    cashPayback = 0;
  } else {
    let prevDiff = newCashAtMonth(m, 0);
    for (let i = 1; i <= months; i++) {
      const diff = newCashAtMonth(m, i) - m.old.profit * i;
      if (diff >= 0) {
        cashPayback = prevDiff < 0 ? (i - 1) + (-prevDiff) / (diff - prevDiff) : i;
        break;
      }
      prevDiff = diff;
    }
  }

  let marker = '';
  const pb = cashPayback;
  if (isFinite(pb) && pb > 0 && pb <= months) {
    const px = X(pb);
    const py = Y(m.old.profit * pb);
    marker = `<line x1="${px.toFixed(1)}" x2="${px.toFixed(1)}" y1="${pad.t}" y2="${h - pad.b}" stroke="#1e7e4e" stroke-width="1" stroke-dasharray="3 3"/>
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#1e7e4e"/>
      <text x="${Math.min(px + 7, w - 95).toFixed(1)}" y="${Math.max(py - 8, 24).toFixed(1)}" font-size="9.5" font-weight="800" fill="#1e7e4e">${esc(t('s2.cashPaybackShort') + ' ' + monthsFmt(pb))}</text>`;
  }

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;height:auto">
    ${grid}
    <path d="${oldPath}" fill="none" stroke="#8f8f8b" stroke-width="1.8" stroke-dasharray="4 3"/>
    <path d="${newPath}" fill="none" stroke="#1e7e4e" stroke-width="2.4"/>
    ${marker}${xLbl}
  </svg>`;
}

function buildDecisionBullets(m) {
  const list = [];
  if (m.hasData && m.invest.delta > 0) {
    list.push(t('vReason.gain', {
      delta: signedMoney(m.invest.delta, 0),
      annual: signedMoney(m.invest.annualDelta, 0),
      standalone: monthsFmt(m.invest.standalonePayback),
      inc: monthsFmt(m.invest.payback)
    }));
    list.push(t('vReason.3yr', { net3: signedMoney(m.invest.threeYearNet, 0), inv: money(m.invest.total, 0) }));
    if (m.finance.enabled && isFinite(m.finance.coverage)) {
      list.push(t('vReason.fin', { pmt: money(m.finance.payment, 2), cov: nf(m.finance.coverage, 2), vsOld: signedMoney(m.finance.vsOldCash, 0) }));
    } else {
      list.push(t('vReason.downside', { down: money(m.stress[2].profit, 0) }));
    }
  } else {
    list.push(t('vReason.neg'));
  }
  if (m.hiddenRepairRisk) {
    list.push(t('s2.hiddenRiskText'));
  }
  return list;
}

function buildConsultativeNextSteps(m) {
  if (m.verdict === 'strong') return [t('next.strong1'), t('next.strong2'), t('next.strong3')];
  if (m.verdict === 'positive') return [t('next.pos1'), t('next.pos2'), t('next.pos3')];
  if (m.verdict === 'conditional') return [t('next.cond1'), t('next.cond2'), t('next.cond3')];
  return [t('next.defer1'), t('next.defer2'), t('next.defer3')];
}
