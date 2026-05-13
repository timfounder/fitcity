'use strict';

const isMobile = window.matchMedia('(max-width: 900px)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// Preloader
// ============================================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hide');
    initSplitText();
  }, 2200);
});

// (Native scroll behavior is used throughout — modern browsers already provide smooth feel.)

// ============================================
// Magnetic Custom Cursor
// ============================================
const cursor = document.querySelector('.cursor');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
let magnetTarget = null;
let magnetX = 0, magnetY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

function animateRing() {
  // If magnetic target active, ease ring towards center of element instead of cursor
  let tx = mouseX, ty = mouseY;
  if (magnetTarget) {
    const rect = magnetTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Pull cursor element a bit toward center too
    const pullX = (cx - mouseX) * 0.25;
    const pullY = (cy - mouseY) * 0.25;
    cursor.style.left = (mouseX + pullX) + 'px';
    cursor.style.top = (mouseY + pullY) + 'px';
    tx = cx;
    ty = cy;
  }
  ringX += (tx - ringX) * 0.2;
  ringY += (ty - ringY) * 0.2;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

// Magnetic effect: elements with [data-cursor] highlight the cursor;
// only those with [data-magnetic] also translate themselves toward cursor
function setupMagnetic() {
  document.querySelectorAll('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      ring.classList.add('hover');
      magnetTarget = el;
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      ring.classList.remove('hover');
      if (magnetTarget === el) magnetTarget = null;
      if (el.hasAttribute('data-magnetic')) el.style.transform = '';
    });
    if (el.hasAttribute('data-magnetic')) {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        const strength = 0.3;
        el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
        el.style.transition = 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)';
      });
    }
  });
}
setupMagnetic();

// ============================================
// Particles (Hero canvas)
// ============================================
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w = 0, h = 0;
  const heroEl = canvas.parentElement;
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    const rect = heroEl.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  heroEl.addEventListener('mousemove', (e) => {
    const rect = heroEl.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  heroEl.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  const count = isMobile ? 30 : 60;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.3,
      hue: Math.random() < 0.7 ? 'rgba(255,0,48,' : 'rgba(255,255,255,',
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.6;
        p.vx += (dx / dist) * force * 0.15;
        p.vy += (dy / dist) * force * 0.15;
      }

      p.x += p.vx;
      p.y += p.vy;
      // Friction
      p.vx *= 0.985;
      p.vy *= 0.985;
      // Gentle drift back
      p.vx += (Math.random() - 0.5) * 0.01;
      p.vy += (Math.random() - 0.5) * 0.01;

      // Wrap
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.hue + p.alpha + ')';
      ctx.fill();
    }

    // Connecting lines for nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255,0,48,${(1 - d/110) * 0.12})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }
  tick();
})();

// ============================================
// Hero Parallax (mouse-based)
// ============================================
(function initParallax() {
  if (isMobile || prefersReducedMotion) return;
  const layers = document.querySelectorAll('[data-parallax]');
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let tx = 0, ty = 0, cx = 0, cy = 0;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    tx = (e.clientX - rect.left - rect.width / 2) / rect.width;
    ty = (e.clientY - rect.top - rect.height / 2) / rect.height;
  });
  hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    layers.forEach(l => {
      const depth = parseFloat(l.dataset.parallax) || 0.2;
      const x = cx * depth * 40;
      const y = cy * depth * 40;
      l.style.transform = `translate(${x}px, ${y}px)`;
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ============================================
// Split Text (for glitch hover + reveal-by-char)
// ============================================
function initSplitText() {
  document.querySelectorAll('.split-text').forEach(el => {
    if (el.dataset.splitDone === '1') return;
    el.dataset.splitDone = '1';
    // Walk through child nodes, wrap each character in a span, preserve nested elements (.accent)
    const walk = (node) => {
      const result = document.createDocumentFragment();
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent;
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === ' ' || ch === '\n') {
              result.appendChild(document.createTextNode(ch));
            } else {
              const span = document.createElement('span');
              span.className = 'split-char';
              span.textContent = ch;
              span.setAttribute('data-char', ch);
              span.style.transitionDelay = (i * 0.018) + 's';
              result.appendChild(span);
            }
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Recursive: wrap inside the element but keep the wrapper element
          if (child.tagName === 'BR') {
            result.appendChild(child.cloneNode());
          } else {
            const clone = child.cloneNode(false);
            clone.appendChild(walk(child));
            result.appendChild(clone);
          }
        }
      });
      return result;
    };
    const wrapped = walk(el);
    el.innerHTML = '';
    el.appendChild(wrapped);
  });
}
// Initialize early too (so it's ready when reveals fire)
if (document.readyState !== 'loading') initSplitText();
else document.addEventListener('DOMContentLoaded', initSplitText);

// ============================================
// Scroll-triggered reveals
// ============================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.reveal, .reveal-stagger, .split-text').forEach(el => observer.observe(el));

// ============================================
// Nav scroll state + Scroll progress bar
// ============================================
const nav = document.getElementById('nav');
const progressBar = document.querySelector('.scroll-progress-bar');
const progressPct = document.getElementById('scrollPct');

function updateScroll() {
  const scrolled = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? scrolled / docHeight : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  if (progressPct) progressPct.textContent = String(Math.round(progress * 100)).padStart(2, '0');

  if (scrolled > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

// ============================================
// Number counters
// ============================================
const counters = document.querySelectorAll('[data-target]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const duration = 2000;
      const start = performance.now();
      const animate = (t) => {
        const progress = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value + '+';
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

// ============================================
// Smooth scroll for anchor links (native)
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const targetY = target.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  });
});

// ============================================
// Journey sticky-scroll (4 stages)
// ============================================
(function initJourney() {
  const track = document.getElementById('journeyTrack');
  if (!track) return;
  const stages = document.querySelectorAll('.journey-stage');
  const layers = document.querySelectorAll('.journey-visual-layer');
  const dots = document.querySelectorAll('.journey-dot');
  const stepNum = document.getElementById('stepNum');
  const total = 4;
  let currentStage = -1;

  function setStage(i) {
    if (i === currentStage) return;
    currentStage = i;
    stages.forEach((s, idx) => s.classList.toggle('active', idx === i));
    layers.forEach((l, idx) => l.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('done', idx < i);
      d.classList.toggle('active', idx === i);
    });
    if (stepNum) stepNum.textContent = String(i + 1).padStart(2, '0');
  }

  function update() {
    const rect = track.getBoundingClientRect();
    const trackHeight = track.offsetHeight - window.innerHeight;
    if (trackHeight <= 0) return;
    // progress: 0 when track top reaches viewport top, 1 when bottom of track reaches viewport bottom
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(scrolled / trackHeight, 0.9999));
    const stage = Math.floor(progress * total);
    setStage(Math.max(0, Math.min(stage, total - 1)));
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();


// ============================================
// i18n — Internationalization
// ============================================
// Translation dictionary embedded above is loaded; init the engine here.

const SUPPORTED_LANGS = ['ru', 'uz', 'en'];

function detectInitialLang() {
  // 1) URL ?lang=
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;
  // 2) localStorage
  try {
    const stored = localStorage.getItem('fc_lang');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (e) {}
  // 3) browser language
  const nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(nav)) return nav;
  return 'ru';
}

let currentLang = detectInitialLang();

function applyTranslations(lang) {
  if (!i18n[lang]) lang = 'ru';
  const dict = i18n[lang];

  // textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  // innerHTML (for keys with <br> or markup if any — we don't use this much)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });

  // Update <html lang>
  document.documentElement.lang = lang;
  // Update toggle state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  currentLang = lang;
  try { localStorage.setItem('fc_lang', lang); } catch (e) {}

  // After language change, re-split text elements
  // (their content changed; split-char wrappers are stale)
  document.querySelectorAll('.split-text').forEach(el => {
    el.dataset.splitDone = '';
  });
  initSplitText();

  // Update meta description and OG title for SEO
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const descKey = dict['hero.aside'];
    if (descKey) metaDesc.setAttribute('content', descKey);
  }

  // Recalculate calculator (number formatting may differ)
  if (window.recalculateCalc) window.recalculateCalc();
}

// Init translation engine
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    if (lang === currentLang) return;
    applyTranslations(lang);
  });
});

applyTranslations(currentLang);

// ============================================
// CALCULATOR
// ============================================
(function initCalculator() {
  const monthlyBase = 800000;       // 1-month price
  const monthlyAt6  = 700000;       // effective monthly when buying 6 months (4 200 000 / 6)
  const monthlyAt12 = 566667;       // effective monthly when buying 12 months (6 800 000 / 12)
  const personalPrice = 150000;     // per personal session
  const freezeMonthly = 30000;      // freeze service added per month

  const state = { duration: 6, personal: 0, freeze: 0 };

  const totalEl = document.getElementById('calcTotal');
  const monthlyEl = document.getElementById('calcMonthly');
  const savingsEl = document.getElementById('calcSavings');
  const savingsBlock = document.getElementById('calcSavingsBlock');
  const personalValEl = document.getElementById('calcPersonalVal');
  const periodLabel = document.getElementById('calcPeriodLabel');
  const personalSlider = document.getElementById('calcPersonal');

  function formatNum(n) {
    // Use a thin space separator that reads well in all 3 languages
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function recalculate() {
    const dur = state.duration;
    let monthlyRate;
    if (dur === 1) monthlyRate = monthlyBase;
    else if (dur === 6) monthlyRate = monthlyAt6;
    else monthlyRate = monthlyAt12;

    const baseBlock = monthlyRate * dur;
    const personalBlock = state.personal * personalPrice * dur;
    const freezeBlock = state.freeze * freezeMonthly * dur;
    const total = baseBlock + personalBlock + freezeBlock;

    // Savings: vs paying month-by-month at monthlyBase, plus same personal/freeze
    const baseline = monthlyBase * dur + personalBlock + freezeBlock;
    const savings = baseline - total;

    if (totalEl) totalEl.textContent = formatNum(total / 1000);
    if (monthlyEl) monthlyEl.textContent = formatNum(total / dur);
    if (savingsEl) savingsEl.textContent = formatNum(savings / 1000);
    if (savingsBlock) savingsBlock.classList.toggle('show', savings > 0);
    if (personalValEl) personalValEl.textContent = state.personal;

    // Period label translation key adjusts to duration
    if (periodLabel) {
      const dict = i18n[currentLang] || i18n.ru;
      periodLabel.textContent = dict['calc.period'] || 'за весь период';
    }
  }
  window.recalculateCalc = recalculate;

  // Tab-group handlers (duration, freeze)
  document.querySelectorAll('.calc-options').forEach(group => {
    group.querySelectorAll('.calc-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.calc-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = group.dataset.calc;
        const val = parseInt(btn.dataset.value);
        if (key === 'duration') state.duration = val;
        if (key === 'freeze') state.freeze = val;
        recalculate();
      });
    });
  });

  if (personalSlider) {
    personalSlider.addEventListener('input', (e) => {
      state.personal = parseInt(e.target.value);
      recalculate();
    });
  }

  recalculate();
})();

// ============================================
// FORM — Plan toggle + submission to Telegram
// ============================================
(function initForm() {
  // Plan toggle
  const planOpts = document.querySelectorAll('.form-plan-opt');
  const planInput = document.getElementById('formPlan');
  planOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      planOpts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (planInput) planInput.value = btn.dataset.value;
    });
  });

  // Form submit
  const form = document.getElementById('leadForm');
  const submitBtn = document.getElementById('formSubmit');
  const submitText = submitBtn ? submitBtn.querySelector('.form-submit-text') : null;
  const status = document.getElementById('formStatus');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dict = i18n[currentLang] || i18n.ru;

    const name = document.getElementById('formName').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const plan = (planInput && planInput.value) || 'month';
    const message = document.getElementById('formMessage').value.trim();

    // Basic validation
    if (name.length < 2 || phone.length < 9) {
      showStatus('error', dict['form.error']);
      return;
    }

    submitBtn.classList.add('loading');
    if (submitText) submitText.textContent = dict['form.submitting'];

    const planLabel = {
      month: '1 месяц / 1 oy / 1 month',
      '6m':  '6 месяцев / 6 oy / 6 months',
      year:  'Год / Yil / Yearly',
      consult: 'Консультация / Maslahat / Consultation'
    }[plan] || plan;

    const text =
      '🔥 НОВАЯ ЗАЯВКА — FITCITY CHIMGAN\n\n' +
      '👤 Имя: ' + name + '\n' +
      '📞 Телефон: ' + phone + '\n' +
      '📋 Тариф: ' + planLabel + '\n' +
      (message ? '💬 Комментарий: ' + message + '\n' : '') +
      '🌐 Язык: ' + currentLang.toUpperCase() + '\n' +
      '🕐 ' + new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });

    // === Telegram Bot API integration ===
    // To activate: replace TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID below with real values.
    // Until then, the form will simulate a successful submission for demo purposes.
    const TELEGRAM_BOT_TOKEN = '';   // e.g. "7123456789:AA..."
    const TELEGRAM_CHAT_ID   = '';   // e.g. "-1001234567890" or your personal chat id

    try {
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const res = await fetch(
          'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: text,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          }
        );
        const data = await res.json();
        if (!data.ok) throw new Error(data.description || 'Failed');
      } else {
        // Demo mode — no real send, just simulate latency
        await new Promise(r => setTimeout(r, 800));
        console.info('[FitCity] Demo lead (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to activate):', text);
      }

      showStatus('success', dict['form.success']);
      form.reset();
      planOpts.forEach((b, i) => b.classList.toggle('active', i === 0));
      if (planInput) planInput.value = 'month';
    } catch (err) {
      console.error('Form submit error:', err);
      showStatus('error', dict['form.error']);
    } finally {
      submitBtn.classList.remove('loading');
      if (submitText) submitText.textContent = dict['form.submit'];
    }
  });

  function showStatus(type, msg) {
    if (!status) return;
    status.className = 'form-status show ' + type;
    status.textContent = msg;
    setTimeout(() => { status.classList.remove('show'); }, 6000);
  }
})();

// ============================================
// Sticky mobile CTA visibility
// ============================================
(function initStickyCTA() {
  const sticky = document.querySelector('.sticky-cta');
  if (!sticky) return;
  let lastShown = false;
  function update() {
    const heroEnd = window.innerHeight * 0.8;
    const formEl = document.getElementById('form');
    const formTop = formEl ? formEl.getBoundingClientRect().top + window.scrollY : Infinity;
    const formBottom = formEl ? formTop + formEl.offsetHeight : Infinity;
    const y = window.scrollY;
    // Show when scrolled past hero and NOT currently in form section
    const inForm = y + window.innerHeight > formTop && y < formBottom;
    const show = y > heroEnd && !inForm;
    if (show !== lastShown) {
      sticky.classList.toggle('visible', show);
      lastShown = show;
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
