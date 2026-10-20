// app.js: Seitenliste, Editor (Zuschnitt und Aussehen), Ablegen
(function () {
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* Speicher nicht verfügbar */ } }
  };

  const pages = [];      // { id, srcBlob, quad, filter, rot, resBlob, w, h, url }
  let queue = [];        // wartende Fotos
  let ed = null;         // Zustand des Editors
  let nextId = 1;
  let lastFilter = store.get('bs.filter') || 'dokument';
  let fmt = store.get('bs.fmt') === 'jpg' ? 'jpg' : 'pdf';

  const cv = $('cv');
  const edgeColor = () => getComputedStyle(document.documentElement).getPropertyValue('--edge').trim() || '#f2a900';

  // ---------- Liste ----------
  function render() {
    $('count').textContent = pages.length + (pages.length === 1 ? ' Seite' : ' Seiten');
    $('saveBtn').disabled = !pages.length;
    const list = $('list');
    list.textContent = '';
    if (!pages.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      const s = document.createElement('strong'); s.textContent = 'Noch keine Seite';
      e.append(s, 'Lege das Blatt auf einen Untergrund, der sich in der Helligkeit abhebt, und tippe auf „Foto aufnehmen“.');
      list.append(e);
      return;
    }
    const g = document.createElement('div'); g.className = 'grid';
    pages.forEach((p, i) => {
      const c = document.createElement('div'); c.className = 'card';
      const t = document.createElement('button'); t.className = 'thumb'; t.setAttribute('aria-label', 'Seite ' + (i + 1) + ' bearbeiten');
      const im = document.createElement('img'); im.src = p.url; im.alt = '';
      t.append(im); t.onclick = () => openEdit(i);
      const m = document.createElement('div'); m.className = 'meta';
      const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1).padStart(2, '0');
      const mini = document.createElement('div'); mini.className = 'mini';
      const l = document.createElement('button'); l.textContent = '‹'; l.setAttribute('aria-label', 'Nach vorn'); l.disabled = i === 0; l.onclick = () => move(i, -1);
      const r = document.createElement('button'); r.textContent = '›'; r.setAttribute('aria-label', 'Nach hinten'); r.disabled = i === pages.length - 1; r.onclick = () => move(i, 1);
      mini.append(l, r); m.append(n, mini); c.append(t, m); g.append(c);
    });
    list.append(g);
  }

  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= pages.length) return;
    [pages[i], pages[j]] = [pages[j], pages[i]];
    render();
  }

  // ---------- Fotos annehmen ----------
  function takeFiles(input) {
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    queue.push(...files);
    if (!ed) nextFromQueue();
  }
  $('cam').addEventListener('change', (e) => takeFiles(e.target));
  $('gal').addEventListener('change', (e) => takeFiles(e.target));

  async function nextFromQueue() {
    if (!queue.length) { closeEditor(); return; }
    const f = queue.shift();
    showEditor();
    busy(true);
    try {
      const src = await Scan.loadCanvas(f, 2400);
      const det = Scan.detect(src);
      ed = { idx: null, src, quad: det.quad, found: det.found, filter: lastFilter, rot: 0, srcBlob: null, prevKey: '', prevCanvas: null };
      setTab('crop');
    } catch (e) {
      busy(false);
      closeEditor();
      alert0('Das Foto konnte nicht gelesen werden.');
    }
  }

  async function openEdit(i) {
    const p = pages[i];
    showEditor();
    busy(true);
    const src = await Scan.loadCanvas(p.srcBlob, 2400);
    ed = { idx: i, src, quad: p.quad.map((a) => a.slice()), found: true, filter: p.filter, rot: p.rot, srcBlob: p.srcBlob, prevKey: '', prevCanvas: null };
    setTab('crop');
  }

  function alert0(msg) { $('count').textContent = msg; setTimeout(render, 2500); }

  // ---------- Editor ----------
  function showEditor() { $('editor').hidden = false; }
  function closeEditor() { $('editor').hidden = true; ed = null; busy(false); render(); }
  function busy(on) { $('busy').hidden = !on; }

  function setTab(t) {
    ed.tab = t;
    $('tabCrop').setAttribute('aria-selected', String(t === 'crop'));
    $('tabLook').setAttribute('aria-selected', String(t === 'look'));
    $('toolsCrop').hidden = t !== 'crop';
    $('toolsLook').hidden = t !== 'look';
    $('edNext').textContent = t === 'crop' ? 'Weiter' : 'Fertig';
    $('edTitle').textContent = ed.idx === null ? 'Neue Seite' + (queue.length ? ' (+' + queue.length + ')' : '') : 'Seite ' + (ed.idx + 1);
    $('delPage').hidden = ed.idx === null;
    document.querySelectorAll('#toolsLook [data-f]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === ed.filter)));
    if (t === 'crop') { busy(false); requestAnimationFrame(drawCrop); } else renderLook();
  }
  $('tabCrop').onclick = () => ed && setTab('crop');
  $('tabLook').onclick = () => ed && setTab('look');

  function fit(w, h) {
    const st = $('stage');
    const k = Math.min((st.clientWidth - 32) / w, (st.clientHeight - 24) / h, 4);
    return [Math.max(40, Math.floor(w * k)), Math.max(40, Math.floor(h * k)), k];
  }

  let drag = null;
  function drawCrop() {
    if (!ed || ed.tab !== 'crop') return;
    const s = ed.src;
    const [cw, ch, k] = fit(s.width, s.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    const x = cv.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.drawImage(s, 0, 0, cw, ch);
    const P = ed.quad.map((p) => [p[0] * cw, p[1] * ch]);
    const edge = edgeColor();
    x.beginPath(); x.rect(0, 0, cw, ch);
    P.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
    x.closePath(); x.fillStyle = 'rgba(0,0,0,.45)'; x.fill('evenodd');
    x.beginPath();
    P.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
    x.closePath(); x.lineWidth = 2.5; x.strokeStyle = edge; x.stroke();
    P.forEach((p, i) => {
      x.beginPath(); x.arc(p[0], p[1], 11, 0, Math.PI * 2);
      x.fillStyle = edge; x.fill(); x.lineWidth = 2; x.strokeStyle = '#fff'; x.stroke();
    });
    if (drag !== null) {
      const R = 48, hp = P[drag];
      const lx = hp[0] < 150 && hp[1] < 150 ? cw - R - 8 : R + 8, ly = R + 8;
      const reg = R / 2 / k;
      x.save();
      x.beginPath(); x.arc(lx, ly, R, 0, Math.PI * 2); x.clip();
      x.fillStyle = '#000'; x.fillRect(lx - R, ly - R, R * 2, R * 2);
      x.drawImage(s, ed.quad[drag][0] * s.width - reg, ed.quad[drag][1] * s.height - reg, reg * 2, reg * 2, lx - R, ly - R, R * 2, R * 2);
      x.restore();
      x.beginPath(); x.arc(lx, ly, R, 0, Math.PI * 2); x.lineWidth = 3; x.strokeStyle = edge; x.stroke();
      x.beginPath(); x.moveTo(lx - 8, ly); x.lineTo(lx + 8, ly); x.moveTo(lx, ly - 8); x.lineTo(lx, ly + 8);
      x.lineWidth = 1.5; x.strokeStyle = '#fff'; x.stroke();
    }
  }

  cv.addEventListener('pointerdown', (e) => {
    if (!ed || ed.tab !== 'crop') return;
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = -1, bd = 40;
    ed.quad.forEach((p, i) => { const d = Math.hypot(p[0] * r.width - px, p[1] * r.height - py); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    drag = best;
    cv.setPointerCapture(e.pointerId);
    e.preventDefault();
    drawCrop();
  });
  cv.addEventListener('pointermove', (e) => {
    if (drag === null || !ed) return;
    const r = cv.getBoundingClientRect();
    ed.quad[drag] = [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
    drawCrop();
  });
  const endDrag = () => { if (drag !== null) { drag = null; drawCrop(); } };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', () => { if (ed && ed.tab === 'crop') drawCrop(); else if (ed) renderLook(); });

  $('reDetect').onclick = () => { if (!ed) return; const d = Scan.detect(ed.src); ed.quad = d.quad; ed.prevKey = ''; drawCrop(); };
  $('fullImg').onclick = () => { if (!ed) return; ed.quad = [[0, 0], [1, 0], [1, 1], [0, 1]]; ed.prevKey = ''; drawCrop(); };

  let lookToken = 0;
  function renderLook() {
    if (!ed) return;
    const my = ++lookToken;
    busy(true);
    setTimeout(() => {
      if (!ed || my !== lookToken) return;
      const key = JSON.stringify(ed.quad);
      if (ed.prevKey !== key) { ed.prevCanvas = Scan.warp(ed.src, ed.quad, 1100); ed.prevKey = key; }
      const out = Scan.rotate(Scan.filter(ed.prevCanvas, ed.filter), ed.rot);
      const [cw, ch] = fit(out.width, out.height);
      cv.width = out.width; cv.height = out.height;
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(out, 0, 0);
      busy(false);
    }, 30);
  }

  document.querySelectorAll('#toolsLook [data-f]').forEach((b) => {
    b.onclick = () => {
      if (!ed) return;
      ed.filter = b.dataset.f;
      document.querySelectorAll('#toolsLook [data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderLook();
    };
  });
  $('rotL').onclick = () => { if (ed) { ed.rot = (ed.rot + 3) % 4; renderLook(); } };
  $('rotR').onclick = () => { if (ed) { ed.rot = (ed.rot + 1) % 4; renderLook(); } };

  $('edCancel').onclick = () => { queue = []; closeEditor(); };

  $('delPage').onclick = () => {
    if (!ed || ed.idx === null) return;
    const p = pages.splice(ed.idx, 1)[0];
    if (p) URL.revokeObjectURL(p.url);
    queue = [];
    closeEditor();
  };

  $('edNext').onclick = async () => {
    if (!ed) return;
    if (ed.tab === 'crop') { setTab('look'); return; }
    const cur = ed;
    busy(true);
    $('edNext').disabled = true;
    await new Promise((r) => setTimeout(r, 30));
    try {
      const out = Scan.rotate(Scan.filter(Scan.warp(cur.src, cur.quad, 2200), cur.filter), cur.rot);
      const resBlob = await Scan.toBlob(out, 0.88);
      const srcBlob = cur.srcBlob || (await Scan.toBlob(cur.src, 0.9));
      const rec = { id: cur.idx === null ? nextId++ : pages[cur.idx].id, srcBlob, quad: cur.quad, filter: cur.filter, rot: cur.rot, resBlob, w: out.width, h: out.height, url: URL.createObjectURL(resBlob) };
      if (cur.idx === null) pages.push(rec);
      else { URL.revokeObjectURL(pages[cur.idx].url); pages[cur.idx] = rec; }
      lastFilter = cur.filter; store.set('bs.filter', lastFilter);
    } finally {
      $('edNext').disabled = false;
    }
    ed = null;
    if (queue.length) nextFromQueue(); else closeEditor();
  };

  // ---------- Ablegen ----------
  const cleanName = (s) => (s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\.(pdf|jpe?g|zip)$/i, '').trim().slice(0, 120);

  function setStatus(msg, kind) {
    const s = $('saveStatus');
    s.textContent = msg || '';
    s.className = 'status' + (kind ? ' ' + kind : '');
  }

  function syncFmt() {
    document.querySelectorAll('#fmt [data-fmt]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fmt === fmt)));
  }
  document.querySelectorAll('#fmt [data-fmt]').forEach((b) => {
    b.onclick = () => { fmt = b.dataset.fmt; store.set('bs.fmt', fmt); syncFmt(); };
  });

  $('saveBtn').onclick = () => {
    if (!pages.length) return;
    $('fname').value = Pack.stamp();
    setStatus('');
    syncFmt();
    $('sheetScrim').hidden = false;
  };
  $('sheetClose').onclick = () => { $('sheetScrim').hidden = true; };
  $('sheetScrim').addEventListener('pointerdown', (e) => { if (e.target === $('sheetScrim')) $('sheetScrim').hidden = true; });

  async function build() {
    const name = cleanName($('fname').value) || Pack.stamp();
    if (fmt === 'pdf') {
      const arr = [];
      for (const p of pages) arr.push({ jpeg: await Pack.bytes(p.resBlob), w: p.w, h: p.h });
      return { blob: Pack.pdf(arr), filename: name + '.pdf', mime: 'application/pdf' };
    }
    if (pages.length === 1) return { blob: pages[0].resBlob, filename: name + '.jpg', mime: 'image/jpeg' };
    const files = [];
    for (let i = 0; i < pages.length; i++) files.push({ name: name + '_' + String(i + 1).padStart(2, '0') + '.jpg', data: await Pack.bytes(pages[i].resBlob) });
    return { blob: Pack.zip(files), filename: name + '.zip', mime: 'application/zip' };
  }

  async function makeFile() {
    const o = await build();
    return { o, file: new File([o.blob], o.filename, { type: o.mime }) };
  }

  $('devSave').onclick = async () => {
    $('devSave').disabled = true;
    setStatus('Wird vorbereitet …');
    try {
      const { o, file } = await makeFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: o.filename });
          setStatus('Weitergegeben: ' + o.filename, 'ok');
        } catch (e) {
          if (e && e.name === 'AbortError') setStatus('Abgebrochen. Nichts wurde gespeichert.');
          else throw e;
        }
      } else {
        setStatus('Teilen wird hier nicht unterstützt. Nutze „Als Datei herunterladen“.', 'err');
      }
    } catch (e) {
      setStatus('Teilen ist nicht möglich (' + ((e && e.name) || 'Fehler') + '). Nutze „Als Datei herunterladen“.', 'err');
    } finally { $('devSave').disabled = false; }
  };

  $('dlSave').onclick = async () => {
    $('dlSave').disabled = true;
    setStatus('Wird vorbereitet …');
    try {
      const { o } = await makeFile();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(o.blob); a.download = o.filename;
      document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
      setStatus('Heruntergeladen: ' + o.filename + '. Du findest die Datei im Download-Ordner.', 'ok');
    } catch (e) {
      setStatus('Herunterladen ist nicht möglich.', 'err');
    } finally { $('dlSave').disabled = false; }
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline-Modus weiter */ });

  render();
})();
