// Texterkennung im Hintergrund (eigener Thread, damit die App nicht ruckelt)
let api = null, core = null;
async function init() {
  if (api) return;
  importScripts('core.js');
  core = await TesseractCore({});
  const data = new Uint8Array(await (await fetch('deu.traineddata')).arrayBuffer());
  core.FS.writeFile('./deu.traineddata', data);
  api = new core.TessBaseAPI();
  // Nur das neuronale Netz (1), keine Zusatzdateien noetig
  if (api.Init(null, 'deu', 1) !== 0) throw new Error('Init fehlgeschlagen');
  api.SetVariable('tessedit_pageseg_mode', '6');     // ein Block Text
  api.SetVariable('debug_file', '/dev/null');
}
self.onmessage = async (e) => {
  const { id, bytes } = e.data;
  try {
    await init();
    core.FS.writeFile('/input', new Uint8Array(bytes));
    if (api.SetImageFile(1, 0) === 1) throw new Error('Bild nicht lesbar');
    api.Recognize(null);
    self.postMessage({ id, text: api.GetUTF8Text() });
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
