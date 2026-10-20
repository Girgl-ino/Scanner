// pdf.js: PDF aus JPEG-Seiten, ZIP ohne Kompression, kleine Hilfen
(function () {
  const enc = new TextEncoder();
  const Pack = {};

  // Seitenformat: A4, wenn das Bild ungefähr A4 ist, sonst passend zum Bild (lange Seite 842 pt)
  function pageSize(w, h) {
    const A4 = [595.28, 841.89];
    const ratio = Math.min(w, h) / Math.max(w, h);
    if (Math.abs(ratio - A4[0] / A4[1]) < 0.06) return w <= h ? A4 : [A4[1], A4[0]];
    const k = 841.89 / Math.max(w, h);
    return [+(w * k).toFixed(2), +(h * k).toFixed(2)];
  }

  // pages: [{ jpeg: Uint8Array, w, h }]
  Pack.pdf = function (pages, title) {
    const parts = [];
    const offsets = [];
    let pos = 0;
    const push = (x) => {
      const u = typeof x === 'string' ? enc.encode(x) : x;
      parts.push(u); pos += u.length;
    };
    const obj = (n, body) => { offsets[n] = pos; push(n + ' 0 obj\n' + body + '\nendobj\n'); };

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const n = pages.length;
    // Objekte: 1 Katalog, 2 Seitenbaum, danach je Seite 3 Objekte (Seite, Inhalt, Bild)
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    const kids = pages.map((_, i) => (3 + i * 3) + ' 0 R').join(' ');
    obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + kids + '] >>');
    pages.forEach((p, i) => {
      const pg = 3 + i * 3, ct = pg + 1, im = pg + 2;
      const [pw, ph] = pageSize(p.w, p.h);
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>');
      const content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
      obj(ct, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
      offsets[im] = pos;
      push(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>\nstream\n');
      push(p.jpeg);
      push('\nendstream\nendobj\n');
    });
    const total = 3 + n * 3;
    const xref = pos;
    let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  };

  // ZIP (nur speichern, JPEGs sind bereits komprimiert); files: [{name, data: Uint8Array}]
  let crcTable = null;
  function crc32(u8) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[i] = c >>> 0; }
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  Pack.zip = function (files) {
    const parts = [], central = [];
    let pos = 0;
    files.forEach((f) => {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, pos, true);
      central.push(new Uint8Array(ch.buffer), name);
      parts.push(new Uint8Array(lh.buffer), name, f.data);
      pos += 30 + name.length + size;
    });
    let cl = 0; central.forEach((c) => { cl += c.length; });
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cl, true); end.setUint32(16, pos, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  };

  Pack.bytes = async function (blob) { return new Uint8Array(await blob.arrayBuffer()); };

  Pack.base64 = async function (blob) {
    const u = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };

  Pack.stamp = function () {
    const d = new Date(), p = (v) => String(v).padStart(2, '0');
    return 'Scan_' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  };

  window.Pack = Pack;
})();
