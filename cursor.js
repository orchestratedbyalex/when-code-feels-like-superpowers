/* ===== One cursor — cursor.js: one block, placed from the current section ===== */
(() => {
  const reveal = document.querySelector('.reveal');
  const cur = document.createElement('div'); cur.className = 'kcur notrans'; cur.hidden = true; cur.innerHTML = '<i></i>';
  reveal.append(cur);

  let timers = [], section = null, phase = 'first', nodeIdx = 0;
  const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); fn(); }, ms); timers.push(t); };
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const em = () => (section?.querySelector('.stage') || reveal).getBoundingClientRect().width / 100;

  // Rect with any entrance translation (e.g. the `rise` keyframe on .copy) subtracted: where the element will rest.
  function rest(el) {
    const r = el.getBoundingClientRect(); let dx = 0, dy = 0;
    const stage = section?.querySelector('.stage');
    for (let a = el.parentElement; a && a !== stage && a !== reveal; a = a.parentElement) {
      const tf = getComputedStyle(a).transform;
      if (tf && tf !== 'none') { const m = new DOMMatrix(tf); dx += m.e; dy += m.f; }
    }
    return { left: r.left - dx, top: r.top - dy, width: r.width, height: r.height };
  }
  function box(r) {
    const s = reveal.getBoundingClientRect();
    Object.assign(cur.style, { left: r.left - s.left + 'px', top: r.top - s.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  }
  const nameSlot = name => {                       // beside the name's last line of text (a wrapped name is wider than its text)
    const r = rest(name), e = em(), b = name.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(name);
    const lines = [...g.getClientRects()], t = lines.length > 1 ? lines[lines.length - 1] : null;
    if (!t) return { left: r.left + r.width + e * .45, top: r.top + r.height * .08, width: e * .75, height: r.height * .84 };
    return { left: t.right - b.left + r.left + e * .45, top: t.top - b.top + r.top + t.height * .08, width: e * .75, height: t.height * .84 };
  };
  const nodes = () => [...section.querySelectorAll('.arch .node')].sort((a, b) => +a.style.getPropertyValue('--i') - +b.style.getPropertyValue('--i'));
  const second = () => section.querySelector('[data-cur2]');
  const secondShown = el => !el.dataset.at && !!el.closest('.fragment')?.classList.contains('visible');

  // Positions the block for the current phase. Pure: same section + phase → same box.
  function apply() {
    if (!section) return;
    const arch = section.querySelector('.arch');
    if (arch) { const n = nodes()[nodeIdx]; if (n) box(nameSlot(n.querySelector('.name'))); return; }
    const first = section.querySelector('[data-cur]'), then = second();
    if (phase === 'second' && then) box(rest(then));
    else if (first) box(rest(first));
  }

  function place(s) {
    if (Reveal.isOverview()) { cur.hidden = true; return; }
    section = s; clear(); phase = 'first'; nodeIdx = 0;
    const was = cur.hidden;
    if (s.classList.contains('nocur')) { cur.hidden = true; cur.className = 'kcur notrans'; return; }
    if (!s.querySelector('[data-cur]') && !s.querySelector('.arch')) { cur.hidden = true; cur.className = 'kcur notrans'; return; }   // fail safe: no anchor, no cursor
    cur.hidden = false;
    cur.className = 'kcur' + (was ? ' notrans' : '') + (s.classList.contains('beat') ? ' meter' : '');
    if (was) later(() => cur.classList.remove('notrans'), 50);

    const arch = s.querySelector('.arch');
    if (arch) {                                    // hop name to name in narration order (--i), 0.2s each; the first lands synchronously
      nodes().forEach((nd, k) => {
        const go = () => { if (k) cur.classList.add('hop'); nodeIdx = k; apply(); };
        k ? later(go, (parseFloat(nd.style.getPropertyValue('--i')) * .2 + .5) * 1000) : go();
      });
      later(() => cur.classList.add('idle'), 5600);
      return;
    }
    if (s.classList.contains('beat')) later(apply, 520); else apply();   // the numeral hits first, then the cursor joins it
    const then = second(), first = s.querySelector('[data-cur]');
    if (then && then.dataset.at) {
      if (first && first.classList.contains('cur-slot')) later(() => cur.classList.add('idle'), 900);   // the default caret blinks while it waits
      later(() => { cur.classList.remove('idle'); phase = 'second'; apply(); settle(then); }, +then.dataset.at);
    }
    else if (then && secondShown(then)) { phase = 'second'; apply(); settle(then); }
    else later(() => cur.classList.add('idle'), 900);   // blink after arrival; a pending second anchor waits as a blinking caret
  }
  function settle(then) {                          // caret anchors blink; a bar/frame does not
    if (then.classList.contains('cur-slot')) later(() => cur.classList.add('idle'), 800);
    if (section.classList.contains('fade-out')) later(() => cur.classList.add('gone'), 760);
  }
  function onFragment() {                          // jokes, 17a: the second anchor follows the punchline fragment
    if (!section) return;
    const then = second(); if (!then || then.dataset.at) return;
    clear(); cur.classList.remove('idle');
    phase = secondShown(then) ? 'second' : 'first'; apply();
    if (phase === 'second') settle(then); else later(() => cur.classList.add('idle'), 900);
  }
  function refresh() { cur.classList.add('notrans'); apply(); void cur.offsetWidth; cur.classList.remove('notrans'); }
  function follow()  { cur.classList.add('notrans'); cur.classList.remove('idle'); apply(); }

  Reveal.on('ready', e => place(e.currentSlide));
  Reveal.on('slidechanged', e => place(e.currentSlide));
  Reveal.on('overviewshown', () => { cur.hidden = true; });
  Reveal.on('overviewhidden', () => place(Reveal.getCurrentSlide()));
  Reveal.on('fragmentshown', onFragment);
  Reveal.on('fragmenthidden', onFragment);
  if (Reveal.isReady()) place(Reveal.getCurrentSlide());
  addEventListener('resize', refresh);
  document.fonts.ready.then(refresh);

  window.Cursor = { place, refresh, follow, state: () => ({ section, phase, timers: timers.length, nodeIdx }) };
})();
