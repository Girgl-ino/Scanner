/* Lernen: Prüfungsvorbereitung und Hauptfächer. Aufgaben stehen nur zum Ablesen da, gelöst wird auf Papier.
   Pakete (JSON) erzeugt Claude aus Fotos vom Lernstoff; Georg fügt sie in der Elternansicht ein. */
(function () {
  'use strict';
  var C = null, ln = {}, loaded = false, el = null, view = { t: 'home' }, armed = null, sel = {}, msg = '';
  function E(s) { return C.esc(s == null ? '' : s); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addD(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ds(d); }
  function diff(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function fd(s) { var d = new Date(s + 'T12:00:00'); return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; }
  function pk() { var o = {}; Object.keys(ln.pk || {}).forEach(function (k) { if (ln.pk[k] && ln.pk[k].titel) o[k] = ln.pk[k]; }); return o; }
  function acc(r) { return r && r.n ? r.f / r.n : 0; }
  var ART = { lern: '📘 Lernen', ueben: '✏️ Üben', probe: '📝 Probe-Schulaufgabe' };

  /* Paket prüfen und Plan erstellen */
  function parse(txt, today) {
    var o; txt = String(txt || '').trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
    try { o = JSON.parse(txt); } catch (e) { return { err: 'Das ist kein gültiges Paket (JSON). Bitte den kompletten Text von Claude einfügen.' }; }
    if (!o || o.ln !== 1) return { err: 'Das Paket muss mit "ln":1 beginnen.' };
    var t = String(o.titel || '').trim(), f = String(o.fach || '').trim();
    if (!t || !f) return { err: 'Fach und Titel fehlen.' };
    if (o.typ !== 'pruefung' && o.typ !== 'lernen') return { err: 'typ muss "pruefung" oder "lernen" sein.' };
    if (o.typ === 'pruefung' && !/^\d{4}-\d{2}-\d{2}$/.test(o.termin || '')) return { err: 'Für eine Prüfung fehlt das Datum (termin, Format JJJJ-MM-TT).' };
    if (!Array.isArray(o.blaetter) || !o.blaetter.length || o.blaetter.length > 40) return { err: 'Es fehlen Blätter (1 bis 40).' };
    var bl = [];
    for (var i = 0; i < o.blaetter.length; i++) {
      var b = o.blaetter[i], a = (b && b.a) || [];
      if (!b || !String(b.t || '').trim() || !Array.isArray(a) || !a.length || a.length > 30) return { err: 'Blatt ' + (i + 1) + ': Titel oder Aufgaben fehlen.' };
      for (var j = 0; j < a.length; j++) if (!a[j] || !String(a[j].q || '').trim()) return { err: 'Blatt ' + (i + 1) + ', Aufgabe ' + (j + 1) + ': Frage fehlt.' };
      bl.push({ t: String(b.t).slice(0, 120), art: ART[b.art] ? b.art : 'ueben', a: a.map(function (x) { return { q: String(x.q).slice(0, 600), l: String(x.l || '').slice(0, 600) }; }) });
    }
    var id = String(o.id || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || ('p' + Date.now().toString(36));
    var p = { fach: f.slice(0, 40), typ: o.typ, titel: t.slice(0, 120), stoff: String(o.stoff || '').slice(0, 4000), blaetter: bl, created: today, res: {} };
    if (o.typ === 'pruefung') {
      p.termin = o.termin;
      var last = addD(o.termin, -1), n = bl.length, days = Math.max(1, diff(today, last) + 1), plan = [], probe = bl.map(function (b, i) { return b.art === 'probe' ? i : -1; }).filter(function (i) { return i >= 0; });
      for (var k = 0; k < n; k++) plan.push(addD(today, Math.min(days - 1, Math.floor(k * days / n))));
      probe.forEach(function (i) { plan[i] = last > today ? last : today; });
      p.plan = plan;
    }
    return { id: id, p: p };
  }

  function sheetKey(p, i) { return String(i); }
  function done(p, i) { return !!(p.res && p.res[sheetKey(p, i)]); }
  function nextIdx(p) { for (var i = 0; i < p.blaetter.length; i++) if (!done(p, i)) return i; return -1; }
  function cnt(p) { var n = 0; p.blaetter.forEach(function (b, i) { if (done(p, i)) n++; }); return n; }
  function fresh(p, i) { var r = p.res[sheetKey(p, i)]; return r && acc(r) >= 0.8 && diff(r.d, C.today()) < 14; }

  function packCard(id, p, adm) {
    var t = C.today(), nx = nextIdx(p), h = '<div class="panel pad ln-pk"><div class="dt-meta">' + E(p.fach) + (p.typ === 'pruefung' ? ' · Schulaufgabe ' + E(fd(p.termin)) : '') + '</div><h3>' + E(p.titel) + '</h3>';
    if (p.typ === 'pruefung') { var dd = diff(t, p.termin); h += '<p class="dt-sub"><b>' + (dd > 0 ? 'Noch ' + dd + ' Tag' + (dd === 1 ? '' : 'e') : dd === 0 ? 'Heute!' : 'Vorbei') + '</b> · ' + cnt(p) + ' von ' + p.blaetter.length + ' Blättern geschafft</p>'; }
    else h += '<p class="dt-sub">' + cnt(p) + ' von ' + p.blaetter.length + ' Blättern geschafft</p>';
    h += '<div class="dt-bar"><i style="width:' + Math.round(cnt(p) / p.blaetter.length * 100) + '%"></i></div>';
    if (nx >= 0) h += '<p class="dt-sub">Als Nächstes: ' + E(p.blaetter[nx].t) + (p.plan ? ' · empfohlen ' + E(fd(p.plan[nx])) : '') + '</p><button class="btn primary submit" type="button" data-a="open" data-id="' + E(id) + '" data-i="' + nx + '">Blatt anzeigen</button>';
    else h += '<p class="dt-sub">Alle Blätter geschafft ✔</p>';
    h += ' <button class="btn" type="button" data-a="pack" data-id="' + E(id) + '">' + (adm ? 'Übersicht und Korrektur' : 'Alle Blätter') + '</button></div>';
    return h;
  }

  function stoffHtml(p) { return p.stoff ? '<details class="panel pad dt-rules dtno-print"><summary><b>📖 Das Wichtigste zum Nachschlagen</b></summary><p style="white-space:pre-wrap;font-size:14px;line-height:1.5">' + E(p.stoff) + '</p></details>' : ''; }

  function homeHtml() {
    var all = pk(), ids = Object.keys(all), adm = C.isAdmin(), h = '';
    h += '<div class="panel pad dt-hero"><div><h2>Lernen</h2><p class="dt-sub">Aufgaben ablesen, auf Papier schreiben, Foto an Papa.</p></div></div>';
    var pr = ids.filter(function (i) { return all[i].typ === 'pruefung'; }).sort(function (a, b) { return all[a].termin < all[b].termin ? -1 : 1; });
    var up = pr.filter(function (i) { return diff(C.today(), all[i].termin) >= 0; }), old = pr.filter(function (i) { return diff(C.today(), all[i].termin) < 0; });
    h += '<h3 class="ln-h">📝 Prüfungsvorbereitung</h3>' + (up.length ? up.map(function (i) { return packCard(i, all[i], adm); }).join('') : '<div class="panel pad"><p class="dt-sub">Noch keine Prüfung geplant.</p></div>');
    var lr = ids.filter(function (i) { return all[i].typ === 'lernen'; }), fa = {};
    lr.forEach(function (i) { (fa[all[i].fach] = fa[all[i].fach] || []).push(i); });
    h += '<h3 class="ln-h">📚 Hauptfächer lernen und festigen</h3>';
    var fk = Object.keys(fa).sort();
    h += fk.length ? fk.map(function (f) { return '<div class="dt-meta ln-f">' + E(f) + '</div>' + fa[f].map(function (i) { return packCard(i, all[i], adm); }).join(''); }).join('') : '<div class="panel pad"><p class="dt-sub">Noch keine Lernpakete. Papa schickt Fotos vom Stoff an Claude, daraus entstehen Blätter.</p></div>';
    if (old.length) h += '<details class="panel pad"><summary><b>Vergangene Prüfungen</b></summary>' + old.map(function (i) { return '<p><button class="btn small" type="button" data-a="pack" data-id="' + E(i) + '">' + E(all[i].fach + ': ' + all[i].titel) + '</button></p>'; }).join('') + '</details>';
    if (adm) h += adminImport();
    return h;
  }

  function adminImport() {
    return '<div class="panel pad dtno-print"><h3>Neues Paket einfügen</h3><p class="dt-sub">So geht es: Fotos vom Lernstoff und das Prüfungsdatum an Claude schicken, Claude antwortet mit einem Paket. Den Text hier einfügen.</p>' +
      '<textarea id="lnimp" class="dt-ta" rows="5" placeholder="{&quot;ln&quot;:1, ...}"></textarea>' + (msg ? '<p class="dt-sub" style="color:var(--bad,#b3261e)">' + E(msg) + '</p>' : '') +
      '<button class="btn primary" type="button" data-a="import">Paket speichern</button></div>';
  }

  function packHtml(id) {
    var p = pk()[id]; if (!p) return '<p>Nicht gefunden.</p>';
    var adm = C.isAdmin(), h = '<button class="btn small dtno-print" type="button" data-a="back">← Zurück</button><div class="panel pad"><div class="dt-meta">' + E(p.fach) + '</div><h2>' + E(p.titel) + '</h2>' + (p.typ === 'pruefung' ? '<p class="dt-sub">Schulaufgabe ' + E(fd(p.termin)) + '</p>' : '') + '</div>' + stoffHtml(p);
    p.blaetter.forEach(function (b, i) {
      var r = p.res[sheetKey(p, i)], st = r ? (acc(r) >= 0.8 ? '✔ ' + Math.round(acc(r) * 100) + ' %' : '↻ ' + Math.round(acc(r) * 100) + ' %, nochmal üben') : (p.plan ? 'empfohlen ' + fd(p.plan[i]) : 'offen');
      h += '<div class="panel pad"><div class="dt-meta">' + (ART[b.art] || '') + ' · ' + E(st) + (r && fresh(p, i) === false && acc(r) >= 0.8 ? ' · zum Auffrischen' : '') + '</div><b>' + E(b.t) + '</b> <span class="dt-sub">(' + b.a.length + ' Aufgaben)</span><div><button class="btn small" type="button" data-a="open" data-id="' + E(id) + '" data-i="' + i + '">Anzeigen</button>' +
        (adm ? ' <button class="btn small" type="button" data-a="cor" data-id="' + E(id) + '" data-i="' + i + '">Korrektur</button>' : '') + '</div></div>';
    });
    if (adm) h += '<div class="panel pad dtno-print"><button class="btn" type="button" data-a="del" data-id="' + E(id) + '">' + (armed === id ? 'Wirklich löschen? Nochmal tippen' : 'Paket löschen') + '</button></div>';
    return h;
  }

  function sheetHtml(id, i) {
    var p = pk()[id]; if (!p) return '';
    var b = p.blaetter[i], h = '<div class="dtno-print"><button class="btn small" type="button" data-a="pack" data-id="' + E(id) + '">← Zurück</button> <button class="btn small" type="button" data-a="print">🖨 Drucken</button></div>' + stoffHtml(p);
    h += '<div class="panel pad dtsheet"><div class="dt-meta">' + E(p.fach) + ' · ' + (ART[b.art] || '') + '</div><h2>' + E(b.t) + '</h2><p class="dt-sub">Schreibe die Lösungen auf Papier. Nummer vor jede Antwort schreiben. Name und Datum oben aufs Blatt.</p>';
    b.a.forEach(function (x, k) { h += '<div class="dt-pt"><b>' + (k + 1) + '.</b> ' + E(x.q) + '</div>'; });
    return h + '</div>';
  }

  function corHtml(id, i) {
    var p = pk()[id], b = p.blaetter[i], key = id + ':' + i, s = sel[key] = sel[key] || b.a.map(function () { return -1; });
    var h = '<button class="btn small" type="button" data-a="pack" data-id="' + E(id) + '">← Zurück</button><div class="panel pad"><h2>Korrektur: ' + E(b.t) + '</h2><p class="dt-sub">Nach der Auswertung von Claude: je Aufgabe ✔ richtig, ◐ teilweise, ✖ falsch.</p>';
    b.a.forEach(function (x, k) {
      h += '<div class="dt-pt"><b>' + (k + 1) + '.</b> ' + E(x.q) + (x.l ? '<br><small>Lösung: ' + E(x.l) + '</small>' : '') + '<div class="ln-rb">' + [[1, '✔'], [0.5, '◐'], [0, '✖']].map(function (o) { return '<button type="button" class="btn small' + (s[k] === o[0] ? ' primary' : '') + '" data-a="mk" data-key="' + E(key) + '" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    });
    return h + '<button class="btn primary submit" type="button" data-a="savecor" data-id="' + E(id) + '" data-i="' + i + '">Ergebnis speichern</button></div>';
  }

  function render() {
    if (!el || !C) return;
    var h;
    if (!loaded) h = '<div class="panel pad"><p class="dt-sub">Lädt …</p></div>';
    else if (view.t === 'pack') h = packHtml(view.id);
    else if (view.t === 'sheet') h = sheetHtml(view.id, view.i);
    else if (view.t === 'cor') h = corHtml(view.id, view.i);
    else h = homeHtml();
    el.innerHTML = '<div class="dtw">' + h + '</div>';
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b || !el.contains(b)) return;
    var a = b.getAttribute('data-a'), id = b.getAttribute('data-id'), i = +b.getAttribute('data-i');
    if (a === 'open') view = { t: 'sheet', id: id, i: i };
    else if (a === 'pack') view = { t: 'pack', id: id };
    else if (a === 'back') view = { t: 'home' };
    else if (a === 'print') { window.print(); return; }
    else if (a === 'cor') view = { t: 'cor', id: id, i: i };
    else if (a === 'mk') { var s = sel[b.getAttribute('data-key')]; s[+b.getAttribute('data-k')] = +b.getAttribute('data-v'); }
    else if (a === 'import') {
      var r = parse((el.querySelector('#lnimp') || {}).value, C.today());
      if (r.err) msg = r.err; else { msg = ''; var pp = {}; pp[r.id] = r.p; save({ pk: pp }); C.toast('Paket gespeichert.'); }
    } else if (a === 'savecor') {
      var p = pk()[id], key = id + ':' + i, s2 = sel[key];
      if (!s2 || s2.some(function (x) { return x < 0; })) { C.toast('Bitte jede Aufgabe bewerten.'); return; }
      var rr = {}; rr[String(i)] = { d: C.today(), f: s2.reduce(function (x, y) { return x + y; }, 0), n: s2.length, t: s2 };
      var upd = {}; upd[id] = { res: rr }; save({ pk: upd }); delete sel[key]; view = { t: 'pack', id: id }; C.toast('Ergebnis gespeichert.');
    } else if (a === 'del') {
      if (armed !== id) { armed = id; } else { var dl = {}; dl[id] = null; save({ pk: dl }); armed = null; view = { t: 'home' }; }
    } else return;
    render(); window.scrollTo(0, 0);
  }

  function save(patch) {
    function dm(a, b) { Object.keys(b).forEach(function (k) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) dm(a[k], b[k]); else a[k] = b[k]; }); }
    dm(ln, JSON.parse(JSON.stringify(patch)));
    return C.save({ ln: patch });
  }

  window.LN = {
    init: function (ctx) { C = ctx; el = ctx.el; el.addEventListener('click', onClick); },
    setData: function (data) { ln = (data && data.ln) || {}; loaded = true; if (el && !el.hidden) render(); },
    data: function () { return ln; },
    render: render,
    parse: parse,
    reset: function () { ln = {}; loaded = false; view = { t: 'home' }; sel = {}; armed = null; msg = ''; }
  };
})();
