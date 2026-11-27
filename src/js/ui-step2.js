/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

function renderStep2(p) {
  const b = p.baseline;
  const s = p.site;
  const f = p.invest.finance;
  const h = p.haha;

  const upliftItems = [
    { k: 'variety', t: 's2.up1t', d: 's2.up1d', out: 'upRevVariety', capFlag: 'orderCapped' },
    { k: 'basket',  t: 's2.up2t', d: 's2.up2d', out: 'upRevBasket',  capFlag: 'aovCapped' },
    { k: 'stock',   t: 's2.up3t', d: 's2.up3d', out: 'upRevStock',   capFlag: 'orderCapped' },
    { k: 'payment', t: 's2.up4t', d: 's2.up4d', out: 'upRevPayment', capFlag: 'orderCapped' }
  ];

  return `
    <div class="page-heading">
      <div>
        <div class="eyebrow">${esc(t('s2.eyebrow'))}</div>
        <h1>${esc(t('s2.title'))}</h1>
        <p>${esc(t('s2.lead'))}</p>
      </div>
    </div>

    <div class="two-column-layout">
      <div class="main-col">
        <!-- CARD A: Current Baseline & Site Agreement -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s2.secA'))}</h3><p>${esc(t('s2.secAd'))}</p></div>
            <span class="step-tag">A</span>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>${esc(t('s2.mSales'))}</label>
              <div class="input-wrap">
                <span class="prefix">$</span>
                <input type="number" class="has-prefix" min="0" step="50" data-bind="baseline.monthlySales" value="${esc(b.monthlySales)}" placeholder="1800">
              </div>
            </div>
            <div class="field">
              <label>${esc(t('s2.mOrders'))}</label>
              <input type="number" min="0" step="10" data-bind="baseline.monthlyOrders" value="${esc(b.monthlyOrders)}" placeholder="720">
              <button type="button" class="button button-outline button-small" style="margin-top:4px;align-self:flex-start" data-action="estOrders">${esc(t('s2.estOrders'))}</button>
              <span class="field-hint hidden" data-show="ordersEstimated">${esc(t('s2.estOrdersNote'))}</span>
            </div>
          </div>

          <div class="derived-bar">
            <div class="derived-item"><span>${esc(t('s2.dDaily'))}</span><strong data-out="dDaily">—</strong></div>
            <div class="derived-item"><span>${esc(t('s2.dAov'))}</span><strong data-out="dAov">—</strong></div>
            <div class="derived-item"><span>${esc(t('s2.dMargin'))}</span><strong data-out="dMargin">—</strong></div>
          </div>

          <div class="divider"></div>

          <!-- 3 Mutually Exclusive Profit Mode Tabs -->
          <div class="field" style="margin-bottom:12px">
            <label>${esc(t('s2.profitLabel'))}</label>
            <div class="seg block" data-seg-group="baseline.profitMode">
              <button type="button" class="${b.profitMode === 'actual' ? 'on' : ''}" data-set="baseline.profitMode" data-value="actual">${esc(t('s2.pmActual'))}</button>
              <button type="button" class="${b.profitMode === 'margin' ? 'on' : ''}" data-set="baseline.profitMode" data-value="margin">${esc(t('s2.pmMargin'))}</button>
              <button type="button" class="${b.profitMode === 'detail' ? 'on' : ''}" data-set="baseline.profitMode" data-value="detail">${esc(t('s2.pmDetail'))}</button>
            </div>
          </div>

          <div data-show="pmActual" style="max-width:340px">
            <div class="field">
              <label>${esc(t('s2.actualProfit'))}</label>
              <div class="input-wrap">
                <span class="prefix">$</span>
                <input type="number" class="has-prefix" step="10" data-bind="baseline.actualProfit" value="${esc(b.actualProfit)}" placeholder="500">
              </div>
            </div>
          </div>

          <div data-show="pmMargin" style="max-width:340px">
            <div class="field">
              <label>${esc(t('s2.estMargin'))}</label>
              <div class="input-wrap">
                <input type="number" class="has-unit" min="0" max="100" step="1" data-bind="baseline.estMarginPct" value="${esc(b.estMarginPct)}">
                <span class="unit">%</span>
              </div>
            </div>
          </div>

          <div data-show="pmDetail" style="padding:14px;background:var(--soft);border:1px solid var(--line);border-radius:10px">
            <div class="form-grid-3">
              <div class="field"><label>${esc(t('s2.dCogs'))}</label><div class="input-wrap"><input type="number" class="has-unit" step="0.5" data-bind="baseline.cogsRate" value="${esc(b.cogsRate)}"><span class="unit">%</span></div></div>
              <div class="field"><label>${esc(t('s2.dCashless'))}</label><div class="input-wrap"><input type="number" class="has-unit" step="1" data-bind="baseline.cashlessShare" value="${esc(b.cashlessShare)}"><span class="unit">%</span></div></div>
              <div class="field"><label>${esc(t('s2.dCardFee'))}</label><div class="input-wrap"><input type="number" class="has-unit" step="0.05" data-bind="baseline.cardFee" value="${esc(b.cardFee)}"><span class="unit">%</span></div></div>
              <div class="field"><label>${esc(t('s2.dReader'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" step="1" data-bind="baseline.readerFee" value="${esc(b.readerFee)}"></div></div>
              <div class="field"><label>${esc(t('s2.dPlatform'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" step="1" data-bind="baseline.platform" value="${esc(b.platform)}"></div></div>
              <div class="field"><label>${esc(t('s2.dOther'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" step="1" data-bind="baseline.other" value="${esc(b.other)}"></div></div>
            </div>
            <div style="margin-top:10px;font-size:12px;color:var(--muted)">
              ${esc(t('s2.dSiteAuto'))}: <strong style="color:#111" data-out="oldSiteFee">$0</strong>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Site Agreement -->
          <div class="field" style="margin-bottom:12px">
            <label>${esc(t('s2.dealTitle'))}</label>
            <div class="chips" data-chip-group="site.deal">
              ${[['share', 's2.dealShare'], ['rent', 's2.dealRent'], ['combo', 's2.dealCombo'], ['none', 's2.dealNone']].map(([v, k]) =>
                `<button type="button" class="chip ${s.deal === v ? 'on' : ''}" data-set="site.deal" data-value="${v}">${esc(t(k))}</button>`
              ).join('')}
            </div>
          </div>

          <div class="form-grid" data-show="dealHasTerms">
            <div class="field" data-show="dealHasShare">
              <label>${esc(t('s2.sharePct'))}</label>
              <div class="input-wrap"><input type="number" class="has-unit" min="0" max="100" step="0.5" data-bind="site.share" value="${esc(s.share)}"><span class="unit">%</span></div>
            </div>
            <div class="field" data-show="dealHasRent">
              <label>${esc(t('s2.rentAmt'))}</label>
              <div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="10" data-bind="site.rent" value="${esc(s.rent)}"></div>
            </div>
          </div>

          <div class="formula-box">
            <div data-out="siteFormulaCur"></div>
            <div data-show="overrideDeal" style="margin-top:4px;color:var(--green);font-weight:700" data-out="siteFormulaNew"></div>
          </div>

          <label style="display:inline-flex;align-items:center;gap:8px;margin-top:12px;font-size:12.5px;font-weight:700;cursor:pointer">
            <input type="checkbox" data-bind="site.overrideDeal" ${s.overrideDeal ? 'checked' : ''}> ${esc(t('s2.overrideDeal'))}
          </label>

          <div class="form-grid" data-show="overrideDeal" style="margin-top:10px">
            <div class="field" data-show="dealHasShare">
              <label>${esc(t('s2.hahaShare'))}</label>
              <div class="input-wrap"><input type="number" class="has-unit" min="0" max="100" step="0.5" data-bind="site.hahaShare" value="${esc(s.hahaShare)}"><span class="unit">%</span></div>
            </div>
            <div class="field" data-show="dealHasRent">
              <label>${esc(t('s2.hahaRent'))}</label>
              <div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="10" data-bind="site.hahaRent" value="${esc(s.hahaRent)}"></div>
            </div>
          </div>
        </div>

        <!-- CARD B: Client-Agreed Growth Uplift -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s2.secB'))}</h3><p>${esc(t('s2.secBd'))}</p></div>
            <button type="button" class="button button-outline button-small" data-action="resetUplift">${esc(t('s2.resetUp'))}</button>
          </div>
          <div class="uplift-grid">
            ${upliftItems.map(item => {
              const u = p.uplift[item.k];
              return `
                <div class="uplift-card">
                  <div class="uplift-head">
                    <div><h4>${esc(t(item.t))}</h4><p>${esc(t(item.d))}</p></div>
                    <span class="cap-badge hidden" data-show="${item.capFlag}">${esc(t('s2.capped'))}</span>
                  </div>
                  <div class="seg block" data-seg-group="uplift.${item.k}.accept">
                    <button type="button" class="${u.accept === 'yes' ? 'on' : ''}" data-set="uplift.${item.k}.accept" data-value="yes">${esc(t('s2.yes100'))}</button>
                    <button type="button" class="${u.accept === 'partial' ? 'on' : ''}" data-set="uplift.${item.k}.accept" data-value="partial">${esc(t('s2.part50'))}</button>
                    <button type="button" class="${u.accept === 'no' ? 'on' : ''}" data-set="uplift.${item.k}.accept" data-value="no">${esc(t('s2.no0'))}</button>
                  </div>
                  <div class="uplift-foot">
                    <div class="input-wrap" style="width:94px">
                      <input type="number" class="has-unit" min="0" step="0.5" data-bind="uplift.${item.k}.pct" value="${esc(u.pct)}">
                      <span class="unit">%</span>
                    </div>
                    <div class="uplift-impact" data-out="${item.out}">+$0${t('common.perMonth')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="derived-bar">
            <div class="derived-item"><span>${esc(t('s2.projSales'))}</span><strong data-out="projSales">—</strong></div>
            <div class="derived-item"><span>${esc(t('s2.revUplift'))}</span><strong class="pos" data-out="revUplift">—</strong></div>
            <div class="derived-item"><span>${esc(t('s2.projDaily'))}</span><strong data-out="projDaily">—</strong></div>
          </div>
        </div>

        <!-- CARD C: Machine Recommendation, Investment & Financing -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s2.secC'))}</h3><p>${esc(t('s2.secCd'))}</p></div>
            <div style="display:flex;align-items:center;gap:8px">
              <button type="button" class="button button-ghost button-small" data-action="autoModel">${esc(t('s2.autoModel'))}</button>
              <span class="step-tag">C</span>
            </div>
          </div>
          <div class="model-grid">
            ${MODELS.map(mod => `
              <button type="button" class="model-card" data-model-card="${mod.id}" data-set="invest.modelId" data-value="${mod.id}">
                <span class="rec-badge hidden" data-rec-badge="${mod.id}">${esc(t('s2.recBadge'))}</span>
                <div class="mn">${esc(mod.name)}</div>
                <div class="mp">${money(mod.msrp, 0)}</div>
                <div class="mt">${esc(t('tag.' + mod.tag))}</div>
              </button>
            `).join('')}
          </div>

          <div class="form-grid-4" style="align-items:start">
            <div class="field">
              <label>&nbsp;</label>
              <label style="display:flex;align-items:center;gap:8px;height:40px;font-size:13px;font-weight:700;cursor:pointer">
                <input type="checkbox" data-bind="invest.freight" ${p.invest.freight ? 'checked' : ''}> ${esc(t('s2.freight'))}
              </label>
            </div>
            <div class="field">
              <label>${esc(t('s2.install'))}</label>
              <div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" data-bind="invest.install" value="${esc(p.invest.install)}"></div>
            </div>
            <div class="field">
              <label>${esc(t('s2.removal'))}</label>
              <div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" data-bind="invest.removal" value="${esc(p.invest.removal)}"></div>
            </div>
            <div class="field">
              <label>${esc(t('s2.tradeIn'))}</label>
              <div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" data-bind="invest.tradeIn" value="${esc(p.invest.tradeIn)}"></div>
              <span class="field-hint">${esc(t('s2.tradeInHint'))}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
            <strong style="font-size:13.5px">${esc(t('s2.payMethod'))}</strong>
            <div class="seg" data-seg-group="invest.finance.enabled">
              <button type="button" class="${!f.enabled ? 'on' : ''}" data-set="invest.finance.enabled" data-value="false">${esc(t('s2.cash'))}</button>
              <button type="button" class="${f.enabled ? 'on' : ''}" data-set="invest.finance.enabled" data-value="true">${esc(t('s2.finance'))}</button>
            </div>
          </div>

          <div class="hidden" data-show="finDisabled">
            <div class="derived-bar" style="grid-template-columns:1fr 1fr">
              <div class="derived-item"><span>${esc(t('s2.cashSigning'))}</span><strong data-out="cashSigning">—</strong></div>
              <div class="derived-item"><span>${esc(t('s2.kpiStandalone'))}</span><strong data-out="kpiStandalone">—</strong></div>
            </div>
          </div>

          <div class="hidden" data-show="finEnabled">
            <div class="form-grid-4">
              <div class="field"><label>${esc(t('s2.down'))}</label><div class="input-wrap"><input type="number" class="has-unit" min="0" max="100" step="1" data-bind="invest.finance.downPct" value="${esc(f.downPct)}"><span class="unit">%</span></div></div>
              <div class="field"><label>${esc(t('s2.term'))}</label><div class="input-wrap"><input type="number" class="has-unit" min="1" max="24" step="1" data-bind="invest.finance.term" value="${esc(f.term)}"><span class="unit">${esc(t('common.mo'))}</span></div><span class="field-hint">${esc(t('s2.termHint'))}</span></div>
              <div class="field"><label>${esc(t('s2.apr'))}</label><div class="input-wrap"><input type="number" class="has-unit" min="0" step="0.1" data-bind="invest.finance.apr" value="${esc(f.apr)}"><span class="unit">%</span></div><span class="field-hint">${esc(t('s2.aprHint'))}</span></div>
              <div class="field"><label>${esc(t('s2.docFee'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="10" data-bind="invest.finance.docFee" value="${esc(f.docFee)}"></div><span class="field-hint">${esc(t('s2.docFeeHint'))}</span></div>
            </div>
            <div class="derived-bar" style="grid-template-columns:repeat(4,1fr)">
              <div class="derived-item"><span>${esc(t('s2.cashSigning'))}</span><strong data-out="cashSigning">—</strong></div>
              <div class="derived-item"><span>${esc(t('s2.monthlyPmt'))}</span><strong data-out="finPayment">—</strong></div>
              <div class="derived-item"><span>${esc(t('s2.coverage'))}</span><strong data-out="finCoverage" data-tone="finCovTone">—</strong></div>
              <div class="derived-item"><span>${esc(t('s2.cashAfter'))}</span><strong data-out="finCashAfter">—</strong></div>
            </div>
            <div class="callout good hidden" data-show="selfFunding">
              <div class="big">✓</div>
              <div class="txt" data-out="selfFundText"></div>
            </div>
          </div>
        </div>

        <!-- CARD D: HAHA Operating Costs (Collapsible, Closed by Default) -->
        <div class="panel">
          <div class="collapse-header" data-action="toggleCost">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:800">${esc(t('s2.secD'))}</h3>
              <p style="margin:3px 0 0;font-size:12px;color:var(--muted)">${esc(t('s2.secDd'))}</p>
            </div>
            <div class="collapse-summary">
              <strong data-out="hahaTotalCost">—</strong>
              <span class="step-tag" id="costArrow">${app.costExpanded ? '▲' : '▼'}</span>
            </div>
          </div>
          <div id="costBody" class="${app.costExpanded ? '' : 'hidden'}">
            <div class="divider"></div>
            <div class="form-grid-3">
              <div class="field"><label>${esc(t('s2.cogs'))}</label><div class="input-wrap"><input type="number" class="has-unit" step="0.5" data-bind="haha.cogsRate" value="${esc(h.cogsRate)}"><span class="unit">%</span></div><span class="field-hint">${esc(t('s2.cogsHint'))}</span></div>
              <div class="field"><label>${esc(t('s2.proc'))}</label><div class="input-wrap"><input type="number" class="has-unit" step="0.05" data-bind="haha.processing" value="${esc(h.processing)}"><span class="unit">%</span></div></div>
              <div class="field"><label>${esc(t('s2.shrink'))}</label><div class="input-wrap"><input type="number" class="has-unit" min="0" step="0.1" data-bind="haha.shrinkage" value="${esc(h.shrinkage)}"><span class="unit">%</span></div><span class="field-hint">${esc(t('s2.shrinkHint'))}</span></div>
              <div class="field"><label>${esc(t('s2.aiFee'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="0.01" data-bind="haha.aiPerOrder" value="${esc(h.aiPerOrder)}"></div></div>
              <div class="field"><label>${esc(t('s2.saas'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="1" data-bind="haha.saas" value="${esc(h.saas)}"></div></div>
              <div class="field"><label>${esc(t('s2.sim'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="1" data-bind="haha.sim" value="${esc(h.sim)}"></div></div>
              <div class="field"><label>${esc(t('s2.pos'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="1" data-bind="haha.pos" value="${esc(h.pos)}"></div></div>
              <div class="field"><label>${esc(t('s2.maint'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="1" data-bind="haha.maintenance" value="${esc(h.maintenance)}"></div></div>
              <div class="field"><label>${esc(t('s2.other'))}</label><div class="input-wrap"><span class="prefix">$</span><input type="number" class="has-prefix" min="0" step="1" data-bind="haha.other" value="${esc(h.other)}"></div></div>
            </div>
          </div>
        </div>

        <!-- CARD E: Before vs After, 36-Month Cash Flow & Stress Test -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s2.secE'))}</h3></div>
            <span class="step-tag">E</span>
          </div>

          <div class="kpi-row-4">
            <div class="kpi-box dark">
              <span>${esc(t('s2.kpiGain'))}</span>
              <strong data-out="kpiGain">—</strong>
              <small data-out="kpiAnnual">—</small>
            </div>
            <div class="kpi-box">
              <span>${esc(t('s2.kpiStandalone'))}</span>
              <strong data-out="kpiStandalone">—</strong>
              <small>${esc(t('s2.kpiStandaloneSub'))}</small>
            </div>
            <div class="kpi-box">
              <span>${esc(t('s2.kpiInc'))}</span>
              <strong data-out="kpiInc">—</strong>
              <small>${esc(t('s2.kpiIncSub'))}</small>
            </div>
            <div class="kpi-box">
              <span>${esc(t('s2.kpi3yr'))}</span>
              <strong data-out="kpi3yr">—</strong>
              <small>${esc(t('s2.kpi3yrSub'))}</small>
            </div>
          </div>

          <div class="table-wrap" data-out-html="cmpTable"></div>

          <div style="margin-top:22px">
            <strong style="font-size:14.5px;display:block;margin-bottom:6px">${esc(t('s2.chartTitle'))}</strong>
            <div class="chart-legend">
              <span><i style="background:#8f8f8b"></i>${esc(t('s2.legOld'))}</span>
              <span><i style="background:#1e7e4e"></i>${esc(t('s2.legNew'))}</span>
            </div>
            <div id="cumChartHost"></div>
            <div class="chart-explain">${esc(t('s2.chartExplain'))}</div>
          </div>

          <div class="callout" id="zeroCallout">
            <div class="big" data-out="zeroProfit">$0</div>
            <div class="txt"><strong>${esc(t('s2.zeroTitle'))}</strong><br><span data-out="zeroText"></span></div>
          </div>

          <div class="callout warn hidden" data-show="hiddenRepairRisk">
            <div class="big">⚠</div>
            <div class="txt"><strong>${esc(t('s2.hiddenRiskTitle'))}</strong><br>${esc(t('s2.hiddenRiskText'))}</div>
          </div>

          <div class="form-grid" style="margin-top:18px">
            <div>
              <strong style="font-size:13.5px;display:block;margin-bottom:8px">${esc(t('s2.stressTitle'))}</strong>
              <div class="table-wrap" data-out-html="stressTable"></div>
            </div>
            <div>
              <strong style="font-size:13.5px;display:block;margin-bottom:8px">${esc(t('s2.propTitle'))}</strong>
              <div class="derived-bar" style="margin-top:0;grid-template-columns:1fr 1fr">
                <div class="derived-item"><span>${esc(t('rep.monthly'))}</span><strong data-out="propMo">—</strong></div>
                <div class="derived-item"><span>${esc(t('rep.annual'))}</span><strong data-out="propYr">—</strong></div>
              </div>
              <p style="font-size:12px;color:var(--muted);margin-top:8px">${esc(t('s2.propSub'))}</p>
            </div>
          </div>

          <div class="verdict-box" data-out-html="verdictBox"></div>
          <div class="warn-list" data-out-html="warningsHost"></div>
        </div>

        <div class="step-footer" data-step-footer="step2">
          <div class="step-footer-copy">
            <strong>${esc(t('s2.footerTitle'))}</strong>
            <span data-step-hint="step2">${esc(stepMissingText('step2', p))}</span>
          </div>
          <button type="button" class="button button-dark" data-nav="step3" data-step-cta="step3" disabled>${esc(t('r2.toReport'))}</button>
        </div>
      </div>

      <!-- Sticky Right Financial Snapshot -->
      <aside class="side-col" id="railHost"></aside>
    </div>
  `;
}
