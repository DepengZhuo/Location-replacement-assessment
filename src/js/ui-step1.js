/* =====================================================================
   HAHA Location Replacement Assessment v2.2
   ===================================================================== */
'use strict';

function renderStep1(p) {
  const venues = ['office', 'factory', 'gym', 'hospital', 'hotel', 'school', 'apartment', 'transit', 'construction', 'retail'];
  const mtypes = ['snack', 'beverage', 'combo', 'frozen', 'other'];
  const pays = ['coin', 'bill', 'card', 'mobile'];
  const diagQs = [
    { k: 'q1', dim: 'offense', t: 's1.q1t', q: 's1.q1', opts: ['s1.q1a', 's1.q1b', 's1.q1c'] },
    { k: 'q2', dim: 'offense', t: 's1.q2t', q: 's1.q2', opts: ['s1.q2a', 's1.q2b', 's1.q2c'] },
    { k: 'q3', dim: 'offense', t: 's1.q3t', q: 's1.q3', opts: ['s1.q3a', 's1.q3b', 's1.q3c'] },
    { k: 'q4', dim: 'defense', t: 's1.q4t', q: 's1.q4', opts: ['s1.q4a', 's1.q4b', 's1.q4c'] },
    { k: 'q5', dim: 'defense', t: 's1.q5t', q: 's1.q5', opts: ['s1.q5a', 's1.q5b', 's1.q5c'] },
    { k: 'q6', dim: 'defense', t: 's1.q6t', q: 's1.q6', opts: ['s1.q6a', 's1.q6b', 's1.q6c'] }
  ];

  return `
    <div class="page-heading">
      <div>
        <div class="eyebrow">${esc(t('s1.eyebrow'))}</div>
        <h1>${esc(t('s1.title'))}</h1>
        <p>${esc(t('s1.lead'))}</p>
      </div>
    </div>
    <div class="two-column-layout">
      <div class="main-col">
        <!-- Location Details -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s1.c1'))}</h3><p>${esc(t('s1.c1d'))}</p></div>
            <span class="step-tag">01</span>
          </div>
          <div class="form-grid">
            <div class="field">
              <label>${esc(t('s1.locName'))}</label>
              <input type="text" data-bind="meta.locationName" data-kind="text" value="${esc(p.meta.locationName)}" placeholder="${esc(t('s1.locNamePh'))}">
            </div>
            <div class="field">
              <label>${esc(t('s1.venue'))}</label>
              <select data-bind="meta.venue" data-kind="text">
                ${venues.map(v => `<option value="${v}" ${p.meta.venue === v ? 'selected' : ''}>${esc(t('venue.' + v))}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>${esc(t('s1.city'))}</label>
              <input type="text" data-bind="meta.city" data-kind="text" value="${esc(p.meta.city)}">
            </div>
            <div class="field">
              <label>${esc(t('s1.state'))}</label>
              <input type="text" data-bind="meta.state" data-kind="text" value="${esc(p.meta.state)}" placeholder="TX">
            </div>
          </div>
        </div>

        <!-- Current Machine Status (0–40 pts) -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s1.c2'))}</h3><p>${esc(t('s1.c2d'))}</p></div>
            <span class="step-tag">40 PTS</span>
          </div>
          <div class="field" style="margin-bottom:14px">
            <label>${esc(t('s1.mType'))}</label>
            <div class="chips" data-chip-group="machine.type">
              ${mtypes.map(x => `<button type="button" class="chip ${p.machine.type === x ? 'on' : ''}" data-set="machine.type" data-value="${x}">${esc(t('mtype.' + x))}</button>`).join('')}
            </div>
          </div>
          <div class="form-grid-3" style="margin-bottom:14px">
            <div class="field">
              <label>${esc(t('s1.mAge'))}</label>
              <input type="number" min="0" step="1" data-bind="machine.age" value="${esc(p.machine.age)}" placeholder="0">
              <span class="field-hint">${esc(t('s1.mAgeHint'))}</span>
            </div>
            <div class="field">
              <label>${esc(t('s1.mCond'))}</label>
              <div class="seg block" data-seg-group="machine.condition">
                ${['good', 'fair', 'poor'].map(x => `<button type="button" class="${p.machine.condition === x ? 'on' : ''}" data-set="machine.condition" data-value="${x}">${esc(t('cond.' + x))}</button>`).join('')}
              </div>
            </div>
            <div class="field">
              <label>${esc(t('s1.mMon'))}</label>
              <div class="seg block" data-seg-group="machine.monitoring">
                ${['yes', 'no'].map(x => `<button type="button" class="${p.machine.monitoring === x ? 'on' : ''}" data-set="machine.monitoring" data-value="${x}">${esc(t('common.' + x))}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="field">
            <label>${esc(t('s1.mPay'))}</label>
            <div class="chips" data-multi-group="machine.payments">
              ${pays.map(x => `<button type="button" class="chip ${(p.machine.payments || []).includes(x) ? 'on' : ''}" data-toggle="machine.payments" data-value="${x}">${esc(t('pay.' + x))}</button>`).join('')}
            </div>
            <span class="field-hint">${esc(t('s1.mPayHint'))}</span>
          </div>
        </div>

        <!-- 6 Commercial Diagnostic Questions (0–60 pts) -->
        <div class="panel">
          <div class="panel-head">
            <div><h3>${esc(t('s1.c3'))}</h3><p>${esc(t('s1.c3d'))}</p></div>
            <span class="step-tag">60 PTS</span>
          </div>
          <div class="criteria-list">
            ${diagQs.map((q, idx) => {
              const cur = num(p.diag[q.k]);
              return `
                <div class="criterion">
                  <div class="criterion-top">
                    <div class="criterion-title-wrap">
                      <span class="criterion-num">0${idx + 1}</span>
                      <div><h4>${esc(t(q.t))}</h4><p class="criterion-q">${esc(t(q.q))}</p></div>
                    </div>
                    <span class="dim-tag ${q.dim}">${esc(t('s1.' + q.dim))}</span>
                  </div>
                  <div class="choices-3" data-diag-group="diag.${q.k}">
                    <button type="button" class="choice-btn ${cur === 10 ? 'on-10' : ''}" data-set="diag.${q.k}" data-value="10">${esc(t(q.opts[0]))}</button>
                    <button type="button" class="choice-btn ${cur === 5 ? 'on-5' : ''}" data-set="diag.${q.k}" data-value="5">${esc(t(q.opts[1]))}</button>
                    <button type="button" class="choice-btn ${cur === 0 ? 'on-0' : ''}" data-set="diag.${q.k}" data-value="0">${esc(t(q.opts[2]))}</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Sticky Right Column: Urgency Score + Explicit Scoring Criteria Card -->
      <aside class="side-col">
        <div id="railHost"></div>
        <div class="criteria-guide-card">
          <h4>${esc(t('s1.critTitle'))}</h4>
          <p>${esc(t('s1.critDesc'))}</p>
          <div class="criteria-tier-list">
            <div class="criteria-tier-row"><strong>75–100</strong><span>${esc(t('s1.tierStrong'))}</span></div>
            <div class="criteria-tier-row"><strong>50–74</strong><span>${esc(t('s1.tierModel'))}</span></div>
            <div class="criteria-tier-row"><strong>0–49</strong><span>${esc(t('s1.tierLow'))}</span></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}
