/* ===== One cursor — deck.js: reveal init, palette, counter, keys, song, help ===== */
(() => {
  // --- palette: ?theme=gold|orange wins, then localStorage, default orange. Storage may throw (private mode). ---
  const store = { get() { try { return localStorage.getItem('theme'); } catch { return null; } },
                  set(v) { try { localStorage.setItem('theme', v); } catch {} } };
  const q = new URLSearchParams(location.search).get('theme');
  if (q === 'gold' || q === 'orange') store.set(q);
  const setTheme = gold => { document.documentElement.classList.toggle('theme-gold', gold); store.set(gold ? 'gold' : 'orange'); };
  setTheme((q || store.get()) === 'gold');

  // --- typed-in text: split [data-type] into .ch spans; anchors (data-cur*) are left alone ---
  document.querySelectorAll('[data-type]').forEach(el => {
    let c = 0;
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const f = document.createDocumentFragment();
        [...ch.textContent].forEach(t => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--c', c++); s.textContent = t; f.append(s); });
        ch.replaceWith(f);
      } else if (ch.nodeType === 1 && !ch.hasAttribute('data-cur') && !ch.hasAttribute('data-cur2')) walk(ch);
    });
    walk(el);
  });

  // Diagrams: [kind, name, sub, row, column, step]; wires: [classes, row, grid-column, step, label]. Serpentine, so no row reads backwards.
  const DIAGRAMS = {
    pipeline: { rows: 3, nodes: [
      ['step', 'read the photo', '', 1, 1, 0], ['step', 'write the song', 'music starts here', 1, 3, 2], ['step', 'plan the cover and the clip', '', 1, 5, 4],
      ['step', 'paint the cover', '', 1, 7, 6], ['step', 'make the music', '', 1, 9, 8], ['step', 'shoot the video', '', 3, 9, 10],
    ], wires: [['wire', 1, '2', 1], ['wire', 1, '4', 3], ['wire', 1, '6', 5], ['wire', 1, '8', 7], ['vwire down', 2, '9', 9]] },
    emx: { rows: 5, nodes: [
      ['you',  'a photo',       '+ a story + a mood',                  1, 1, 0],
      ['ours', 'emx-web',       'emotion pad → BPM',                   1, 3, 2],
      ['ours', 'BFF',           'Node.js · starts each job the moment it can', 1, 5, 4],
      ['ours', 'emx-api',       'Python · four Gemini calls',          1, 7, 6],
      ['ai',   'Gemini ×4',     'reads · writes the song · plans · paints', 1, 9, 8],
      ['ai',   'Kie AI ×2',     'music ‖ video · in parallel',         3, 3, 12],
      ['you',  'a music video', 'song + cover + clip · a gift to send', 3, 1, 14],
      ['ours', 'SSE',           'live progress, streamed back',        5, 1, 16],
      ['ours', 'emx-web',       'the listening card · lyrics in time', 5, 5, 18],
    ], wires: [
      ['wire', 1, '2', 1], ['wire', 1, '4', 3], ['wire', 1, '6', 5], ['wire', 1, '8', 7],
      ['vwire elbow', 2, '9', 9], ['wire rev join', 3, '4 / 9', 10, 'the moment the song is written, the music starts'],
      ['wire rev', 3, '2', 13], ['vwire down', 4, '1', 15], ['wire', 5, '2 / 5', 17, 'a preview plays while the song finishes'],
    ] },
    stage: { rows: 5, nodes: [
      ['you',  'a sentence',     'describe an app',               1, 1, 0],
      ['ours', 'the console',    'Simple or Advanced',            1, 3, 2],
      ['ours', 'the queue',      'on disk · survives a reload',   1, 5, 4],
      ['ours', 'the worker',     'on my host · one build at a time', 1, 7, 6],
      ['ai',   'Codex',          'GPT-6 Astra · writes the whole app', 1, 9, 8],
      ['ours', 'a real browser', 'Chromium taps it before it ships', 3, 3, 12],
      ['you',  'a live app',     'v1 · plus a QR to share',       3, 1, 14],
      ['you',  'every phone',    'scans and answers',             5, 1, 16],
      ['ours', 'stage-sessions', 'one room · the server keeps score', 5, 5, 18],
      ['you',  'the projector',  'results, live, behind me',      5, 9, 20],
    ], wires: [
      ['wire', 1, '2', 1], ['wire', 1, '4', 3], ['wire', 1, '6', 5], ['wire', 1, '8', 7],
      ['vwire elbow', 2, '9', 9], ['wire rev join', 3, '4 / 9', 10, 'tested in a real browser first'],
      ['wire rev', 3, '2', 13], ['vwire down', 4, '1', 15], ['wire', 5, '2 / 5', 17], ['wire', 5, '6 / 9', 19, 'and it comes back'],
    ] },
    hermes: { rows: 3, nodes: [
      ['you',  'a food photo',     'or just a description',   1, 1, 0],
      ['ours', 'Telegram',         'you message the bot',     1, 3, 2],
      ['ours', 'Hermes',           'open source · on my VPS', 1, 5, 4],
      ['ours', 'calorie-tracker',  'a skill I wrote',         1, 7, 6],
      ['ai',   'GPT-5.5',          'estimates from the input', 1, 9, 8],
      ['ours', 'data.json', 'one entry per meal',       3, 3, 12],
      ['you',  'your daily total', 'replied in Telegram',     3, 1, 14],
    ], wires: [
      ['wire', 1, '2', 1], ['wire', 1, '4', 3], ['wire', 1, '6', 5], ['wire', 1, '8', 7],
      ['vwire elbow', 2, '9', 9], ['wire rev join', 3, '4 / 9', 10, 'validated write → atomic replacement'], ['wire rev', 3, '2', 13],
    ] },
    yt: { rows: 5, nodes: [
      ['you',  'a YouTube link', '+ a command, maybe',        1, 1, 0],
      ['ours', 'Telegram',       'you message the bot',       1, 3, 2],
      ['ours', 'n8n',            'the YoutubeAnalyser flow',  1, 5, 4],
      ['ours', 'yt-transcript',  'grabs the captions',        1, 7, 6],
      ['ai',   'Fabric',         'Gemini · AI patterns analyse it', 1, 9, 8],
      ['ours', 'yt-research',    'five commands · a 7-day memory', 3, 3, 12],
      ['ai',   'Codex',          'GPT-5.6 · searches the web', 3, 1, 14],
      ['you',  'your chat',      'the answer, back in Telegram', 5, 1, 16],
    ], wires: [
      ['wire', 1, '2', 1], ['wire', 1, '4', 3], ['wire', 1, '6', 5], ['wire', 1, '8', 7],
      ['vwire elbow', 2, '9', 9], ['wire rev join', 3, '4 / 9', 10, 'and for /verify and /roadmap'], ['wire rev', 3, '2', 13], ['vwire down', 4, '1', 15],
    ] },
  };
  document.querySelectorAll('.arch[data-diagram]').forEach(a => {
    const dg = DIAGRAMS[a.dataset.diagram]; a.classList.toggle('r3', dg.rows === 3);
    a.innerHTML =
      dg.nodes.map(([k, n, s, r, c, i]) => `<div class="node ${k}" style="grid-row:${r};grid-column:${c};--i:${i}"><span class="name">${n}</span>${s ? `<span class="sub">${s}</span>` : ''}</div>`).join('') +
      dg.wires.map(([cl, r, c, i, l]) => `<div class="${cl}" style="grid-row:${r};grid-column:${c};--i:${i}">${l ? `<b>${l}</b>` : ''}</div>`).join('');
  });

  Reveal.initialize({
    hash: true, transition: 'fade', transitionSpeed: 'default',
    controls: false, progress: false, slideNumber: false, help: false, center: false,
    width: '100%', height: '100%', margin: 0, minScale: 1, maxScale: 1,
    keyboard: {
      83: null, // Audience edition has no speaker view.
      32: e => e.shiftKey ? Reveal.left() : Reveal.right(),       // Space: horizontal only (Shift+Space back); pockets are DOWN
      80: () => setTheme(!document.documentElement.classList.contains('theme-gold')), // P: palette
    },
    plugins: [], showNotes: false,
  });

  // --- counter: horizontal position over horizontal total ---
  const counter = document.getElementById('counter');
  const pad = n => String(n).padStart(2, '0');
  // A pocket hint rides on the counter: ↓ when this slide has a pocket below, ↑ inside a pocket, ↕ when both.
  const pocketHint = () => { const r = Reveal.availableRoutes(); return r.down && r.up ? ' ↕' : r.down ? ' ↓' : r.up ? ' ↑' : ''; };
  const showCount = () => { counter.textContent = `${pad(Reveal.getIndices().h + 1)} / ${pad(Reveal.getHorizontalSlides().length)}${pocketHint()}`; };
  Reveal.on('ready', showCount);
  Reveal.on('slidechanged', showCount);

  // --- help overlay (?) ---
  const help = document.getElementById('help');
  function toggleHelp() { help.hidden = !help.hidden; }
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?') { toggleHelp(); e.preventDefault(); }
  });
  document.querySelectorAll('.fallback img').forEach(i => {
    i.addEventListener('error', () => { i.hidden = true; });
    if (i.complete && !i.naturalWidth) i.hidden = true;                       // a fast 404 can fire before the listener exists
  });

  // Spotify: reveal owns data-src (it lazy-loads it unconditionally), so the deck uses data-embed and loads it
  // itself — only when online and only while its slide is current; otherwise the card behind it is the slide.
  const embeds = () => document.querySelectorAll('iframe[data-embed]');
  const syncEmbeds = () => embeds().forEach(f => {
    const on = navigator.onLine && Reveal.getCurrentSlide().contains(f);
    if (on && !f.src) f.src = f.dataset.embed; else if (!on && f.src) f.removeAttribute('src');
  });
  Reveal.on('ready', syncEmbeds); Reveal.on('slidechanged', syncEmbeds);

  // --- song: range and cues come from the sections, never from indices ---
  const songAudio = document.getElementById('song-audio');
  const H = () => Reveal.getHorizontalSlides();
  const Song = {
    cueFor: h => { const v = H()[h]?.dataset.songCue; return v === undefined ? undefined : +v; },
    range: () => [H().findIndex(s => 'songCue' in s.dataset), H().findIndex(s => 'songEnd' in s.dataset)],
    inRange: h => { const [a, b] = Song.range(); return a >= 0 && b >= 0 && h >= a && h <= b; },
  };
  const FADE_MS_CUE = 400, FADE_MS_OUT = 1500, FADE_MS_IN = 600;
  let fadeTimer = null;
  function fadeVolume(target, duration, onComplete) {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    const start = songAudio.volume, delta = target - start, steps = Math.max(1, Math.round(duration / 16));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++; songAudio.volume = Math.max(0, Math.min(1, start + delta * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; songAudio.volume = target; if (onComplete) onComplete(); }
    }, 16);
  }
  const crossfadeToCue = t => fadeVolume(0, FADE_MS_CUE, () => { songAudio.currentTime = t; fadeVolume(1, FADE_MS_CUE); });
  let playToken = 0;
  const fadeOutAndPause = () => { playToken++; fadeVolume(0, FADE_MS_OUT, () => { songAudio.pause(); songAudio.volume = 1; }); };

  // --- bass → --b: AnalyserNode on the audio element, created on the first M (needs a gesture) ---
  const stage = document.querySelector('.reveal');
  let ctx, analyser, bins, raf, level = 0;
  function tick() {
    if (songAudio.paused) { stop(); return; }
    analyser.getByteFrequencyData(bins);
    const e = (bins[1] + bins[2] + bins[3] + bins[4]) / 4 / 255;          // ≈ 40–170 Hz
    const v = Math.max(0, (e - .45) / .5);
    level = v > level ? v : level * .86;                                   // fast attack, slow decay
    stage.style.setProperty('--b', Math.min(1, level).toFixed(3));
    if (Reveal.getCurrentSlide().classList.contains('beat') && !Reveal.getCurrentSlide().querySelector('h2')?.getAnimations().some(a => a.animationName === 'hit' && a.playState === 'running')) Cursor.follow(); // the numeral's width changes with weight
    raf = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(raf); stage.style.setProperty('--b', .8); stage.classList.remove('live'); Cursor.refresh(); }
  function ensureCtx() {
    if (!ctx) {
      try {
        const c = new AudioContext();
        const a = c.createAnalyser(); a.fftSize = 1024; a.smoothingTimeConstant = .5;
        c.createMediaElementSource(songAudio).connect(a); a.connect(c.destination);
        bins = new Uint8Array(a.frequencyBinCount); analyser = a; ctx = c;
      } catch (e) { console.warn('no analyser:', e); }
    }
    if (ctx) ctx.resume().catch(() => {});
  }
  function start() { if (!analyser) return; stage.classList.add('live'); tick(); }
  songAudio.addEventListener('pause', stop);

  Reveal.on('slidechanged', e => {
    const h = e.indexh;
    if (!songAudio.paused && Song.cueFor(h) !== undefined) crossfadeToCue(Song.cueFor(h));   // forward or backward: re-cue
    if (!songAudio.paused && !Song.inRange(h)) fadeOutAndPause();
  });
  function toggleSong() {
    const h = Reveal.getIndices().h;
    if (songAudio.paused && !Song.inRange(h)) return;                        // M starts only inside the song, but always stops it
    if (songAudio.paused) {
      ensureCtx();                                                           // created + resumed synchronously in the gesture (Safari)
      songAudio.currentTime = Song.cueFor(h) ?? Song.cueFor(Song.range()[0]);
      songAudio.volume = 0;
      const token = ++playToken;
      songAudio.play().then(() => {
        if (token !== playToken || songAudio.paused || !Song.inRange(Reveal.getIndices().h)) return;
        fadeVolume(1, FADE_MS_IN); start();
      }).catch(err => console.warn('play blocked:', err));
    } else fadeOutAndPause();
  }
  // Films: the short main-route cut and optional full recording share one lifecycle.
  const films = [...document.querySelectorAll('video[data-film]')];
  const activeFilm = () => films.find(f => Reveal.getCurrentSlide()?.contains(f));
  const onFilm = () => !!activeFilm();
  const inNotesWindow = () => typeof Reveal.isSpeakerNotes === 'function' && Reveal.isSpeakerNotes();
  function stopSongNow() {
    playToken++;
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    songAudio.pause(); songAudio.volume = 1;
  }
  function syncFilm() {
    const active = !inNotesWindow() && !Reveal.isOverview() ? activeFilm() : null;
    // Stop every other source before starting the active film.
    films.forEach(f => { if (f !== active) { f.pause(); if (f.currentTime) f.currentTime = 0; } });
    if (active) { stopSongNow(); active.currentTime = 0; active.pause(); }
  }
  Reveal.on('ready', () => {
    if (window === window.top && !inNotesWindow()) { const f = films[0]; if(f) f.preload = 'none'; }
  });
  Reveal.on('ready', syncFilm); Reveal.on('slidechanged', syncFilm);
  Reveal.on('overviewshown', () => { films.forEach(f => f.pause()); stopSongNow(); });
  Reveal.on('overviewhidden', syncFilm);
  films.forEach(f => f.addEventListener('error', () => { f.hidden = true; f.parentElement.querySelector('.missing').hidden = false; }));
  const toggleFilm = () => { const f=activeFilm(); if (!f) return; stopSongNow(); if (f.paused) f.play().catch(err => console.warn('film blocked:', err)); else f.pause(); };

  document.addEventListener('keydown', e => {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (onFilm()) { toggleFilm(); if (!songAudio.paused) fadeOutAndPause(); }   // on the film slide M is the film's key; it still stops a stray song
    else toggleSong();
    e.preventDefault();
  });
  window.Song = Song;

  window.Deck = { setTheme };
})();
