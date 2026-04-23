/* goc. — lead capture landing
 * JSON-driven, mobile-first. Real performance data from config.performance.accounts.
 */
(() => {
  'use strict';

  const $  = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const getPath = (obj, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);

  /* ---------- Formatters ---------- */
  const fmtInt = n => Number(n).toLocaleString('en-US');
  const fmtMoney = n => {
    const abs = Math.abs(Math.round(n));
    return (n < 0 ? '-$' : '$') + abs.toLocaleString('en-US');
  };
  const fmtPct = n => (n >= 0 ? '+' : '') + Number(n).toFixed(1) + '%';

  /* ---------- Animation helpers ---------- */
  const prefersReducedMotion = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el, from, to, duration = 1000, formatter = fmtMoney) {
    if (prefersReducedMotion()) { el.textContent = formatter(to); return; }
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = formatter(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function onceInView(el, cb, threshold = 0.2) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { cb(); io.disconnect(); break; }
      }
    }, { threshold });
    io.observe(el);
  }

  /* ---------- Bindings ---------- */
  function bindConfig(config) {
    $$('[data-bind]').forEach(el => {
      const val = getPath(config, el.dataset.bind);
      if (val != null) el.textContent = val;
    });
    $$('[data-bind-html]').forEach(el => {
      const val = getPath(config, el.dataset.bindHtml);
      if (val != null) el.innerHTML = val;
    });
    $$('[data-bind-src]').forEach(el => {
      const val = getPath(config, el.dataset.bindSrc);
      if (val) el.src = val;
    });
    $$('[data-bind-alt]').forEach(el => {
      const val = getPath(config, el.dataset.bindAlt);
      if (val) el.alt = val;
    });
    document.title = `${config.brand.name} live forex`;
  }

  /* ---------- Ticker ---------- */
  function renderTicker(items) {
    if (!items || !items.length) return;
    const group = items.map(t => `
      <span class="px-5 flex items-center gap-5 shrink-0">
        <span>${t}</span>
        <span aria-hidden="true">✦</span>
      </span>
    `).join('');
    $('#ticker').innerHTML = `<div class="flex shrink-0">${group}</div><div class="flex shrink-0" aria-hidden="true">${group}</div>`;
  }

  /* ---------- Form fields ---------- */
  function renderFormFields(fields) {
    $('#formFields').innerHTML = fields.map(f => `
      <label class="block">
        <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">${f.label}${f.required ? ' *' : ''}</span>
        <input
          name="${f.name}"
          type="${f.type || 'text'}"
          placeholder="${f.placeholder || ''}"
          ${f.required ? 'required' : ''}
          ${f.pattern ? `pattern="${f.pattern}"` : ''}
          ${f.minLength ? `minlength="${f.minLength}"` : ''}
          ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}
          ${f.type === 'tel' ? 'inputmode="numeric"' : ''}
          autocomplete="${f.name === 'mobile' ? 'tel' : (f.name === 'name' ? 'name' : 'off')}"
          class="input-field block w-full"
        />
        <span class="error-msg hidden mt-1.5 text-[11px] text-blood font-mono"></span>
      </label>
    `).join('');
  }

  /* ---------- Credentials ---------- */
  function renderCredentials(creds) {
    $('#credentialsList').innerHTML = creds.map((c, i) => `
      <div class="flex items-center justify-between gap-3 py-3.5">
        <div class="min-w-0">
          <div class="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">${c.label}</div>
          <div class="text-paper font-mono text-[15px] font-semibold mt-1 truncate">${c.value}</div>
        </div>
        ${c.copy ? `
          <button type="button" class="copy-btn flex-shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest border border-paper/30 text-paper hover:border-lime hover:text-lime px-3 py-2 transition-colors" data-copy="${c.value}" data-idx="${i}">
            copy
          </button>
        ` : ''}
      </div>
    `).join('');
    $$('.copy-btn').forEach(btn => btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn)));
  }

  /* ---------- Upsell ---------- */
  function renderUpsell(upsell) {
    if (upsell.features && upsell.features.length) {
      $('#upsellFeatures').innerHTML = upsell.features.map(f => `
        <li class="flex items-start gap-2.5 text-paper/90 text-[14px]">
          <span class="flex-shrink-0 mt-1.5 w-1.5 h-1.5 bg-lime"></span>
          <span>${f}</span>
        </li>
      `).join('');
    }
    const btn = $('#upsellBtn');
    if (btn) btn.href = upsell.buttonUrl || '#';
  }

  /* ---------- Clipboard ---------- */
  async function copyToClipboard(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    if (btn) {
      btn.classList.add('copied');
      btn.textContent = 'copied';
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'copy'; }, 1400);
    }
    showToast('copied');
  }

  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => (t.style.opacity = '0'), 1400);
  }

  /* ---------- Validation + Form submit ---------- */
  function validateField(input, field) {
    const errEl = input.parentElement.querySelector('.error-msg');
    const val = (input.value || '').trim();
    let error = '';
    if (field.required && !val) error = `${field.label} required`;
    else if (field.minLength && val.length < field.minLength) error = `min ${field.minLength} chars`;
    else if (field.pattern && !new RegExp(field.pattern).test(val)) error = field.errorMessage || 'invalid';
    if (error) {
      errEl.textContent = error;
      errEl.classList.remove('hidden');
      input.classList.add('input-error');
      return false;
    }
    errEl.classList.add('hidden');
    input.classList.remove('input-error');
    return true;
  }

  function wireForm(config) {
    const form = $('#leadForm');
    const btn = $('#submitBtn');
    const label = $('#submitLabel');
    const arrow = $('#submitArrow');
    const spinner = $('#submitSpinner');

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

    const showFormError = msg => {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    };
    const hideFormError = () => errorEl.classList.add('hidden');
    const resetSubmit = () => {
      btn.disabled = false;
      btn.classList.remove('opacity-80', 'cursor-not-allowed');
      label.textContent = originalLabel;
      arrow.classList.remove('hidden');
      spinner.classList.add('hidden');
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideFormError();

      const fields = config.form.fields;
      const inputs = fields.map(f => form.querySelector(`[name="${f.name}"]`));
      const results = fields.map((f, i) => validateField(inputs[i], f));
      if (results.some(r => !r)) {
        const firstBad = inputs.find((_, i) => !results[i]);
        if (firstBad) firstBad.focus();
        return;
      }
      const values = Object.fromEntries(fields.map((f, i) => [f.name, inputs[i].value.trim()]));
      const payload = {
        name: values.name,
        mobileNumber: values.mobile,
        source: 'Instagram'
      };

      btn.disabled = true;
      btn.classList.add('opacity-80', 'cursor-not-allowed');
      label.textContent = (config.form.submittingText || 'verifying').toUpperCase();
      arrow.classList.add('hidden');
      spinner.classList.remove('hidden');

      const endpoint = (config.form.apiEndpoint || '').trim();
      if (!endpoint) {
        await new Promise(r => setTimeout(r, 600));
        revealAccount();
        return;
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && data.isSuccess === true) {
          revealAccount();
        } else {
          showFormError((data && data.message) || errorText);
          resetSubmit();
        }
      } catch (err) {
        console.warn('Lead API failed:', err);
        showFormError(errorText);
        resetSubmit();
      }
    });
  }

  function revealAccount() {
    const reveal = $('#revealSection');
    const upsell = $('#upsellSection');
    const form = $('#formSection');
    reveal.classList.remove('reveal-hidden'); reveal.classList.add('reveal-show');
    upsell.classList.remove('reveal-hidden'); upsell.classList.add('reveal-show');
    form.style.display = 'none';
    setTimeout(() => reveal.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  /* =====================================================
   * DYNAMIC HYDRATION
   * ===================================================== */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function isoWeek(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function currentSession() {
    const h = new Date().getUTCHours();
    if (h >= 0  && h < 7)  return 'ASIA SESSION';
    if (h >= 7  && h < 12) return 'LONDON SESSION';
    if (h >= 12 && h < 16) return 'LONDON × NY OVERLAP';
    if (h >= 16 && h < 21) return 'NY SESSION';
    return 'AFTER HOURS';
  }

  function hydrateDynamic(config) {
    // HERO — pick one snapshot from the pool
    if (config.hero && Array.isArray(config.hero.snapshots) && config.hero.snapshots.length) {
      Object.assign(config.hero, pick(config.hero.snapshots));
    }
  }

  /* =====================================================
   * PERFORMANCE SECTION (real data)
   * ===================================================== */

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
      <span class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-paper/15 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/80">
        ${i === 0 ? '<span class="w-1 h-1 bg-lime rounded-full shrink-0"></span>' : ''}
        <span>${tag}</span>
      </span>
    `).join('');
  }

  function renderAccountHeader(a) {
    // Period divider
    $('#accountPeriod').textContent = a.periodLabel || '';

    const investedEl = $('#accountInvested');
    const currentEl  = $('#accountCurrent');
    const pill       = $('#accountProfitBadge');

    // Profit banner: 3-col stats grid with win/loss theming
    const isWin = a.netProfit >= 0;
    const sign  = isWin ? '+' : '-';
    const accentText   = isWin ? 'text-lime'   : 'text-blood';
    const accentMuted  = isWin ? 'text-lime/70' : 'text-blood/70';
    const accentBorder = isWin ? 'border-lime/25' : 'border-blood/25';

    pill.classList.toggle('border-lime/40', isWin);
    pill.classList.toggle('bg-lime/10',     isWin);
    pill.classList.toggle('border-blood/40', !isWin);
    pill.classList.toggle('bg-blood/10',     !isWin);

    const cell = (label, value, withDivider) => `
      <div class="px-2.5 py-3 text-center ${withDivider ? 'border-l ' + accentBorder : ''}">
        <div class="font-mono text-[9px] uppercase tracking-[0.18em] ${accentMuted} mb-1">${label}</div>
        <div class="font-mono text-[15px] tabular-nums ${accentText} font-bold leading-none">${value}</div>
      </div>
    `;
    pill.innerHTML =
      cell(isWin ? 'profit' : 'loss',    `${sign}$${fmtInt(Math.abs(a.netProfit))}`, false) +
      cell('roi',                        fmtPct(a.roiPct),                           true)  +
      cell('period',                     `~${a.weeks.length} wks`,                   true);

    // Initial state: numbers at zero, pill hidden
    investedEl.textContent = fmtMoney(0);
    currentEl.textContent  = fmtMoney(0);
    pill.classList.add('pill-hidden');

    // Trigger count-up + pill reveal when the card scrolls into view
    onceInView($('#accountCard'), () => {
      countUp(investedEl, 0, a.invested, 1100);
      countUp(currentEl,  0, a.current,  1400);
      setTimeout(() => {
        pill.classList.remove('pill-hidden');
        pill.classList.add('pill-reveal');
      }, 1500);
    });
  }

  /* ---------- Weekly bar chart ($ label on top, date below) ---------- */

  /* ---------- Line chart (cumulative equity curve) ---------- */

  function renderLineChart(account) {
    const { invested, weeks, id } = account;
    if (!weeks || !weeks.length) return;
    const host = $('#lineChart');

    // equity[0] = invested; equity[i] = invested + sum of first i weekly profits
    const equity = [invested];
    let cur = invested;
    weeks.forEach(w => { cur += w.profit; equity.push(cur); });

    const n = equity.length;
    const minV = Math.min(...equity);
    const maxV = Math.max(...equity);
    const pad = (maxV - minV) * 0.08 || invested * 0.02;
    const yMin = minV - pad;
    const yMax = maxV + pad;
    const range = yMax - yMin || 1;

    const VW = 100, VH = 40;
    const points = equity.map((v, i) => ({
      x: n > 1 ? (i / (n - 1)) * VW : VW / 2,
      y: VH - ((v - yMin) / range) * VH
    }));

    const linePath = smoothPath(points);
    const areaPath = `${linePath} L${VW.toFixed(2)},${VH} L0,${VH} Z`;

    const first = points[0];
    const last  = points[points.length - 1];
    const firstXPct = (first.x / VW) * 100;
    const firstYPct = (first.y / VH) * 100;
    const lastXPct  = (last.x  / VW) * 100;
    const lastYPct  = (last.y  / VH) * 100;

    const endValue = equity[equity.length - 1];
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
        <path d="${areaPath}" fill="url(#${gradId})"/>
        <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
      <!-- start dot -->
      <div class="absolute w-2 h-2 rounded-full bg-dim" style="left:${firstXPct.toFixed(2)}%;top:${firstYPct.toFixed(2)}%;margin-left:-4px;margin-top:-4px"></div>
      <!-- end dot with halo -->
      <div class="absolute w-3 h-3" style="left:${lastXPct.toFixed(2)}%;top:${lastYPct.toFixed(2)}%;margin-left:-6px;margin-top:-6px">
        <span class="absolute inset-0 rounded-full animate-ping" style="background:${lineColor};opacity:0.45"></span>
        <span class="absolute inset-0 rounded-full" style="background:${lineColor};box-shadow:0 0 10px ${lineColor}"></span>
      </div>
    `;
  }

  function smoothPath(points) {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} L${points[1].x.toFixed(2)},${points[1].y.toFixed(2)}`;
    }
    const tension = 0.35;
    let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 2;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 2;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 2;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 2;
      d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }

  /* ---------- Weekly Pulse table (with TOTAL row) ---------- */

  function renderWeekTable(account) {
    const { weeks, netProfit, roiPct } = account;
    if (!weeks || !weeks.length) return;

    const body = $('#weekTableBody');
    const foot = $('#weekTableFoot');

    const row = (w) => {
      const up = w.profit >= 0;
      const roiUp = (w.roi || 0) >= 0;
      return `
        <tr class="border-t border-paper/5">
          <td class="text-left  px-4 py-3 text-paper">${w.range}</td>
          <td class="text-right pl-4 pr-8 py-3 ${up ? 'text-lime' : 'text-blood'}">${up ? '' : '-'}$${fmtInt(Math.abs(w.profit))}</td>
          <td class="text-right pl-4 pr-8 py-3 ${roiUp ? 'text-lime' : 'text-blood'}">${fmtPct(w.roi)}</td>
        </tr>
      `;
    };

    body.innerHTML = weeks.map(row).join('');

    const netUp = netProfit >= 0;
    const roiTotalUp = roiPct >= 0;
    foot.innerHTML = `
      <tr class="border-t-2 border-paper/20">
        <td class="text-left  px-4 py-3.5 text-paper uppercase tracking-widest text-[10px]">total</td>
        <td class="text-right pl-4 pr-8 py-3.5 ${netUp ? 'text-lime' : 'text-blood'}">${netUp ? '' : '-'}$${fmtInt(Math.abs(netProfit))}</td>
        <td class="text-right pl-4 pr-8 py-3.5 ${roiTotalUp ? 'text-lime' : 'text-blood'}">${fmtPct(roiPct)}</td>
      </tr>
    `;
  }

  /* ---------- Boot ---------- */
  async function boot() {
    let config;
    try {
      const res = await fetch('./config.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      config = await res.json();
    } catch (err) {
      console.error('config load failed:', err);
      document.body.innerHTML = `
        <div style="padding:40px 20px;color:#e8e6e0;font-family:'Space Grotesk',system-ui;text-align:center">
          <h2 style="color:#ff3a3a;font-family:'Instrument Serif',serif;font-style:italic;font-size:32px">couldn't load config.</h2>
          <p style="color:#8a8a83;font-size:13px;margin-top:12px;font-family:monospace">${err.message}</p>
          <p style="color:#5a5a54;font-size:11px;margin-top:20px;font-family:monospace">serve via a local web server, not file://</p>
        </div>`;
      return;
    }

    hydrateDynamic(config);

    bindConfig(config);
    renderTicker(config.ticker);
    initPerformance(config.performance);
    renderFormFields(config.form.fields);
    renderCredentials(config.reveal.credentials);
    renderUpsell(config.upsell);
    wireCtaButton('#finalCtaBtn', config.finalCta);
    wireForm(config);
  }

  function wireCtaButton(selector, cta) {
    if (!cta) return;
    const btn = $(selector);
    if (btn && cta.buttonUrl) btn.href = cta.buttonUrl;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
