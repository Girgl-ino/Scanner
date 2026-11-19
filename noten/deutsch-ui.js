/* deutsch-ui.js: Oberfläche des Deutschtrainings (Schüleransicht, Übungslauf, Elternansicht).
   Wird von index.html mit DTUI.init({...}) eingebunden. Nutzt DT aus deutsch.js. Speichern übernimmt index.html (Firestore). */
(function () {
  'use strict';
  var C = null, st = emptyState(), loaded = false, err = false, S = null, tab = 'home', pweek = null, armedDel = false, wait = null;
  var el = null;

  function emptyState() { return { v: 1, done: {}, days: {}, srs: {}, words: {}, errors: {}, texts: {}, review: {}, cfg: {} }; }
  function E(s) { return C.esc(s); }
  function EX(id) { return DT.EX[id]; }
  function iv() { var a = (st.cfg && st.cfg.iv) || DT.INTERVALS; return a && a.length === 5 ? a : DT.INTERVALS; }
  function lk() { return 'dtsess:' + C.studentUid; }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dmerge(a, b) {
    Object.keys(b).forEach(function (k) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) dmerge(a[k], b[k]); else a[k] = b[k];
    });
    return a;
  }
  function save(patch) {
    patch.v = 1;
    dmerge(st, JSON.parse(JSON.stringify(patch)));
    lsSet('dtcache:' + C.studentUid, st);
    return C.save(patch);
  }
  function isDay(k) { return k.indexOf('~') < 0; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fdate(ds) { var d = new Date(ds + 'T12:00:00'); return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; }
  function fmin(sec) { return sec < 90 ? Math.max(1, Math.round(sec / 60 * 10) / 10) + ' Min.' : Math.round(sec / 60) + ' Min.'; }
  function fnum(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function lvlColor(c) { return 'var(--' + c + ')'; }

  /* ---------- Auswertung der gespeicherten Tage ---------- */
  function finishedDays() {
    return Object.keys(st.days || {}).filter(function (k) { return !st.days[k].part; }).sort();
  }
  function stats() {
    var s = { area: { rs: { n: 0, f: 0 }, gr: { n: 0, f: 0 } }, first: { n: 0, f: 0 }, rep: { n: 0, f: 0 }, help: 0, total: 0, dur: 0, days: [], skill: {} };
    finishedDays().forEach(function (k) {
      var d = st.days[k], a = { rs: { n: 0, f: 0 }, gr: { n: 0, f: 0 } };
      (d.r || []).forEach(function (r) {
        var ex = EX(r[0]); if (!ex) return;
        var f = r[2];
        s.area[ex.area].n++; s.area[ex.area].f += f; a[ex.area].n++; a[ex.area].f += f;
        var g = r[4] ? s.rep : s.first; g.n++; g.f += f;
        if (r[3]) s.help++; s.total++;
        var q = s.skill[ex.skill] || (s.skill[ex.skill] = { n: 0, f: 0 }); q.n++; q.f += f;
      });
      s.dur += d.dur || 0;
      if (isDay(k) || true) s.days.push({ k: k, date: k.slice(0, 10), unit: d.k, p: d.p, pp: d.pp, rs: a.rs.n ? a.rs.f / a.rs.n : null, gr: a.gr.n ? a.gr.f / a.gr.n : null, dur: d.dur || 0, rep: !!d.rep, n: (d.r || []).length, help: (d.r || []).filter(function (r) { return r[3]; }).length });
    });
    return s;
  }
  function streak() {
    var have = {}; finishedDays().forEach(function (k) { have[k.slice(0, 10)] = 1; });
    var n = 0, d = C.today(), guard = 0;
    while (guard++ < 400) {
      var wd = new Date(d + 'T12:00:00').getDay();
      if (have[d]) n++;
      else if (!(wd === 0 || wd === 6) && d !== C.today()) break;
      d = DT.addDays(d, -1);
    }
    return n;
  }
  function doneToday() { var t = C.today(); return finishedDays().some(function (k) { return k === t; }); }
  function unitDone(key) { return !!(st.done && st.done[key]); }
  function masteredSkills() { return Object.keys(st.srs || {}).filter(function (k) { return DT.SKILLS[k] && DT.skillMastered(st.srs[k]); }); }
  function masteredWords() { return Object.keys(st.words || {}).filter(function (w) { return DT.wordMastered(st.words[w]); }); }
  function badges() {
    var us = stats(), unitDays = us.days.filter(function (d) { return !d.rep; }), best = 0;
    unitDays.forEach(function (d) { if (d.p > best) best = d.p; });
    var wk1 = DT.WEEKS[0].days.every(function (d, i) { return unitDone('w1d' + (i + 1)); });
    return [
      { e: '🌟', n: 'Erster Übungstag geschafft', on: unitDays.length >= 1 },
      { e: '🔥', n: '3 Tage in Folge geübt', on: streak() >= 3 },
      { e: '🎯', n: '18 oder mehr Punkte an einem Tag', on: best >= 18 },
      { e: '📚', n: '10 Wörter sicher gelernt', on: masteredWords().length >= 10 },
      { e: '💯', n: '100 Aufgaben richtig gelöst', on: us.total && us.area.rs.f + us.area.gr.f >= 100 },
      { e: '🏆', n: 'Woche 1 geschafft', on: wk1 }
    ];
  }

  /* ---------- Sitzung ---------- */
  function persistSess() { if (S && !S.probe) lsSet(lk(), S); }
  function newSess(mode, list, key, probe) {
    S = { mode: mode, key: key || '', date: C.today(), list: list, i: 0, res: [], applied: 0, ph: 0, step: 'intro', cur: {}, probe: !!probe, t0: Date.now(), tdone: 0 };
    persistSess();
  }
  function startUnit(unit, probe) {
    var today = C.today(), list, partial = !probe && st.days[today] && st.days[today].part && st.days[today].k === unit.key && st.days[today].l;
    if (partial) {
      var d = st.days[today];
      list = d.l.map(function (x) { return { id: x[0], ph: x[1], rep: !!x[2] }; });
      newSess('unit', list, unit.key, false);
      S.res = (d.r || []).map(function (r) { return { id: r[0], ph: r[1], f: r[2], h: r[3], rep: r[4], sec: r[5], wd: {} }; });
      S.applied = S.res.length; S.i = S.res.length; S.tdone = d.dur || 0;
      S.ph = S.i > 0 && list[S.i - 1] ? list[S.i - 1].ph : 0;
    } else {
      list = DT.buildDay(st, unit, today);
      newSess('unit', list, unit.key, probe);
    }
    enter();
  }
  function startReview() {
    var list = DT.buildReview(st, C.today());
    if (!list.length) { C.toast('Gerade gibt es nichts zu wiederholen. Super!'); return; }
    newSess('review', list, '', false); enter();
  }
  function enter() {
    S.step = S.i < S.list.length && S.list[S.i].ph === S.ph ? 'task' : 'intro';
    if (S.i >= S.list.length) { finish(); return; }
    S.cur = {}; S.t0 = Date.now(); tab = 'run'; persistSess(); render(); window.scrollTo(0, 0);
  }
  function resume(sv) { S = sv; if (S.step === 'fb' || S.step === 'task') { S.step = 'task'; S.cur = {}; } S.t0 = Date.now(); tab = 'run'; render(); }

  function curEx() { return EX(S.list[S.i].id); }
  function readAnswer(ex) {
    var c = S.cur;
    if (ex.t === 'single') return c.sel == null ? null : c.sel;
    if (ex.t === 'multi') return c.sel && c.sel.length ? c.sel : null;
    if (ex.t === 'gap') { var n = ex.gaps.length, a = []; for (var i = 0; i < n; i++) { a.push((c.g || [])[i] || ''); } return a.every(function (x) { return x.trim(); }) ? a : null; }
    if (ex.t === 'text') return (c.txt || '').trim() ? c.txt : null;
    if (ex.t === 'own') return (c.txt || '').trim() ? c.txt : null;
    if (ex.t === 'assign') { var as = c.as || []; return ex.items.every(function (_, i) { return as[i] != null; }) ? as : null; }
    if (ex.t === 'fix') return ex.tokens.map(function (t, i) { return c.ed && c.ed[i] != null ? c.ed[i] : t; });
    if (ex.t === 'order') return c.ord && c.ord.length === ex.parts.length ? c.ord : null;
    return null;
  }
  function check() {
    var ex = curEx(), ans = readAnswer(ex);
    if (ans == null) { C.toast(ex.t === 'gap' ? 'Fülle alle Lücken aus.' : ex.t === 'assign' ? 'Ordne alle Wörter zu.' : ex.t === 'order' ? 'Tippe alle Satzteile an.' : 'Wähle oder schreibe zuerst eine Antwort.'); return; }
    var g = DT.grade(ex, ans);
    var sec = Math.min(300, Math.round((Date.now() - S.t0) / 1000));
    var u = S.list[S.i];
    S.res.push({ id: u.id, ph: u.ph, f: Math.round(g.f * 100) / 100, h: S.cur.h ? 1 : 0, rep: u.rep ? 1 : 0, sec: sec, wd: g.words, txt: ex.t === 'own' ? String(ans).slice(0, 300) : undefined });
    S.fb = { g: g, ans: ans };
    S.step = 'fb'; persistSess(); render();
    var f = $('.dt-fb'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function next() {
    var prevPh = S.list[S.i].ph;
    S.i++; S.fb = null; S.cur = {}; S.t0 = Date.now();
    if (S.i >= S.list.length) { finish(); return; }
    if (S.list[S.i].ph !== prevPh) { S.step = 'intro'; savePartial(); } else S.step = 'task';
    persistSess(); render(); window.scrollTo(0, 0);
  }
  function applyPending() {
    for (; S.applied < S.res.length; S.applied++) {
      var r = S.res[S.applied], ex = EX(r.id); if (!ex) continue;
      DT.applyResult(st, ex, { f: r.h ? Math.min(r.f, 0.6) : r.f, words: r.h ? {} : (r.wd || {}) }, S.date, iv());
    }
  }
  function dayRecord(done) {
    var units = S.list.map(function (u) { return { id: u.id, ph: u.ph }; });
    var pts = DT.points(units, S.res);
    var dur = S.tdone + S.res.reduce(function (s, r) { return s + (r.sec || 0); }, 0);
    var rec = { k: S.key || 'rep', p: pts.total, pp: pts.per.map(function (x) { return Math.round(x * 10) / 10; }), r: S.res.map(function (r) { return [r.id, r.ph, r.f, r.h, r.rep, r.sec]; }), dur: dur, rep: S.mode === 'review' ? 1 : 0, t: Date.now(), part: done ? 0 : 1 };
    rec.l = done ? [] : S.list.map(function (u) { return [u.id, u.ph, u.rep ? 1 : 0]; });
    return rec;
  }
  function dayKey() { if (S.mode === 'unit') return S.date; var n = 1; while (st.days[S.date + '~r' + n]) n++; return S.date + '~r' + n; }
  function savePartial() {
    if (S.probe || S.mode !== 'unit') return;
    applyPending();
    var p = { days: {}, srs: st.srs, words: st.words, errors: st.errors };
    p.days[S.date] = dayRecord(false);
    persistSess();
    save(p);
  }
  function finish() {
    S.step = 'done';
    var units = S.list.map(function (u) { return { id: u.id, ph: u.ph }; });
    S.pts = DT.points(units, S.res);
    if (!S.probe) {
      applyPending();
      if (!S.dkey) S.dkey = dayKey();
      var p = { days: {}, srs: st.srs, words: st.words, errors: st.errors, texts: {} };
      if (!st.start) p.start = S.date;
      p.days[S.dkey] = dayRecord(true);
      if (S.mode === 'unit') { p.done = {}; p.done[S.key] = S.date; }
      S.res.forEach(function (r) { if (r.txt) p.texts[S.dkey + '|' + r.id] = r.txt; });
      if (!Object.keys(p.texts).length) delete p.texts;
      persistSess();
      save(p);
      lsSet(lk(), null);
    }
    persistSess(); tab = 'run'; render(); window.scrollTo(0, 0);
  }
  function tomorrowAgain() {
    var tm = DT.addDays(S.date, 1), p = { srs: {} }, seen = {};
    S.res.forEach(function (r) { var ex = EX(r.id); if (ex && !seen[ex.skill] && st.srs[ex.skill]) { seen[ex.skill] = 1; var s = Object.assign({}, st.srs[ex.skill]); s.d = tm; p.srs[ex.skill] = s; } });
    if (!S.probe && Object.keys(p.srs).length) save(p);
    S.tomorrow = true; render(); C.toast('Notiert. Morgen kommt das wieder dran.');
  }
  function leave() { S = null; tab = 'home'; render(); window.scrollTo(0, 0); }

  /* ---------- Darstellung: Aufgaben ---------- */
  function $(sel) { return el.querySelector(sel); }
  function optHtml(ex, locked) {
    var c = S.cur, g = S.fb && S.fb.g;
    return '<div class="dt-opts">' + ex.opts.map(function (o, i) {
      var on = ex.t === 'single' ? c.sel === i : (c.sel || []).indexOf(i) >= 0;
      var good = ex.t === 'single' ? ex.sol === i : ex.sol.indexOf(i) >= 0, cls = '';
      if (locked) cls = good ? ' good' : (on ? ' miss' : '');
      return '<button type="button" class="dt-opt' + (on ? ' on' : '') + cls + '"' + (locked ? ' disabled' : '') + ' data-a="opt" data-i="' + i + '">' + (ex.t === 'multi' ? '<span class="dt-box">' + (on ? '✓' : '') + '</span>' : '') + '<span>' + E(o) + '</span></button>';
    }).join('') + '</div>';
  }
  function bodyHtml(ex, locked) {
    var c = S.cur, h = '';
    if (ex.t === 'single' || ex.t === 'multi') {
      h += '<p class="dt-q">' + E(ex.q) + '</p>' + (ex.t === 'multi' ? '<p class="dt-sub">Es können mehrere richtig sein.</p>' : '') + optHtml(ex, locked);
    } else if (ex.t === 'gap') {
      /* Der Satz vor den Lücken ist die Aufgabe, die Lücken stehen im Text */
      var parts = ex.q.split('___'), g = c.g || [], line = '<div class="dt-gaptext">';
      for (var i = 0; i < parts.length; i++) {
        line += E(parts[i]);
        if (i < ex.gaps.length) {
          var val = g[i] || '', ok = locked && S.fb ? ex.gaps[i].indexOf(DT.nrm(val)) >= 0 : null;
          line += '<input class="dt-gap' + (ok === true ? ' good' : ok === false ? ' miss' : '') + '" data-a="gap" data-i="' + i + '" value="' + E(val) + '" ' + (locked ? 'disabled ' : '') + 'size="' + Math.max(8, ex.gaps[i][0].length + 2) + '" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="next" aria-label="Lücke ' + (i + 1) + '">';
        }
      }
      h += '<p class="dt-sub">Schreibe die Wörter so, wie sie richtig geschrieben werden.</p>' + line + '</div>';
    } else if (ex.t === 'text' || ex.t === 'own') {
      h += '<p class="dt-q">' + E(ex.q) + '</p><textarea class="dt-ta" data-a="txt" rows="' + (ex.t === 'own' ? 3 : 2) + '" ' + (locked ? 'disabled ' : '') + 'autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" aria-label="Deine Antwort">' + E(c.txt || '') + '</textarea>' + (ex.t === 'own' ? '<p class="dt-sub">Denk an den Großbuchstaben am Anfang und an das Satzzeichen am Ende.</p>' : '<p class="dt-sub">Schreibe alles genau so auf, wie es richtig geschrieben wird.</p>');
    } else if (ex.t === 'assign') {
      h += '<p class="dt-q">' + E(ex.q) + '</p><div class="dt-asg">' + ex.items.map(function (it, i) {
        var sel = (c.as || [])[i], mark = '';
        if (locked) mark = sel === it.c ? ' good' : ' miss';
        return '<div class="dt-arow' + mark + '"><div class="dt-aw">' + E(it.t) + (locked && sel !== it.c ? '<small>richtig: ' + E(ex.cats[it.c]) + '</small>' : '') + '</div><div class="dt-seg">' + ex.cats.map(function (cn, k) {
          return '<button type="button" class="dt-sb' + (sel === k ? ' on' : '') + '"' + (locked ? ' disabled' : '') + ' data-a="as" data-i="' + i + '" data-k="' + k + '">' + E(cn) + '</button>';
        }).join('') + '</div></div>';
      }).join('') + '</div>';
    } else if (ex.t === 'fix') {
      h += '<p class="dt-q">' + E(ex.q) + '</p><p class="dt-sub">Tippe auf ein falsch geschriebenes Wort und schreibe es richtig hin.</p><div class="dt-fix">' + ex.tokens.map(function (t, i) {
        var ed = c.ed && c.ed[i] != null;
        var cls = '';
        if (locked) { var isErr = ex.errs.indexOf(i) >= 0; var core = function (s) { return DT.nrm(s).replace(/[.!?,;:]+$/, ''); }; var now = ed ? c.ed[i] : t; cls = isErr ? (core(now) === core(ex.right[i]) ? ' good' : ' miss') : (core(now) !== core(t) ? ' miss' : ''); }
        if (ed) return '<input class="dt-tkin' + cls + '" data-a="ed" data-i="' + i + '" value="' + E(c.ed[i]) + '" size="' + Math.max(4, c.ed[i].length + 1) + '" ' + (locked ? 'disabled ' : '') + 'autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" aria-label="Wort ' + (i + 1) + '">';
        return '<button type="button" class="dt-tk' + cls + '" data-a="tk" data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' + E(t) + '</button>';
      }).join(' ') + '</div>';
    } else if (ex.t === 'order') {
      var ord = c.ord || [];
      h += '<p class="dt-q">' + E(ex.q) + '</p><div class="dt-line" aria-label="Dein Satz">' + (ord.length ? ord.map(function (p, k) { return '<button type="button" class="dt-chip on" data-a="ordx" data-k="' + k + '"' + (locked ? ' disabled' : '') + '>' + E(ex.parts[p]) + '</button>'; }).join(' ') : '<span class="dt-ph">Tippe unten die Satzteile an.</span>') + '</div><div class="dt-pool">' + shuffled(ex).map(function (p) {
        var used = ord.indexOf(p) >= 0;
        return '<button type="button" class="dt-chip' + (used ? ' used' : '') + '" data-a="ordp" data-i="' + p + '"' + (used || locked ? ' disabled' : '') + '>' + E(ex.parts[p]) + '</button>';
      }).join(' ') + '</div>';
    }
    return h;
  }
  function shuffled(ex) {
    /* feste, vom Aufgaben-Index abhängige Mischung, damit die Reihenfolge beim Neuzeichnen gleich bleibt */
    if (!S.cur.shuf) {
      var a = ex.parts.map(function (_, i) { return i; }), seed = (S.i * 7 + 3);
      for (var k = a.length - 1; k > 0; k--) { seed = (seed * 31 + 11) % 97; var j = seed % (k + 1); var t = a[k]; a[k] = a[j]; a[j] = t; }
      if (ex.sols.some(function (s) { return s.every(function (x, i) { return x === a[i]; }); })) a.push(a.shift());
      S.cur.shuf = a;
    }
    return S.cur.shuf;
  }
  function fbHtml(ex) {
    var g = S.fb.g, head, cls;
    if (ex.t === 'own') { head = g.f >= 0.999 ? 'Schön! Dein Satz sieht gut aus. 👍' : 'Dein Satz ist ein guter Anfang.'; cls = g.f >= 0.999 ? 'ok' : 'part'; }
    else if (g.ok) { head = ['Richtig! 👍', 'Genau! ⭐', 'Stimmt! 🎉', 'Super gemacht! 💪'][S.i % 4]; cls = 'ok'; }
    else if (g.f > 0) { head = 'Schon fast! 👏'; cls = 'part'; }
    else { head = 'Das war noch nicht richtig. Das üben wir.'; cls = 'no'; }
    var sol = '';
    if (!g.ok && ex.t !== 'own') {
      if (ex.t === 'gap') {
        var parts = ex.q.split('___'), s = '';
        for (var i = 0; i < parts.length; i++) { s += E(parts[i]); if (i < ex.gaps.length) s += '<b>' + E(ex.gaps[i][0]) + '</b>'; }
        sol = '<div class="dt-sol"><span>Richtig wäre:</span> ' + s + '</div>';
      } else if (ex.t !== 'assign') sol = '<div class="dt-sol"><span>Richtig wäre:</span> <b>' + E(DT.solutionText(ex)) + '</b></div>';
    }
    if (ex.t === 'fix' && !g.ok) sol = '<div class="dt-sol"><span>Richtig wäre:</span> <b>' + E(ex.right.join(' ')) + '</b></div>' + (g.wrongChanges ? '<p class="dt-sub">Du hast ' + g.wrongChanges + ' Wort/Wörter geändert, die schon richtig waren.</p>' : '');
    return '<div class="dt-fb ' + cls + '"><strong>' + head + '</strong>' + (g.msg ? '<p>' + E(g.msg) + '</p>' : '') + sol + '<div class="dt-rule"><span>📘 Regel</span>' + E(ex.expl) + '</div></div>';
  }
  function runHtml() {
    var tot = S.list.length, ph = S.list[Math.min(S.i, tot - 1)].ph, P = DT.PHASES[ph - 1];
    var top = '<div class="dt-top"><button class="btn small" type="button" data-a="pause">⏸ Pause</button><div class="dt-ph-n">' + P.e + ' ' + P.n + '</div><div class="dt-cnt">' + Math.min(S.i + 1, tot) + ' / ' + tot + '</div></div><div class="dt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + tot + '" aria-valuenow="' + S.i + '"><i style="width:' + Math.round(S.i / tot * 100) + '%"></i></div>';
    if (S.probe) top = '<div class="infobox">Probelauf: Es wird nichts gespeichert.</div>' + top;
    if (S.step === 'intro') {
      var count = S.list.filter(function (u) { return u.ph === ph; }).length;
      var nxt = S.list[S.i];
      var intro = {
        1: 'Zum Start holst du dein Wissen zurück. Das sind ein paar kurze Fragen zu dem, was du schon kannst.',
        2: 'Jetzt üben wir Rechtschreibung. Lies jede Aufgabe in Ruhe und schreibe die Wörter genau auf.',
        3: 'Jetzt geht es um Grammatik: Wortarten und Sätze. Denk an die Proben, die du kennst.',
        4: 'Zum Schluss ein kurzer Test. Hier zeigst du, was du heute gelernt hast. Du schaffst das!'
      }[ph];
      return top + '<div class="panel pad dt-intro"><div class="dt-big">' + P.e + '</div><h2>' + (S.mode === 'review' ? 'Wiederholung' : 'Phase ' + ph + ': ' + P.n) + '</h2><p>' + (S.mode === 'review' ? 'Kurze Aufgaben zu Themen, die gerade wieder dran sind.' : intro) + '</p><p class="dt-sub">' + count + ' Aufgaben, etwa ' + P.min + ' Minuten</p><button class="btn primary submit" type="button" data-a="go">Los geht’s</button></div>';
    }
    var ex = curEx(), locked = S.step === 'fb';
    var h = top + '<div class="panel pad dt-card"><div class="dt-meta">' + E(DT.SKILLS[ex.skill].n) + (S.list[S.i].rep ? ' <span class="pill">Wiederholung</span>' : '') + '</div>' + bodyHtml(ex, locked);
    if (!locked) {
      h += (S.cur.h ? '<div class="dt-tip">💡 ' + E(ex.hint) + '<small>Mit Tipp gibt es etwas weniger Punkte.</small></div>' : '<button type="button" class="btn small dt-tipbtn" data-a="tip">💡 Tipp</button>');
      h += '<button class="btn primary submit dt-main" type="button" data-a="check">Prüfen</button>';
    } else {
      h += fbHtml(ex) + '<button class="btn primary submit dt-main" type="button" data-a="next">' + (S.i + 1 >= S.list.length ? 'Fertig' : 'Weiter') + '</button>';
    }
    return h + '</div>';
  }
  function doneHtml() {
    var p = S.pts, lv = DT.level(p.total), n = S.res.length, ok = S.res.filter(function (r) { return r.f >= 0.999; }).length;
    var sec = S.tdone + S.res.reduce(function (s, r) { return s + (r.sec || 0); }, 0);
    var good = {}, bad = {};
    S.res.forEach(function (r) { var ex = EX(r.id); if (!ex) return; if (r.f >= 0.999 && !r.h) good[ex.skill] = (good[ex.skill] || 0) + 1; else bad[ex.skill] = 1; });
    Object.keys(bad).forEach(function (k) { delete good[k]; });
    var h = '';
    if (S.mode === 'review') {
      h += '<div class="panel pad dt-done"><div class="dt-big">🔁</div><h2>Wiederholung geschafft!</h2><div class="dt-pts"><b>' + ok + '</b> von ' + n + ' richtig</div>';
    } else {
      h += '<div class="panel pad dt-done"><div class="dt-big">' + (p.total >= 18 ? '🏆' : p.total >= 15 ? '🎉' : p.total >= 11 ? '👍' : '💪') + '</div><h2>' + (S.probe ? 'Probelauf beendet' : 'Geschafft!') + '</h2><div class="dt-pts"><b>' + p.rounded + '</b> von 20 Punkten</div><div class="dt-lvl" style="color:' + lvlColor(lv.c) + '">' + lv.l + '</div>';
      h += '<div class="dt-phs">' + DT.PHASES.map(function (P, i) { return '<div><span>' + P.e + ' ' + P.n + '</span><div class="dt-bar"><i style="width:' + Math.round(p.per[i] / P.pts * 100) + '%"></i></div><small>' + fnum(p.per[i]) + ' / ' + P.pts + '</small></div>'; }).join('') + '</div>';
    }
    h += '<p class="dt-sub">' + ok + ' von ' + n + ' Aufgaben ganz richtig · ' + fmin(sec) + '</p>';
    if (Object.keys(good).length) h += '<div class="dt-list ok"><b>Das klappt schon gut:</b>' + Object.keys(good).map(function (k) { return '<span>✓ ' + E(DT.SKILLS[k].n) + '</span>'; }).join('') + '</div>';
    if (Object.keys(bad).length) h += '<div class="dt-list"><b>Das üben wir bald nochmal:</b>' + Object.keys(bad).map(function (k) { return '<span>→ ' + E(DT.SKILLS[k].n) + '</span>'; }).join('') + '</div>';
    if (S.mode === 'unit' && !S.probe) h += S.tomorrow ? '<p class="dt-sub">🔁 Das kommt morgen nochmal dran.</p>' : '<button type="button" class="btn" data-a="tomorrow">🔁 Morgen nochmal üben</button>';
    h += '<button type="button" class="btn primary submit" data-a="leave">Zurück zur Startseite</button></div>';
    return h;
  }

  /* ---------- Darstellung: Schüleransicht ---------- */
  function weekHtml() {
    return DT.WEEKS.map(function (w) {
      if (!w.ready) return '<div class="dt-wk off"><b>Woche ' + w.n + '</b><span>' + E(w.title) + '</span><small>folgt</small></div>';
      return '<div class="dt-wk"><b>Woche ' + w.n + '</b><span>' + E(w.title) + '</span><div class="dt-dots">' + w.days.map(function (d, i) {
        var key = 'w' + w.n + 'd' + (i + 1), dn = unitDone(key), rec = dn ? st.days[st.done[key]] : null;
        return '<div class="dt-dot' + (dn ? ' on' : '') + '" title="' + E(d.title) + '"><i>' + (['Mo', 'Di', 'Mi', 'Do', 'Fr'][i]) + '</i><b>' + (dn && rec ? Math.round(rec.p) : '·') + '</b></div>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function homeHtml() {
    var u = DT.nextUnit(st), today = C.today(), h = '', ok = openSheetKey();
    var dn = doneToday(), name = C.name();
    h += '<div class="panel pad dt-hero"><div><h2>Deutsch üben' + (name ? ', ' + E(name) : '') + '</h2><p class="dt-sub">Jeden Tag etwa 20 Minuten. Du schreibst auf Papier. <span class="pill">Stufe ' + DT.levelFor(st) + '</span></p></div><div class="dt-streak" title="Tage in Folge"><b>' + streak() + '</b><span>🔥 Tage</span></div></div>';
    if (ok) {
      var orec = st.days[ok];
      h += '<div class="panel pad dt-today"><div class="dt-meta">Dein Blatt wartet</div><h2>' + (orec.rep ? 'Wiederholungsblatt' : 'Heutige Aufgaben') + '</h2><p class="dt-sub">' + sheetList(ok).length + ' Aufgaben · schreibe die Lösungen auf Papier. Danach fotografiert Papa dein Blatt.</p><button class="btn primary submit" type="button" data-a="sheetview">Aufgaben anzeigen</button></div>';
    } else if (u && !dn) {
      var wk = DT.WEEKS[u.w], dy = wk.days[u.d];
      h += '<div class="panel pad dt-today"><div class="dt-meta">Heute · Woche ' + wk.n + ', Tag ' + (u.d + 1) + '</div><h2>' + E(dy.title) + '</h2><p class="dt-sub">' + E(dy.focus) + ' · Papier und Stift bereitlegen</p><div class="dt-phrow">' + DT.PHASES.map(function (P) { return '<span class="dt-phc">' + P.e + ' ' + P.n + '<small>' + P.min + ' Min.</small></span>'; }).join('') + '</div><button class="btn primary submit" type="button" data-a="newsheet">Aufgaben öffnen</button></div>';
    } else if (dn) {
      var rec = st.days[today], lv = DT.level(rec.p);
      h += '<div class="panel pad dt-today"><div class="dt-meta">Heute</div><h2>Heute ist geschafft ✔</h2><p><b>' + Math.round(rec.p) + ' von 20 Punkten</b> <span style="color:' + lvlColor(lv.c) + ';font-weight:700">· ' + lv.l + '</span></p><p class="dt-sub">Morgen geht es weiter.</p><button class="btn" type="button" data-a="newrev">🔁 Wiederholungsblatt</button></div>';
    } else {
      h += '<div class="panel pad dt-today"><div class="dt-meta">Alle geplanten Tage geschafft</div><h2>Stark! 🎉</h2><p class="dt-sub">Die nächsten Wochen kommen bald. Bis dahin kannst du wiederholen.</p><button class="btn primary submit" type="button" data-a="newrev">🔁 Wiederholungsblatt</button></div>';
    }
    h += lastResultHtml();
    var due = DT.dueSkills(st, today);
    h += '<div class="panel pad"><h3>Meine Wochen</h3><div class="dt-weeks">' + weekHtml() + '</div></div>';
    var ms = masteredSkills(), mw = masteredWords();
    h += '<div class="panel pad"><h3>Das kann ich schon sicher</h3>' + (ms.length || mw.length ? '<div class="dt-tags">' + ms.map(function (k) { return '<span class="dt-tag">✓ ' + E(DT.SKILLS[k].n) + '</span>'; }).join('') + mw.map(function (w) { return '<span class="dt-tag w">' + E(w) + '</span>'; }).join('') + '</div>' : '<p class="dt-sub">Hier sammelst du, was du sicher kannst. Das füllt sich mit jedem Tag.</p>') + '</div>';
    h += '<div class="panel pad"><h3>Meine Erfolge</h3><div class="dt-badges">' + badges().map(function (b) { return '<div class="dt-badge' + (b.on ? ' on' : '') + '"><span>' + b.e + '</span>' + E(b.n) + '</div>'; }).join('') + '</div></div>';
    h += '<p class="dt-sub dt-pad">Papa sieht, wie du übst. So kann er dir helfen. Mit deinen Schulnoten hat das nichts zu tun.</p>';
    h += '<details class="panel pad dt-rules"><summary><b>📖 Regeln zum Nachschlagen</b></summary>' + DT.RULES.map(function (g) { return '<h3>' + E(g.t) + '</h3><ul>' + g.r.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>'; }).join('') + '</details>';
    return h;
  }

  /* ---------- Darstellung: Elternansicht ---------- */
  function svgChart(days) {
    var d = days.filter(function (x) { return !x.rep; }).slice(-14);
    if (!d.length) return '<p class="dt-sub">Noch keine abgeschlossenen Tage.</p>';
    var W = 560, H = 190, L = 34, B = 26, T = 10, n = d.length, bw = Math.min(34, (W - L) / n * 0.6), step = (W - L - 8) / n;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Punkte pro Tag und Genauigkeit in Rechtschreibung und Grammatik">';
    [0, 10, 20].forEach(function (v) { var y = H - B - (H - B - T) * v / 20; s += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + v + '</text>'; });
    var pts1 = [], pts2 = [];
    d.forEach(function (x, i) {
      var cx = L + step * i + step / 2, h = (H - B - T) * Math.min(20, x.p) / 20, lv = DT.level(x.p);
      s += '<rect x="' + (cx - bw / 2) + '" y="' + (H - B - h) + '" width="' + bw + '" height="' + h + '" rx="5" fill="' + lvlColor(lv.c) + '" opacity=".28"/><text x="' + cx + '" y="' + (H - B - h - 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="var(--fg)">' + Math.round(x.p) + '</text>';
      s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10.5" fill="var(--muted)">' + x.date.slice(8) + '.' + x.date.slice(5, 7) + '.</text>';
      if (x.rs != null) pts1.push(cx + ',' + (H - B - (H - B - T) * x.rs)); if (x.gr != null) pts2.push(cx + ',' + (H - B - (H - B - T) * x.gr));
    });
    function line(p, col) { return p.length ? '<polyline points="' + p.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round"/>' + p.map(function (q) { var a = q.split(','); return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="3.5" fill="' + col + '"/>'; }).join('') : ''; }
    s += line(pts1, 'var(--accent)') + line(pts2, 'var(--ok)') + '</svg>';
    return s + '<div class="dt-leg"><span><i style="background:var(--g3);opacity:.5"></i>Punkte (von 20)</span><span><i style="background:var(--accent)"></i>Rechtschreibung (Linie, 0 bis 100 %)</span><span><i style="background:var(--ok)"></i>Grammatik (Linie)</span></div>';
  }
  function pct(o) { return o.n ? Math.round(o.f / o.n * 100) + ' %' : '–'; }
  function parentHtml() {
    var us = stats(), h = '', nextU = DT.nextUnit(st), today = C.today();
    h += corrHtml();
    h += '<div class="panel pad"><h2>Deutschtraining: ' + E(C.name() || 'Anwender') + '</h2><p class="dt-sub">Die Punkte sind keine Schulnoten und beeinflussen den Notendurchschnitt nicht.</p>';
    var wkDone = DT.WEEKS[0].days.filter(function (d, i) { return unitDone('w1d' + (i + 1)); }).length;
    h += '<div class="tiles"><div class="tile"><div class="k">Tage geübt</div><div class="v">' + us.days.filter(function (d) { return !d.rep; }).length + '</div><div class="s">Woche 1: ' + wkDone + ' von 5</div></div>' +
      '<div class="tile"><div class="k">Echte Übungszeit</div><div class="v">' + Math.round(us.dur / 60) + ' Min.</div><div class="s">Ø ' + (us.days.length ? Math.round(us.dur / 60 / us.days.length) : 0) + ' Min. pro Einheit</div></div>' +
      '<div class="tile"><div class="k">Rechtschreibung</div><div class="v">' + pct(us.area.rs) + '</div><div class="s">richtig gelöst</div></div>' +
      '<div class="tile"><div class="k">Grammatik</div><div class="v">' + pct(us.area.gr) + '</div><div class="s">richtig gelöst</div></div>' +
      '<div class="tile"><div class="k">Erstmals / Wiederholung</div><div class="v">' + pct(us.first) + ' / ' + pct(us.rep) + '</div><div class="s">Aufgaben neu / wiederholt</div></div>' +
      (us.help ? '<div class="tile"><div class="k">Mit Tipp gelöst</div><div class="v">' + Math.round(us.help / us.total * 100) + ' %</div><div class="s">' + us.help + ' von ' + us.total + ' Aufgaben</div></div>' : '') + '</div></div>';
    h += '<div class="panel pad"><h3>Verlauf</h3><div class="chart">' + svgChart(us.days) + '</div></div>';
    /* Tage */
    h += '<div class="panel"><div class="pad"><h3>Übungstage</h3></div>' + (us.days.length ? us.days.slice().reverse().map(function (x) {
      var lv = DT.level(x.p);
      return '<div class="row"><div><div class="t">' + fdate(x.date) + (x.rep ? ' · Wiederholung' : ' · ' + E((function () { var m = /^w(\d+)d(\d+)$/.exec(x.unit); return m ? 'Woche ' + m[1] + ', Tag ' + m[2] : x.unit; })())) + '</div><div class="m">' + fmin(x.dur) + ' · ' + x.n + ' Aufgaben, ' + x.help + ' mit Tipp · Rechtschreibung ' + (x.rs == null ? '–' : Math.round(x.rs * 100) + ' %') + ', Grammatik ' + (x.gr == null ? '–' : Math.round(x.gr * 100) + ' %') + '</div></div><div style="text-align:right;color:' + lvlColor(lv.c) + ';font-weight:700">' + (x.rep ? '' : fnum(x.p) + ' / 20<div class="m" style="color:inherit">' + lv.l + '</div>') + '</div></div>';
    }).join('') : '<div class="pad"><p class="dt-sub">Noch nichts abgeschlossen.</p></div>') + '</div>';
    /* Schwächen */
    var weak = Object.keys(us.skill).map(function (k) { return { k: k, n: us.skill[k].n, r: us.skill[k].f / us.skill[k].n }; }).filter(function (x) { return DT.SKILLS[x.k]; });
    var wk = weak.slice().sort(function (a, b) { return a.r - b.r; }).filter(function (x) { return x.r < 0.8 }).slice(0, 5);
    var st2 = weak.slice().sort(function (a, b) { return b.r - a.r; }).filter(function (x) { return x.r >= 0.8 && x.n >= 3; }).slice(0, 5);
    h += '<div class="panel pad"><h3>Stärken und Schwächen</h3><div class="dt-two"><div><b>Das fällt schwer</b>' + (wk.length ? wk.map(function (x) { return '<div class="dt-sk"><span>' + E(DT.SKILLS[x.k].n) + '</span><em>' + Math.round(x.r * 100) + ' %</em></div>'; }).join('') : '<p class="dt-sub">Bisher nichts Auffälliges.</p>') + '</div><div><b>Das klappt gut</b>' + (st2.length ? st2.map(function (x) { return '<div class="dt-sk"><span>' + E(DT.SKILLS[x.k].n) + '</span><em>' + Math.round(x.r * 100) + ' %</em></div>'; }).join('') : '<p class="dt-sub">Wird nach ein paar Tagen sichtbar.</p>') + '</div></div></div>';
    /* Wörter */
    var wlist = Object.keys(st.words || {}).map(function (w) { return { w: w, s: st.words[w] }; });
    var hard = wlist.filter(function (x) { return x.s.e > 0; }).sort(function (a, b) { return b.s.e - a.s.e; }).slice(0, 8);
    h += '<div class="panel pad"><h3>Schwierige Wörter</h3>' + (hard.length ? '<div class="dt-tags">' + hard.map(function (x) { return '<span class="dt-tag w bad">' + E(x.w) + ' <small>' + x.s.e + '× falsch</small></span>'; }).join('') + '</div>' : '<p class="dt-sub">Noch keine Wörter mit Fehlern.</p>') +
      '<p class="dt-sub">Sicher gelernt: ' + masteredWords().length + ' von ' + DT.WORDS.length + ' Wörtern.</p><details><summary>Alle Lernwörter und ihre Regel</summary><div class="dt-wt">' + DT.WORDS.map(function (x) { var s = st.words[x.w]; return '<div><b>' + E(x.w) + '</b><span>' + E(x.cat) + ', ' + E(x.rule) + '</span><em>' + (s ? s.k + '/' + s.n + ' richtig' + (DT.wordMastered(s) ? ' ✓' : '') : 'noch nicht geübt') + '</em></div>'; }).join('') + '</div></details></div>';
    /* Eigene Sätze */
    var tx = Object.keys(st.texts || {}).sort().reverse();
    h += '<div class="panel pad"><h3>Eigene Sätze zur Durchsicht</h3>' + (tx.length ? tx.slice(0, 12).map(function (k) {
      var id = k.split('|')[1], ex = EX(id), rv = st.review && st.review[k];
      return '<div class="dt-own"><div class="m">' + fdate(k.slice(0, 10)) + ' · ' + E(ex ? ex.q : id) + '</div><div class="dt-sent">„' + E(st.texts[k]) + '“</div><div class="dt-rv"><button class="btn small' + (rv === 1 ? ' primary' : '') + '" type="button" data-a="rv" data-k="' + E(k) + '" data-v="1">✓ passt</button><button class="btn small' + (rv === 0 ? ' primary' : '') + '" type="button" data-a="rv" data-k="' + E(k) + '" data-v="0">✗ nochmal besprechen</button></div></div>';
    }).join('') : '<p class="dt-sub">Noch keine eigenen Sätze. Die automatische Prüfung kontrolliert Großbuchstaben, Satzzeichen und Pflichtwörter. Ob ein Satz inhaltlich passt, entscheiden Sie hier.</p>') + '</div>';
    /* Empfehlung */
    var rec;
    var sw = wk.map(function (x) { return DT.SKILLS[x.k].n; });
    if (!us.days.length) rec = 'Noch keine Daten. Der erste Tag startet mit „Nomen und Wortarten“.';
    else if (sw.length) rec = 'Empfohlen: ' + sw.slice(0, 3).join(', ') + ' kurz gemeinsam besprechen. Die App wiederholt diese Themen automatisch in kurzen Abständen.' + (nextU ? ' Nächster Inhalt: Woche ' + DT.WEEKS[nextU.w].n + ', Tag ' + (nextU.d + 1) + '.' : '');
    else rec = 'Es läuft gut. ' + (nextU ? 'Nächster Inhalt: Woche ' + DT.WEEKS[nextU.w].n + ', Tag ' + (nextU.d + 1) + '.' : 'Woche 1 ist abgeschlossen. Weitere Wochen folgen.');
    h += '<div class="panel pad"><h3>Empfehlung</h3><p>' + E(rec) + '</p></div>';
    /* Fahrplan */
    h += '<div class="panel pad"><h3>Plan der Wochen</h3>' + DT.WEEKS.map(function (w) { return '<div class="dt-pl"><b>Woche ' + w.n + (w.ready ? '' : ' (folgt)') + ':</b> ' + E(w.rs) + (w.gr ? ' · ' + E(w.gr) : '') + '</div>'; }).join('') + '<p class="dt-sub">Lernbereiche nach LehrplanPLUS Deutsch Realschule 5 (Richtig schreiben, Sprache untersuchen). Bitte die Inhalte mit dem Unterricht abgleichen.</p></div>';
    /* Probelauf + Einstellungen */
    h += '<div class="panel pad"><h3>Probelauf</h3><p class="dt-sub">Probieren Sie eine Einheit selbst aus. Dabei wird nichts gespeichert.</p><div class="dt-try">' + DT.units().map(function (u) { return '<button class="btn small" type="button" data-a="probe" data-w="' + u.w + '" data-d="' + u.d + '">W' + DT.WEEKS[u.w].n + ' T' + (u.d + 1) + '</button>'; }).join('') + '</div></div>';
    h += '<div class="panel pad"><h3>Schwierigkeit</h3><p class="dt-sub">Aktuell Stufe ' + DT.levelFor(st) + ' (' + ((st.cfg && +st.cfg.lv) ? 'von Ihnen festgelegt' : 'automatisch') + '). Die Stufe steigt nach zwei sehr guten Tagen in Folge (je mindestens 18 von 20 Punkten) und sinkt nach einem schwachen Tag.</p><div class="dt-try">' + [[0, 'Automatisch'], [1, 'Stufe 1 fest'], [2, 'Stufe 2 fest']].map(function (o) { return '<button type="button" class="btn small' + (((st.cfg && +st.cfg.lv) || 0) === o[0] ? ' primary' : '') + '" data-a="setlv" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    h += '<div class="panel pad"><h3>Wiederholungs-Abstände</h3><p class="dt-sub">In Tagen, von „gerade gelernt“ bis „sicher“. Bei Fehlern beginnt es wieder vorne. Standard: 1, 3, 7, 14, 30.</p><div class="dt-iv"><input class="inp" id="dtiv" value="' + E(iv().join(', ')) + '" inputmode="numeric" aria-label="Abstände in Tagen"><button class="btn" type="button" data-a="saveiv">Speichern</button></div>' +
      '<h3 style="margin-top:16px">Daten löschen</h3><p class="dt-sub">Löscht den gesamten Lernstand von ' + E(C.name() || 'Anwender') + ' im Deutschtraining. Das kann nicht rückgängig gemacht werden.</p><button class="btn danger' + (armedDel ? ' armed' : '') + '" type="button" data-a="wipe">' + (armedDel ? 'Wirklich alles löschen? Nochmal tippen' : 'Lernstand löschen') + '</button></div>';
    return h;
  }

  /* ---------- Papier-Ablauf: Blatt anzeigen, Korrektur eintragen ---------- */
  var cor = { f: {}, min: '', code: '' }, showSheet = false, armedDrop = false, msd = { key: '', min: '', g: 0, n: '' };
  function openSheetKey() {
    var ks = Object.keys(st.days || {}).filter(function (k) { return st.days[k].paper && st.days[k].part; }).sort();
    return ks.length ? ks[ks.length - 1] : null;
  }
  function sheetList(key) { return (st.days[key].l || []).map(function (x) { return { id: x[0], ph: x[1], rep: !!x[2] }; }).filter(function (u) { return EX(u.id); }); }
  function createSheet(kind) {
    if (openSheetKey()) { showSheet = true; render(); return; }
    var today = C.today(), list, key, unitKey;
    if (kind === 'unit') {
      var u = DT.nextUnit(st); if (!u) { C.toast('Alle geplanten Tage sind geschafft.'); return; }
      if (doneToday()) { C.toast('Heute ist schon geschafft.'); return; }
      list = DT.buildDay(st, u, today); key = today; unitKey = u.key;
    } else {
      list = DT.buildReview(st, today); if (!list.length) { C.toast('Gerade gibt es nichts zu wiederholen.'); return; }
      var n = 1; while (st.days[today + '~r' + n]) n++; key = today + '~r' + n; unitKey = 'rep';
    }
    var rec = { k: unitKey, paper: 1, part: 1, l: list.map(function (x) { return [x.id, x.ph, x.rep ? 1 : 0]; }), r: [], p: 0, pp: [0, 0, 0, 0], dur: 0, rep: kind === 'unit' ? 0 : 1, lv: DT.levelFor(st), t: Date.now() };
    var p = { days: {} }; p.days[key] = rec; save(p);
    cor = { f: {}, min: '', code: '' }; showSheet = true; render(); window.scrollTo(0, 0);
  }
  function shufOrder(ex, n) {
    var a = ex.parts.map(function (_, i) { return i; }), seed = n * 5 + 1;
    for (var k = a.length - 1; k > 0; k--) { seed = (seed * 31 + 11) % 97; var j = seed % (k + 1); var t = a[k]; a[k] = a[j]; a[j] = t; }
    if (ex.sols.some(function (s) { return s.every(function (x, i) { return x === a[i]; }); })) a.push(a.shift());
    return a;
  }
  function paperTask(ex, n) {
    var L = 'ABCDEFG', h = '<div class="dt-pt"><div class="dt-pn">' + n + '</div><div class="dt-pb">';
    if (ex.t === 'single' || ex.t === 'multi') {
      h += '<p class="dt-pq">' + E(ex.q) + '</p><div class="dt-po">' + ex.opts.map(function (o, i) { return '<div><b>' + L[i] + ')</b> ' + E(o) + '</div>'; }).join('') + '</div><p class="dt-ph2">' + (ex.t === 'multi' ? 'Mehrere sind richtig. Schreibe die Buchstaben auf.' : 'Schreibe den Buchstaben auf.') + '</p>';
    } else if (ex.t === 'gap') {
      h += '<p class="dt-ph2">Schreibe die fehlenden Wörter richtig geschrieben auf.</p><p class="dt-pq">' + E(ex.q).replace(/___/g, '<span class="dt-bl"></span>') + '</p>';
    } else if (ex.t === 'text') {
      h += '<p class="dt-pq">' + E(ex.q) + '</p>';
    } else if (ex.t === 'assign') {
      h += '<p class="dt-pq">' + E(ex.q) + '</p><div class="dt-po">' + ex.items.map(function (it, i) { return '<div><b>' + 'abcdefghij'[i] + ')</b> ' + E(it.t) + '</div>'; }).join('') + '</div><p class="dt-ph2">Gruppen: <b>' + ex.cats.map(E).join('</b> · <b>') + '</b>. Schreibe zu jedem Buchstaben die passende Gruppe auf.</p>';
    } else if (ex.t === 'fix') {
      h += '<p class="dt-pq">' + E(ex.q.replace(/Tippe auf[^.]*\.\s*/, '')) + '</p><div class="dt-pbox">' + E(ex.tokens.join(' ')) + '</div><p class="dt-ph2">Schreibe den Text ohne Fehler auf.</p>';
    } else if (ex.t === 'order') {
      h += '<p class="dt-pq">' + E(ex.q.replace(/Tippe[^.]*\./, 'Bringe die Satzteile in eine passende Reihenfolge.')) + '</p><div class="dt-pbox">' + shufOrder(ex, n).map(function (i) { return '<span class="dt-pch">' + E(ex.parts[i]) + '</span>'; }).join(' ') + '</div><p class="dt-ph2">Schreibe den ganzen Satz auf (mit Punkt).</p>';
    } else if (ex.t === 'own') {
      h += '<p class="dt-pq">' + E(ex.q) + '</p><p class="dt-ph2">Schreibe einen ganzen Satz.</p>';
    }
    return h + '<details class="dtno-print"><summary>💡 Tipp</summary><div class="dt-tip">' + E(ex.hint) + '</div></details></div></div>';
  }
  function sheetHtml() {
    var key = openSheetKey(); if (!key) { showSheet = false; return C.isAdmin() ? parentHtml() : homeHtml(); }
    var rec = st.days[key], list = sheetList(key), n = 0, h = '';
    var wk = /^w(\d+)d(\d+)$/.exec(rec.k), title = rec.rep ? 'Wiederholungsblatt' : (wk ? DT.WEEKS[+wk[1] - 1].days[+wk[2] - 1].title : 'Blatt');
    h += '<div class="dtsheet"><div class="dt-top dtno-print"><button class="btn small" type="button" data-a="sheetback">← Zurück</button><button class="btn small" type="button" data-a="print">🖨 Drucken</button></div>';
    h += '<div class="panel pad"><h2>' + E(title) + '</h2><p class="dt-sub">' + (wk ? 'Woche ' + wk[1] + ', Tag ' + wk[2] + ' · ' : '') + fdate(key.slice(0, 10)) + '</p>';
    h += '<div class="infobox dt-how"><b>So geht’s:</b> Schreibe alles von Hand auf ein Blatt Papier. Setze immer die Nummer der Aufgabe davor. Schreibe ordentlich und lass Platz zwischen den Aufgaben. Wenn du fertig bist, fotografiert Papa dein Blatt.</div></div>';
    DT.PHASES.forEach(function (P) {
      var us = list.filter(function (u) { return u.ph === P.k; }); if (!us.length) return;
      h += '<div class="panel pad"><h3>' + P.e + ' ' + P.n + ' <span class="pill">' + P.min + ' Min.</span></h3>' + us.map(function (u) { n++; return paperTask(EX(u.id), n); }).join('') + '</div>';
    });
    if (!C.isAdmin()) {
      if (msd.key !== key) msd = { key: key, min: rec.ms && rec.ms.min ? String(rec.ms.min) : '', g: rec.ms ? rec.ms.g : 0, n: rec.ms && rec.ms.n ? rec.ms.n : '' };
      h += DTMS.form(E, msd, rec.ms);
    }
    return h + '</div>';
  }
  function corrHtml() {
    var key = openSheetKey(), h = '';
    if (!key) {
      var nu = DT.nextUnit(st), canU = nu && !doneToday();
      h += '<div class="panel pad"><h3>Aufgabenblatt</h3><p class="dt-sub">Maximilian bekommt die Aufgaben in der App angezeigt und schreibt sie von Hand. Sie fotografieren das Blatt und senden es an Claude zur Korrektur. Das Ergebnis tragen Sie danach hier ein.</p>' +
        (canU ? '<button class="btn primary" type="button" data-a="newsheet">📄 Blatt für Woche ' + DT.WEEKS[nu.w].n + ', Tag ' + (nu.d + 1) + ' anlegen</button> ' : '<p class="dt-sub">' + (nu ? 'Heute ist schon geschafft.' : 'Alle geplanten Tage sind geschafft.') + '</p>') +
        '<button class="btn" type="button" data-a="newrev">🔁 Wiederholungsblatt anlegen</button></div>';
      return h;
    }
    var rec = st.days[key], list = sheetList(key), n = 0;
    h += '<div class="panel pad"><h3>Offenes Blatt: ' + (rec.rep ? 'Wiederholung' : 'Woche ' + (/^w(\d+)/.exec(rec.k) || [0, '?'])[1] + ', Tag ' + ((/d(\d+)$/.exec(rec.k) || [0, '?'])[1])) + ' (' + fdate(key.slice(0, 10)) + ')</h3>' +
      '<p class="dt-sub">Nach der Korrektur: pro Aufgabe das Ergebnis wählen, die Übungszeit eintragen und speichern. Oder den Ergebnis-Code von Claude einfügen.</p>' +
      (rec.ms ? '<div class="infobox"><b>Maximilian meldet:</b> ' + E(DTMS.text(rec.ms)) + '</div>' : '<p class="dt-sub">Noch keine Meldung von Maximilian.</p>') +
      '<div class="dt-try"><button class="btn small" type="button" data-a="sheetview">📄 Blatt ansehen und drucken</button></div>';
    if (!cor.min && rec.ms && rec.ms.min) cor.min = String(rec.ms.min);
    h += '<div class="dt-cor">' + list.map(function (u) {
      n++; var ex = EX(u.id), v = cor.f[u.id];
      return '<div class="dt-crow"><div class="dt-cn">' + n + '</div><div class="dt-ct"><b>' + E(DT.SKILLS[ex.skill].n) + '</b><span>' + E(ex.q.slice(0, 70)) + (ex.q.length > 70 ? ' …' : '') + '</span></div><div class="dt-cb">' +
        [[1, '✔'], [0.5, '◐'], [0, '✖']].map(function (x) { return '<button type="button" class="dt-cbt' + (v === x[0] ? ' on' + (x[0] === 1 ? ' g' : x[0] === 0 ? ' r' : ' y') : '') + '" data-a="cf" data-id="' + u.id + '" data-v="' + x[0] + '" aria-label="' + (x[0] === 1 ? 'richtig' : x[0] === 0 ? 'falsch' : 'teilweise') + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
    h += '<p class="dt-sub">✔ richtig · ◐ teilweise richtig · ✖ falsch</p>';
    h += '<label class="fld" style="margin-top:10px">Übungszeit in Minuten<input class="inp" id="dtmin" type="number" min="1" max="180" inputmode="numeric" value="' + E(cor.min) + '" style="max-width:140px"></label>';
    h += '<label class="fld" style="margin-top:10px">Ergebnis-Code von Claude (optional)<textarea class="inp" id="dtcode" rows="2" placeholder="DT1 min=22 m01=1 m02=0.5 …">' + E(cor.code) + '</textarea></label><div class="dt-try" style="margin-top:8px"><button class="btn small" type="button" data-a="capply">Code übernehmen</button></div>';
    h += '<div class="dt-try" style="margin-top:12px"><button class="btn primary" type="button" data-a="csave">Ergebnis speichern</button><button class="btn small danger' + (armedDrop ? ' armed' : '') + '" type="button" data-a="cdrop">' + (armedDrop ? 'Wirklich verwerfen? Nochmal tippen' : 'Blatt verwerfen') + '</button></div></div>';
    return h;
  }
  function finalizeSheet(key) {
    var rec = st.days[key], list = sheetList(key), min = +cor.min;
    if (!(min >= 1 && min <= 180)) { C.toast('Bitte die Übungszeit in Minuten eintragen.'); return; }
    var miss = list.filter(function (u) { return cor.f[u.id] == null; });
    if (miss.length) { C.toast('Es fehlt noch das Ergebnis bei ' + miss.length + ' Aufgabe(n).'); return; }
    S = { mode: rec.rep ? 'review' : 'unit', key: rec.k === 'rep' ? '' : rec.k, date: key.slice(0, 10), list: list, i: list.length, res: [], applied: 0, tdone: 0, probe: false };
    list.forEach(function (u) { var f = cor.f[u.id], ex = EX(u.id); S.res.push({ id: u.id, ph: u.ph, f: f, h: 0, rep: u.rep ? 1 : 0, sec: Math.round(min * 60 / list.length), wd: DT.wordsOfTask(ex, f) }); });
    applyPending();
    var r2 = dayRecord(true); r2.paper = 1; r2.lv = rec.lv || 1;
    var p = { days: {}, srs: st.srs, words: st.words, errors: st.errors };
    p.days[key] = r2;
    if (!st.start) p.start = S.date;
    if (S.mode === 'unit') { p.done = {}; p.done[S.key] = S.date; }
    var pts = DT.points(list, S.res);
    S = null; cor = { f: {}, min: '', code: '' }; showSheet = false;
    save(p); render();
    C.toast('Gespeichert: ' + pts.rounded + ' von 20 Punkten.');
  }
  function lastResultHtml() {
    var ks = finishedDays().filter(function (k) { return isDay(k); });
    if (!ks.length) return '';
    var k = ks[ks.length - 1], d = st.days[k], bad = (d.r || []).filter(function (r) { return r[2] < 0.999 && EX(r[0]); });
    var lv = DT.level(d.p);
    var h = '<div class="panel pad"><h3>Letztes Ergebnis (' + fdate(k) + ')</h3><p><b>' + Math.round(d.p) + ' von 20 Punkten</b> <span style="color:' + lvlColor(lv.c) + ';font-weight:700">· ' + lv.l + '</span></p>';
    if (bad.length) h += '<p class="dt-sub">Das schauen wir uns noch einmal an:</p>' + bad.slice(0, 6).map(function (r) { var ex = EX(r[0]); return '<div class="dt-rule" style="margin-top:6px"><span>' + E(DT.SKILLS[ex.skill].n) + '</span>' + E(ex.expl) + '</div>'; }).join('');
    else h += '<p class="dt-sub">Alles richtig. Super!</p>';
    return h + '</div>';
  }

  /* ---------- Rendern und Ereignisse ---------- */
  function render() {
    if (!C) return;
    var h;
    if (err && !loaded) h = '<div class="empty"><strong>Deutschtraining nicht verfügbar</strong>Die Datenbank-Regeln für das Deutschtraining sind noch nicht veröffentlicht. Bitte die neuen Regeln in Firebase eintragen.</div>';
    else if (S) h = S.step === 'done' ? doneHtml() : runHtml();
    else if (showSheet) h = sheetHtml();
    else if (C.isAdmin()) h = parentHtml();
    else h = homeHtml();
    el.innerHTML = '<div class="dtw">' + h + '</div>';
    if (S && S.step === 'task') { var f = el.querySelector('.dt-gap,.dt-ta'); }
  }
  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.dataset.a;
    if (S && S.step === 'task') {
      var ex = curEx(), c = S.cur;
      if (a === 'opt') { var i = +b.dataset.i; if (ex.t === 'single') c.sel = i; else { c.sel = c.sel || []; var p = c.sel.indexOf(i); if (p >= 0) c.sel.splice(p, 1); else c.sel.push(i); } render(); return; }
      if (a === 'as') { c.as = c.as || []; c.as[+b.dataset.i] = +b.dataset.k; render(); return; }
      if (a === 'tk') { c.ed = c.ed || {}; var ti = +b.dataset.i; c.ed[ti] = ex.tokens[ti]; render(); var inp = el.querySelector('.dt-tkin[data-i="' + ti + '"]'); if (inp) { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (x) {} } return; }
      if (a === 'ordp') { c.ord = c.ord || []; c.ord.push(+b.dataset.i); render(); return; }
      if (a === 'ordx') { c.ord.splice(+b.dataset.k, 1); render(); return; }
      if (a === 'tip') { c.h = 1; render(); return; }
      if (a === 'check') { check(); return; }
    }
    if (a === 'newsheet') { createSheet('unit'); return; }
    if (a === 'newrev') { createSheet('rev'); return; }
    if (a === 'sheetview') { showSheet = true; render(); window.scrollTo(0, 0); return; }
    if (a === 'sheetback') { showSheet = false; render(); return; }
    if (a === 'print') { try { window.print(); } catch (x) {} return; }
    if (a === 'msg') { msd.g = +b.dataset.v; render(); return; }
    if (a === 'mssend') {
      var k3 = openSheetKey(), m3 = DTMS.make(msd, C.today());
      if (!k3) return; if (!m3) { C.toast('Bitte wähle aus, wie es war.'); return; }
      var pm = { days: {} }; pm.days[k3] = { ms: m3 }; save(pm); render(); C.toast('Danke! Papa sieht deine Meldung.'); return;
    }
    if (a === 'cf') { cor.f[b.dataset.id] = +b.dataset.v; render(); return; }
    if (a === 'capply') {
      var key0 = openSheetKey(); if (!key0) return;
      var pr = DT.parseCode($('#dtcode').value, sheetList(key0));
      if (!pr.ok) { C.toast(pr.err); return; }
      cor.f = pr.f; if (pr.min) cor.min = String(pr.min); cor.code = $('#dtcode').value; render(); C.toast('Code übernommen. Bitte prüfen und speichern.'); return;
    }
    if (a === 'csave') { var key1 = openSheetKey(); if (key1) finalizeSheet(key1); return; }
    if (a === 'cdrop') {
      if (!armedDrop) { armedDrop = true; render(); setTimeout(function () { armedDrop = false; if (!S) render(); }, 5000); return; }
      armedDrop = false; var key2 = openSheetKey();
      if (key2) { var pd = { days: {} }; pd.days[key2] = { k: 'x', paper: 0, part: 1, l: [], r: [], p: 0, pp: [0, 0, 0, 0], dur: 0, rep: 0, t: Date.now() }; save(pd); }
      cor = { f: {}, min: '', code: '' }; showSheet = false; render(); return;
    }
    if (a === 'next') { next(); return; }
    if (a === 'go') { S.step = 'task'; S.t0 = Date.now(); persistSess(); render(); window.scrollTo(0, 0); return; }
    if (a === 'pause') {
      if (S.step === 'fb') {
        S.i++; S.fb = null; S.cur = {};
        if (S.i >= S.list.length) { finish(); return; }
        S.step = S.list[S.i].ph !== S.list[S.i - 1].ph ? 'intro' : 'task';
      }
      persistSess();
      if (!S.probe && S.mode === 'unit') savePartial();
      S = null; tab = 'home'; render(); C.toast('Gespeichert. Du kannst jederzeit weitermachen.'); return;
    }
    if (a === 'start') { var u = DT.nextUnit(st); if (u) startUnit(u, false); return; }
    if (a === 'resume') { var sv = lsGet(lk()); if (sv) resume(sv); return; }
    if (a === 'review') { startReview(); return; }
    if (a === 'tomorrow') { tomorrowAgain(); return; }
    if (a === 'leave') { leave(); return; }
    if (a === 'probe') { startUnit({ w: +b.dataset.w, d: +b.dataset.d, key: 'w' + DT.WEEKS[+b.dataset.w].n + 'd' + (+b.dataset.d + 1) }, true); return; }
    if (a === 'rv') { var p2 = { review: {} }; p2.review[b.dataset.k] = +b.dataset.v; save(p2); render(); return; }
    if (a === 'setlv') { save({ cfg: { lv: +b.dataset.v } }); render(); C.toast('Gespeichert.'); return; }
    if (a === 'saveiv') {
      var v = ($('#dtiv').value || '').split(/[,;\s]+/).filter(Boolean).map(Number);
      if (v.length !== 5 || v.some(function (x) { return !(x >= 1 && x <= 120) || x % 1; }) || v.some(function (x, i) { return i && x < v[i - 1]; })) { C.toast('Bitte fünf aufsteigende Zahlen (Tage) eingeben, zum Beispiel 1, 3, 7, 14, 30.'); return; }
      save({ cfg: { iv: v } }); C.toast('Gespeichert.'); render(); return;
    }
    if (a === 'wipe') { if (!armedDel) { armedDel = true; render(); setTimeout(function () { armedDel = false; if (!S) render(); }, 5000); return; } armedDel = false; C.wipe().then(function () { st = emptyState(); lsSet(lk(), null); lsSet('dtcache:' + C.studentUid, null); render(); C.toast('Lernstand gelöscht.'); }); return; }
  }
  function onInput(e) {
    var t = e.target;
    if (t.dataset.ms === 'min') { msd.min = t.value; return; }
    if (t.dataset.ms === 'n') { msd.n = t.value; return; }
    if (t.id === 'dtmin') { cor.min = t.value; return; }
    if (t.id === 'dtcode') { cor.code = t.value; return; }
    var a = t.dataset.a; if (!a || !S || S.step !== 'task') return;
    var c = S.cur;
    if (a === 'gap') { c.g = c.g || []; c.g[+t.dataset.i] = t.value; }
    else if (a === 'txt') c.txt = t.value;
    else if (a === 'ed') { c.ed = c.ed || {}; c.ed[+t.dataset.i] = t.value; t.size = Math.max(4, t.value.length + 1); }
  }
  function onKey(e) {
    if (e.key !== 'Enter' || !S) return;
    var t = e.target;
    if (S.step === 'task' && t.matches && t.matches('.dt-gap,.dt-tkin')) {
      var all = Array.prototype.slice.call(el.querySelectorAll('.dt-gap,.dt-tkin')), i = all.indexOf(t);
      e.preventDefault(); if (i >= 0 && i < all.length - 1) all[i + 1].focus(); else check();
    }
  }

  /* Rückmeldung des Schülers zum Blatt (wird auch vom Lernen-Reiter benutzt) */
  var FEEL = [[1, '😀', 'leicht'], [2, '🙂', 'geht so'], [3, '😓', 'schwer']];
  window.DTMS = {
    feel: function (g) { for (var i = 0; i < FEEL.length; i++) if (FEEL[i][0] === g) return FEEL[i]; return null; },
    text: function (m) {
      if (!m) return '';
      var f = window.DTMS.feel(m.g);
      return (m.min ? m.min + ' Min.' : '') + (f ? (m.min ? ', ' : '') + f[1] + ' ' + f[2] : '') + (m.n ? ' · „' + m.n + '“' : '');
    },
    form: function (esc, draft, saved) {
      var h = '<div class="panel pad dtno-print dt-ms"><h3>Fertig? Sag Papa, wie es war</h3>';
      if (saved) h += '<p class="dt-sub">✔ Gemeldet: ' + esc(window.DTMS.text(saved)) + '. Du kannst es noch ändern.</p>';
      h += '<label class="fld">Wie lange hast du gebraucht? (Minuten)<input class="inp" data-ms="min" type="number" min="1" max="180" inputmode="numeric" value="' + esc(draft.min) + '" style="max-width:140px"></label>';
      h += '<div class="dt-try" style="margin:10px 0">' + FEEL.map(function (f) { return '<button type="button" class="btn small' + (draft.g === f[0] ? ' primary' : '') + '" data-a="msg" data-v="' + f[0] + '">' + f[1] + ' ' + f[2] + '</button>'; }).join('') + '</div>';
      h += '<label class="fld">Was war schwer oder leicht? (kurz)<textarea class="inp" data-ms="n" rows="2" maxlength="300">' + esc(draft.n) + '</textarea></label>';
      return h + '<button class="btn primary" type="button" data-a="mssend" style="margin-top:8px">Meldung senden</button></div>';
    },
    /* Entwurf prüfen; liefert die Meldung oder null */
    make: function (draft, today) {
      var m = +draft.min;
      if (!draft.g) return null;
      var o = { d: today, g: draft.g, t: Date.now() };
      if (m >= 1 && m <= 180) o.min = Math.round(m);
      var n = String(draft.n || '').trim().slice(0, 300); if (n) o.n = n;
      return o;
    }
  };

  window.DTUI = {
    init: function (ctx) {
      C = ctx; el = ctx.el;
      var cached = lsGet('dtcache:' + C.studentUid); if (cached && cached.v === 1) { st = Object.assign(emptyState(), cached); }
      el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('keydown', onKey);
    },
    /* Daten vom Server (Snapshot); data kann null sein (noch nichts gespeichert) */
    setData: function (data, failed) {
      err = !!failed;
      if (!failed) { loaded = true; st = Object.assign(emptyState(), data || {}); lsSet('dtcache:' + C.studentUid, st); }
      if (S && S.step === 'task') return;
      render();
    },
    render: render,
    busy: function () { return !!(S && S.step === 'task'); },
    reset: function () { showSheet = false; cor = { f: {}, min: '', code: '' }; S = null; st = emptyState(); loaded = false; err = false; tab = 'home'; },
    state: function () { return st; },
    current: function () { return S && S.list && S.list[S.i] && (S.step === 'task' || S.step === 'fb') ? S.list[S.i].id : null; },
    step: function () { return S ? S.step : null; }
  };
})();
