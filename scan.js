// scan.js: Kantenerkennung, Entzerrung und Filter ohne externe Bibliotheken
(function () {
  const Scan = {};

  // ---------- Bild laden (EXIF-Drehung beachten, auf Arbeitsgröße verkleinern) ----------
  Scan.loadCanvas = async function (blob, maxSide) {
    let bmp;
    try {
      bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch (e) {
      bmp = await new Promise((res, rej) => {
        const u = URL.createObjectURL(blob);
        const i = new Image();
        i.onload = () => { URL.revokeObjectURL(u); res(i); };
        i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Bild nicht lesbar')); };
        i.src = u;
      });
    }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    const k = Math.min(1, maxSide / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return c;
  };

  Scan.toBlob = function (canvas, q) {
    return new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', q || 0.88));
  };

  // ---------- Hilfsfunktionen ----------
  function boxBlur(src, w, h, r) {
    const t = new Float32Array(w * h), o = new Float32Array(w * h), d = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      const row = y * w; let s = 0;
      for (let x = -r; x <= r; x++) s += src[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        t[row + x] = s / d;
        s += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        o[y * w + x] = s / d;
        s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
      }
    }
    return o;
  }

  function maxFilter(src, w, h, r) {
    const t = new Float32Array(w * h), o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = -r; k <= r; k++) { const v = src[y * w + Math.min(w - 1, Math.max(0, x + k))]; if (v > m) m = v; }
      t[y * w + x] = m;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = -r; k <= r; k++) { const v = t[Math.min(h - 1, Math.max(0, y + k)) * w + x]; if (v > m) m = v; }
      o[y * w + x] = m;
    }
    return o;
  }

  function otsu(gray, n) {
    const hist = new Float64Array(256);
    for (let i = 0; i < n; i++) hist[gray[i] | 0]++;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, th = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = n - wB; if (!wF) break;
      sB += t * hist[t];
      const mB = sB / wB, mF = (sum - sB) / wF;
      const v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; th = t; }
    }
    return th;
  }

  function polyArea(q) {
    let a = 0;
    for (let i = 0; i < 4; i++) { const p = q[i], n = q[(i + 1) % 4]; a += p[0] * n[1] - n[0] * p[1]; }
    return Math.abs(a) / 2;
  }

  // Größte zusammenhängende Fläche in der Maske, bewertet nach Rechteckigkeit
  function bestBlob(mask, w, h) {
    const lab = new Int32Array(w * h), stack = new Int32Array(w * h);
    let best = null, id = 0;
    for (let i = 0; i < w * h; i++) {
      if (!mask[i] || lab[i]) continue;
      id++;
      let sp = 0; stack[sp++] = i; lab[i] = id;
      let area = 0, minS = 1e9, maxS = -1e9, minD = 1e9, maxD = -1e9, tl, br, tr, bl;
      while (sp) {
        const p = stack[--sp], x = p % w, y = (p / w) | 0;
        area++;
        const s = x + y, d = x - y;
        if (s < minS) { minS = s; tl = [x, y]; }
        if (s > maxS) { maxS = s; br = [x, y]; }
        if (d > maxD) { maxD = d; tr = [x, y]; }
        if (d < minD) { minD = d; bl = [x, y]; }
        if (x > 0 && mask[p - 1] && !lab[p - 1]) { lab[p - 1] = id; stack[sp++] = p - 1; }
        if (x < w - 1 && mask[p + 1] && !lab[p + 1]) { lab[p + 1] = id; stack[sp++] = p + 1; }
        if (y > 0 && mask[p - w] && !lab[p - w]) { lab[p - w] = id; stack[sp++] = p - w; }
        if (y < h - 1 && mask[p + w] && !lab[p + w]) { lab[p + w] = id; stack[sp++] = p + w; }
      }
      const frac = area / (w * h);
      if (frac < 0.10 || frac > 0.93) continue;
      const q = [tl, tr, br, bl], qa = polyArea(q);
      if (qa < 1) continue;
      const rect = Math.min(1, area / qa);
      const score = rect * rect * rect * Math.pow(frac, 0.35);
      if (!best || score > best.score) best = { score, rect, frac, q };
    }
    return best;
  }

  // ---------- Blattkanten finden: Ergebnis in 0..1 (TL, TR, BR, BL) ----------
  Scan.defaultQuad = function () {
    const m = 0.05;
    return [[m, m], [1 - m, m], [1 - m, 1 - m], [m, 1 - m]];
  };

  // Löcher durch Text und Bilder im Blatt schließen (Dilatation, dann Erosion)
  function closeMask(mask, w, h, r) {
    const f = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) f[i] = mask[i];
    const dil = maxFilter(f, w, h, r);
    for (let i = 0; i < w * h; i++) f[i] = 1 - dil[i];
    const ero = maxFilter(f, w, h, r);
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = ero[i] < 0.5 ? 1 : 0;
    // Innenliegende Löcher (Text, Bilder, Stempel) füllen: alles, was vom Bildrand aus nicht erreichbar ist
    const outside = new Uint8Array(w * h), st = new Int32Array(w * h);
    let sp = 0;
    const push = (p) => { if (!out[p] && !outside[p]) { outside[p] = 1; st[sp++] = p; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (sp) {
      const p = st[--sp], x = p % w, y = (p / w) | 0;
      if (x > 0) push(p - 1); if (x < w - 1) push(p + 1);
      if (y > 0) push(p - w); if (y < h - 1) push(p + w);
    }
    for (let i = 0; i < w * h; i++) if (!outside[i]) out[i] = 1;
    return out;
  }

  // Seitenverhältnis des Vierecks: extrem schmale Formen sind keine Blätter
  function shapeOk(q, w, h) {
    const d = (p, n) => Math.hypot((p[0] - n[0]) / (w - 1), (p[1] - n[1]) / (h - 1) * (h / w));
    const top = d(q[0], q[1]), bot = d(q[3], q[2]), le = d(q[0], q[3]), ri = d(q[1], q[2]);
    const W = (top + bot) / 2, H = (le + ri) / 2;
    if (!W || !H) return 0;
    const ratio = Math.max(W, H) / Math.min(W, H);
    if (ratio > 3.2) return 0;
    // gegenüberliegende Seiten sollten ähnlich lang sein
    const par = Math.min(top, bot) / Math.max(top, bot) * Math.min(le, ri) / Math.max(le, ri);
    return par < 0.45 ? 0 : 0.85 + 0.15 * par;
  }

  // ---------- Kanten und Linien ----------
  // Sobel je Farbkanal; pro Pixel zaehlt der Kanal mit der staerksten Kante (findet auch Farbkanten bei gleicher Helligkeit)
  function edgeField(d, w, h) {
    const n = w * h, ch = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    for (let i = 0; i < n; i++) { ch[0][i] = d[i * 4]; ch[1][i] = d[i * 4 + 1]; ch[2][i] = d[i * 4 + 2]; }
    const bl = ch.map((c) => boxBlur(c, w, h, 1));
    const gx = new Float32Array(n), gy = new Float32Array(n), mag = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      let bm = 0, bx = 0, by = 0;
      for (let c = 0; c < 3; c++) {
        const a = bl[c];
        const sx = (a[p - w + 1] + 2 * a[p + 1] + a[p + w + 1]) - (a[p - w - 1] + 2 * a[p - 1] + a[p + w - 1]);
        const sy = (a[p + w - 1] + 2 * a[p + w] + a[p + w + 1]) - (a[p - w - 1] + 2 * a[p - w] + a[p - w + 1]);
        const m = Math.hypot(sx, sy);
        if (m > bm) { bm = m; bx = sx; by = sy; }
      }
      gx[p] = bx / 4; gy[p] = by / 4; mag[p] = bm / 4;
    }
    return { gx, gy, mag };
  }

  function percentile(arr, q) {
    const c = Float32Array.from(arr).sort();
    return c[Math.min(c.length - 1, Math.floor(c.length * q))];
  }

  // Hough-Transformation: nur Winkel nahe der Kantenrichtung stimmen ab -> schnell
  function houghLines(E, w, h, thr) {
    const cap = thr * 2.5;
    const NA = 120, diag = Math.ceil(Math.hypot(w, h)), NR = 2 * diag + 1;
    const acc = new Float32Array(NA * NR);
    const cs = new Float32Array(NA), sn = new Float32Array(NA);
    for (let a = 0; a < NA; a++) { cs[a] = Math.cos(a * Math.PI / NA); sn[a] = Math.sin(a * Math.PI / NA); }
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x, m = E.mag[p];
      if (m < thr) continue;
      let ph = Math.atan2(E.gy[p], E.gx[p]); if (ph < 0) ph += Math.PI; if (ph >= Math.PI) ph -= Math.PI;
      const a0 = Math.round(ph / Math.PI * NA);
      for (let da = -3; da <= 3; da++) {
        const a = (a0 + da + NA) % NA;
        const r = Math.round(x * cs[a] + y * sn[a]) + diag;
        acc[a * NR + r] += Math.min(m, cap) / cap * (1 - Math.abs(da) * 0.12);
      }
    }
    // Maxima (Fenster +-3 Winkel, +-6 rho), Winkel zyklisch
    const peaks = [];
    for (let a = 0; a < NA; a++) for (let r = 6; r < NR - 6; r++) {
      const v = acc[a * NR + r];
      if (v < 25) continue;
      let ok = true;
      for (let da = -3; da <= 3 && ok; da++) {
        const aa = (a + da + NA) % NA;
        for (let dr = -6; dr <= 6; dr++) { const o = acc[aa * NR + r + dr]; if (o > v || (o === v && (da < 0 || (da === 0 && dr < 0)))) { ok = false; break; } }
      }
      if (ok) peaks.push({ th: a * Math.PI / NA, rho: r - diag, v });
    }
    peaks.sort((p, q) => q.v - p.v);
    return peaks.slice(0, 24);
  }

  function lineIsect(l1, l2) {
    const c1 = Math.cos(l1.th), s1 = Math.sin(l1.th), c2 = Math.cos(l2.th), s2 = Math.sin(l2.th);
    const det = c1 * s2 - s1 * c2;
    if (Math.abs(det) < 0.2) return null;
    return [(l1.rho * s2 - s1 * l2.rho) / det, (c1 * l2.rho - l1.rho * c2) / det];
  }

  function angDiff(a, b) { let d = Math.abs(a - b) % Math.PI; return Math.min(d, Math.PI - d); }

  function orderQuad(pts) {
    let tl = pts[0], br = pts[0], tr = pts[0], bl = pts[0];
    pts.forEach((p) => {
      if (p[0] + p[1] < tl[0] + tl[1]) tl = p;
      if (p[0] + p[1] > br[0] + br[1]) br = p;
      if (p[0] - p[1] > tr[0] - tr[1]) tr = p;
      if (p[0] - p[1] < bl[0] - bl[1]) bl = p;
    });
    return [tl, tr, br, bl];
  }

  // Wie viel Kante liegt wirklich entlang der Vierecksseiten? (Anteil 0..1 je Seite)
  function sideSupport(q, E, w, h, thr) {
    const res = [];
    for (let i = 0; i < 4; i++) {
      const p = q[i], n = q[(i + 1) % 4];
      const dx = n[0] - p[0], dy = n[1] - p[1], len = Math.hypot(dx, dy);
      if (len < 8) return null;
      const nx = -dy / len, ny = dx / len;
      const steps = Math.max(16, Math.round(len / 2.5));
      let hit = 0, tot = 0;
      for (let k = 1; k < steps; k++) {
        const x = p[0] + dx * k / steps, y = p[1] + dy * k / steps;
        if (x < 2 || y < 2 || x > w - 3 || y > h - 3) continue;   // ausserhalb des Bildes: nicht zaehlen
        tot++;
        let best = 0;
        for (let o = -3; o <= 3; o++) {
          const xx = Math.round(x + nx * o), yy = Math.round(y + ny * o), pp = yy * w + xx;
          const pr = Math.abs(E.gx[pp] * nx + E.gy[pp] * ny);
          if (pr > best) best = pr;
        }
        if (best > thr) hit++;
      }
      if (tot < 6) { res.push(0.55); continue; }   // Seite liegt (fast) ausserhalb: neutral
      res.push(hit / tot);
    }
    return res;
  }

  // Gaengige Papierformate: A-Reihe (1,414), Letter (1,294), Quittung/Foto grob
  function formatPrior(q, w, h) {
    const d = (p, n) => Math.hypot(p[0] - n[0], p[1] - n[1]);
    const W = (d(q[0], q[1]) + d(q[3], q[2])) / 2, H = (d(q[0], q[3]) + d(q[1], q[2])) / 2;
    if (!W || !H) return 0;
    const r = Math.max(W, H) / Math.min(W, H);
    if (r > 3.2) return 0;
    const m = Math.max(...[1.414, 1.294, 1.5, 1.0].map((f) => Math.exp(-Math.pow((r - f) / 0.07, 2))));
    return 0.82 + 0.18 * m;
  }

  function quadFromLines(L, w, h) {
    const out = [];
    const minGap = 0.2 * Math.min(w, h);
    const pairs = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      if (angDiff(L[i].th, L[j].th) > 12 * Math.PI / 180) continue;
      // Abstand der beiden Geraden (senkrecht zur ersten)
      let dr = Math.abs(L[i].rho - L[j].rho);
      if (Math.cos(L[i].th - L[j].th) < 0) dr = Math.abs(L[i].rho + L[j].rho);
      if (dr < minGap) continue;
      pairs.push([L[i], L[j]]);
    }
    for (let a = 0; a < pairs.length; a++) for (let b = a + 1; b < pairs.length; b++) {
      const P = pairs[a], Q = pairs[b];
      const tp = (P[0].th + P[1].th) / 2, tq = (Q[0].th + Q[1].th) / 2;
      const ang = angDiff(tp, tq);
      if (Math.abs(ang - Math.PI / 2) > 22 * Math.PI / 180) continue;
      const pts = [lineIsect(P[0], Q[0]), lineIsect(P[0], Q[1]), lineIsect(P[1], Q[0]), lineIsect(P[1], Q[1])];
      if (pts.some((p) => !p || p[0] < -0.08 * w || p[0] > 1.08 * w || p[1] < -0.08 * h || p[1] > 1.08 * h)) continue;
      const q = orderQuad(pts), ar = polyArea(q) / (w * h);
      if (ar < 0.12 || ar > 1.1) continue;
      out.push({ q, frac: ar });
    }
    return out;
  }

  Scan.detect = function (canvas) {
    const k = 400 / Math.max(canvas.width, canvas.height);
    const w = Math.max(16, Math.round(canvas.width * k)), h = Math.max(16, Math.round(canvas.height * k));
    const s = document.createElement('canvas'); s.width = w; s.height = h;
    const sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(canvas, 0, 0, w, h);
    const d = sx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];

    // 1) Kandidaten aus Helligkeits- und Farbflaechen (wie bisher)
    const b = boxBlur(boxBlur(g, w, h, 2), w, h, 2);
    const th = otsu(b, w * h);
    const masks = [];
    [0, -18, 18].forEach((off) => {
      const t = th + off, light = new Uint8Array(w * h), dark = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) { if (b[i] > t) light[i] = 1; else dark[i] = 1; }
      masks.push(light, dark);
    });
    const br = new Float32Array(w * h), bg = new Float32Array(w * h), bb = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { br[i] = d[i * 4]; bg[i] = d[i * 4 + 1]; bb[i] = d[i * 4 + 2]; }
    const R = boxBlur(boxBlur(br, w, h, 2), w, h, 2), G = boxBlur(boxBlur(bg, w, h, 2), w, h, 2), B = boxBlur(boxBlur(bb, w, h, 2), w, h, 2);
    const edgePx = [], mg = Math.max(2, Math.round(Math.min(w, h) * 0.04));
    for (let x = 0; x < w; x++) edgePx.push(mg * w + x, (h - 1 - mg) * w + x);
    for (let y = 0; y < h; y++) edgePx.push(y * w + mg, y * w + (w - 1 - mg));
    const med = (arr) => { const c = arr.slice().sort((p, q) => p - q); return c[c.length >> 1]; };
    const er = med(edgePx.map((i) => R[i])), eg = med(edgePx.map((i) => G[i])), eb = med(edgePx.map((i) => B[i]));
    const dist = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) dist[i] = Math.hypot(R[i] - er, G[i] - eg, B[i] - eb);
    const dth = Math.max(10, otsu(dist, w * h));
    const far = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) far[i] = dist[i] > dth ? 1 : 0;
    masks.push(far);
    const cands = [];
    masks.forEach((mk) => {
      const c = bestBlob(closeMask(mk, w, h, 3), w, h);
      if (c && shapeOk(c.q, w, h)) cands.push({ q: c.q, frac: polyArea(c.q) / (w * h) });
    });

    // 2) Kandidaten aus geraden Kantenlinien (Hough): funktioniert auch bei weissem Blatt auf weissem Tisch
    const E = edgeField(d, w, h);
    const med50 = percentile(E.mag, 0.5), p97 = percentile(E.mag, 0.97);
    const houghThr = Math.max(3.5, 3.5 * med50), supThr = Math.max(3, Math.min(2.2 * med50 + 1, 0.4 * p97));
    const lines = houghLines(E, w, h, houghThr);
    quadFromLines(lines, w, h).forEach((c) => cands.push(c));

    // 3) Alle Kandidaten nach Kantenbelegung, Papierformat und Groesse bewerten
    let pick = null;
    cands.forEach((c) => {
      const sup = sideSupport(c.q, E, w, h, supThr);
      if (!sup) return;
      const mean = sup.reduce((p, q) => p + q, 0) / 4, mn = Math.min.apply(null, sup);
      const pr = formatPrior(c.q, w, h);
      if (!pr) return;
      const frac = Math.min(c.frac, 0.97);
      c.sup = mean; c.mn = mn;
      c.final = Math.pow(0.6 * mean + 0.4 * mn, 1.4) * pr * Math.pow(frac, 0.7);
      if (!pick || c.final > pick.final) pick = c;
    });
    if (!pick || pick.sup < 0.4 || pick.mn < 0.15 || pick.final < 0.12) return { quad: Scan.defaultQuad(), found: false };
    const clamp = (v) => Math.max(0, Math.min(1, v));
    return { quad: pick.q.map((p) => [clamp(p[0] / (w - 1)), clamp(p[1] / (h - 1))]), found: true };
  };

  // ---------- Perspektive entzerren ----------
  function homography(dst, src) {
    // löst die Abbildung (u,v) im Ziel -> (x,y) in der Quelle
    const A = [], B = [];
    for (let i = 0; i < 4; i++) {
      const [u, v] = dst[i], [x, y] = src[i];
      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); B.push(x);
      A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); B.push(y);
    }
    const n = 8;
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [B[i], B[p]] = [B[p], B[i]];
      const dv = A[i][i] || 1e-12;
      for (let r = i + 1; r < n; r++) {
        const f = A[r][i] / dv;
        for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
        B[r] -= f * B[i];
      }
    }
    const X = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = B[i];
      for (let c = i + 1; c < n; c++) s -= A[i][c] * X[c];
      X[i] = s / (A[i][i] || 1e-12);
    }
    return X;
  }

  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  Scan.warp = function (src, quad01, maxSide) {
    const sw = src.width, sh = src.height;
    const q = quad01.map((p) => [p[0] * sw, p[1] * sh]);
    let ow = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
    let oh = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
    const k = Math.min(1, maxSide / Math.max(ow, oh));
    ow = Math.max(40, Math.round(ow * k)); oh = Math.max(40, Math.round(oh * k));
    const H = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], q);
    const sd = src.getContext('2d').getImageData(0, 0, sw, sh).data;
    const out = document.createElement('canvas'); out.width = ow; out.height = oh;
    const ox = out.getContext('2d'), od = ox.createImageData(ow, oh), o = od.data;
    const [a, b, c, d, e, f, g, hh] = H;
    for (let v = 0; v < oh; v++) {
      for (let u = 0; u < ow; u++) {
        const z = g * u + hh * v + 1;
        let x = (a * u + b * v + c) / z, y = (d * u + e * v + f) / z;
        if (x < 0) x = 0; else if (x > sw - 1.001) x = sw - 1.001;
        if (y < 0) y = 0; else if (y > sh - 1.001) y = sh - 1.001;
        const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
        const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        const oi = (v * ow + u) * 4;
        o[oi] = sd[i00] * w00 + sd[i10] * w10 + sd[i01] * w01 + sd[i11] * w11;
        o[oi + 1] = sd[i00 + 1] * w00 + sd[i10 + 1] * w10 + sd[i01 + 1] * w01 + sd[i11 + 1] * w11;
        o[oi + 2] = sd[i00 + 2] * w00 + sd[i10 + 2] * w10 + sd[i01 + 2] * w01 + sd[i11 + 2] * w11;
        o[oi + 3] = 255;
      }
    }
    ox.putImageData(od, 0, 0);
    return out;
  };

  // ---------- Drehen ----------
  Scan.rotate = function (canvas, turns) {
    turns = ((turns % 4) + 4) % 4;
    if (!turns) return canvas;
    const swap = turns % 2 === 1;
    const c = document.createElement('canvas');
    c.width = swap ? canvas.height : canvas.width;
    c.height = swap ? canvas.width : canvas.height;
    const x = c.getContext('2d');
    x.translate(c.width / 2, c.height / 2);
    x.rotate(turns * Math.PI / 2);
    x.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return c;
  };

  // ---------- Filter ----------
  function background(canvas) {
    const w = canvas.width, h = canvas.height;
    const sw = Math.max(8, Math.round(w / 8)), sh = Math.max(8, Math.round(h / 8));
    const s = document.createElement('canvas'); s.width = sw; s.height = sh;
    const sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(canvas, 0, 0, sw, sh);
    const d = sx.getImageData(0, 0, sw, sh).data;
    const g = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    const r = Math.max(3, Math.round(Math.min(sw, sh) / 14));
    const bg = boxBlur(boxBlur(maxFilter(g, sw, sh, 2), sw, sh, r), sw, sh, r);
    const id = sx.createImageData(sw, sh);
    for (let i = 0; i < sw * sh; i++) { const v = Math.max(1, Math.min(255, bg[i])); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    sx.putImageData(id, 0, 0);
    const big = document.createElement('canvas'); big.width = w; big.height = h;
    const bx = big.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(s, 0, 0, w, h);
    return bx.getImageData(0, 0, w, h).data;
  }

  Scan.filter = function (canvas, mode) {
    if (mode === 'original') return canvas;
    const w = canvas.width, h = canvas.height;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const ox = out.getContext('2d');
    const img = canvas.getContext('2d').getImageData(0, 0, w, h), d = img.data;
    const bg = background(canvas);
    const lo = 40, hi = 225, span = hi - lo;
    for (let i = 0; i < w * h; i++) {
      const p = i * 4, b = Math.max(bg[p], 40);
      const r = d[p], g = d[p + 1], bl = d[p + 2];
      if (mode === 'sw') {
        const l = (0.299 * r + 0.587 * g + 0.114 * bl) / b;
        let t = (l - 0.70) / 0.22; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const v = t * t * (3 - 2 * t) * 255;
        d[p] = d[p + 1] = d[p + 2] = v;
      } else {
        const m = 255 / b;
        let rr = (r * m - lo) / span * 255, gg = (g * m - lo) / span * 255, bb = (bl * m - lo) / span * 255;
        if (mode === 'grau') { rr = gg = bb = 0.299 * rr + 0.587 * gg + 0.114 * bb; }
        d[p] = rr; d[p + 1] = gg; d[p + 2] = bb;
      }
    }
    ox.putImageData(img, 0, 0);
    return out;
  };

  window.Scan = Scan;
})();
