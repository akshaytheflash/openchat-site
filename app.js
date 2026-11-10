(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ── theme ─────────────────────────────────────────────────────────────── */
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('#theme-color');

  function paintTheme(theme, persist) {
    root.dataset.theme = theme;
    const light = theme === 'light';
    if (themeMeta) themeMeta.setAttribute('content', light ? '#F2F3EF' : '#080A0D');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', light ? 'true' : 'false');
      themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }
    if (persist) {
      try { localStorage.setItem('openchat-theme', theme); } catch (e) {}
    }
  }

  paintTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      const r = themeBtn.getBoundingClientRect();
      root.style.setProperty('--vt-x', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--vt-y', (r.top + r.height / 2) + 'px');
      if (document.startViewTransition && !reduce) {
        document.startViewTransition(() => paintTheme(next, true));
      } else {
        paintTheme(next, true);
      }
    });
  }

  /* ── mobile menu ───────────────────────────────────────────────────────── */
  const menuBtn = $('#menu-btn');
  const menu = $('#mobile-menu');
  let menuOpen = false;

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      const first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      window.setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 220);
      if (menu.contains(document.activeElement)) menuBtn.focus({ preventScroll: true });
    }
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    document.addEventListener('click', (e) => {
      if (menuOpen && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  /* ── progress + scrollspy ──────────────────────────────────────────────── */
  const bar = $('#progress-bar');
  let maxScroll = 1;
  let ticking = false;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, window.scrollY / maxScroll).toFixed(4) + ')';
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, window.scrollY / maxScroll).toFixed(4) + ')';
      ticking = false;
    });
  }

  if (bar) {
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  }

  const navLinks = $$('.nav-links a');
  const sections = navLinks.map((a) => document.getElementById(a.dataset.nav)).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }

  const heroSection = document.getElementById('top');
  if (heroSection && 'IntersectionObserver' in window) {
    const heroSpy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) navLinks.forEach((a) => a.classList.remove('is-active'));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    heroSpy.observe(heroSection);
  }

  /* ── the orb follows the pointer, a little ─────────────────────────────── */
  const orb = $('[data-orb]');
  if (orb && fine && !reduce) {
    const hero = orb.closest('.hero');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(() => {
        cx += (tx - cx) * 0.09;
        cy += (ty - cy) * 0.09;
        orb.style.setProperty('--ox', cx.toFixed(2) + 'px');
        orb.style.setProperty('--oy', cy.toFixed(2) + 'px');
        if (Math.abs(tx - cx) > 0.08 || Math.abs(ty - cy) > 0.08) loop();
        else raf = 0;
      });
    };
    const aim = (e) => {
      const r = orb.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = Math.max(-1, Math.min(1, dx)) * 14;
      ty = Math.max(-1, Math.min(1, dy)) * 12;
      if (!raf) loop();
    };
    if (hero) {
      hero.addEventListener('pointermove', aim, { passive: true });
      hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) loop(); });
    }
  }

  /* ── magnetic buttons ──────────────────────────────────────────────────── */
  if (fine && !reduce) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.setProperty('--tx', (x * 5).toFixed(2) + 'px');
        btn.style.setProperty('--ty', (y * 4).toFixed(2) + 'px');
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--tx', '0px');
        btn.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ── card spotlights ───────────────────────────────────────────────────── */
  if (fine) {
    $$('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ── the film ──────────────────────────────────────────────────────────── */
  const video = $('#film-video');
  const playBtn = $('#film-play');
  const playLabel = $('#film-play-label');
  const chapters = $$('.chapter');

  if (video && playBtn) {
    const times = chapters.map((b) => parseFloat(b.dataset.seek) || 0);

    function showPlay(label) {
      playBtn.classList.remove('is-hidden');
      if (playLabel) playLabel.textContent = label;
      playBtn.setAttribute('aria-label', label === 'Replay the film' ? 'Replay the 23-second film' : 'Play the 23-second film');
    }

    playBtn.addEventListener('click', () => {
      if (video.ended) video.currentTime = 0;
      video.controls = true;
      playBtn.classList.add('is-hidden');
      video.play().catch(() => {});
    });

    video.addEventListener('play', () => playBtn.classList.add('is-hidden'));
    video.addEventListener('ended', () => showPlay('Replay the film'));

    chapters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = parseFloat(btn.dataset.seek) || 0;
        video.currentTime = t;
        video.controls = true;
        playBtn.classList.add('is-hidden');
        video.play().catch(() => {});
      });
    });

    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      let idx = 0;
      for (let i = 0; i < times.length; i++) if (t >= times[i]) idx = i;
      chapters.forEach((b, i) => {
        const on = i === idx;
        b.classList.toggle('is-active', on);
        if (on) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    });
  }

  /* ── the key demo ──────────────────────────────────────────────────────── */
  const keyForm = $('#key-form');
  const keyInput = $('#key-input');
  const keyStatus = $('#key-status');
  const keyCard = $('#connect');
  const keyDemo = $('#key-demo');

  if (keyForm && keyInput && keyStatus && keyCard) {
    const keySubmit = keyForm.querySelector('button[type="submit"]');
    const clear = () => {
      keyCard.classList.remove('is-error', 'is-ok');
      keyStatus.classList.remove('is-error');
      keyStatus.textContent = '';
      keyInput.removeAttribute('aria-invalid');
      if (keySubmit) {
        keySubmit.textContent = 'Connect key';
        keySubmit.disabled = false;
      }
    };

    if (keyDemo) {
      keyDemo.addEventListener('click', () => {
        clear();
        keyInput.value = 'sk-or-v1-demo-7f3e1c';
        keyInput.focus();
      });
    }

    keyInput.addEventListener('input', clear);

    keyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clear();
      const value = keyInput.value.trim();
      if (!/^sk-or-v1-/.test(value)) {
        keyCard.classList.add('is-error');
        keyStatus.classList.add('is-error');
        keyInput.setAttribute('aria-invalid', 'true');
        keyStatus.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2v.3"/></svg>That doesn’t look like an OpenRouter key. They start with sk-or-v1-.';
        keyInput.focus();
        return;
      }
      keyCard.classList.add('is-ok');
      keyStatus.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>Connected. You’re in.';
      if (keySubmit) {
        keySubmit.textContent = 'Connected';
        keySubmit.disabled = true;
      }
    });
  }

  /* ── the chat demo ─────────────────────────────────────────────────────── */
  const ANSWER = [
    ['Two coins that always land the same way, however far apart. That\'s entanglement: ', 0],
    ['one shared outcome', 1],
    [', decided the moment you look.', 0]
  ];
  const ANS_LEN = ANSWER.reduce((n, a) => n + a[0].length, 0);

  const phone = $('.phone');
  const demoUser = $('#demo-user');
  const demoAi = $('#demo-ai');
  const demoEmpty = $('#demo-empty');
  const demoModel = $('#demo-model');
  const demoThink = $('#demo-thinking');
  const demoAnswer = $('#demo-answer');
  const demoCopy = $('#demo-copy');
  const demoStatus = $('#demo-status');
  const demoReset = $('#demo-reset');
  const outsideSend = $('#demo-send');
  const sendBtns = [$('#demo-send'), $('#demo-send-phone')].filter(Boolean);

  let runId = 0, raf = 0, timers = [], running = false, done = false;

  function answerHTML(n) {
    let out = '', k = n;
    for (const [text, bold] of ANSWER) {
      if (k <= 0) break;
      const part = text.slice(0, Math.min(k, text.length));
      out += bold ? '<strong>' + part + '</strong>' : part;
      k -= text.length;
    }
    return out;
  }

  function resetDemo() {
    runId++;
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    cancelAnimationFrame(raf);
    running = false;
    done = false;
    if (phone) phone.classList.remove('is-streaming');
    if (demoUser) demoUser.hidden = true;
    if (demoAi) demoAi.hidden = true;
    if (demoEmpty) demoEmpty.classList.remove('is-hidden');
    if (demoModel) demoModel.textContent = 'Free Router';
    if (demoThink) demoThink.hidden = false;
    if (demoAnswer) { demoAnswer.hidden = true; demoAnswer.innerHTML = ''; }
    if (demoCopy) {
      demoCopy.hidden = true;
      demoCopy.classList.remove('is-copied');
      demoCopy.setAttribute('aria-label', 'Copy answer');
    }
    if (demoStatus) demoStatus.textContent = '';
    sendBtns.forEach((b) => { b.disabled = false; });
    if (outsideSend) outsideSend.textContent = 'Send the question';
  }

  function sendDemo() {
    if (running || done) return;
    running = true;
    const my = ++runId;
    if (demoEmpty) demoEmpty.classList.add('is-hidden');
    if (demoUser) demoUser.hidden = false;
    if (demoAi) demoAi.hidden = false;
    if (phone) phone.classList.add('is-streaming');
    sendBtns.forEach((b) => { b.disabled = true; });
    if (outsideSend) outsideSend.textContent = 'Streaming…';
    if (demoStatus) demoStatus.textContent = 'Thinking…';

    timers.push(window.setTimeout(() => {
      if (my !== runId) return;
      if (demoModel) demoModel.textContent = 'Nemotron 3 Nano';
    }, 650));

    timers.push(window.setTimeout(() => {
      if (my !== runId) return;
      if (demoThink) demoThink.hidden = true;
      if (demoAnswer) demoAnswer.hidden = false;
      if (demoStatus) demoStatus.textContent = 'Answering…';
      const start = performance.now();
      const tick = () => {
        if (my !== runId) return;
        const n = Math.min(ANS_LEN, Math.floor((performance.now() - start) / 1000 * 32));
        if (demoAnswer) demoAnswer.innerHTML = answerHTML(n) + '<span class="caret" aria-hidden="true"></span>';
        if (n < ANS_LEN) {
          raf = requestAnimationFrame(tick);
        } else {
          running = false;
          done = true;
          if (phone) phone.classList.remove('is-streaming');
          if (demoAnswer) demoAnswer.innerHTML = answerHTML(ANS_LEN);
          if (demoCopy) demoCopy.hidden = false;
          if (demoStatus) demoStatus.textContent = 'Answer ready.';
          sendBtns.forEach((b) => { b.disabled = false; });
          if (outsideSend) outsideSend.textContent = 'Send the question';
        }
      };
      tick();
    }, 700));
  }

  sendBtns.forEach((b) => b.addEventListener('click', sendDemo));
  if (demoReset) demoReset.addEventListener('click', resetDemo);

  if (demoCopy) {
    demoCopy.addEventListener('click', async () => {
      const text = ANSWER.map((a) => a[0]).join('');
      try {
        await navigator.clipboard.writeText(text);
        demoCopy.classList.add('is-copied');
        demoCopy.setAttribute('aria-label', 'Copied');
        if (demoStatus) demoStatus.textContent = 'Answer copied.';
        window.setTimeout(() => {
          demoCopy.classList.remove('is-copied');
          demoCopy.setAttribute('aria-label', 'Copy answer');
        }, 1600);
      } catch (e) {
        if (demoStatus) demoStatus.textContent = 'Copy failed. Select the answer and copy it.';
      }
    });
  }

  /* ── personas ──────────────────────────────────────────────────────────── */
  const SAMPLES = {
    balanced: 'Clear, friendly, all-round. The answer you’d send to a friend.',
    concise: 'One shared outcome. Measure one, and you know the other.',
    creative: 'Two coins with a secret. Flip one, and the other already knows.',
    code: 'if measure(a): b = a.state  # one state, two places'
  };
  const sample = $('#persona-sample');
  const personaBtns = $$('.persona');

  personaBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      personaBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (!sample) return;
      const key = btn.dataset.persona;
      const swap = () => {
        sample.textContent = SAMPLES[key] || SAMPLES.balanced;
        sample.classList.toggle('is-code', key === 'code');
        sample.classList.remove('is-swapping');
      };
      if (reduce) { swap(); return; }
      sample.classList.add('is-swapping');
      window.setTimeout(swap, 140);
    });
  });

  /* ── the limit comparison ──────────────────────────────────────────────── */
  const compare = $('.compare');
  if (compare && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        compare.classList.add('is-in');
        io.disconnect();
      });
    }, { threshold: 0.35 });
    io.observe(compare);
  }

  /* ── year ──────────────────────────────────────────────────────────────── */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
