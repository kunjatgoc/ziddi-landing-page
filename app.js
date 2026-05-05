/* Ziddi Trader — lead-capture landing
 * JSON-driven, mobile-first. Dramatic scroll animations.
 */
(() => {
  'use strict';

  const $  = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const getPath = (obj, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);

  const fmtInt   = n => Number(n).toLocaleString('en-US');
  const fmtMoney = n => { const abs = Math.abs(Math.round(n)); return (n < 0 ? '-$' : '$') + abs.toLocaleString('en-US'); };
  const fmtPct   = n => (n >= 0 ? '+' : '') + Number(n).toFixed(1) + '%';

  const prefersReducedMotion = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el, from, to, duration = 1000, formatter = fmtMoney) {
    if (!el) return;
    // Cancel any in-flight tick so re-triggers don't race
    el._ctok = (el._ctok || 0) + 1;
    const token = el._ctok;
    if (el._craf) cancelAnimationFrame(el._craf);

    if (prefersReducedMotion()) { el.textContent = formatter(to); return; }
    const start = performance.now();
    function tick(now) {
      if (token !== el._ctok) return; // superseded
      const t = Math.min(1, (now - start) / duration);
      // easeOutBack for extra drama
      const c1 = 1.70158, c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      el.textContent = formatter(from + (to - from) * Math.max(0, eased));
      if (t < 1) el._craf = requestAnimationFrame(tick);
      else el.textContent = formatter(to);
    }
    el._craf = requestAnimationFrame(tick);
  }

  function resetCount(el, to, formatter = fmtMoney) {
    if (!el) return;
    el._ctok = (el._ctok || 0) + 1;
    if (el._craf) cancelAnimationFrame(el._craf);
    el.textContent = formatter(to);
  }

  function bindConfig(config) {
    $$('[data-bind]').forEach(el => { const val = getPath(config, el.dataset.bind); if (val != null) el.textContent = val; });
    $$('[data-bind-html]').forEach(el => { const val = getPath(config, el.dataset.bindHtml); if (val != null) el.innerHTML = val; });
    $$('[data-bind-src]').forEach(el => { const val = getPath(config, el.dataset.bindSrc); if (val) el.src = val; });
    $$('[data-bind-alt]').forEach(el => { const val = getPath(config, el.dataset.bindAlt); if (val) el.alt = val; });
    document.title = `${config.brand.name} · live forex`;
  }

  function renderTicker(items) {
    if (!items || !items.length) return;
    const group = items.map(t => `
      <span class="px-5 flex items-center gap-5 shrink-0">
        <span>${t}</span><span aria-hidden="true">✦</span>
      </span>`).join('');
    $('#ticker').innerHTML = `<div class="flex shrink-0">${group}</div><div class="flex shrink-0" aria-hidden="true">${group}</div>`;
  }

  function renderFormFields(fields) {
    $('#formFields').innerHTML = fields.map(f => `
      <label class="block">
        <span class="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">${f.label}${f.required ? ' *' : ''}</span>
        <input name="${f.name}" type="${f.type || 'text'}" placeholder="${f.placeholder || ''}"
          ${f.required ? 'required' : ''}
          ${f.pattern ? `pattern="${f.pattern}"` : ''}
          ${f.minLength ? `minlength="${f.minLength}"` : ''}
          ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}
          ${f.type === 'tel' ? 'inputmode="numeric"' : ''}
          autocomplete="${f.name === 'mobile' ? 'tel' : (f.name === 'name' ? 'name' : 'off')}"
          class="input-field block w-full" />
        <span class="error-msg hidden mt-1.5 text-[12px] text-blood font-mono"></span>
      </label>`).join('');
  }

  function renderCredentials(creds) {
    $('#credentialsList').innerHTML = creds.map((c, i) => `
      <div class="flex items-center justify-between gap-3 py-3.5">
        <div class="min-w-0">
          <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">${c.label}</div>
          <div class="text-paper font-mono text-[16px] font-semibold mt-1 truncate">${c.value}</div>
        </div>
        ${c.copy ? `
          <button type="button" class="copy-btn flex-shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest border border-paper/30 text-paper hover:border-lime hover:text-lime px-3 py-2 transition-colors" data-copy="${c.value}" data-idx="${i}">copy</button>
        ` : ''}
      </div>`).join('');
    $$('.copy-btn').forEach(btn => btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn)));
  }

  function renderUpsell(upsell) {
    if (upsell.features && upsell.features.length) {
      $('#upsellFeatures').innerHTML = upsell.features.map(f => `
        <li class="flex items-start gap-2.5 text-paper/90 text-[15px] leading-relaxed">
          <span class="flex-shrink-0 mt-1.5 w-1.5 h-1.5 bg-lime"></span>
          <span>${f}</span>
        </li>`).join('');
    }
    const btn = $('#upsellBtn');
    if (btn) btn.href = upsell.buttonUrl || '#';
  }

  async function copyToClipboard(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    if (btn) { btn.classList.add('copied'); btn.textContent = 'copied'; setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'copy'; }, 1400); }
    showToast('copied');
  }

  function showToast(msg) {
    const t = $('#toast'); t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._timer); t._timer = setTimeout(() => (t.style.opacity = '0'), 1400);
  }

  function validateField(input, field) {
    const errEl = input.parentElement.querySelector('.error-msg');
    const val = (input.value || '').trim();
    let error = '';
    if (field.required && !val) error = `${field.label} required`;
    else if (field.minLength && val.length < field.minLength) error = `min ${field.minLength} chars`;
    else if (field.pattern && !new RegExp(field.pattern).test(val)) error = field.errorMessage || 'invalid';
    if (error) { errEl.textContent = error; errEl.classList.remove('hidden'); input.classList.add('input-error'); return false; }
    errEl.classList.add('hidden'); input.classList.remove('input-error'); return true;
  }

  function wireForm(config) {
    const form = $('#leadForm'), btn = $('#submitBtn'), label = $('#submitLabel');
    const arrow = $('#submitArrow'), spinner = $('#submitSpinner');

    form.addEventListener('input', e => {
      if (e.target.matches('input')) {
        const err = e.target.parentElement.querySelector('.error-msg');
        if (err) err.classList.add('hidden');
        e.target.classList.remove('input-error');
      }
    });

    const errorEl = $('#formError');
    const originalLabel = (config.form.submitText || 'GET MT5 LOGIN').toUpperCase();
    const errorText = config.form.errorText || 'something went wrong. please try again.';
    label.textContent = originalLabel;

    const showFormError = msg => { errorEl.textContent = msg; errorEl.classList.remove('hidden'); };
    const hideFormError = () => errorEl.classList.add('hidden');
    const resetSubmit = () => { btn.disabled = false; btn.classList.remove('opacity-80', 'cursor-not-allowed'); label.textContent = originalLabel; arrow.classList.remove('hidden'); spinner.classList.add('hidden'); };

    form.addEventListener('submit', async e => {
      e.preventDefault(); hideFormError();
      const fields = config.form.fields;
      const inputs = fields.map(f => form.querySelector(`[name="${f.name}"]`));
      const results = fields.map((f, i) => validateField(inputs[i], f));
      if (results.some(r => !r)) { const firstBad = inputs.find((_, i) => !results[i]); if (firstBad) firstBad.focus(); return; }
      const values = Object.fromEntries(fields.map((f, i) => [f.name, inputs[i].value.trim()]));
      const payload = { name: values.name, mobileNumber: values.mobile, source: 'Instagram' };

      btn.disabled = true; btn.classList.add('opacity-80', 'cursor-not-allowed');
      label.textContent = (config.form.submittingText || 'verifying').toUpperCase();
      arrow.classList.add('hidden'); spinner.classList.remove('hidden');

      const endpoint = (config.form.apiEndpoint || '').trim();
      if (!endpoint) { await new Promise(r => setTimeout(r, 600)); revealAccount(); return; }

      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && data.isSuccess === true) revealAccount();
        else { showFormError((data && data.message) || errorText); resetSubmit(); }
      } catch (err) { console.warn('Lead API failed:', err); showFormError(errorText); resetSubmit(); }
    });
  }

  function revealAccount() {
    const reveal = $('#revealSection'), upsell = $('#upsellSection'), form = $('#formSection');
    reveal.classList.remove('reveal-hidden'); reveal.classList.add('reveal-show');
    upsell.classList.remove('reveal-hidden'); upsell.classList.add('reveal-show');
    form.style.display = 'none';
    setTimeout(() => reveal.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function hydrateDynamic(config) {
    if (config.hero && Array.isArray(config.hero.snapshots) && config.hero.snapshots.length) {
      Object.assign(config.hero, pick(config.hero.snapshots));
    }
  }

  /* ========== Live algo feed ========== */

  const signedMoney = v => (v >= 0 ? '+$' : '-$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const signedPct   = v => (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

  function buildTokens(algo) {
    const stats  = algo.stats  || {};
    const totals = algo.totals || {};
    const weeksCount = Array.isArray(algo.weekly) ? algo.weekly.length : 0;
    const np  = (stats.net_profit  && stats.net_profit.value)  || 0;
    const roi = (stats.return_pct  && stats.return_pct.value)  || 0;
    return {
      netProfit:       (stats.net_profit && stats.net_profit.display) || `$${fmtInt(Math.round(np))}`,
      netProfitSigned: signedMoney(np),
      roi:             (stats.return_pct && stats.return_pct.display) || `${roi.toFixed(1)}%`,
      roiSigned:       signedPct(roi),
      trades:          (totals.trades  && totals.trades.display)  || fmtInt(totals.trades && totals.trades.value || 0),
      winPct:          (totals.win_pct && totals.win_pct.display) || `${(totals.win_pct && totals.win_pct.value || 0).toFixed(1)}%`,
      weeksCount:      String(weeksCount)
    };
  }

  function applyTokens(str, tokens) {
    if (typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (k in tokens ? tokens[k] : `{${k}}`));
  }

  function applyTokensDeep(value, tokens) {
    if (typeof value === 'string') return applyTokens(value, tokens);
    if (Array.isArray(value)) return value.map(v => applyTokensDeep(v, tokens));
    if (value && typeof value === 'object') {
      const out = {};
      for (const k in value) out[k] = applyTokensDeep(value[k], tokens);
      return out;
    }
    return value;
  }

  function mapAccountFromAlgo(algo, tags) {
    const invested  = (algo.stats && algo.stats.invested && algo.stats.invested.value) || 0;
    const netProfit = (algo.stats && algo.stats.net_profit && algo.stats.net_profit.value) || 0;
    return {
      id:          algo.id || 'live',
      invested,
      netProfit,
      current:     invested + netProfit,
      roiPct:      (algo.stats && algo.stats.return_pct && algo.stats.return_pct.value) || 0,
      periodLabel: (algo.meta && algo.meta.period_label) || '',
      tags:        Array.isArray(tags) ? tags : [],
      weeks: (Array.isArray(algo.weekly) ? algo.weekly : []).map(w => ({
        range:  w.week,
        profit: (w.ret_dollar && w.ret_dollar.value) || 0,
        roi:    (w.ret_pct    && w.ret_pct.value)    || 0
      }))
    };
  }

  async function fetchLiveAlgo(dataSource) {
    if (!dataSource || !dataSource.url || !dataSource.algoId) {
      throw new Error('dataSource.url / dataSource.algoId missing in config');
    }
    // Cache-bust so CDNs / proxies always return the freshest weekly data
    const sep = dataSource.url.includes('?') ? '&' : '?';
    const url = `${dataSource.url}${sep}t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const algos = await res.json();
    const algo = (Array.isArray(algos) ? algos : []).find(a => a.id === dataSource.algoId);
    if (!algo) throw new Error(`algo "${dataSource.algoId}" not found in feed`);
    return algo;
  }

  function initPerformance(perf) {
    const account = perf && perf.account;
    if (!account) return;
    renderAccountHeader(account);
    renderAccountTags(account.tags);
    renderLineChart(account);
    renderWeekTable(account);
  }

  function renderAccountTags(tags) {
    const host = $('#accountTags');
    if (!host || !Array.isArray(tags) || !tags.length) return;
    host.innerHTML = tags.map((tag, i) => `
      <span class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-paper/15 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80">
        ${i === 0 ? '<span class="w-1 h-1 bg-lime rounded-full shrink-0"></span>' : ''}
        <span>${tag}</span>
      </span>`).join('');
  }

  function renderAccountHeader(a) {
    $('#accountPeriod').textContent = a.periodLabel || '';
    const investedEl = $('#accountInvested'), currentEl = $('#accountCurrent'), pill = $('#accountProfitBadge');

    const isWin = a.netProfit >= 0;
    const sign = isWin ? '+' : '-';
    const accentText = isWin ? 'text-lime' : 'text-blood';
    const accentMuted = isWin ? 'text-lime/70' : 'text-blood/70';
    const accentBorder = isWin ? 'border-lime/25' : 'border-blood/25';

    pill.classList.toggle('border-lime/40', isWin);
    pill.classList.toggle('bg-lime/10', isWin);
    pill.classList.toggle('border-blood/40', !isWin);
    pill.classList.toggle('bg-blood/10', !isWin);

    const cell = (label, value, withDivider) => `
      <div class="px-2.5 py-3 text-center ${withDivider ? 'border-l ' + accentBorder : ''}">
        <div class="font-mono text-[10px] uppercase tracking-[0.18em] ${accentMuted} mb-1">${label}</div>
        <div class="font-mono text-[16px] tabular-nums ${accentText} font-bold leading-none">${value}</div>
      </div>`;
    pill.innerHTML =
      cell(isWin ? 'profit' : 'loss', `${sign}$${fmtInt(Math.abs(a.netProfit))}`, false) +
      cell('roi', fmtPct(a.roiPct), true) +
      cell('period', `~${a.weeks.length} wks`, true);

    resetCount(investedEl, 0);
    resetCount(currentEl, 0);
    pill.classList.add('pill-hidden');
    pill.classList.remove('pill-reveal');

    // Bidirectional: re-animate counters and pill on every entry, reset on exit
    let pillTimer = null;
    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          countUp(investedEl, 0, a.invested, 1800);
          countUp(currentEl,  0, a.current,  2100);
          clearTimeout(pillTimer);
          pillTimer = setTimeout(() => {
            pill.classList.remove('pill-hidden');
            pill.classList.add('pill-reveal');
          }, 2100);
        } else {
          resetCount(investedEl, 0);
          resetCount(currentEl,  0);
          clearTimeout(pillTimer);
          pill.classList.add('pill-hidden');
          pill.classList.remove('pill-reveal');
        }
      });
    }, { threshold: 0.25 });
    cardIO.observe($('#accountCard'));
  }

  function renderLineChart(account) {
    const { invested, weeks, id } = account;
    if (!weeks || !weeks.length) return;
    const host = $('#lineChart');

    const equity = [invested];
    let cur = invested;
    weeks.forEach(w => { cur += w.profit; equity.push(cur); });

    const n = equity.length;
    const minV = Math.min(...equity), maxV = Math.max(...equity);
    const pad = (maxV - minV) * 0.08 || invested * 0.02;
    const yMin = minV - pad, yMax = maxV + pad, range = yMax - yMin || 1;

    const VW = 100, VH = 40;
    // Target (final) positions for each data point
    const targets = equity.map((v, i) => ({
      x: n > 1 ? (i / (n - 1)) * VW : VW / 2,
      y: VH - ((v - yMin) / range) * VH
    }));

    const first = targets[0], last = targets[n - 1];
    const firstXPct = (first.x / VW) * 100, firstYPct = (first.y / VH) * 100;
    const lastXPct  = (last.x  / VW) * 100, lastYPct  = (last.y  / VH) * 100;

    const endValue = equity[n - 1];
    const isUp = endValue >= invested;
    const lineColor = isUp ? '#d9ff00' : '#ff3a3a';
    const gradId = `lcGrad_${id || 'acct'}`;

    const grid = [25, 50, 75].map(p =>
      `<line x1="0" x2="${VW}" y1="${(VH * p / 100).toFixed(2)}" y2="${(VH * p / 100).toFixed(2)}" stroke="rgba(232,230,224,0.05)" stroke-width="0.1"/>`
    ).join('');

    host.innerHTML = `
      <svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stop-color="${lineColor}" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="" fill="url(#${gradId})" class="equity-area"/>
        <path d="" fill="none" stroke="${lineColor}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" class="equity-line"/>
      </svg>
      <div class="absolute w-2 h-2 rounded-full bg-dim" style="left:${firstXPct.toFixed(2)}%;top:${firstYPct.toFixed(2)}%;margin-left:-4px;margin-top:-4px"></div>
      <div class="absolute w-3 h-3 chart-end-dot" style="left:${lastXPct.toFixed(2)}%;top:${lastYPct.toFixed(2)}%;margin-left:-6px;margin-top:-6px">
        <span class="absolute inset-0 rounded-full animate-ping" style="background:${lineColor};opacity:0.55"></span>
        <span class="absolute inset-0 rounded-full" style="background:${lineColor};box-shadow:0 0 16px ${lineColor}"></span>
      </div>`;

    const linePathEl = host.querySelector('path.equity-line');
    const areaPathEl = host.querySelector('path.equity-area');

    const buildPaths = (pts) => {
      const lineD = smoothPath(pts);
      const areaD = `${lineD} L${VW.toFixed(2)},${VH} L0,${VH} Z`;
      linePathEl.setAttribute('d', lineD);
      areaPathEl.setAttribute('d', areaD);
    };

    const baselinePoints = () => targets.map(p => ({ x: p.x, y: VH }));

    // Initial state: flat line at baseline (waiting for entry)
    buildPaths(baselinePoints());

    // Per-point rise animation timing
    const perPointDuration = 600;  // each point takes 600ms to rise to target
    const pointStagger    = 85;    // delay between successive points starting
    const totalDuration   = (n - 1) * pointStagger + perPointDuration;

    let rafId = null;
    let startTime = null;

    const tick = (now) => {
      if (startTime == null) startTime = now;
      const elapsed = now - startTime;
      const pts = targets.map((p, i) => {
        const localStart = i * pointStagger;
        const localEnd   = localStart + perPointDuration;
        let progress;
        if (elapsed < localStart) progress = 0;
        else if (elapsed >= localEnd) progress = 1;
        else {
          const t = (elapsed - localStart) / perPointDuration;
          progress = 1 - Math.pow(1 - t, 3); // easeOutCubic
        }
        return { x: p.x, y: VH + (p.y - VH) * progress };
      });
      buildPaths(pts);
      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(tick);
      } else {
        buildPaths(targets);
        host.classList.add('drawn');
        rafId = null;
      }
    };

    host._animateChart = function(enter) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      startTime = null;
      if (prefersReducedMotion()) {
        buildPaths(targets);
        host.classList.toggle('drawn', !!enter);
        return;
      }
      host.classList.remove('drawn');
      if (enter) {
        buildPaths(baselinePoints());
        rafId = requestAnimationFrame(tick);
      } else {
        // Exit: instant reset to baseline so the next entry re-animates from zero
        buildPaths(baselinePoints());
      }
    };
  }

  function smoothPath(points) {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} L${points[1].x.toFixed(2)},${points[1].y.toFixed(2)}`;
    }
    const tension = 0.35;
    let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 2, cp1y = p1.y + (p2.y - p0.y) * tension / 2;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 2, cp2y = p2.y - (p3.y - p1.y) * tension / 2;
      d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }

  function renderWeekTable(account) {
    const { weeks, netProfit, roiPct } = account;
    if (!weeks || !weeks.length) return;
    const body = $('#weekTableBody'), foot = $('#weekTableFoot');

    const row = (w) => {
      const up = w.profit >= 0, roiUp = (w.roi || 0) >= 0;
      return `
        <tr class="border-t border-paper/5">
          <td class="text-left  px-4 py-3 text-paper">${w.range}</td>
          <td class="text-right pl-4 pr-8 py-3 ${up ? 'text-lime' : 'text-blood'}">${up ? '' : '-'}$${fmtInt(Math.abs(w.profit))}</td>
          <td class="text-right pl-4 pr-8 py-3 ${roiUp ? 'text-lime' : 'text-blood'}">${fmtPct(w.roi)}</td>
        </tr>`;
    };
    body.innerHTML = weeks.map(row).join('');

    const netUp = netProfit >= 0, roiTotalUp = roiPct >= 0;
    foot.innerHTML = `
      <tr class="border-t-2 border-paper/20">
        <td class="text-left  px-4 py-3.5 text-paper uppercase tracking-widest text-[11px]">total</td>
        <td class="text-right pl-4 pr-8 py-3.5 ${netUp ? 'text-lime' : 'text-blood'}">${netUp ? '' : '-'}$${fmtInt(Math.abs(netProfit))}</td>
        <td class="text-right pl-4 pr-8 py-3.5 ${roiTotalUp ? 'text-lime' : 'text-blood'}">${fmtPct(roiPct)}</td>
      </tr>`;
  }

  /* ========== Scroll animations ========== */

  function splitWords(el) {
    if (!el) return [];
    const text = (el.textContent || '').trim();
    if (!text) return [];
    const words = text.split(/\s+/);
    el.innerHTML = words
      .map(w => `<span class="v-word">${w}</span>`)
      .join(' ');
    return $$('.v-word', el);
  }

  function animateHeroOnLoad() {
    if (prefersReducedMotion()) return;

    const leadWords   = splitWords($('#heroLead'));
    const tailWords   = splitWords($('#heroTail'));
    const accentWords = splitWords($('#heroAccent'));

    const all = [...leadWords, ...tailWords, ...accentWords];
    all.forEach((span, i) => {
      setTimeout(() => span.classList.add('in'), 120 + i * 85);
    });

    const amount = $('#heroAmount');
    if (amount) amount.classList.add('v-accent-burst');
  }

  function initAnimationsB() {
    if (prefersReducedMotion()) return;

    animateHeroOnLoad();

    // Section reveal assignments.
    // #revealSection and #upsellSection are intentionally excluded: they use
    // their own one-shot `.reveal-show` slideUp keyframe animation (triggered
    // after form submit). Mixing .v-pop with .reveal-show's fill-forwards
    // caused the bidirectional toggle to get stuck visible.
    const setClass = (sel, cls) => { const el = $(sel); if (el) el.classList.add(cls); };
    setClass('#accountCard',     'v-slide-l');
    setClass('#weeklyPulseCard', 'v-slide-r');
    setClass('#formSection',     'v-pop');
    setClass('#finalCtaSection', 'v-pop');
    setClass('#siteFooter',      'v-pop');

    // Table rows
    const bodyRows = $$('#weekTableBody tr');
    const footRows = $$('#weekTableFoot tr');
    bodyRows.forEach((tr, i) => {
      tr.classList.add('v-row-pop');
      tr.style.transitionDelay = `${i * 85}ms`;
    });
    footRows.forEach((tr) => {
      tr.classList.add('v-row-pop');
      tr.style.transitionDelay = `${bodyRows.length * 85 + 120}ms`;
    });

    // Bidirectional IntersectionObserver for section reveals
    // (toggle in-view so reveals replay when scrolling back up)
    const selectors = '.v-pop, .v-slide-l, .v-slide-r';
    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    $$(selectors).forEach(el => sectionIO.observe(el));

    // Weekly pulse rows: toggle all based on the card's visibility
    const pulse = $('#weeklyPulseCard');
    if (pulse) {
      const rowIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          const on = e.isIntersecting;
          $$('#weekTableBody tr, #weekTableFoot tr').forEach(tr => tr.classList.toggle('in-view', on));
        });
      }, { threshold: 0.15 });
      rowIO.observe(pulse);
    }

    // Equity line — per-point rise animation (JS-driven via host._animateChart)
    const chart = $('#lineChart');
    if (chart && typeof chart._animateChart === 'function') {
      const chartIO = new IntersectionObserver((entries) => {
        entries.forEach(e => chart._animateChart(e.isIntersecting));
      }, { threshold: 0.25 });
      chartIO.observe(chart);
    }

    // CTA glow: triggers on every re-entry of the final CTA section
    const finalBtn = $('#finalCtaBtn');
    const ctaSection = $('#finalCtaSection') || finalBtn;
    if (finalBtn && ctaSection) {
      let glowTimer = null;
      const ctaIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            finalBtn.classList.add('v-btn-glow');
            clearTimeout(glowTimer);
            glowTimer = setTimeout(() => finalBtn.classList.remove('v-btn-glow'), 4800);
          } else {
            clearTimeout(glowTimer);
            finalBtn.classList.remove('v-btn-glow');
          }
        });
      }, { threshold: 0.4 });
      ctaIO.observe(ctaSection);
    }
  }

  function fatalScreen(title, err, hint) {
    const hintHtml = hint ? `<p style="color:#5a5a54;font-size:12px;margin:20px 0 0">${hint}</p>` : '';
    document.body.innerHTML = `<div style="padding:40px 20px;color:#e8e6e0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;text-align:center">
      <h2 style="color:#ff3a3a;font-size:28px;font-weight:700;margin:0 0 12px">${title}</h2>
      <p style="color:#8a8a83;font-size:14px;margin:12px 0 0">${err.message}</p>${hintHtml}</div>`;
  }

  async function boot() {
    let config;
    try {
      const res = await fetch('./config.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      config = await res.json();
    } catch (err) {
      console.error('config load failed:', err);
      fatalScreen('couldn’t load config.', err, 'serve via a local web server, not file://');
      return;
    }

    let algo;
    try {
      algo = await fetchLiveAlgo(config.dataSource);
    } catch (err) {
      console.error('live algo feed load failed:', err);
      fatalScreen('live data unavailable.', err);
      return;
    }

    const staticTags = (config.performance && config.performance.account && config.performance.account.tags) || [];
    config.performance = { account: mapAccountFromAlgo(algo, staticTags) };

    const tokens = buildTokens(algo);
    if (Array.isArray(config.ticker)) config.ticker = applyTokensDeep(config.ticker, tokens);
    if (config.hero && Array.isArray(config.hero.snapshots)) config.hero.snapshots = applyTokensDeep(config.hero.snapshots, tokens);
    if (config.upsell && Array.isArray(config.upsell.features)) config.upsell.features = applyTokensDeep(config.upsell.features, tokens);

    hydrateDynamic(config);
    bindConfig(config);
    renderTicker(config.ticker);
    initPerformance(config.performance);
    renderFormFields(config.form.fields);
    renderCredentials(config.reveal.credentials);
    renderUpsell(config.upsell);
    wireCtaButton('#finalCtaBtn', config.finalCta);
    wireForm(config);

    requestAnimationFrame(() => initAnimationsB());
  }

  function wireCtaButton(selector, cta) {
    if (!cta) return;
    const btn = $(selector);
    if (btn && cta.buttonUrl) btn.href = cta.buttonUrl;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
