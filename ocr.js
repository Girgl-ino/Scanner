// ocr.js: schlaegt aus dem oberen Drittel einer Seite einen Dateinamen vor (z. B. 2026_11_11_Rechnung)
(function () {
  const Ocr = {};
  let worker = null, seq = 0;
  const waiting = {};

  function getWorker() {
    if (worker) return worker;
    worker = new Worker('ocr/worker.js');
    worker.onmessage = (e) => {
      const w = waiting[e.data.id]; if (!w) return;
      delete waiting[e.data.id];
      if (e.data.error) w.rej(new Error(e.data.error)); else w.res(e.data.text || '');
    };
    worker.onerror = () => { Object.keys(waiting).forEach((k) => { waiting[k].rej(new Error('worker')); delete waiting[k]; }); worker = null; };
    return worker;
  }

  // Oberes Drittel ausschneiden, auf ca. 900 px Breite verkleinern, in Graustufen
  async function topThird(blob) {
    const bmp = await createImageBitmap(blob);
    const sw = bmp.width, sh = Math.round(bmp.height * 0.34);
    const k = Math.min(1, 900 / sw);
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.filter = 'grayscale(1) contrast(1.15)';
    x.drawImage(bmp, 0, 0, sw, sh, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    return new Uint8Array(await b.arrayBuffer());
  }

  Ocr.read = async function (blob) {
    const bytes = await topThird(blob);
    return new Promise((res, rej) => {
      const id = ++seq; waiting[id] = { res, rej };
      const t = setTimeout(() => { if (waiting[id]) { delete waiting[id]; rej(new Error('timeout')); } }, 25000);
      const done = (f) => (v) => { clearTimeout(t); f(v); };
      waiting[id] = { res: done(res), rej: done(rej) };
      getWorker().postMessage({ id, bytes }, [bytes.buffer]);
    });
  };

  // ---------- Dokumentart erkennen ----------
  const strip = (s) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[^a-z0-9\s]/g, ' ');
  // [Stichwort(e), Name] – leicht erweiterbar. Reihenfolge = Vorrang.
  Ocr.TYPES = [
    [['kontoauszug', 'kontoauszuge'], 'Kontoauszug'],
    [['mahnung', 'zahlungserinnerung'], 'Mahnung'],
    [['rechnung', 'invoice', 'rechnungsnummer'], 'Rechnung'],
    [['gehaltsabrechnung', 'lohnabrechnung', 'entgeltabrechnung', 'verdienstabrechnung'], 'Gehaltsabrechnung'],
    [['nebenkostenabrechnung', 'betriebskostenabrechnung'], 'Nebenkostenabrechnung'],
    [['steuerbescheid', 'einkommensteuerbescheid'], 'Steuerbescheid'],
    [['kundigung', 'kundigungsbestatigung'], 'Kuendigung'],
    [['mietvertrag'], 'Mietvertrag'],
    [['arbeitsvertrag'], 'Arbeitsvertrag'],
    [['vertrag', 'vereinbarung'], 'Vertrag'],
    [['versicherungsschein', 'versicherungsnummer', 'versicherung', 'police'], 'Versicherung'],
    [['arztbrief', 'befund', 'uberweisungsschein', 'krankschreibung', 'arbeitsunfahigkeit'], 'Arzt'],
    [['zeugnis'], 'Zeugnis'],
    [['bescheinigung'], 'Bescheinigung'],
    [['bescheid'], 'Bescheid'],
    [['quittung', 'kassenbon', 'kassenbeleg'], 'Quittung'],
    [['auftragsbestatigung', 'bestellbestatigung', 'bestellung'], 'Bestellung'],
    [['lieferschein'], 'Lieferschein'],
    [['angebot', 'kostenvoranschlag'], 'Angebot'],
    [['antrag'], 'Antrag'],
    [['protokoll'], 'Protokoll'],
    [['einladung'], 'Einladung'],
  ];
  const lev1 = (a, b) => {   // Abstand hoechstens 1 (OCR-Tippfehler verzeihen)
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  };

  function findType(text) {
    const toks = strip(text).split(/\s+/).filter(Boolean);
    for (const [keys, name] of Ocr.TYPES) {
      for (const k of keys) {
        for (const t of toks) {
          if (t === k || (k.length >= 8 && t.length >= 7 && lev1(t, k)) || (k.length >= 8 && t.includes(k))) return name;
        }
      }
    }
    return '';
  }

  const ORG = /(gmbh|\bag\b|\bkg\b|\bse\b|e\.?\s?v\.?|\bmbh\b|bank|sparkasse|versicherung|finanzamt|stadt|gemeinde|landratsamt|amt\b|telekom|vodafone|stadtwerke|krankenkasse|\bag &|kanzlei|praxis)/i;
  function findSender(text) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length >= 3).slice(0, 8);
    for (const l of lines) {
      if (!ORG.test(l) || /\d{5}\s/.test(l) && l.length > 60) continue;
      const w = l.replace(/[^A-Za-zÄÖÜäöüß0-9&\s-]/g, ' ').split(/\s+/).filter((x) => x.length > 1 && !/^(und|der|die|das|von|fur|für)$/i.test(x));
      const word = w.slice(0, 2).join('');
      if (word.length >= 3) return word.slice(0, 18);
    }
    return '';
  }

  // Liefert nur den Namensteil nach dem Datum, z. B. "Rechnung_Telekom", "Text" oder "Scan"
  Ocr.suggest = function (text) {
    const t = findType(text), s = findSender(text);
    const words = text.split(/\s+/).filter((w) => /[A-Za-zÄÖÜäöü]{2,}/.test(w)).length;
    const lines = text.split(/\n/).filter((l) => l.trim().length > 3);
    const avg = lines.length ? lines.reduce((a, l) => a + l.trim().length, 0) / lines.length : 0;
    if (t) return s && s.toLowerCase() !== t.toLowerCase() ? t + '_' + s : t;
    if (s) return s;
    if (words >= 25 && avg >= 40) return 'Text';
    return 'Scan';
  };

  Ocr.datePrefix = function () {
    const d = new Date(), p = (v) => String(v).padStart(2, '0');
    return d.getFullYear() + '_' + p(d.getMonth() + 1) + '_' + p(d.getDate());
  };

  window.Ocr = Ocr;
})();
