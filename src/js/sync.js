/* =====================================================================
   HAHA Location Replacement Assessment v2.2
   ===================================================================== */
'use strict';

function syncOutputs() {
  const p = getActiveProject();
  if (!p) return;
  const m = compute(p);

  const topName = $('[data-out="topProjName"]');
  if (topName) topName.textContent = p.meta.locationName || t('top.untitled');

  /* STEP 01 RAIL */
  if (app.view === 'step1') {
    const rail = $('#railHost');
    if (rail) {
      const u = m.urgency;
      const tierCls = u.tier === 'strong' ? 'strong' : u.tier === 'model' ? 'conditional' : 'defer';
      const tierLbl = u.tier === 'strong' ? t('s1.tierStrong') : u.tier === 'model' ? t('s1.tierModel') : t('s1.tierLow');
      rail.innerHTML = `
        <div class="rail-panel">
          <div class="rail-label">${esc(t('s1.railTitle'))}</div>
          <div class="rail-big">${u.total}<span style="font-size:18px;color:#888;font-weight:700"> / 100</span></div>
          <div style="margin-top:8px"><span class="status-badge ${tierCls}">${esc(tierLbl)}</span></div>
          <div class="score-bar-track" style="margin-top:12px"><div class="score-bar-fill" style="width:${u.total}%"></div></div>
          <div class="rail-div"></div>
          <div class="breakdown-bar">
            <div class="breakdown-head"><span>${esc(t('s1.railHw'))}</span><strong>${u.hwPts} / 40</strong></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${(u.hwPts / 40) * 100}%"></div></div>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-head"><span>${esc(t('s1.railComm'))}</span><strong>${u.commercialPts} / 60</strong></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${(u.commercialPts / 60) * 100}%"></div></div>
          </div>
          <div class="rail-div"></div>
          <button type="button" class="button button-white button-wide" data-nav="step2">${esc(t('s1.railNext'))}</button>
        </div>
      `;
    }
    return;
  }

  /* STEP 02 LIVE OUTPUTS */
  if (app.view === 'step2') {
    const out = {
      dAov: m.old.aov > 0 ? money(m.old.aov, 2) : '—',
      dDaily: m.old.monthlyOrders > 0 ? nf(m.old.dailyOrders, 1) + ' / day' : '—',
      dMargin: m.old.sales > 0 ? pct(m.old.margin, 1) : '—',
      oldSiteFee: money(m.old.siteFee, 2) + '/mo',
      siteFormulaCur: t('s2.formulaCur', {
        sales: money(m.old.sales, 0),
        share: nf(m.siteTerms.share, 1),
        rent: money(m.siteTerms.rent, 0),
        total: money(m.old.siteFee, 2)
      }),
      siteFormulaNew: t('s2.formulaNew', {
        sales: money(m.haha.sales, 0),
        share: nf(m.hahaTerms.share, 1),
        rent: money(m.hahaTerms.rent, 0),
        total: money(m.haha.siteFee, 2)
      }),
      upRevVariety: '+' + money(m.growth.varietyRev, 0) + '/mo',
      upRevBasket:  '+' + money(m.growth.basketRev, 0) + '/mo',
      upRevStock:   '+' + money(m.growth.stockRev, 0) + '/mo',
      upRevPayment: '+' + money(m.growth.paymentRev, 0) + '/mo',
      projSales: m.hasData ? money(m.haha.sales, 0) + '/mo' : '—',
      revUplift: m.hasData ? '+' + pct(m.growth.totalRevenueGrowthPct, 1) + ' (+' + money(m.growth.totalRevenueGrowth, 0) + ')' : '—',
      projDaily: m.hasData ? nf(m.haha.dailyOrders, 1) + ' / day' : '—',
      cashSigning: money(m.finance.cashDueAtSigning, 0),
      finPayment: money(m.finance.payment, 2) + '/mo',
      finCoverage: isFinite(m.finance.coverage) ? nf(m.finance.coverage, 2) + '×' : '—',
      finCashAfter: money(m.finance.cashAfter, 0) + '/mo',
      selfFundText: t('s2.selfFund', {
        cov: nf(m.finance.coverage, 2),
        cash: money(m.finance.cashAfter, 0),
        term: m.finance.months
      }),
      hahaTotalCost: money(m.haha.cost, 0) + '/mo',
      kpiGain: m.hasData ? signedMoney(m.invest.delta, 0) : '—',
      kpiAnnual: m.hasData ? signedMoney(m.invest.annualDelta, 0) + ' / yr' : '—',
      kpiStandalone: m.hasData ? monthsFmt(m.invest.standalonePayback) : '—',
      kpiInc: m.hasData ? monthsFmt(m.invest.payback) : '—',
      kpi3yr: m.hasData ? signedMoney(m.invest.threeYearNet, 0) : '—',
      zeroProfit: money(m.haha.zeroGrowthProfit, 0),
      zeroText: t('s2.zeroText', {
        v: money(m.haha.zeroGrowthProfit, 0),
        gap: signedMoney(m.haha.zeroGrowthProfit - m.old.profit, 0)
      }),
      propMo: money(m.siteEarnings.monthly, 0),
      propYr: money(m.siteEarnings.annual, 0)
    };

    $$('[data-out]').forEach(el => {
      const k = el.dataset.out;
      if (out[k] !== undefined) el.textContent = out[k];
    });

    /* Mutually exclusive visibility flags */
    const flags = {
      pmActual: p.baseline.profitMode === 'actual',
      pmMargin: p.baseline.profitMode === 'margin',
      pmDetail: p.baseline.profitMode === 'detail',
      dealHasTerms: p.site.deal !== 'none',
      dealHasShare: p.site.deal === 'share' || p.site.deal === 'combo',
      dealHasRent: p.site.deal === 'rent' || p.site.deal === 'combo',
      overrideDeal: !!p.site.overrideDeal,
      orderCapped: m.growth.orderCapped,
      aovCapped: m.growth.aovCapped,
      finEnabled: !!p.invest.finance.enabled,
      finDisabled: !p.invest.finance.enabled,
      selfFunding: m.finance.selfFunding,
      hiddenRepairRisk: m.hiddenRepairRisk
    };
    $$('[data-show]').forEach(el => {
      const k = el.dataset.show;
      if (flags[k] !== undefined) el.classList.toggle('hidden', !flags[k]);
    });

    const covEl = $('[data-tone="finCovTone"]');
    if (covEl) {
      covEl.classList.toggle('pos', m.finance.coverage >= 1.25);
      covEl.classList.toggle('neg', m.finance.coverage < 1.25);
    }

    const zc = $('#zeroCallout');
    if (zc) {
      zc.classList.toggle('good', m.haha.zeroGrowthProfit >= m.old.profit);
      zc.classList.toggle('warn', m.haha.zeroGrowthProfit < m.old.profit);
    }

    /* Update model active & recommended badges */
    $$('[data-model-card]').forEach(btn => {
      const id = btn.dataset.modelCard;
      btn.classList.toggle('on', id === m.invest.effectiveModelId);
      const rec = btn.querySelector(`[data-rec-badge="${id}"]`);
      if (rec) rec.classList.toggle('hidden', id !== m.invest.recModelId);
    });

    /* Comparison table */
    const cmpHost = $('[data-out-html="cmpTable"]');
    if (cmpHost) {
      cmpHost.innerHTML = `
        <table class="table">
          <thead><tr><th>${esc(t('s2.metric'))}</th><th class="r">${esc(t('s2.cur'))}</th><th class="r">${esc(t('s2.haha'))}</th><th class="r">${esc(t('s2.chg'))}</th></tr></thead>
          <tbody>
            <tr><td>${esc(t('s2.rOrders'))}</td><td class="r">${nf(m.old.monthlyOrders, 0)}</td><td class="r">${nf(m.haha.monthlyOrders, 0)}</td><td class="r">+${pct(m.growth.orderPct, 1)}</td></tr>
            <tr><td>${esc(t('s2.rAov'))}</td><td class="r">${money(m.old.aov, 2)}</td><td class="r">${money(m.haha.aov, 2)}</td><td class="r">${signedMoney(m.haha.aov - m.old.aov, 2)}</td></tr>
            <tr><td>${esc(t('s2.rSales'))}</td><td class="r">${money(m.old.sales, 0)}</td><td class="r">${money(m.haha.sales, 0)}</td><td class="r pos">${signedMoney(m.growth.totalRevenueGrowth, 0)}</td></tr>
            <tr class="total"><td>${esc(t('s2.rCost'))}</td><td class="r">${money(m.old.cost, 0)}</td><td class="r">${money(m.haha.cost, 0)}</td><td class="r">${signedMoney(m.haha.cost - m.old.cost, 0)}</td></tr>
            <tr class="primary"><td>${esc(t('s2.rProfit'))}</td><td class="r">${money(m.old.profit, 0)}</td><td class="r">${money(m.haha.profit, 0)}</td><td class="r ${m.invest.delta >= 0 ? 'pos' : 'neg'}">${signedMoney(m.invest.delta, 0)}</td></tr>
            <tr><td>${esc(t('s2.rMargin'))}</td><td class="r">${pct(m.old.margin, 1)}</td><td class="r">${pct(m.haha.margin, 1)}</td><td class="r">${(m.haha.margin - m.old.margin >= 0 ? '+' : '') + nf(m.haha.margin - m.old.margin, 1)} pts</td></tr>
          </tbody>
        </table>
      `;
    }

    /* Stress test table */
    const stHost = $('[data-out-html="stressTable"]');
    if (stHost) {
      stHost.innerHTML = `
        <table class="table">
          <thead><tr><th>%</th><th class="r">Profit</th><th class="r">Delta</th><th class="r">Payback</th>${m.finance.enabled ? '<th class="r">Cov</th>' : ''}</tr></thead>
          <tbody>
            ${m.stress.map(st => `
              <tr>
                <td>${nf(st.scale * 100, 0)}%</td>
                <td class="r">${money(st.profit, 0)}</td>
                <td class="r ${st.delta >= 0 ? 'pos' : 'neg'}">${signedMoney(st.delta, 0)}</td>
                <td class="r">${esc(monthsFmt(st.payback))}</td>
                ${m.finance.enabled ? `<td class="r">${isFinite(st.coverage) ? nf(st.coverage, 2) + '×' : '—'}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    /* 36-Month SVG Chart */
    const chartHost = $('#cumChartHost');
    if (chartHost) chartHost.innerHTML = cumulativeSvg(m, 680, 215);

    /* Decision Verdict Box */
    const vHost = $('[data-out-html="verdictBox"]');
    if (vHost) {
      const bullets = buildDecisionBullets(m);
      const nexts = buildConsultativeNextSteps(m);
      vHost.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <span class="status-badge ${m.verdict}">${esc(t('verdict.' + m.verdict))}</span>
          <strong style="font-size:13.5px;color:#ddd">${esc(m.invest.model.name)} · ${money(m.invest.total, 0)}</strong>
        </div>
        <ul>${bullets.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        <ol style="margin-top:10px;border-top:1px solid rgba(255,255,255,.14);padding-top:10px">${nexts.map(n => `<li>${esc(n)}</li>`).join('')}</ol>
      `;
    }

    /* Warnings */
    const wHost = $('[data-out-html="warningsHost"]');
    if (wHost) {
      wHost.innerHTML = m.warnings.map(w => `
        <div class="warn-item ${w.level === 'info' ? 'info' : ''}">
          <strong>${w.level === 'info' ? 'i' : '!'}</strong>
          <span>${esc(t('warn.' + w.code, w.vars))}</span>
        </div>
      `).join('');
    }

    /* Right Sticky Snapshot Rail */
    const rail = $('#railHost');
    if (rail) {
      rail.innerHTML = `
        <div class="rail-panel">
          <div class="rail-label">${esc(t('r2.title'))}</div>
          <div style="margin-bottom:10px"><span class="status-badge ${m.verdict}">${esc(t('verdict.' + m.verdict))}</span></div>
          <div class="rail-label" style="margin-top:12px;margin-bottom:2px">${esc(t('r2.gain'))}</div>
          <div class="rail-big ${m.invest.delta >= 0 ? 'pos' : 'neg'}">${m.hasData ? signedMoney(m.invest.delta, 0) : '—'}</div>
          <div class="rail-sub">${m.hasData ? signedMoney(m.invest.annualDelta, 0) + ' / yr' : ''}</div>
          <div class="rail-div"></div>
          <div class="rail-row"><span>${esc(t('r2.standalone'))}</span><strong>${m.hasData ? esc(monthsFmt(m.invest.standalonePayback)) : '—'}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.inc'))}</span><strong>${m.hasData ? esc(monthsFmt(m.invest.payback)) : '—'}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.threeYr'))}</span><strong>${m.hasData ? signedMoney(m.invest.threeYearNet, 0) : '—'}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.netInv'))}</span><strong>${money(m.invest.total, 0)}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.model'))}</span><strong>${esc(m.invest.model.name)}</strong></div>
          <div class="rail-div"></div>
          <button type="button" class="button button-white button-wide" data-nav="step3">${esc(t('r2.toReport'))}</button>
        </div>
      `;
    }
  }
}
