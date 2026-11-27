/* =====================================================================
   HAHA Location Replacement Assessment v2.3
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
      const complete = u.complete;
      const tierCls = u.tier === 'strong' ? 'strong' : u.tier === 'model' ? 'conditional' : 'defer';
      const tierLbl = u.tier === 'strong' ? t('s1.tierStrong') : u.tier === 'model' ? t('s1.tierModel') : t('s1.tierLow');
      rail.innerHTML = `
        <div class="rail-panel">
          <div class="rail-label">${esc(t('s1.railTitle'))}</div>
          <div class="rail-big">${complete ? u.total : '--'}<span style="font-size:18px;color:#888;font-weight:700"> / 100</span></div>
          <div style="margin-top:8px"><span class="status-badge ${complete ? tierCls : 'defer'}">${esc(complete ? tierLbl : t('s1.railPending'))}</span></div>
          <div class="score-bar-track" style="margin-top:12px"><div class="score-bar-fill" style="width:${complete ? u.total : 0}%"></div></div>
          <div class="rail-div"></div>
          <div class="breakdown-bar">
            <div class="breakdown-head"><span>${esc(t('s1.railHw'))}</span><strong>${complete ? u.hwPts : '—'} / 40</strong></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${complete ? (u.hwPts / 40) * 100 : 0}%"></div></div>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-head"><span>${esc(t('s1.railComm'))}</span><strong>${complete ? u.commercialPts : '—'} / 60</strong></div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${complete ? (u.commercialPts / 60) * 100 : 0}%"></div></div>
          </div>
        </div>
      `;
    }
    syncStepGates(p);
    renderStorageWarning();
    return;
  }

  /* STEP 02 LIVE OUTPUTS */
  if (app.view === 'step2') {
    const out = {
      dAov: m.old.aov > 0 ? money(m.old.aov, 2) : '—',
      dDaily: m.old.monthlyOrders > 0 ? nf(m.old.dailyOrders, 1) + t('common.perDay') : '—',
      dMargin: m.old.sales > 0 ? pct(m.old.margin, 1) : '—',
      modelReason: m.invest.recFrozen
        ? (m.invest.recLowVolume
          ? t('s2.recFrozenLow', { orders: nf(m.invest.recDailyOrders, 1) })
          : t('s2.recFrozen'))
        : t('s2.recReason', {
          orders: nf(m.invest.recDailyOrders, 1),
          venue: t('venue.' + p.meta.venue),
          model: m.invest.recModelName
        }),
      oldSiteFee: money(m.old.siteFee, 2) + t('common.perMonth'),
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
      upRevVariety: '+' + money(m.growth.varietyRev, 0) + t('common.perMonth'),
      upRevBasket:  '+' + money(m.growth.basketRev, 0) + t('common.perMonth'),
      upRevStock:   '+' + money(m.growth.stockRev, 0) + t('common.perMonth'),
      upRevPayment: '+' + money(m.growth.paymentRev, 0) + t('common.perMonth'),
      projSales: m.hasData ? money(m.haha.sales, 0) + t('common.perMonth') : '—',
      revUplift: m.hasData ? '+' + pct(m.growth.totalRevenueGrowthPct, 1) + ' (+' + money(m.growth.totalRevenueGrowth, 0) + ')' : '—',
      projDaily: m.hasData ? nf(m.haha.dailyOrders, 1) + t('common.perDay') : '—',
      cashSigning: money(m.finance.cashDueAtSigning, 0),
      finPayment: money(m.finance.payment, 2) + t('common.perMonth'),
      finCoverage: isFinite(m.finance.coverage) ? nf(m.finance.coverage, 2) + '×' : '—',
      finCashAfter: money(m.finance.cashAfter, 0) + t('common.perMonth'),
      selfFundText: t('s2.selfFund', {
        cov: nf(m.finance.coverage, 2),
        cash: money(m.finance.cashAfter, 0),
        vsOld: signedMoney(m.finance.vsOldCash, 0),
        term: m.finance.months
      }),
      hahaTotalCost: money(m.haha.cost, 0) + t('common.perMonth'),
      kpiGain: m.hasData ? signedMoney(m.invest.delta, 0) : '—',
      kpiAnnual: m.hasData ? signedMoney(m.invest.annualDelta, 0) + t('common.perYear') : '—',
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
      hiddenRepairRisk: m.hiddenRepairRisk,
      ordersEstimated: !!p.baseline.ordersEstimated
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
            <tr><td>${esc(t('s2.rMargin'))}</td><td class="r">${pct(m.old.margin, 1)}</td><td class="r">${pct(m.haha.margin, 1)}</td><td class="r">${(m.haha.margin - m.old.margin >= 0 ? '+' : '') + nf(m.haha.margin - m.old.margin, 1)} ${esc(t('s2.pts'))}</td></tr>
          </tbody>
        </table>
      `;
    }

    /* Stress test table */
    const stHost = $('[data-out-html="stressTable"]');
    if (stHost) {
      stHost.innerHTML = `
        <table class="table">
          <thead><tr><th>%</th><th class="r">${esc(t('rep.profit'))}</th><th class="r">${esc(t('rep.delta'))}</th><th class="r">${esc(t('rep.payback'))}</th>${m.finance.enabled ? `<th class="r">${esc(t('s2.cov'))}</th>` : ''}</tr></thead>
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
          <div class="rail-sub">${m.hasData ? signedMoney(m.invest.annualDelta, 0) + t('common.perYear') : ''}</div>
          <div class="rail-div"></div>
          <div class="rail-row"><span>${esc(t('r2.inc'))}</span><strong>${m.hasData ? esc(monthsFmt(m.invest.payback)) : '—'}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.threeYr'))}</span><strong>${m.hasData ? signedMoney(m.invest.threeYearNet, 0) : '—'}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.netInv'))}</span><strong>${money(m.invest.total, 0)}</strong></div>
          <div class="rail-row"><span>${esc(t('r2.model'))}</span><strong>${esc(m.invest.model.name)}</strong></div>
        </div>
      `;
    }
    syncStepGates(p);
    renderStorageWarning();
  }
}

function syncStepGates(p) {
  if (!p) return;
  const s1 = validateStep1(p);
  const s2 = validateStep2(p);
  const ready = { step2: s1.ok, step3: s1.ok && s2.ok };

  $$('[data-step-cta]').forEach(btn => {
    const step = btn.dataset.stepCta;
    const ok = !!ready[step];
    btn.disabled = !ok;
    btn.setAttribute('aria-disabled', String(!ok));
    btn.title = ok ? '' : (step === 'step3' ? stepMissingText('step2', p) : stepMissingText('step1', p));
  });
  $$('[data-step-hint]').forEach(el => {
    const step = el.dataset.stepHint;
    el.textContent = stepMissingText(step, p);
  });

  $$('.nav-item[data-nav="step2"]').forEach(btn => {
    btn.disabled = !s1.ok;
    btn.title = s1.ok ? '' : t('validate.step1First');
  });
  $$('.nav-item[data-nav="step3"]').forEach(btn => {
    const ok = s1.ok && s2.ok;
    btn.disabled = !ok;
    btn.title = ok ? '' : (s1.ok ? t('validate.step2First') : t('validate.step1First'));
  });
}
