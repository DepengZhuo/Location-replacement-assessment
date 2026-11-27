/* =====================================================================
   HAHA Location Replacement Assessment v2.2
   ===================================================================== */
'use strict';

function reportDocumentHtml(p, m) {
  const locName = p.meta.locationName || t('top.untitled');
  const cityState = [p.meta.city, p.meta.state].filter(Boolean).join(', ');
  const f = p.invest.finance;
  const bullets = buildDecisionBullets(m);
  const nextSteps = buildConsultativeNextSteps(m);
  const headline = t('repHead.' + m.verdict, { model: m.invest.model.name });

  const upRows = [
    { k: 'variety', label: t('s2.up1t'), rev: m.growth.varietyRev },
    { k: 'basket',  label: t('s2.up2t'), rev: m.growth.basketRev },
    { k: 'stock',   label: t('s2.up3t'), rev: m.growth.stockRev },
    { k: 'payment', label: t('s2.up4t'), rev: m.growth.paymentRev }
  ].map(r => {
    const u = p.uplift[r.k];
    const lbl = u.accept === 'yes' ? t('common.yes') : u.accept === 'partial' ? t('common.partly') : t('common.no');
    return `<tr><td>${esc(r.label)}</td><td>${esc(lbl)}</td><td class="r">${nf(u.pct, 1)}%</td><td class="r">+${money(r.rev, 0)}</td></tr>`;
  }).join('');

  return `
    <div class="proposal-paper">
      <div class="rep-header">
        <div class="rep-logo">HAHA VENDING</div>
        <div class="rep-doc-type">${esc(t('s3.docType'))}</div>
      </div>
      <h1 class="rep-title">${esc(locName)}</h1>
      <div class="rep-meta-bar">
        <div><span>${esc(t('s1.venue'))}:</span><strong>${esc(t('venue.' + p.meta.venue))}${cityState ? ' · ' + esc(cityState) : ''}</strong></div>
        <div><span>Date:</span><strong>${esc(p.meta.date)}</strong></div>
        <div><span>Recommended Model:</span><strong>${esc(m.invest.model.name)} (${esc(t('tag.' + m.invest.model.tag))})</strong></div>
      </div>

      <!-- Executive Summary (No duplicate Key Figures table) -->
      <div class="rep-sec" style="margin-top:0">
        <h3>${esc(t('s3.exec'))}</h3>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
          <span class="status-badge ${m.verdict}">${esc(t('verdict.' + m.verdict))}</span>
          <strong style="font-size:15px">${esc(headline)}</strong>
        </div>
        <div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">
          ${esc(m.invest.model.name)} (${money(m.invest.model.msrp, 0)}) · ${esc(t('r2.netInv'))}: <strong>${money(m.invest.total, 0)}</strong>
        </div>
        <div class="rep-stat-row">
          <div class="rep-stat"><span>${esc(t('s2.kpiGain'))}</span><strong>${signedMoney(m.invest.delta, 0)}/mo</strong></div>
          <div class="rep-stat"><span>${esc(t('s2.kpiStandalone'))}</span><strong>${esc(monthsFmt(m.invest.standalonePayback))}</strong></div>
          <div class="rep-stat"><span>${esc(t('s2.kpiInc'))}</span><strong>${esc(monthsFmt(m.invest.payback))}</strong></div>
          <div class="rep-stat"><span>${esc(t('s2.kpi3yr'))}</span><strong>${signedMoney(m.invest.threeYearNet, 0)}</strong></div>
        </div>
        <ul class="rep-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>

      <!-- 01 · Site & Diagnostic Overview -->
      <div class="rep-sec">
        <h3>${esc(t('s3.sec1'))}</h3>
        <div class="rep-two">
          <table class="table">
            <tr><td>${esc(t('s1.mType'))}</td><td class="r"><strong>${esc(t('mtype.' + p.machine.type))}</strong></td></tr>
            <tr><td>${esc(t('s1.mAge'))} / ${esc(t('s1.mCond'))}</td><td class="r">${p.machine.age !== '' ? p.machine.age + ' yrs' : '—'} · ${esc(t('cond.' + p.machine.condition))}</td></tr>
            <tr><td>${esc(t('s1.mMon'))}</td><td class="r">${esc(t('common.' + p.machine.monitoring))}</td></tr>
            <tr><td>${esc(t('s1.railHw'))} / ${esc(t('s1.railComm'))}</td><td class="r">${m.urgency.hwPts}/40 · ${m.urgency.commercialPts}/60</td></tr>
            <tr class="total"><td>${esc(t('s1.railTitle'))}</td><td class="r">${m.urgency.total} / 100</td></tr>
          </table>
          <div>
            <ul class="rep-list" style="margin-top:0">
              ${m.rationale.map(r => `<li>${esc(t('why.' + r.code, r.vars))}</li>`).join('')}
            </ul>
          </div>
        </div>
        ${m.hiddenRepairRisk ? `<div class="rep-alert"><strong>${esc(t('s2.hiddenRiskTitle'))}:</strong> ${esc(t('s2.hiddenRiskText'))}</div>` : ''}
      </div>

      <!-- 02 · Before vs. After Economics & Cash Flow -->
      <div class="rep-sec">
        <h3>${esc(t('s3.sec2'))}</h3>
        <table class="table" style="margin-bottom:14px">
          <thead><tr><th>Growth Driver</th><th>Client View</th><th class="r">Applied %</th><th class="r">Monthly Impact</th></tr></thead>
          <tbody>
            ${upRows}
            <tr class="total"><td colspan="2">${esc(t('s2.revUplift'))}</td><td class="r">+${pct(m.growth.totalRevenueGrowthPct, 1)}</td><td class="r">+${money(m.growth.totalRevenueGrowth, 0)}</td></tr>
          </tbody>
        </table>
        <table class="table">
          <thead><tr><th>${esc(t('s2.metric'))}</th><th class="r">${esc(t('s2.cur'))}</th><th class="r">${esc(t('s2.haha'))}</th><th class="r">${esc(t('s2.chg'))}</th></tr></thead>
          <tbody>
            <tr><td>${esc(t('s2.rOrders'))}</td><td class="r">${nf(m.old.monthlyOrders, 0)}</td><td class="r">${nf(m.haha.monthlyOrders, 0)}</td><td class="r">+${pct(m.growth.orderPct, 1)}</td></tr>
            <tr><td>${esc(t('s2.rAov'))}</td><td class="r">${money(m.old.aov, 2)}</td><td class="r">${money(m.haha.aov, 2)}</td><td class="r">${signedMoney(m.haha.aov - m.old.aov, 2)}</td></tr>
            <tr><td>${esc(t('s2.rSales'))}</td><td class="r">${money(m.old.sales, 0)}</td><td class="r">${money(m.haha.sales, 0)}</td><td class="r">${signedMoney(m.growth.totalRevenueGrowth, 0)}</td></tr>
            <tr class="total"><td>${esc(t('s2.rCost'))}</td><td class="r">${money(m.old.cost, 0)}</td><td class="r">${money(m.haha.cost, 0)}</td><td class="r">${signedMoney(m.haha.cost - m.old.cost, 0)}</td></tr>
            <tr class="primary"><td>${esc(t('s2.rProfit'))}</td><td class="r">${money(m.old.profit, 0)}</td><td class="r">${money(m.haha.profit, 0)}</td><td class="r">${signedMoney(m.invest.delta, 0)}</td></tr>
          </tbody>
        </table>
        <div style="margin-top:14px">${cumulativeSvg(m, 680, 175)}</div>
        <div class="rep-note">${esc(t('s2.chartExplain'))}</div>
      </div>

      <!-- 03 · Investment, Financing & Stress Test -->
      <div class="rep-sec">
        <h3>${esc(t('s3.sec3'))}</h3>
        <div class="rep-two">
          <table class="table">
            <tr><td>${esc(m.invest.model.name)} MSRP</td><td class="r">${money(m.invest.equipment, 0)}</td></tr>
            <tr><td>Freight / Install / Removal</td><td class="r">${money(m.invest.freight + m.invest.install + m.invest.removal, 0)}</td></tr>
            <tr><td>${esc(t('s2.tradeIn'))}</td><td class="r">-${money(m.invest.tradeIn, 0)}</td></tr>
            <tr class="total"><td>${esc(t('r2.netInv'))}</td><td class="r">${money(m.invest.total, 0)}</td></tr>
            <tr><td>${esc(t('s2.payMethod'))}</td><td class="r">${f.enabled ? `${m.finance.months}m @ ${m.finance.apr}% (${money(m.finance.payment, 2)}/mo · ${nf(m.finance.coverage, 2)}×)` : esc(t('s2.cash'))}</td></tr>
            <tr><td>${esc(t('s2.propTitle'))}</td><td class="r">${money(m.siteEarnings.monthly, 0)}/mo (${money(m.siteEarnings.annual, 0)}/yr)</td></tr>
          </table>
          <table class="table">
            <thead><tr><th>Stress</th><th class="r">Profit</th><th class="r">Delta</th><th class="r">Payback</th></tr></thead>
            <tbody>
              ${m.stress.map(st => `<tr><td>${nf(st.scale * 100, 0)}%</td><td class="r">${money(st.profit, 0)}</td><td class="r">${signedMoney(st.delta, 0)}</td><td class="r">${esc(monthsFmt(st.payback))}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 04 · Next Steps & Assessment Notes (NO Sign-Off lines) -->
      <div class="rep-sec">
        <h3>${esc(t('s3.sec4'))}</h3>
        <div class="rep-subh">${esc(t('s3.nextSub'))}</div>
        <ol class="rep-list">
          ${nextSteps.map(n => `<li>${esc(n)}</li>`).join('')}
        </ol>
        <div class="rep-deploy-bar">${esc(t('s3.deployNote'))}</div>
        <div class="rep-subh">${esc(t('s3.basisSub'))}</div>
        <div class="rep-note">${esc(t('s3.method'))}</div>
        <div class="rep-note">${esc(t('s3.disclaimer'))}</div>
      </div>

      <div class="rep-foot-bar">
        <span>HAHA Vending · ${esc(t('s3.docType'))}</span>
        <span>${esc(locName)} · ${esc(p.meta.date)}</span>
      </div>
    </div>
  `;
}

function renderStep3(p, m) {
  return `
    <div class="report-toolbar no-print">
      <button type="button" class="button button-outline" data-nav="step2">${esc(t('s3.back'))}</button>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="button button-dark" data-action="printReport">${esc(t('s3.print'))}</button>
        <button type="button" class="button button-outline" data-action="downloadReport">${esc(t('s3.download'))}</button>
      </div>
    </div>
    ${reportDocumentHtml(p, m)}
  `;
}
