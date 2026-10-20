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
      if (frac < 0.10 || frac > 0.985) continue;
      const q = [tl, tr, br, bl], qa = polyArea(q);
      if (qa < 1) continue;
      const rect = Math.min(1, area / qa);
      const score = rect * rect * Math.sqrt(frac);
      if (!best || score > best.score) best = { score, rect, frac, q };
    }
    return best;
  }

  // ---------- Blattkanten finden: Ergebnis in 0..1 (TL, TR, BR, BL) ----------
  Scan.defaultQuad = function () {
    const m = 0.05;
    return [[m, m], [1 - m, m], [1 - m, 1 - m], [m, 1 - m]];
  };

  Scan.detect = function (canvas) {
    const k = 320 / Math.max(canvas.width, canvas.height);
    const w = Math.max(16, Math.round(canvas.width * k)), h = Math.max(16, Math.round(canvas.height * k));
    const s = document.createElement('canvas'); s.width = w; s.height = h;
    const sx = s.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(canvas, 0, 0, w, h);
    const d = sx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    const b = boxBlur(boxBlur(g, w, h, 2), w, h, 2);
    const th = otsu(b, w * h);
    const light = new Uint8Array(w * h), dark = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { if (b[i] > th) light[i] = 1; else dark[i] = 1; }
    const a = bestBlob(light, w, h), c = bestBlob(dark, w, h);
    let pick = a;
    if (c && (!a || c.score > a.score)) pick = c;
    if (!pick || pick.score < 0.5) return { quad: Scan.defaultQuad(), found: false };
    return { quad: pick.q.map((p) => [p[0] / (w - 1), p[1] / (h - 1)]), found: true };
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
