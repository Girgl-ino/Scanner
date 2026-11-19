/* deutsch.js: Deutschtraining (Realschule Bayern, Jahrgangsstufe 5)
   Inhalt: Aufgabenformate und Auswertung, Punkte, Wiederholungslogik (Leitner-Boxen), Wochenplan, Aufgaben von Woche 1.
   Lehrplanbezug: LehrplanPLUS Realschule Bayern, Deutsch Jahrgangsstufe 5, Lernbereich 4 (4.2 Sprachliche Strukturen, 4.3 Richtig schreiben)
   und Lernbereich 3.3 (Texte überarbeiten). Stand der Auswertung: Fachlehrplan Realschule 5 Deutsch, Abruf November 2026. */
(function () {
  'use strict';
  var DT = { VERSION: 1 };
  window.DT = DT;

  DT.INTERVALS = [1, 3, 7, 14, 30];
  DT.PHASES = [
    { k: 1, n: 'Wissen aktivieren', e: '🧠', min: 3, pts: 3 },
    { k: 2, n: 'Rechtschreibung', e: '✏️', min: 7, pts: 7 },
    { k: 3, n: 'Grammatik', e: '🔤', min: 7, pts: 7 },
    { k: 4, n: 'Abschlusstest', e: '🏁', min: 3, pts: 3 }
  ];
  DT.LEVELS = [
    { min: 18, l: 'Sehr sicher', c: 'g1' },
    { min: 15, l: 'Gut', c: 'g2' },
    { min: 11, l: 'Teilweise sicher', c: 'g3' },
    { min: 0, l: 'Weiter üben', c: 'g4' }
  ];
  var LPR = 'D 4.3 Richtig schreiben: Groß- und Kleinschreibung (Artikelprobe, Satzanfang, Nomen)', LPS = 'D 4.2 Sprachliche Strukturen: Wortarten (Nomen, Verb, Adjektiv, Artikel, Pronomen)', LPB = 'D 4.2 Sprachliche Strukturen: Satzglieder, Satzbau, Satzarten';
  function sk(n, a, lp, tip) { return { n: n, a: a, lp: lp, tip: tip }; }
  DT.SKILLS = {
    'gk.nomen': sk('Nomen großschreiben', 'rs', LPR, 'Mach die Artikelprobe: Passt der, die oder das davor? Dann ist es ein Nomen und wird großgeschrieben.'),
    'gk.endung': sk('Nomen an der Endung erkennen', 'rs', LPR, 'Wörter auf -ung, -heit, -keit, -schaft und -nis sind Nomen und werden großgeschrieben.'),
    'gk.satz': sk('Satzanfang und Namen', 'rs', LPR, 'Das erste Wort im Satz und alle Namen schreibt man groß. Nomen auch.'),
    'gk.verbnomen': sk('Verben als Nomen', 'rs', LPR, 'Steht ein Artikel davor (das, beim = bei dem, zum = zu dem), ist das Verb ein Nomen und wird großgeschrieben.'),
    'gk.klein': sk('Verben und Adjektive kleinschreiben', 'rs', LPR, 'Verben und Adjektive schreibt man klein, auch mitten im Satz.'),
    'wa.nomen': sk('Nomen erkennen', 'gr', LPS, 'Nomen benennen Menschen, Tiere, Pflanzen, Dinge und Gefühle. Es passt ein Artikel davor.'),
    'wa.verb': sk('Verben erkennen', 'gr', LPS, 'Verben sagen, was jemand tut oder was geschieht. Sie verändern sich: ich laufe, du läufst.'),
    'wa.adj': sk('Adjektive erkennen', 'gr', LPS, 'Adjektive sagen, wie jemand oder etwas ist: ein kleiner Hund, das Wetter ist schön.'),
    'wa.artikel': sk('Artikel', 'gr', LPS, 'Artikel begleiten das Nomen: der, die, das (bestimmt), ein, eine (unbestimmt). Endungen helfen: die -ung, die -heit, die -keit, die -schaft, das -nis.'),
    'wa.pronomen': sk('Personalpronomen', 'gr', LPS, 'Pronomen stehen für Nomen: der Hund → er, die Blume → sie, das Haus → es, mehrere → sie.'),
    'wa.satz': sk('Wortarten im Satz bestimmen', 'gr', LPS, 'Frage bei jedem Wort: Passt ein Artikel davor (Nomen)? Was tut jemand (Verb)? Wie ist es (Adjektiv)?'),
    'wa.mix': sk('Wörter nach Wortart sortieren', 'gr', LPS, 'Artikelprobe für Nomen, „Was tut jemand?“ für Verben, „Wie ist es?“ für Adjektive.'),
    'sb.verb2': sk('Satzbau: Verb an zweiter Stelle', 'gr', LPB, 'Im Aussagesatz steht das Verb an zweiter Stelle. Du kannst die Satzteile umstellen, das Verb bleibt an Stelle 2.'),
    'sb.zeichen': sk('Satzzeichen am Satzende', 'gr', LPB, 'Aussagesatz: Punkt. Fragesatz: Fragezeichen. Aufforderung oder Ausruf: Ausrufezeichen.'),
    'sb.satzglied': sk('Subjekt und Prädikat', 'gr', LPB, 'Prädikat = das Verb (Was tut er?). Das Subjekt fragst du mit „Wer oder was?“ + Prädikat.')
  };
  var LPR2 = 'D 4.3 Richtig schreiben: Dehnung und Schärfung (Doppelkonsonanten, ck, tz, Doppelvokal, ie, Dehnungs-h)', LPV = 'D 4.2 Sprachliche Strukturen: Verben (Infinitiv, Personalform, Präsens)';
  DT.SKILLS['ds.kurz'] = sk('Doppelkonsonant nach kurzem Vokal', 'rs', LPR2, 'Sprich das Wort in Silben (Was-ser). Steht nach einem kurzen Vokal nur ein Konsonant, verdoppelst du ihn: Wasser, Mutter, kommen.');
  DT.SKILLS['ds.ck'] = sk('ck und tz nach kurzem Vokal', 'rs', LPR2, 'Nach einem kurzen Vokal schreibt man ck statt kk und tz statt zz: Decke, Bäcker, Katze, Mütze.');
  DT.SKILLS['ds.lang'] = sk('Lange Vokale: Doppelvokal, ie, h', 'rs', LPR2, 'Ein langer Vokal wird oft markiert: mit Doppelvokal (Haar, See, Boot), mit ie (Wiese, Tier) oder mit Dehnungs-h (Zahl, Bahn). Nach einem langen Vokal steht kein Doppelkonsonant.');
  DT.SKILLS['ds.stamm'] = sk('Verlängern und Wortstamm', 'rs', LPR2, 'Verlängere das Wort: Hund → Hunde (mit d), Kind → Kinder. Dann hörst du, wie der Wortstamm geschrieben wird.');
  DT.SKILLS['vb.inf'] = sk('Verb: Grundform (Infinitiv)', 'gr', LPV, 'Die Grundform (Infinitiv) endet fast immer auf -en: lachen, singen, spielen. Sie verändert sich nicht.');
  DT.SKILLS['vb.pers'] = sk('Verb: Personalform', 'gr', LPV, 'Das Verb passt sich an: ich lache, du lachst, er lacht, wir lachen, ihr lacht, sie lachen.');
  DT.SKILLS['vb.praes'] = sk('Verb: Präsens bilden', 'gr', LPV, 'Im Präsens hängst du die Endung an den Wortstamm: wohn-e, wohn-st, wohn-t, wohn-en, wohn-t, wohn-en.');
  DT.TYPES = { single: 'Einzelauswahl', multi: 'Mehrfachauswahl', gap: 'Lückentext', text: 'Freie Eingabe', fix: 'Fehlertext korrigieren', assign: 'Zuordnen', order: 'Satzteile ordnen', own: 'Eigener Satz' };

  /* ---------- Hilfsfunktionen ---------- */
  function nrm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function stripEnd(s) { return s.replace(/[.!?…]+$/, '').trim(); }
  DT.nrm = nrm;
  function addDays(ds, n) { var d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); }
  function diffDays(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  DT.addDays = addDays; DT.diffDays = diffDays;

  /* ---------- Aufgabenkatalog ---------- */
  var EX = DT.EX = {};
  var BASEW = { single: 1, multi: 1, gap: 1, text: 1.5, fix: 2, assign: 2, order: 1.5, own: 1.5 };
  function add(o) {
    var s = DT.SKILLS[o.skill];
    if (!s) throw new Error('Skill fehlt: ' + o.skill);
    if (EX[o.id]) throw new Error('doppelte ID ' + o.id);
    o.area = s.a; o.lp = s.lp; o.v = 1; o.diff = o.diff || 1;
    o.hint = o.hint || s.tip;
    o.w = o.w || BASEW[o.t];
    if (!o.sec) o.sec = { single: 40, multi: 55, gap: 45 + 15 * ((o.gaps || []).length || 1), text: 50, fix: 100, assign: 30 + 12 * ((o.items || []).length), order: 60, own: 110 }[o.t];
    EX[o.id] = o;
    return o;
  }
  function S(id, skill, q, opts, sol, expl, o) { return add(Object.assign({ id: id, t: 'single', skill: skill, q: q, opts: opts, sol: sol, expl: expl }, o)); }
  function M(id, skill, q, opts, sol, expl, o) { return add(Object.assign({ id: id, t: 'multi', skill: skill, q: q, opts: opts, sol: sol, expl: expl }, o)); }
  function G(id, skill, q, gaps, expl, o) { return add(Object.assign({ id: id, t: 'gap', skill: skill, q: q, gaps: gaps, expl: expl }, o)); }
  function T(id, skill, q, sol, expl, o) { return add(Object.assign({ id: id, t: 'text', skill: skill, q: q, sol: sol, expl: expl }, o)); }
  function A(id, skill, q, cats, items, expl, o) { return add(Object.assign({ id: id, t: 'assign', skill: skill, q: q, cats: cats, items: items.map(function (x) { return { t: x[0], c: x[1] }; }), expl: expl }, o)); }
  function O(id, skill, q, parts, sols, expl, o) { return add(Object.assign({ id: id, t: 'order', skill: skill, q: q, parts: parts, sols: sols, expl: expl }, o)); }
  function W(id, skill, q, req, expl, o) { return add(Object.assign({ id: id, t: 'own', skill: skill, q: q, req: req, expl: expl }, o)); }
  function F(id, skill, q, wrong, right, expl, o) {
    var a = wrong.split(/\s+/), b = right.split(/\s+/);
    if (a.length !== b.length) throw new Error('Fehlertext ' + id + ': Wortzahl verschieden');
    var errs = []; a.forEach(function (w, i) { if (w !== b[i]) errs.push(i); });
    return add(Object.assign({ id: id, t: 'fix', skill: skill, q: q, tokens: a, right: b, errs: errs, expl: expl }, o));
  }
  var GKL = ['Groß (Nomen)', 'Klein'];
  var WA3 = ['Nomen', 'Verb', 'Adjektiv'];
  var WA4 = ['Artikel', 'Nomen', 'Verb', 'Adjektiv'];
  var ART = ['der', 'die', 'das'];
  var PRO = ['er', 'sie', 'es'];
  var ZEI = ['Punkt (.)', 'Fragezeichen (?)', 'Ausrufezeichen (!)'];

  /* === Montag: Nomen, Satzanfang, Wortarten kennenlernen === */
  S('m01', 'gk.nomen', 'Mach die Artikelprobe. Welches Wort ist ein Nomen?', ['schnell', 'hund', 'springen', 'blau'], 1, 'Man kann „der Hund“ sagen. Darum ist Hund ein Nomen und wird großgeschrieben.');
  S('m02', 'wa.verb', 'Welches Wort ist ein Verb?', ['Fenster', 'laufen', 'grün', 'Schule'], 1, 'Laufen sagt, was jemand tut. Das ist ein Verb.');
  S('m03', 'wa.adj', 'Welches Wort sagt, wie etwas ist (Adjektiv)?', ['Katze', 'lustig', 'rennt', 'der'], 1, 'Lustig sagt, wie jemand ist: eine lustige Katze. Das ist ein Adjektiv.');
  G('m04', 'gk.nomen', 'Schreibe das Wort in Klammern richtig auf. Am Morgen scheint die ___ (sonne) hell.', [['Sonne']], 'Die Sonne: Mit „die“ davor ist es ein Nomen, also großschreiben.');
  G('m05', 'gk.nomen', 'Schreibe die Wörter richtig auf. Der ___ (hund) bellt. Die ___ (katze) schläft.', [['Hund'], ['Katze']], 'Der Hund, die Katze: Nomen mit Artikel schreibt man groß.');
  A('m06', 'gk.nomen', 'Wie schreibt man das Wort? Ordne zu.', GKL, [['tisch', 0], ['rennen', 1], ['freundlich', 1], ['schule', 0], ['bunt', 1], ['apfel', 0]], 'Der Tisch, die Schule, der Apfel sind Nomen (groß). Rennen ist ein Verb, freundlich und bunt sind Adjektive (klein).');
  F('m07', 'gk.satz', 'In diesem Text sind Fehler in der Groß- und Kleinschreibung. Tippe auf ein falsches Wort und verbessere es.', 'Am samstag besucht Max seinen Opa. sie spielen fußball im Garten.', 'Am Samstag besucht Max seinen Opa. Sie spielen Fußball im Garten.', 'Samstag und Fußball sind Nomen. „Sie“ steht am Satzanfang. Alle drei schreibt man groß.');
  T('m08', 'gk.satz', 'Schreibe den Satz richtig auf: am montag spielt anna mit ihrem hund.', ['Am Montag spielt Anna mit ihrem Hund.'], 'Satzanfang, Name (Anna) und Nomen (Montag, Hund) schreibt man groß.', { strict: false });
  A('m09', 'wa.mix', 'Welche Wortart ist das Wort? Ordne zu.', WA3, [['Garten', 0], ['singen', 1], ['klein', 2], ['Buch', 0], ['essen', 1], ['laut', 2]], 'Garten und Buch sind Nomen. Singen und essen sind Verben. Klein und laut sind Adjektive.');
  S('m10', 'wa.artikel', 'Welcher Artikel ist unbestimmt?', ['der', 'die', 'ein', 'das'], 2, '„Ein“ und „eine“ sind unbestimmte Artikel. Der, die und das sind bestimmte Artikel.');
  M('m11', 'wa.nomen', 'Der Hund jagt die Katze durch den Garten. Welche Wörter sind Nomen?', ['Hund', 'jagt', 'Katze', 'Garten'], [0, 2, 3], 'Hund, Katze, Garten: Du kannst „der, die, das“ davor setzen. Jagt ist ein Verb.');
  O('m12', 'sb.verb2', 'Bilde einen Satz. Tippe die Satzteile in der richtigen Reihenfolge an.', ['spielt', 'Der Junge', 'im Garten'], [[1, 0, 2], [2, 0, 1]], 'Das Verb steht an zweiter Stelle: Der Junge spielt im Garten. Oder: Im Garten spielt der Junge.');
  S('m13', 'sb.zeichen', 'Welches Satzzeichen steht am Ende? „Wo wohnst du“', ZEI, 1, 'Das ist eine Frage, also steht ein Fragezeichen.');
  G('m14', 'gk.nomen', 'Schreibe die Wörter richtig auf. Meine ___ (schwester) hat einen ___ (hamster).', [['Schwester'], ['Hamster']], 'Meine Schwester, ein Hamster: Beides sind Nomen und werden großgeschrieben.');
  F('m15', 'gk.satz', 'Verbessere die Fehler in der Groß- und Kleinschreibung.', 'heute regnet es. die kinder bleiben im haus.', 'Heute regnet es. Die Kinder bleiben im Haus.', 'Satzanfänge (Heute, Die) und Nomen (Kinder, Haus) schreibt man groß.');
  W('m16', 'gk.satz', 'Schreibe einen eigenen Satz mit dem Wort „Hund“. Achte auf Großbuchstaben und Satzzeichen.', { words: ['Hund'] }, 'Ein guter Satz beginnt groß, hat ein Verb an zweiter Stelle und endet mit einem Satzzeichen, zum Beispiel: Der Hund spielt im Park.');

  /* === Dienstag: Endungen -ung, -heit, -keit, -schaft, -nis === */
  S('d01', 'gk.endung', 'Welche Endung zeigt dir sicher ein Nomen?', ['-ung', '-en', '-lich', '-ig'], 0, 'Wörter auf -ung sind Nomen (die Wohnung). Auch -heit, -keit, -schaft und -nis zeigen Nomen.');
  S('d02', 'gk.endung', 'Welches Wort muss man großschreiben?', ['freundlich', 'freundschaft', 'fröhlich', 'schnell'], 1, 'Freundschaft endet auf -schaft, das ist ein Nomen. Freundlich, fröhlich und schnell sind Adjektive.');
  S('d03', 'wa.artikel', 'Welcher Artikel passt? ___ Übung', ART, 1, 'Nomen auf -ung haben immer den Artikel „die“: die Übung.');
  G('d04', 'gk.endung', 'Schreibe das Wort richtig auf. Die ___ (wohnung) ist groß.', [['Wohnung']], 'Die Wohnung: endet auf -ung, ist also ein Nomen.');
  G('d05', 'gk.endung', 'Schreibe die Wörter richtig auf. Die ___ (gesundheit) ist wichtig. Auch die ___ (sauberkeit) zählt.', [['Gesundheit'], ['Sauberkeit']], 'Gesundheit (-heit) und Sauberkeit (-keit) sind Nomen.');
  A('d06', 'gk.endung', 'Groß oder klein? Ordne zu.', GKL, [['zeitung', 0], ['lustig', 1], ['krankheit', 0], ['wichtig', 1], ['mannschaft', 0], ['ergebnis', 0]], 'Zeitung, Krankheit, Mannschaft und Ergebnis haben Nomen-Endungen. Lustig und wichtig sind Adjektive.');
  T('d07', 'gk.endung', 'Schreibe mit Artikel richtig auf: die erinnerung', ['die Erinnerung'], 'Erinnerung endet auf -ung und ist ein Nomen.');
  F('d08', 'gk.endung', 'Verbessere die Fehler. Achte auf die Endungen.', 'Die freundschaft von Anna und Ben ist stark. Ihre ehrlichkeit gefällt allen.', 'Die Freundschaft von Anna und Ben ist stark. Ihre Ehrlichkeit gefällt allen.', 'Freundschaft (-schaft) und Ehrlichkeit (-keit) sind Nomen.');
  A('d09', 'wa.artikel', 'Welcher Artikel gehört zum Wort? Ordne zu.', ART, [['Wohnung', 1], ['Ergebnis', 2], ['Freundschaft', 1], ['Garten', 0], ['Krankheit', 1], ['Zeugnis', 2]], 'Auf -ung, -heit, -keit und -schaft folgt „die“. Auf -nis folgt meistens „das“. Der Garten musst du lernen.');
  S('d10', 'wa.nomen', 'Welches Wort ist kein Nomen?', ['Gemeinschaft', 'Wirklichkeit', 'freundlich', 'Erlebnis'], 2, 'Freundlich ist ein Adjektiv. Die anderen drei haben Nomen-Endungen.');
  M('d11', 'wa.adj', 'Der kleine Hund ist sehr müde und freundlich. Welche Wörter sind Adjektive?', ['kleine', 'Hund', 'müde', 'freundlich'], [0, 2, 3], 'Kleine, müde und freundlich sagen, wie der Hund ist. Hund ist ein Nomen.');
  O('d12', 'sb.verb2', 'Bilde einen Satz. Tippe die Satzteile in der richtigen Reihenfolge an.', ['backt', 'Die Oma', 'einen Kuchen'], [[1, 0, 2], [2, 0, 1]], 'Das Verb „backt“ steht an zweiter Stelle.');
  A('d13', 'wa.satz', 'Der kleine Hund bellt. Welche Wortart ist das Wort? Ordne zu.', WA4, [['Der', 0], ['kleine', 3], ['Hund', 1], ['bellt', 2]], 'Der = Artikel, kleine = Adjektiv, Hund = Nomen, bellt = Verb.');
  G('d14', 'gk.endung', 'Schreibe die Wörter richtig auf. Das ___ (zeugnis) ist gut. Die ___ (übung) hat geholfen.', [['Zeugnis'], ['Übung']], 'Zeugnis (-nis) und Übung (-ung) sind Nomen.');
  F('d15', 'gk.satz', 'Verbessere die Fehler.', 'Meine freundin hat morgen geburtstag. wir feiern in der wohnung.', 'Meine Freundin hat morgen Geburtstag. Wir feiern in der Wohnung.', 'Freundin, Geburtstag und Wohnung sind Nomen. „Wir“ steht am Satzanfang.');
  W('d16', 'gk.endung', 'Schreibe einen eigenen Satz mit dem Wort „Gesundheit“.', { words: ['Gesundheit'] }, 'Gesundheit endet auf -heit und ist ein Nomen. Im Satz schreibst du es immer groß.');

  /* === Mittwoch: Verben als Nomen, Pronomen, Satzbau === */
  S('w01', 'gk.verbnomen', 'Welcher Satz ist richtig geschrieben?', ['Beim lesen schlafe ich ein.', 'Beim Lesen schlafe ich ein.', 'beim Lesen schlafe ich ein.'], 1, 'Nach „beim“ (bei dem) wird das Verb zum Nomen: beim Lesen. Der Satzanfang wird auch großgeschrieben.');
  S('w02', 'wa.pronomen', 'Welches Pronomen ersetzt „Die Katze“? ___ schläft.', ['Er', 'Sie', 'Es'], 1, 'Die Katze → sie.');
  S('w03', 'sb.zeichen', 'Welches Satzzeichen passt? „Pass auf, das Auto kommt“', ZEI, 2, 'Das ist ein Ausruf oder eine Warnung. Dort steht ein Ausrufezeichen.', { strict: true });
  G('w04', 'gk.verbnomen', 'Schreibe die Wörter richtig auf. Das ___ (schwimmen) macht Spaß. Beim ___ (laufen) werde ich müde.', [['Schwimmen'], ['Laufen']], 'Nach „das“ und „beim“ sind Verben Nomen. Du schreibst sie groß.');
  A('w05', 'gk.verbnomen', 'Das Wort in Klammern: Groß oder klein? Ordne zu.', GKL, [['Ich möchte morgen (schwimmen).', 1], ['Beim (schwimmen) friere ich.', 0], ['Wir (lachen) laut.', 1], ['Das (lachen) steckt an.', 0]], 'Steht ein Artikel davor (beim, das), schreibt man groß. Sonst bleibt das Verb klein.');
  F('w06', 'gk.verbnomen', 'Verbessere die Fehler.', 'Beim essen darf man nicht streiten. Das lesen macht mir Freude.', 'Beim Essen darf man nicht streiten. Das Lesen macht mir Freude.', 'Beim und das sind Signale: Dahinter wird das Verb großgeschrieben.');
  T('w07', 'gk.verbnomen', 'Schreibe richtig auf: beim wandern', ['beim Wandern'], 'Beim Wandern: „beim“ = bei dem, deshalb ist Wandern ein Nomen.');
  G('w08', 'gk.klein', 'Schreibe die Wörter in Klammern richtig auf. Wir ___ (spielen) heute im Park. Das Wetter ist ___ (schön).', [['spielen'], ['schön']], 'Spielen ist ein Verb, schön ein Adjektiv. Beide schreibt man klein.');
  A('w09', 'wa.pronomen', 'Welches Pronomen ersetzt das Nomen? Ordne zu.', PRO, [['Der Hund', 0], ['Die Lehrerin', 1], ['Das Auto', 2], ['Die Kinder', 1], ['Der Ball', 0], ['Das Haus', 2]], 'Der → er, die → sie, das → es. Mehrere (die Kinder) → sie.');
  G('w10', 'wa.pronomen', 'Setze das passende Pronomen ein. Anna hat Hunger. ___ isst einen Apfel. Der Apfel ist rot. ___ schmeckt süß.', [['Sie'], ['Er']], 'Anna → sie. Der Apfel → er.');
  S('w11', 'sb.verb2', 'Bei welchem Satz steht das Verb an der richtigen Stelle?', ['Heute wir gehen ins Kino.', 'Heute gehen wir ins Kino.', 'Heute ins Kino gehen wir.'], 1, 'Das Verb steht an zweiter Stelle: Heute (1) gehen (2) wir ins Kino.');
  O('w12', 'sb.verb2', 'Bilde einen Satz. Tippe die Satzteile in der richtigen Reihenfolge an.', ['Wir', 'fahren', 'am Samstag', 'zum See'], [[0, 1, 2, 3], [0, 1, 3, 2], [2, 1, 0, 3], [3, 1, 0, 2]], 'Das Verb „fahren“ bleibt an zweiter Stelle, egal womit der Satz beginnt.');
  S('w13', 'sb.satzglied', 'Was ist das Prädikat? „Die Kinder spielen im Garten.“', ['Die Kinder', 'spielen', 'im Garten', 'Garten'], 1, 'Das Prädikat ist das Verb: spielen.');
  G('w14', 'gk.verbnomen', 'Schreibe die Wörter richtig auf. Beim ___ (essen) soll man nicht reden. Wir ___ (essen) gleich.', [['Essen'], ['essen']], 'Nach „beim“ ist es ein Nomen (Essen). Bei „wir essen“ ist es ein Verb (essen).');
  F('w15', 'gk.verbnomen', 'Verbessere die Fehler.', 'Gestern war ich beim zahnarzt. Das warten dauerte lange.', 'Gestern war ich beim Zahnarzt. Das Warten dauerte lange.', 'Zahnarzt ist ein Nomen. Nach „das“ ist Warten ein Nomen.');
  W('w16', 'sb.zeichen', 'Schreibe einen Fragesatz mit dem Wort „Wann“. Vergiss das Fragezeichen nicht.', { words: ['Wann'], end: '?' }, 'Ein Fragesatz beginnt hier mit „Wann“ und endet mit einem Fragezeichen, zum Beispiel: Wann kommst du nach Hause?');

  /* === Donnerstag: Fehler erkennen, korrigieren, erklären === */
  S('t01', 'gk.nomen', 'Welche Schreibweise ist richtig?', ['in die schule', 'in die Schule', 'in Die Schule'], 1, 'Schule ist ein Nomen (die Schule). „die“ ist ein Artikel und bleibt klein.');
  S('t02', 'gk.endung', 'Welches Wort ist richtig geschrieben?', ['Gesundheit', 'gesundheit', 'GesundHeit'], 0, 'Gesundheit endet auf -heit und wird am Anfang großgeschrieben.');
  S('t03', 'wa.verb', 'Welches Wort ist ein Verb?', ['Freude', 'freuen', 'freundlich', 'Freund'], 1, 'Freuen sagt, was man tut. Freude und Freund sind Nomen, freundlich ist ein Adjektiv.');
  F('t04', 'gk.nomen', 'Finde die Fehler und verbessere sie.', 'Im garten blühen blumen. Die kinder sehen einen schmetterling.', 'Im Garten blühen Blumen. Die Kinder sehen einen Schmetterling.', 'Garten, Blumen, Kinder und Schmetterling sind Nomen. Man schreibt sie groß.');
  F('t05', 'gk.endung', 'Finde die Fehler und verbessere sie. Achte auf die Endungen.', 'Die wohnung ist klein, aber die gemütlichkeit ist groß. Unsere nachbarschaft ist freundlich.', 'Die Wohnung ist klein, aber die Gemütlichkeit ist groß. Unsere Nachbarschaft ist freundlich.', 'Wohnung (-ung), Gemütlichkeit (-keit) und Nachbarschaft (-schaft) sind Nomen.');
  M('t06', 'gk.verbnomen', 'Welche Sätze sind richtig geschrieben?', ['Das Singen macht Spaß.', 'Ich mag das singen.', 'Beim Malen höre ich Musik.', 'Wir gehen Schwimmen.'], [0, 2], 'Nach „das“ und „beim“ schreibt man das Verb groß. „Wir gehen schwimmen“ ist ein Verb und wird klein geschrieben.');
  T('t07', 'gk.satz', 'Schreibe richtig auf: heute kommt lena zu besuch.', ['Heute kommt Lena zu Besuch.'], 'Satzanfang, Name und das Nomen Besuch werden großgeschrieben.');
  A('t08', 'gk.klein', 'Das Wort in Klammern: Groß oder klein? Ordne zu.', GKL, [['Wir (laufen) schnell.', 1], ['Der (hund) bellt.', 0], ['Er ist (freundlich).', 1], ['Das (lernen) fällt mir leicht.', 0], ['Sie (lacht) laut.', 1], ['Die (freude) ist groß.', 0]], 'Hund, Lernen und Freude haben einen Artikel davor (groß). Laufen, freundlich und lacht sind Verben oder Adjektive (klein).');
  A('t09', 'wa.satz', 'Die fleißige Schülerin schreibt. Welche Wortart ist das Wort? Ordne zu.', WA4, [['Die', 0], ['fleißige', 3], ['Schülerin', 1], ['schreibt', 2]], 'Die = Artikel, fleißige = Adjektiv, Schülerin = Nomen, schreibt = Verb.');
  G('t10', 'wa.pronomen', 'Setze das passende Pronomen ein. Max und Lisa kommen. ___ bringen Kuchen mit. Das Kind lacht. ___ freut sich.', [['Sie'], ['Es']], 'Max und Lisa → sie (mehrere). Das Kind → es.');
  S('t11', 'sb.satzglied', 'Wer oder was spielt? „Im Park spielen die Kinder Fußball.“ Was ist das Subjekt?', ['Im Park', 'spielen', 'die Kinder', 'Fußball'], 2, 'Frage: Wer oder was spielt? Die Kinder. Das ist das Subjekt.');
  S('t12', 'sb.verb2', 'Warum ist der Satz falsch? „Morgen ich gehe zur Schule.“', ['Das Verb steht nicht an zweiter Stelle.', 'Es fehlt ein Nomen.', 'Es fehlt ein Artikel.'], 0, 'Richtig: Morgen gehe ich zur Schule. Das Verb steht an zweiter Stelle.');
  T('t13', 'sb.verb2', 'Beginne den Satz mit „Am Abend“: Wir gehen am Abend spazieren.', ['Am Abend gehen wir spazieren.'], 'Das Verb bleibt an zweiter Stelle: Am Abend (1) gehen (2) wir spazieren.');
  G('t14', 'gk.endung', 'Schreibe die Wörter richtig auf. Das ___ (erlebnis) war toll. Die ___ (freundschaft) hält.', [['Erlebnis'], ['Freundschaft']], 'Erlebnis (-nis) und Freundschaft (-schaft) sind Nomen.');
  F('t15', 'gk.satz', 'Verbessere die Fehler.', 'am sonntag besucht sophie ihre oma. sie backen einen kuchen.', 'Am Sonntag besucht Sophie ihre Oma. Sie backen einen Kuchen.', 'Satzanfänge, Namen und Nomen werden großgeschrieben.');
  W('t16', 'gk.endung', 'Erkläre in einem Satz: Warum schreibt man „Gesundheit“ groß?', { any: ['Nomen', 'Substantiv', 'Artikel'], minWords: 4, plain: true }, 'Gesundheit ist ein Nomen, man erkennt es an der Endung -heit. Außerdem passt „die“ davor.');

  /* === Freitag: Wochentest === */
  S('f01', 'gk.nomen', 'Welche Gruppe enthält nur Nomen?', ['Haus, Tisch, Garten', 'Haus, laufen, Garten', 'schön, Tisch, Garten'], 0, 'Haus, Tisch und Garten sind Nomen. Laufen ist ein Verb, schön ein Adjektiv.');
  S('f02', 'gk.endung', 'Welche Endung zeigt kein Nomen?', ['-heit', '-keit', '-lich', '-schaft'], 2, 'Auf -lich enden Adjektive (freundlich). Die anderen Endungen gehören zu Nomen.');
  S('f03', 'gk.verbnomen', 'Welcher Satz ist richtig geschrieben?', ['Das Rechnen fällt mir leicht.', 'Das rechnen fällt mir leicht.', 'Das Rechnen Fällt mir leicht.'], 0, 'Nach „das“ ist Rechnen ein Nomen. Fällt ist ein Verb und bleibt klein.');
  G('f04', 'gk.nomen', 'Schreibe die Wörter richtig auf. Die ___ (lehrerin) liest ein ___ (buch) vor.', [['Lehrerin'], ['Buch']], 'Die Lehrerin, ein Buch: Nomen schreibt man groß.');
  G('f05', 'gk.endung', 'Schreibe die Wörter richtig auf. Die ___ (mannschaft) hat ein gutes ___ (ergebnis).', [['Mannschaft'], ['Ergebnis']], 'Mannschaft (-schaft) und Ergebnis (-nis) sind Nomen.');
  F('f06', 'gk.satz', 'Verbessere die Fehler.', 'Am freitag schreibt die klasse einen test. paul ist gut vorbereitet.', 'Am Freitag schreibt die Klasse einen Test. Paul ist gut vorbereitet.', 'Freitag, Klasse und Test sind Nomen. Paul ist ein Name und steht am Satzanfang.');
  T('f07', 'gk.verbnomen', 'Schreibe richtig auf: beim zeichnen', ['beim Zeichnen'], 'Beim Zeichnen: Nach „beim“ ist das Verb ein Nomen.');
  A('f08', 'gk.nomen', 'Groß oder klein? Ordne zu.', GKL, [['wohnung', 0], ['fröhlich', 1], ['übung', 0], ['lachen', 1], ['neuigkeit', 0], ['wichtig', 1]], 'Wohnung, Übung und Neuigkeit sind Nomen. Fröhlich und wichtig sind Adjektive, lachen ist ein Verb.');
  A('f09', 'wa.mix', 'Welche Wortart ist das Wort? Ordne zu.', WA3, [['Freude', 0], ['freuen', 1], ['froh', 2], ['Reise', 0], ['reisen', 1], ['klug', 2]], 'Freude und Reise sind Nomen, freuen und reisen sind Verben, froh und klug sind Adjektive.');
  A('f10', 'wa.pronomen', 'Welches Pronomen ersetzt das Nomen? Ordne zu.', PRO, [['Der Lehrer', 0], ['Die Tasche', 1], ['Das Fenster', 2], ['Der Bus', 0], ['Die Autos', 1], ['Das Mädchen', 2]], 'Der → er, die → sie, das → es. Mehrere → sie. Das Mädchen → es.');
  S('f11', 'wa.artikel', 'Welcher Artikel passt? ___ Ergebnis', ART, 2, 'Nomen auf -nis haben meistens den Artikel „das“: das Ergebnis.');
  O('f12', 'sb.verb2', 'Bilde einen Satz. Tippe die Satzteile in der richtigen Reihenfolge an.', ['Die Kinder', 'spielen', 'nach der Schule', 'Fußball'], [[0, 1, 2, 3], [0, 1, 3, 2], [2, 1, 0, 3], [3, 1, 0, 2]], 'Das Verb spielen steht immer an zweiter Stelle.');
  S('f13', 'sb.satzglied', 'Was ist das Prädikat? „Die Sonne scheint hell.“', ['Die Sonne', 'scheint', 'hell', 'Sonne'], 1, 'Das Prädikat ist das Verb: scheint.');
  F('f14', 'gk.satz', 'Verbessere alle Fehler.', 'Gestern hat lena ihre freundin besucht. sie haben zusammen gespielt und das malen hat ihnen spaß gemacht.', 'Gestern hat Lena ihre Freundin besucht. Sie haben zusammen gespielt und das Malen hat ihnen Spaß gemacht.', 'Lena (Name), Freundin und Spaß (Nomen), Sie (Satzanfang) und Malen (nach „das“) werden großgeschrieben.', { w: 3 });
  G('f15', 'gk.verbnomen', 'Schreibe die Wörter richtig auf. Beim ___ (lesen) vergesse ich die ___ (zeit). Meine ___ (freundin) lacht.', [['Lesen'], ['Zeit'], ['Freundin']], 'Beim Lesen (Verb als Nomen), die Zeit und meine Freundin (Nomen).');
  W('f16', 'gk.verbnomen', 'Schreibe einen Satz mit „beim“ und einem Verb als Nomen, zum Beispiel „Beim Lesen …“.', { any: ['beim', 'Beim'], minWords: 4 }, 'Nach „beim“ schreibt man das Verb groß, zum Beispiel: Beim Backen riecht es gut.');

  /* === Übungspool: Varianten für die Wiederholung === */
  G('x01', 'gk.nomen', 'Schreibe die Wörter richtig auf. Der ___ (tisch) steht im ___ (zimmer).', [['Tisch'], ['Zimmer']], 'Der Tisch, das Zimmer: Nomen werden großgeschrieben.', { pool: 1 });
  S('x02', 'gk.nomen', 'Welche Schreibweise ist richtig? Ich schenke dir ...', ['eine Blume', 'eine blume'], 0, 'Blume ist ein Nomen (die Blume).', { pool: 1 });
  G('x03', 'gk.endung', 'Schreibe die Wörter richtig auf. Die ___ (krankheit) dauert lange. Die ___ (zeitung) liegt auf dem Tisch.', [['Krankheit'], ['Zeitung']], 'Krankheit (-heit) und Zeitung (-ung) sind Nomen.', { pool: 1 });
  T('x04', 'gk.endung', 'Schreibe richtig auf: die wirklichkeit', ['die Wirklichkeit'], 'Wirklichkeit endet auf -keit und ist ein Nomen.', { pool: 1 });
  T('x05', 'gk.satz', 'Schreibe richtig auf: im sommer fährt familie meier nach italien.', ['Im Sommer fährt Familie Meier nach Italien.'], 'Satzanfang, Namen, Orte und Nomen schreibt man groß.', { pool: 1 });
  T('x06', 'gk.verbnomen', 'Schreibe richtig auf: zum kochen', ['zum Kochen'], 'Zum Kochen: „zum“ = zu dem. Danach ist das Verb ein Nomen.', { pool: 1 });
  S('x07', 'gk.verbnomen', 'Welcher Satz ist richtig?', ['Das Tanzen macht Freude.', 'Das tanzen macht Freude.'], 0, 'Nach „das“ schreibt man Tanzen groß.', { pool: 1 });
  G('x08', 'gk.klein', 'Schreibe die Wörter in Klammern richtig auf. Der Hund ___ (rennt) durch den Garten. Er ist sehr ___ (schnell).', [['rennt'], ['schnell']], 'Rennt ist ein Verb und schnell ein Adjektiv. Beide schreibt man klein.', { pool: 1 });
  M('x09', 'wa.nomen', 'Die Lehrerin schreibt einen Satz an die Tafel. Welche Wörter sind Nomen?', ['Lehrerin', 'schreibt', 'Satz', 'Tafel'], [0, 2, 3], 'Lehrerin, Satz und Tafel: Du kannst einen Artikel davorsetzen.', { pool: 1 });
  S('x10', 'wa.verb', 'Der Vogel singt ein Lied. Welches Wort ist das Verb?', ['Vogel', 'singt', 'Lied', 'ein'], 1, 'Singt sagt, was der Vogel tut.', { pool: 1 });
  S('x11', 'wa.adj', 'Die rote Tasche liegt auf dem Stuhl. Welches Wort ist ein Adjektiv?', ['rote', 'Tasche', 'liegt', 'Stuhl'], 0, 'Rote sagt, wie die Tasche ist.', { pool: 1 });
  S('x12', 'wa.artikel', 'Welcher Artikel passt? ___ Gesundheit', ART, 1, 'Nomen auf -heit haben den Artikel „die“.', { pool: 1 });
  G('x13', 'wa.pronomen', 'Setze das passende Pronomen ein. Der Lehrer lacht. ___ erzählt einen Witz.', [['Er']], 'Der Lehrer → er.', { pool: 1 });
  A('x14', 'wa.satz', 'Die große Katze schläft. Welche Wortart ist das Wort? Ordne zu.', WA4, [['Die', 0], ['große', 3], ['Katze', 1], ['schläft', 2]], 'Die = Artikel, große = Adjektiv, Katze = Nomen, schläft = Verb.', { pool: 1 });
  A('x15', 'wa.mix', 'Welche Wortart ist das Wort? Ordne zu.', WA3, [['Tür', 0], ['öffnen', 1], ['leise', 2], ['Stuhl', 0]], 'Tür und Stuhl sind Nomen, öffnen ist ein Verb, leise ist ein Adjektiv.', { pool: 1 });
  S('x16', 'sb.verb2', 'Welcher Satz ist richtig?', ['Am Montag haben wir Sport.', 'Am Montag wir haben Sport.', 'Wir am Montag haben Sport.'], 0, 'Das Verb steht an zweiter Stelle.', { pool: 1 });
  S('x17', 'sb.zeichen', 'Wie endet dieser Satz? „Wie spät ist es“', ZEI, 1, 'Das ist eine Frage: Fragezeichen.', { pool: 1, strict: true });
  S('x18', 'sb.satzglied', 'Wer oder was fängt? „Die Katze fängt eine Maus.“ Was ist das Subjekt?', ['Die Katze', 'fängt', 'eine Maus', 'Maus'], 0, 'Wer fängt? Die Katze. Das ist das Subjekt.', { pool: 1 });
  O('x19', 'sb.verb2', 'Bilde einen Satz. Tippe die Satzteile in der richtigen Reihenfolge an.', ['liest', 'Mein Bruder', 'ein Buch'], [[1, 0, 2], [2, 0, 1]], 'Das Verb steht an zweiter Stelle.', { pool: 1 });


  /* ================= WOCHE 2: Doppelkonsonanten, ck/tz, lange Vokale, Verben ================= */
  var KL = ['kurzer Vokal (Doppelkonsonant)', 'langer Vokal'];
  var END = ['-e', '-st', '-t'];
  var W3 = ['Nomen', 'Verb', 'Adjektiv'];
  /* Montag */
  S('a01', 'ds.kurz', 'Sprich das Wort in Silben: Was-ser. Welches Wort ist richtig geschrieben?', ['Wasser', 'Waser'], 0, 'Nach dem kurzen a folgt nur ein s-Laut. Darum verdoppelt man ihn: Wasser.');
  S('a02', 'ds.kurz', 'Welches Wort hat einen kurzen Vokal?', ['Tür', 'Mutter', 'Hase', 'Wiese'], 1, 'Mut-ter: Das u ist kurz, und danach wird das t verdoppelt. Bei Tür, Hase und Wiese ist der Vokal lang.');
  S('a03', 'ds.kurz', 'Welches Wort ist richtig geschrieben?', ['kommen', 'komen', 'komenn'], 0, 'Kom-men: Nach dem kurzen o wird das m verdoppelt.');
  G('a04', 'ds.kurz', 'Schreibe die Wörter richtig auf. Die ___ (sone) scheint. Meine ___ (muter) kocht.', [['Sonne'], ['Mutter']], 'Son-ne und Mut-ter: Nach dem kurzen Vokal steht ein Doppelkonsonant.');
  G('a05', 'ds.kurz', 'Schreibe die Wörter richtig auf. Ich trinke aus der ___ (tase). Er trägt eine ___ (brile).', [['Tasse'], ['Brille']], 'Tas-se und Bril-le: kurzer Vokal, darum Doppelkonsonant.');
  A('a06', 'ds.kurz', 'Sprich das Wort laut. Ist der Vokal kurz oder lang? Ordne zu.', KL, [['Mutter', 0], ['Hase', 1], ['Tasse', 0], ['Boden', 1], ['Treppe', 0], ['Nase', 1]], 'Bei Mutter, Tasse und Treppe ist der Vokal kurz (Doppelkonsonant). Bei Hase, Boden und Nase ist er lang.');
  F('a07', 'ds.kurz', 'In diesem Text sind Rechtschreibfehler. Finde sie und verbessere sie.', 'Meine Muter hat eine neue Brille. Die Tase steht auf dem Tisch. Wir komen bald.', 'Meine Mutter hat eine neue Brille. Die Tasse steht auf dem Tisch. Wir kommen bald.', 'Mutter, Tasse und kommen haben einen kurzen Vokal. Darum verdoppelst du den Konsonanten.');
  T('a08', 'ds.kurz', 'Schreibe richtig auf: die treppe', ['die Treppe'], 'Trep-pe: kurzer Vokal, darum pp. Treppe ist ein Nomen und wird großgeschrieben.');
  S('a09', 'vb.inf', 'Was ist die Grundform (Infinitiv) von „ich lache“?', ['lachen', 'lache', 'gelacht', 'lachte'], 0, 'Die Grundform endet auf -en: lachen.');
  S('a10', 'vb.inf', 'Die Grundform (Infinitiv) eines Verbs endet fast immer auf ...', ['-en', '-ung', '-lich', '-heit'], 0, 'Verben in der Grundform enden auf -en: spielen, laufen, singen.');
  M('a11', 'vb.inf', 'Welche Wörter sind Verben in der Grundform?', ['spielen', 'Spiel', 'laufen', 'laut'], [0, 2], 'Spielen und laufen sind Verben mit der Endung -en. Spiel ist ein Nomen, laut ein Adjektiv.');
  G('a12', 'vb.pers', 'Setze die richtige Form von „spielen“ ein. Ich ___ Fußball. Du ___ Fußball. Er ___ Fußball.', [['spiele'], ['spielst'], ['spielt']], 'ich spiele, du spielst, er spielt: Die Endung ändert sich mit der Person.');
  A('a13', 'vb.pers', 'Welche Endung hat das Verb? Ordne zu.', END, [['ich lache', 0], ['du lachst', 1], ['er lacht', 2], ['du singst', 1], ['ich renne', 0], ['sie rennt', 2]], 'ich → -e, du → -st, er/sie/es → -t.');
  G('a14', 'ds.kurz', 'Schreibe die Wörter richtig auf. Im ___ (somer) esse ich mit dem ___ (löfel) Eis.', [['Sommer'], ['Löffel']], 'Som-mer und Löf-fel: kurzer Vokal, darum mm und ff.');
  F('a15', 'ds.kurz', 'Finde die Fehler und verbessere sie.', 'Die Kinder renen zum Bett. Der Hund bellt laut und die Muter lacht.', 'Die Kinder rennen zum Bett. Der Hund bellt laut und die Mutter lacht.', 'Ren-nen und Mut-ter haben einen kurzen Vokal. Darum steht ein Doppelkonsonant.');
  W('a16', 'ds.kurz', 'Schreibe einen eigenen Satz mit dem Wort „Mutter“ oder „Sonne“.', { any: ['Mutter', 'Sonne'], minWords: 4 }, 'Beide Wörter haben einen kurzen Vokal und einen Doppelkonsonanten, zum Beispiel: Die Sonne scheint heute.');
  /* Dienstag */
  S('b01', 'ds.ck', 'Nach einem kurzen Vokal schreibt man nicht kk, sondern ...', ['ck', 'kc', 'kg', 'gg'], 0, 'Statt kk schreibt man ck: Decke, Bäcker.');
  S('b02', 'ds.ck', 'Nach einem kurzen Vokal schreibt man nicht zz, sondern ...', ['tz', 'zt', 'zs', 'ss'], 0, 'Statt zz schreibt man tz: Katze, Mütze.');
  S('b03', 'ds.ck', 'Welches Wort ist richtig geschrieben?', ['Hecke', 'Heke', 'Hekke', 'Hecce'], 0, 'Hecke: kurzer Vokal, darum ck.');
  G('b04', 'ds.ck', 'Schreibe die Wörter richtig auf. Die ___ (katze) schläft auf der ___ (deke).', [['Katze'], ['Decke']], 'Kat-ze und Decke: Nach kurzem Vokal tz und ck.');
  G('b05', 'ds.ck', 'Schreibe die Wörter richtig auf. Ich habe Schmerzen im ___ (rüken). Meine ___ (müze) ist warm.', [['Rücken'], ['Mütze']], 'Rü-cken mit ck und Mü-tze mit tz.');
  A('b06', 'ds.ck', 'ck oder tz? Wie wird das Wort richtig geschrieben? Ordne zu.', ['ck', 'tz'], [['Ka__e (miaut)', 1], ['Ba__en (im Ofen)', 0], ['Mü__e (auf dem Kopf)', 1], ['Ro__ (Kleidung)', 0], ['Pla__ (großer Ort)', 1], ['Ste__en (mit einer Nadel)', 0]], 'Katze, Mütze und Platz haben tz. Backen, Rock und Stecken haben ck.');
  T('b07', 'ds.ck', 'Schreibe richtig auf: die pfütze', ['die Pfütze'], 'Pfüt-ze: kurzer Vokal, darum tz. Das Wort ist ein Nomen und wird großgeschrieben.');
  F('b08', 'ds.ck', 'Finde die Fehler und verbessere sie.', 'Die Kaze sitzt auf der Deke. Der Beker hat frische Brötchen.', 'Die Katze sitzt auf der Decke. Der Bäcker hat frische Brötchen.', 'Katze (tz), Decke (ck) und Bäcker (ck): Nach kurzem Vokal schreibt man ck und tz. Bäcker kommt von backen.');
  G('b09', 'vb.pers', 'Setze die richtige Form von „lachen“ ein. Wir ___ laut. Ihr ___ auch. Sie ___ nicht.', [['lachen'], ['lacht'], ['lachen']], 'wir lachen, ihr lacht, sie lachen.');
  S('b10', 'vb.pers', 'Welche Form passt? „Ihr ___ im Garten.“ (spielen)', ['spielen', 'spielt', 'spielst', 'spiele'], 1, 'Zu „ihr“ passt die Endung -t: ihr spielt.');
  A('b11', 'vb.pers', 'Einer oder mehrere? Ordne die Verbform zu.', ['einer (er/sie/es)', 'mehrere (sie)'], [['Der Hund bellt', 0], ['Die Hunde bellen', 1], ['Das Kind lacht', 0], ['Die Kinder lachen', 1], ['Anna singt', 0], ['Anna und Ben singen', 1]], 'Bei einer Person endet das Verb auf -t, bei mehreren auf -en.');
  S('b12', 'sb.satzglied', 'Welches Wort ist das Prädikat? „Die Kinder rennen über die Wiese.“', ['Die Kinder', 'rennen', 'über die Wiese', 'Wiese'], 1, 'Das Prädikat ist das Verb: rennen.');
  G('b13', 'vb.inf', 'Schreibe die Grundform (Infinitiv) auf. ich lache → ___ ; er singt → ___ ; wir spielen → ___', [['lachen'], ['singen'], ['spielen']], 'Die Grundform endet auf -en: lachen, singen, spielen.');
  G('b14', 'ds.ck', 'Schreibe die Wörter richtig auf. Auf dem Kopf trage ich eine ___ (müze). Im Bett liegt eine ___ (deke).', [['Mütze'], ['Decke']], 'Mütze mit tz und Decke mit ck.');
  F('b15', 'ds.ck', 'Finde die Fehler und verbessere sie.', 'Die Muter packt den Zuker in die Tase. Die Katze trinkt Milch.', 'Die Mutter packt den Zucker in die Tasse. Die Katze trinkt Milch.', 'Mutter (tt), Zucker (ck) und Tasse (ss): Nach kurzem Vokal wird verdoppelt oder ck/tz geschrieben.');
  W('b16', 'ds.ck', 'Schreibe einen eigenen Satz mit einem Wort mit ck oder tz.', { any: ['ck', 'tz'], minWords: 4 }, 'Zum Beispiel: Die Katze sitzt auf der Decke.');
  /* Mittwoch */
  S('c01', 'ds.lang', 'Welches Wort ist richtig geschrieben?', ['Schnee', 'Schne'], 0, 'Schnee hat ein langes e. Es wird mit ee markiert.');
  S('c02', 'ds.lang', 'Wie schreibt man ein langes i meistens?', ['ie', 'ih', 'i', 'ii'], 0, 'Ein langes i schreibt man meistens ie: Wiese, Tier, Liebe.');
  S('c03', 'ds.lang', 'Welches Wort schreibt man mit Dehnungs-h?', ['Zahl', 'Ball', 'Mutter', 'Katze'], 0, 'In Zahl ist das a lang. Das h zeigt die Dehnung. Ball, Mutter und Katze haben einen kurzen Vokal.');
  G('c04', 'ds.lang', 'Schreibe die Wörter richtig auf. Im ___ (se) schwimmt ein ___ (bot).', [['See'], ['Boot']], 'See und Boot haben einen langen Vokal, der mit ee und oo geschrieben wird.');
  G('c05', 'ds.lang', 'Schreibe die Wörter richtig auf. Die ___ (wise) ist grün. Das ___ (tir) ist müde.', [['Wiese'], ['Tier']], 'Wiese und Tier haben ein langes i: ie.');
  A('c06', 'ds.lang', 'Wie wird der lange Vokal markiert? Ordne zu.', ['Doppelvokal', 'ie', 'Dehnungs-h'], [['Haar', 0], ['Wiese', 1], ['Zahl', 2], ['Boot', 0], ['Tier', 1], ['Bahn', 2]], 'Haar und Boot: Doppelvokal. Wiese und Tier: ie. Zahl und Bahn: Dehnungs-h.');
  T('c07', 'ds.lang', 'Schreibe richtig auf: das fahrrad', ['das Fahrrad'], 'Fahr-rad: Es kommt von fahren (mit Dehnungs-h) und Rad. Fahrrad ist ein Nomen.');
  F('c08', 'ds.lang', 'Finde die Fehler und verbessere sie.', 'Im Winter liegt Schne auf der Wise. Ein Tir läuft über die Bahn.', 'Im Winter liegt Schnee auf der Wiese. Ein Tier läuft über die Bahn.', 'Schnee (ee), Wiese (ie) und Tier (ie) haben einen langen Vokal.');
  G('c09', 'vb.praes', 'Setze die richtige Form von „wohnen“ ein. Ich ___ in München. Du ___ in Berlin. Er ___ in Hamburg.', [['wohne'], ['wohnst'], ['wohnt']], 'ich wohne, du wohnst, er wohnt.');
  G('c10', 'vb.praes', 'Setze die richtige Form von „wohnen“ ein. Wir ___ am See. Ihr ___ am Fluss. Sie ___ im Dorf.', [['wohnen'], ['wohnt'], ['wohnen']], 'wir wohnen, ihr wohnt, sie wohnen.');
  A('c11', 'wa.mix', 'Welche Wortart ist das Wort? Ordne zu.', W3, [['Wiese', 0], ['wohnen', 1], ['grün', 2], ['Boot', 0], ['lesen', 1], ['nass', 2]], 'Wiese und Boot sind Nomen, wohnen und lesen sind Verben, grün und nass sind Adjektive.');
  S('c12', 'sb.satzglied', 'Was ist das Subjekt? „Auf der Wiese spielen die Kinder.“ Frage: Wer oder was spielt?', ['Auf der Wiese', 'spielen', 'die Kinder'], 2, 'Wer spielt? Die Kinder. Das ist das Subjekt.');
  O('c13', 'sb.verb2', 'Bilde einen Satz. Bringe die Satzteile in eine passende Reihenfolge.', ['wohnt', 'Mein Onkel', 'am See'], [[1, 0, 2], [2, 0, 1]], 'Das Verb steht an zweiter Stelle: Mein Onkel wohnt am See. Oder: Am See wohnt mein Onkel.');
  G('c14', 'ds.lang', 'Schreibe die Wörter richtig auf. Das ___ (boot) fährt über den ___ (se).', [['Boot'], ['See']], 'Boot (oo) und See (ee): Doppelvokale.');
  F('c15', 'ds.lang', 'Finde die Fehler und verbessere sie.', 'Meine Muter wont am Se. Dort gibt es eine große Wise.', 'Meine Mutter wohnt am See. Dort gibt es eine große Wiese.', 'Mutter (kurzer Vokal, tt), wohnt (Dehnungs-h), See (ee) und Wiese (ie).');
  W('c16', 'ds.lang', 'Schreibe einen eigenen Satz mit dem Wort „Wiese“ oder „See“.', { any: ['Wiese', 'See'], minWords: 4 }, 'Zum Beispiel: Am See gibt es eine große Wiese.');
  /* Donnerstag */
  S('e01', 'ds.kurz', 'Welches Wort ist falsch geschrieben?', ['Wasser', 'Mutter', 'Tase', 'Sonne'], 2, 'Richtig heißt es Tasse: kurzer Vokal, darum ss.');
  S('e02', 'gk.nomen', 'Welcher Satz ist richtig geschrieben?', ['Die Mutter kocht Suppe.', 'die Mutter kocht Suppe.', 'Die mutter kocht suppe.'], 0, 'Satzanfang, Mutter und Suppe sind Nomen oder stehen am Satzanfang. Sie werden großgeschrieben.');
  S('e03', 'ds.lang', 'Welches Wort ist falsch geschrieben?', ['Schnee', 'Wiese', 'Tir', 'Boot'], 2, 'Richtig heißt es Tier: langes i mit ie.');
  F('e04', 'ds.lang', 'Finde alle Fehler (Groß- und Kleinschreibung und Doppellaute) und verbessere sie.', 'die Kinder fahren mit dem boot über den see. Die muter sitzt in der sone.', 'Die Kinder fahren mit dem Boot über den See. Die Mutter sitzt in der Sonne.', 'Satzanfang und Nomen schreibt man groß (Die, Boot, See, Mutter, Sonne). Mutter und Sonne haben einen Doppelkonsonanten.');
  F('e05', 'ds.ck', 'Finde die Fehler und verbessere sie.', 'Auf dem Dach sitzt eine katze. Im Garten liegt eine Deke und eine Mütse.', 'Auf dem Dach sitzt eine Katze. Im Garten liegt eine Decke und eine Mütze.', 'Katze ist ein Nomen (groß, tz). Decke hat ck, Mütze hat tz.');
  M('e06', 'ds.kurz', 'Welche Wörter sind richtig geschrieben?', ['Treppe', 'Tasse', 'Brile', 'Mutter', 'Komen'], [0, 1, 3], 'Richtig sind Treppe, Tasse und Mutter. Es heißt Brille und kommen oder Kommen.');
  S('e07', 'ds.stamm', 'Verlängere das Wort: die Hunde. Welche Schreibweise ist richtig?', ['der Hund', 'der Hunt'], 0, 'Bei der Mehrzahl hörst du ein d: Hunde. Darum schreibst du Hund mit d.');
  T('e08', 'ds.stamm', 'Verlängere das Wort (die Kinder) und schreibe richtig auf: das kint', ['das Kind'], 'Die Mehrzahl heißt Kinder mit d. Darum schreibt man Kind mit d. Kind ist ein Nomen.');
  G('e09', 'vb.praes', 'Setze die richtige Form von „kommen“ ein. Ich ___ heute. Du ___ morgen. Er ___ später.', [['komme'], ['kommst'], ['kommt']], 'ich komme, du kommst, er kommt. Der Doppelkonsonant mm bleibt in allen Formen.');
  A('e10', 'vb.pers', 'Welche Endung hat das Verb? Ordne zu.', END, [['ich komme', 0], ['du kommst', 1], ['er kommt', 2], ['du lachst', 1], ['ich wohne', 0], ['sie wohnt', 2]], 'ich → -e, du → -st, er/sie/es → -t.');
  S('e11', 'vb.inf', 'Welche Form ist der Infinitiv?', ['kommen', 'kommt', 'kommst', 'komme'], 0, 'Die Grundform endet auf -en: kommen.');
  M('e12', 'sb.satzglied', 'Das Wetter ist schlecht. Wir bleiben zu Hause. Welche Wörter sind Prädikate?', ['ist', 'Wetter', 'bleiben', 'Hause'], [0, 2], 'Die Prädikate sind die Verben: ist und bleiben.');
  T('e13', 'sb.verb2', 'Beginne den Satz mit „Heute“: Wir wohnen am See.', ['Heute wohnen wir am See.'], 'Das Verb bleibt an zweiter Stelle: Heute (1) wohnen (2) wir am See.');
  G('e14', 'ds.stamm', 'Schreibe die Wörter richtig auf. Der ___ (hunt) bellt. Das ___ (kint) lacht.', [['Hund'], ['Kind']], 'Verlängere: Hunde, Kinder. Dann hörst du das d.');
  F('e15', 'ds.kurz', 'Finde die Fehler und verbessere sie.', 'im Sommer fahren wir an den See. Die Sone scheint und die Kinder baden im Waser.', 'Im Sommer fahren wir an den See. Die Sonne scheint und die Kinder baden im Wasser.', 'Satzanfang großschreiben. Sonne und Wasser haben einen kurzen Vokal und einen Doppelkonsonanten.');
  W('e16', 'ds.kurz', 'Schreibe zwei Sätze. In jedem Satz soll ein Wort mit Doppelkonsonant vorkommen.', { minWords: 6 }, 'Zum Beispiel: Meine Mutter backt Brötchen. Wir kommen bald.');
  /* Freitag: Wochentest */
  S('g01', 'ds.kurz', 'Welches Wort ist richtig geschrieben?', ['Treppe', 'Trepe'], 0, 'Trep-pe: kurzer Vokal, darum pp.');
  S('g02', 'ds.lang', 'Welches Wort ist richtig geschrieben?', ['Schnee', 'Schne'], 0, 'Schnee hat ein langes e mit ee.');
  S('g03', 'ds.ck', 'Welches Wort ist richtig geschrieben?', ['Mütze', 'Mükze', 'Müze'], 0, 'Mütze: kurzer Vokal, darum tz.');
  G('g04', 'ds.kurz', 'Schreibe die Wörter richtig auf. Die ___ (kane) steht auf dem ___ (bret).', [['Kanne'], ['Brett']], 'Kan-ne und Bret-t: kurzer Vokal, Doppelkonsonant.');
  G('g05', 'ds.ck', 'Schreibe die Wörter richtig auf. Der ___ (beker) trägt eine ___ (müze).', [['Bäcker'], ['Mütze']], 'Bäcker mit ck, Mütze mit tz. Bäcker kommt von backen.');
  G('g06', 'ds.lang', 'Schreibe die Wörter richtig auf. Auf der ___ (wise) liegt ___ (schne).', [['Wiese'], ['Schnee']], 'Wiese (ie) und Schnee (ee): lange Vokale.');
  A('g07', 'ds.lang', 'Welche Schreibung hat das Wort? Ordne zu.', ['Doppelkonsonant', 'ck oder tz', 'langer Vokal'], [['Tasse', 0], ['Decke', 1], ['Wiese', 2], ['Mutter', 0], ['Katze', 1], ['Zahl', 2]], 'Tasse und Mutter: Doppelkonsonant. Decke und Katze: ck und tz. Wiese und Zahl: langer Vokal.');
  F('g08', 'ds.kurz', 'Finde alle Fehler und verbessere sie.', 'die Muter und das Kint spielen auf der Wise. Dort liegt eine Deke.', 'Die Mutter und das Kind spielen auf der Wiese. Dort liegt eine Decke.', 'Satzanfang und Nomen groß. Mutter (tt), Kind (d), Wiese (ie), Decke (ck).', { w: 3 });
  G('g09', 'vb.pers', 'Setze die richtige Form von „wohnen“ ein. Ich ___ hier. Du ___ dort. Wir ___ zusammen. Ihr ___ nebenan.', [['wohne'], ['wohnst'], ['wohnen'], ['wohnt']], 'ich wohne, du wohnst, wir wohnen, ihr wohnt.');
  A('g10', 'wa.mix', 'Welche Wortart ist das Wort? Ordne zu.', W3, [['Mutter', 0], ['kommen', 1], ['laut', 2], ['Katze', 0], ['spielen', 1], ['müde', 2]], 'Mutter und Katze sind Nomen, kommen und spielen sind Verben, laut und müde sind Adjektive.');
  S('g11', 'vb.inf', 'Wie lautet die Grundform (Infinitiv) von „du lachst“?', ['lachen', 'lachst', 'lacht', 'gelacht'], 0, 'Die Grundform endet auf -en: lachen.');
  O('g12', 'sb.verb2', 'Bilde einen Satz. Bringe die Satzteile in eine passende Reihenfolge.', ['sitzt', 'Die Katze', 'auf der Decke'], [[1, 0, 2], [2, 0, 1]], 'Das Verb sitzt steht an zweiter Stelle.');
  S('g13', 'sb.satzglied', 'Was ist das Prädikat? „Die Kinder wohnen am See.“', ['Die Kinder', 'wohnen', 'am See', 'See'], 1, 'Das Prädikat ist das Verb: wohnen.');
  F('g14', 'ds.kurz', 'Finde alle Fehler und verbessere sie.', 'gestern sind wir mit dem Boot über den Se gefahren. Die Sone schien und meine Muter hat Kakao in der Tase gebracht.', 'Gestern sind wir mit dem Boot über den See gefahren. Die Sonne schien und meine Mutter hat Kakao in der Tasse gebracht.', 'Satzanfang groß. See (ee), Sonne, Mutter und Tasse haben Doppelkonsonanten oder Doppelvokale.', { w: 3 });
  G('g15', 'ds.stamm', 'Schreibe die Wörter richtig auf. Die ___ (katze) sitzt auf der ___ (wise). Der ___ (hunt) rennt.', [['Katze'], ['Wiese'], ['Hund']], 'Katze (tz), Wiese (ie), Hund (verlängern: Hunde).');
  W('g16', 'ds.kurz', 'Schreibe einen Satz mit einem Wort mit Doppelkonsonant und einem Wort mit ie.', { minWords: 6 }, 'Zum Beispiel: Die Katze liegt auf der Wiese.');
  /* Pool Woche 2 */
  G('y01', 'ds.kurz', 'Schreibe die Wörter richtig auf. Am ___ (himel) steht die ___ (sone).', [['Himmel'], ['Sonne']], 'Him-mel und Son-ne: kurzer Vokal, Doppelkonsonant.', { pool: 1 });
  S('y02', 'ds.kurz', 'Welches Wort ist richtig geschrieben?', ['Zimmer', 'Zimer'], 0, 'Zim-mer: kurzer Vokal, darum mm.', { pool: 1 });
  T('y03', 'ds.ck', 'Schreibe richtig auf: die ecke', ['die Ecke'], 'Ecke mit ck, denn der Vokal ist kurz. Es ist ein Nomen.', { pool: 1 });
  S('y04', 'ds.ck', 'Welches Wort ist richtig geschrieben?', ['Glück', 'Glük', 'Glütz'], 0, 'Glück: kurzer Vokal, darum ck.', { pool: 1 });
  G('y05', 'ds.lang', 'Schreibe die Wörter richtig auf. Ich trinke ___ (te). Der Zug fährt auf der ___ (ban).', [['Tee'], ['Bahn']], 'Tee (ee) und Bahn (Dehnungs-h).', { pool: 1 });
  S('y06', 'ds.lang', 'Welches Wort ist richtig geschrieben?', ['Uhr', 'Ur', 'Uhhr'], 0, 'Uhr mit Dehnungs-h.', { pool: 1 });
  S('y07', 'ds.stamm', 'Verlängere (die Berge). Welche Schreibweise ist richtig?', ['der Berg', 'der Berk'], 0, 'Bei Berge hörst du ein g. Darum schreibst du Berg mit g.', { pool: 1 });
  T('y08', 'ds.stamm', 'Verlängere (die Hände) und schreibe richtig auf: die hant', ['die Hand'], 'Bei Hände hörst du ein d. Darum schreibst du Hand mit d.', { pool: 1 });
  S('y09', 'vb.inf', 'Welche Grundform gehört zu „sie singt“?', ['singen', 'singt', 'sang', 'gesungen'], 0, 'Die Grundform endet auf -en: singen.', { pool: 1 });
  G('y10', 'vb.pers', 'Setze die richtige Form von „spielen“ ein. Du ___ gut. Er ___ auch.', [['spielst'], ['spielt']], 'du spielst, er spielt.', { pool: 1 });
  G('y11', 'vb.praes', 'Setze die richtige Form von „singen“ ein. Wir ___ ein Lied. Ihr ___ laut.', [['singen'], ['singt']], 'wir singen, ihr singt.', { pool: 1 });
  A('y12', 'vb.pers', 'Welche Endung hat das Verb? Ordne zu.', END, [['ich singe', 0], ['du singst', 1], ['er singt', 2], ['ich renne', 0], ['du rennst', 1], ['sie rennt', 2]], 'ich → -e, du → -st, er/sie/es → -t.', { pool: 1 });

  /* ---------- Lernwortschatz Woche 1 ---------- */
  DT.WORDS = [
    ['Hund', 'Nomen', 'der Hund: Artikelprobe'], ['Sonne', 'Nomen', 'die Sonne: Artikelprobe'], ['Wohnung', 'Nomen', 'Endung -ung'],
    ['Übung', 'Nomen', 'Endung -ung'], ['Erinnerung', 'Nomen', 'Endung -ung'], ['Zeitung', 'Nomen', 'Endung -ung'],
    ['Gesundheit', 'Nomen', 'Endung -heit'], ['Krankheit', 'Nomen', 'Endung -heit'], ['Sauberkeit', 'Nomen', 'Endung -keit'],
    ['Ehrlichkeit', 'Nomen', 'Endung -keit'], ['Wirklichkeit', 'Nomen', 'Endung -keit'], ['Gemütlichkeit', 'Nomen', 'Endung -keit'],
    ['Freundschaft', 'Nomen', 'Endung -schaft'], ['Mannschaft', 'Nomen', 'Endung -schaft'], ['Nachbarschaft', 'Nomen', 'Endung -schaft'],
    ['Ergebnis', 'Nomen', 'Endung -nis'], ['Zeugnis', 'Nomen', 'Endung -nis'], ['Erlebnis', 'Nomen', 'Endung -nis'],
    ['Lesen', 'Verb als Nomen', 'beim/das + Verb'], ['Schwimmen', 'Verb als Nomen', 'das + Verb'], ['Laufen', 'Verb als Nomen', 'beim + Verb'],
    ['Essen', 'Verb als Nomen', 'beim + Verb'], ['Wandern', 'Verb als Nomen', 'beim + Verb'], ['Zeichnen', 'Verb als Nomen', 'beim + Verb'],
    ['Kochen', 'Verb als Nomen', 'zum + Verb'], ['Freundin', 'Nomen', 'Endung -in'], ['Geburtstag', 'Nomen', 'Artikelprobe'], ['Schmetterling', 'Nomen', 'Artikelprobe']
  ].map(function (x) { return { w: x[0], cat: x[1], rule: x[2] }; });
  DT.WORDMAP = {};
  DT.WORDS.forEach(function (x) { DT.WORDMAP[x.w] = x; });


  var W2W = [['Mutter','Doppelkonsonant','tt nach kurzem u'],['Wasser','Doppelkonsonant','ss nach kurzem a'],['Tasse','Doppelkonsonant','ss nach kurzem a'],['Brille','Doppelkonsonant','ll nach kurzem i'],['Treppe','Doppelkonsonant','pp nach kurzem e'],['Sommer','Doppelkonsonant','mm nach kurzem o'],['Löffel','Doppelkonsonant','ff nach kurzem ö'],['Himmel','Doppelkonsonant','mm nach kurzem i'],['Kanne','Doppelkonsonant','nn nach kurzem a'],['Brett','Doppelkonsonant','tt nach kurzem e'],['Katze','tz','tz statt zz'],['Mütze','tz','tz statt zz'],['Pfütze','tz','tz statt zz'],['Decke','ck','ck statt kk'],['Bäcker','ck','ck statt kk, von backen'],['Rücken','ck','ck statt kk'],['Zucker','ck','ck statt kk'],['Ecke','ck','ck statt kk'],['Haar','langer Vokal','Doppelvokal aa'],['See','langer Vokal','Doppelvokal ee'],['Boot','langer Vokal','Doppelvokal oo'],['Schnee','langer Vokal','Doppelvokal ee'],['Tee','langer Vokal','Doppelvokal ee'],['Wiese','langer Vokal','langes i = ie'],['Tier','langer Vokal','langes i = ie'],['Zahl','langer Vokal','Dehnungs-h'],['Bahn','langer Vokal','Dehnungs-h'],['Fahrrad','langer Vokal','Dehnungs-h (fahren)'],['Uhr','langer Vokal','Dehnungs-h'],['Kind','Verlängern','Kinder mit d'],['Berg','Verlängern','Berge mit g'],['Hand','Verlängern','Hände mit d']];
  W2W.forEach(function (x) { if (!DT.WORDMAP[x[0]]) { var o = { w: x[0], cat: x[1], rule: x[2] }; DT.WORDS.push(o); DT.WORDMAP[x[0]] = o; } });

  /* ---------- Wochenplan ---------- */
  function ids(s) { return s.split(' '); }
  function day(title, focus, p1, p2, p3, p4) { return { title: title, focus: focus, p: [ids(p1), ids(p2), ids(p3), ids(p4)] }; }
  DT.WEEKS = [{
    n: 1, ready: true, title: 'Groß- und Kleinschreibung, Wortarten',
    ziel: 'Nomen sicher erkennen und großschreiben, die Wortarten Nomen, Verb und Adjektiv unterscheiden, das Verb an zweiter Stelle im Satz verwenden.',
    rs: 'Nomen großschreiben, Endungen -ung, -heit, -keit, -schaft, -nis, Verben als Nomen, Satzanfang und Namen',
    gr: 'Nomen, Verb, Adjektiv, Artikel, Personalpronomen, Verb an zweiter Stelle, Satzzeichen, Subjekt und Prädikat',
    words: DT.WORDS.map(function (x) { return x.w; }),
    days: [
      day('Neue Regeln: Nomen und Wortarten', 'Neue Regeln', 'm01 m02 m03', 'm04 m05 m06 m07 m08', 'm09 m10 m11 m12 m13', 'm14 m15 m16'),
      day('Endungen erkennen', 'Anwenden und festigen', 'd01 d02 d03', 'd04 d05 d06 d07 d08', 'd09 d10 d11 d12 d13', 'd14 d15 d16'),
      day('Verben als Nomen, Pronomen, Satzbau', 'Vertiefen', 'w01 w02 w03', 'w04 w05 w06 w07 w08', 'w09 w10 w11 w12 w13', 'w14 w15 w16'),
      day('Fehler finden und erklären', 'Fehler erkennen und korrigieren', 't01 t02 t03', 't04 t05 t06 t07 t08', 't09 t10 t11 t12 t13', 't14 t15 t16'),
      day('Wochentest', 'Test und Wiederholung', 'f01 f02 f03', 'f04 f05 f06 f07 f08', 'f09 f10 f11 f12 f13', 'f14 f15 f16')
    ]
  }];
  DT.WEEKS.push({
    n: 2, ready: true, title: 'Doppelkonsonanten, ck und tz, lange Vokale',
    ziel: 'Sicher entscheiden, wann ein Konsonant verdoppelt wird (kurzer Vokal), wann ck und tz stehen und wie lange Vokale geschrieben werden (Doppelvokal, ie, Dehnungs-h). Außerdem die Verbformen ich, du, er, wir, ihr, sie bilden.',
    rs: 'Doppelkonsonanten nach kurzem Vokal, ck und tz, Doppelvokal, ie, Dehnungs-h, Verlängern (Hund, Kind)',
    gr: 'Verben: Grundform, Personalform, Präsens; Prädikat und Subjekt',
    words: W2W.map(function (x) { return x[0]; }),
    days: [
      day('Kurz oder lang? Doppelkonsonanten', 'Neue Regeln', 'a01 a02 a03', 'a04 a05 a06 a07 a08', 'a09 a10 a11 a12 a13', 'a14 a15 a16'),
      day('ck und tz', 'Anwenden und festigen', 'b01 b02 b03', 'b04 b05 b06 b07 b08', 'b09 b10 b11 b12 b13', 'b14 b15 b16'),
      day('Lange Vokale: ee, oo, ie, h', 'Vertiefen', 'c01 c02 c03', 'c04 c05 c06 c07 c08', 'c09 c10 c11 c12 c13', 'c14 c15 c16'),
      day('Fehler finden und verbessern', 'Fehler erkennen und korrigieren', 'e01 e02 e03', 'e04 e05 e06 e07 e08', 'e09 e10 e11 e12 e13', 'e14 e15 e16'),
      day('Wochentest', 'Test und Wiederholung', 'g01 g02 g03', 'g04 g05 g06 g07 g08', 'g09 g10 g11 g12 g13', 'g14 g15 g16')
    ]
  });
  var NEXT = [
    [3, 'Wortfamilien, Wortstamm, Vor- und Nachsilben (ver-, vor-), zusammengesetzte Nomen', 'Satzglieder: Subjekt und Prädikat, Umstellprobe und Ersatzprobe'],
    [4, 'S-Laute (s, ss, ß) und das oder dass', 'Zeitformen: Präteritum und Perfekt (Partizip II, unregelmäßige Verben)'],
    [5, 'Ableiten (ä/e, äu/eu), Stammprinzip, englische Fremdwörter', 'Adjektive steigern, Fälle (Nominativ, Akkusativ, Dativ), Objekte, Artikel und Zahlwörter'],
    [6, 'Wörtliche Rede und ihre Satzzeichen, Anredeform, Wörterbuch benutzen', 'Pronomen (persönlich, besitzanzeigend), Adverbien, Adverbiale des Ortes und der Zeit'],
    [7, 'Komma bei Aufzählungen, Satzreihen und einfachen Satzgefügen', 'Hauptsatz und Nebensatz, Konjunktionen, Relativpronomen, Plusquamperfekt, Futur I'],
    [8, 'Wiederholung: persönliche Fehlerschwerpunkte, Texte überarbeiten', 'Wiederholung aller Grammatikthemen']
  ];
  NEXT.forEach(function (x) { DT.WEEKS.push({ n: x[0], ready: false, title: x[1], rs: x[1], gr: x[2], days: [] }); });


  /* Regelkarte (Schülerseite, zum Nachschlagen) */
  DT.RULES = [
    { t: 'Groß oder klein?', r: [
      'Nomen schreibt man groß. Probe: Passt der, die oder das davor? (der Hund, die Schule)',
      'Das erste Wort im Satz und alle Namen schreibt man groß.',
      'Endungen -ung, -heit, -keit, -schaft und -nis zeigen Nomen: Wohnung, Gesundheit, Freundschaft, Ergebnis.',
      'Verben als Nomen: Steht ein Artikel davor (das, beim, zum), schreibt man groß: das Lesen, beim Essen.',
      'Verben und Adjektive schreibt man klein: spielen, schön, freundlich.'
    ] },
    { t: 'Doppelte Konsonanten', r: [
      'Sprich das Wort in Silben: Was-ser, Mut-ter.',
      'Steht nach einem kurzen Vokal nur ein Konsonant, wird er verdoppelt: kommen, Tasse, Treppe.',
      'Statt kk schreibt man ck, statt zz schreibt man tz: Decke, Bäcker, Katze, Mütze.',
      'Nach einem langen Vokal verdoppelt man nicht: Hase, Boden, Nase.',
      'Stehen nach dem kurzen Vokal zwei verschiedene Konsonanten, verdoppelt man nichts: Hund, Wand.'
    ] },
    { t: 'Lange Vokale', r: [
      'Doppelvokal: aa, ee, oo (Haar, See, Boot).',
      'ie für ein langes i: Wiese, Tier, Liebe.',
      'Dehnungs-h: Zahl, Bahn, Uhr, wohnen.',
      'Verlängern hilft: Hund (Hunde), Kind (Kinder), Berg (Berge).'
    ] }
  ];

  /* Selbsttest des Katalogs: alle Aufgaben des Plans vorhanden, Lösungen sinnvoll */
  DT.validate = function () {
    var errs = [];
    Object.keys(EX).forEach(function (id) {
      var e = EX[id];
      if (!e.expl) errs.push(id + ': Erklärung fehlt');
      if (e.t === 'single' && !(e.sol >= 0 && e.sol < e.opts.length)) errs.push(id + ': Lösung');
      if (e.t === 'multi' && !(e.sol.length && e.sol.every(function (i) { return i >= 0 && i < e.opts.length; }))) errs.push(id + ': Lösung');
      if (e.t === 'gap') { var n = (e.q.match(/___/g) || []).length; if (n !== e.gaps.length) errs.push(id + ': Lückenzahl ' + n + '/' + e.gaps.length); }
      if (e.t === 'assign' && !e.items.every(function (x) { return x.c >= 0 && x.c < e.cats.length; })) errs.push(id + ': Zuordnung');
      if (e.t === 'order') e.sols.forEach(function (s) { if (s.slice().sort().join() !== e.parts.map(function (_, i) { return i; }).join()) errs.push(id + ': Reihenfolge'); });
    });
    DT.WEEKS.forEach(function (w) { w.days.forEach(function (d, di) { d.p.forEach(function (l, pi) { l.forEach(function (id) { if (!EX[id]) errs.push('W' + w.n + ' T' + (di + 1) + ': ' + id + ' fehlt'); }); }); }); });
    return errs;
  };

  /* ---------- Auswertung ---------- */
  function wordsIn(s) { return nrm(s).split(/[\s,.;:!?()„“"]+/).filter(Boolean); }
  /* Rückgabe: { f: 0..1, ok, msg, review, words: {Wort: true/false} } */
  DT.grade = function (ex, ans) {
    var r = { f: 0, ok: false, msg: '', review: false, words: {} };
    var i;
    function wmark(sol, good) { var m = DT.WORDMAP[sol]; if (m) r.words[sol] = !!good; }
    if (ans == null) return r;
    if (ex.t === 'single') { r.f = ans === ex.sol ? 1 : 0; }
    else if (ex.t === 'multi') {
      var a = Array.isArray(ans) ? ans : [], good = 0, bad = 0;
      a.forEach(function (x) { if (ex.sol.indexOf(x) >= 0) good++; else bad++; });
      r.f = Math.max(0, (good - bad) / ex.sol.length);
    }
    else if (ex.t === 'gap') {
      var g = Array.isArray(ans) ? ans : [], okc = 0, near = 0;
      ex.gaps.forEach(function (acc, k) {
        var v = nrm(g[k]), hit = acc.some(function (s) { return s === v; });
        if (hit) okc++; else if (acc.some(function (s) { return s.toLowerCase() === v.toLowerCase(); })) near++;
        acc.forEach(function (s) { wmark(s, hit); });
      });
      r.f = okc / ex.gaps.length;
      if (near) r.msg = 'Fast: Achte auf Groß- und Kleinschreibung.';
    }
    else if (ex.t === 'text') {
      var v = nrm(ans), cmp = function (x) { return ex.strict ? x : stripEnd(x); };
      var hit = ex.sol.some(function (s) { return cmp(s) === cmp(v); });
      var near = !hit && ex.sol.some(function (s) { return cmp(s).toLowerCase() === cmp(v).toLowerCase(); });
      r.f = hit ? 1 : 0;
      if (near) r.msg = 'Fast: Achte auf Groß- und Kleinschreibung.';
      ex.sol.forEach(function (s) { wordsIn(s).forEach(function (w) { if (DT.WORDMAP[w]) r.words[w] = hit || r.words[w] === true; }); });
    }
    else if (ex.t === 'assign') {
      var c = 0; ex.items.forEach(function (it, k) { if (ans[k] === it.c) c++; });
      r.f = c / ex.items.length;
    }
    else if (ex.t === 'fix') {
      var tk = Array.isArray(ans) ? ans : [], fixed = 0, wrong = 0;
      function core(s) { return nrm(s).replace(/[.!?,;:]+$/, ''); }
      ex.tokens.forEach(function (t, k) {
        var given = tk[k] == null ? t : tk[k], right = ex.right[k];
        if (ex.errs.indexOf(k) >= 0) { if (core(given) === core(right)) fixed++; }
        else if (core(given) !== core(t)) wrong++;
      });
      r.f = Math.max(0, (fixed - wrong) / ex.errs.length);
      r.fixed = fixed; r.wrongChanges = wrong;
      ex.errs.forEach(function (k) { var rw = core(ex.right[k]); if (DT.WORDMAP[rw]) r.words[rw] = core(tk[k] == null ? ex.tokens[k] : tk[k]) === rw; });
    }
    else if (ex.t === 'order') {
      var sel = Array.isArray(ans) ? ans : [];
      r.f = ex.sols.some(function (s) { return s.length === sel.length && s.every(function (x, k) { return x === sel[k]; }); }) ? 1 : 0;
    }
    else if (ex.t === 'own') {
      var s = nrm(ans), rq = ex.req || {}, ws = wordsIn(s), checks = [], notes = [];
      var min = rq.minWords || 4;
      checks.push(ws.length >= min); if (!checks[0]) notes.push('Schreibe mindestens ' + min + ' Wörter.');
      if (!rq.plain) {
        var c1 = /^[A-ZÄÖÜ]/.test(s); checks.push(c1); if (!c1) notes.push('Der Satz beginnt mit einem Großbuchstaben.');
        var c2 = rq.end ? s.slice(-1) === rq.end : /[.!?]$/.test(s); checks.push(c2); if (!c2) notes.push(rq.end ? 'Am Ende fehlt das Zeichen ' + rq.end : 'Am Ende fehlt ein Satzzeichen.');
      }
      (rq.words || []).forEach(function (w) { var h = ws.some(function (x) { return x.toLowerCase() === w.toLowerCase(); }); checks.push(h); if (!h) notes.push('Das Wort „' + w + '“ fehlt.'); });
      if (rq.words) rq.words.forEach(function (w) { if (ws.indexOf(w) < 0 && ws.some(function (x) { return x.toLowerCase() === w.toLowerCase(); })) { checks.push(false); notes.push('Schreibe „' + w + '“ richtig (Groß-/Kleinschreibung).'); } });
      if (rq.any) { var h2 = rq.any.some(function (w) { return ws.some(function (x) { return x.toLowerCase().indexOf(w.toLowerCase()) >= 0; }); }); checks.push(h2); if (!h2) notes.push('Benutze eines der Wörter: ' + rq.any.join(', ') + '.'); }
      var n = checks.filter(Boolean).length;
      r.f = checks.length ? n / checks.length : 0; r.review = true; r.msg = notes.join(' ');
      (rq.words || []).forEach(function (w) { if (DT.WORDMAP[w]) r.words[w] = ws.indexOf(w) >= 0; });
    }
    r.ok = r.f >= 0.999;
    return r;
  };

  /* Korrekte Lösung als Text (für die Rückmeldung) */
  DT.solutionText = function (ex) {
    if (ex.t === 'single') return ex.opts[ex.sol];
    if (ex.t === 'multi') return ex.sol.map(function (i) { return ex.opts[i]; }).join(', ');
    if (ex.t === 'gap') return ex.gaps.map(function (g) { return g[0]; }).join(' · ');
    if (ex.t === 'text') return ex.sol[0];
    if (ex.t === 'assign') return ex.items.map(function (it) { return it.t + ' → ' + ex.cats[it.c]; }).join(' · ');
    if (ex.t === 'fix') return ex.right.join(' ');
    if (ex.t === 'order') return ex.sols[0].map(function (i) { return ex.parts[i]; }).join(' ');
    return '';
  };

  /* ---------- Punkte und Niveau ---------- */
  /* res: [{id, ph, f, h(1=Hinweis genutzt)}], units: Liste der geplanten Aufgaben [{id, ph}] */
  DT.points = function (units, res) {
    var byId = {}; res.forEach(function (r) { byId[r.id + '|' + r.ph] = r; });
    var total = 0, per = [0, 0, 0, 0];
    DT.PHASES.forEach(function (p, pi) {
      var us = units.filter(function (u) { return u.ph === p.k; });
      var sw = 0; us.forEach(function (u) { sw += EX[u.id].w; });
      var got = 0;
      us.forEach(function (u) { var r = byId[u.id + '|' + u.ph]; if (r) got += EX[u.id].w * r.f * (r.h ? 0.7 : 1); });
      per[pi] = sw ? p.pts * got / sw : 0; total += per[pi];
    });
    return { total: Math.round(total * 10) / 10, per: per, rounded: Math.round(total) };
  };
  DT.level = function (pts) { var p = Math.round(pts); for (var i = 0; i < DT.LEVELS.length; i++) if (p >= DT.LEVELS[i].min) return DT.LEVELS[i]; return DT.LEVELS[3]; };

  /* ---------- Wiederholung (Leitner-Boxen, Ausgangsintervalle einstellbar) ---------- */
  function boxStep(s, f, today, iv) {
    s = s ? { b: s.b | 0, n: s.n | 0, k: s.k | 0, e: s.e | 0, le: s.le || '', d: s.d || '' } : { b: 0, n: 0, k: 0, e: 0, le: '', d: '' };
    s.n++;
    if (f >= 0.999) { s.k++; s.b = Math.min(iv.length - 1, s.b + 1); }
    else if (f >= 0.5) { s.e++; s.le = today; }
    else { s.e++; s.le = today; s.b = 0; }
    s.d = addDays(today, iv[s.b]);
    return s;
  }
  /* Lernstand nach einer Aufgabe aktualisieren; r = Ergebnis aus grade() */
  DT.applyResult = function (st, ex, r, today, iv) {
    iv = iv || DT.INTERVALS;
    st.srs = st.srs || {}; st.words = st.words || {}; st.errors = st.errors || {};
    st.srs[ex.skill] = boxStep(st.srs[ex.skill], r.f, today, iv);
    if (r.f < 0.999) st.errors[ex.skill] = (st.errors[ex.skill] || 0) + 1;
    Object.keys(r.words || {}).forEach(function (w) { st.words[w] = boxStep(st.words[w], r.words[w] ? 1 : 0, today, iv); });
  };
  /* Ziel: dauerhaft Niveau "2" (ca. 80 % richtig), erst dann gilt eine Fertigkeit als gefestigt, kommt aber in langen Abständen immer wieder */
  DT.TARGET = 0.8;
  DT.skillAcc = function (s) { return s && s.n ? s.k / s.n : 0; };
  DT.skillMastered = function (s) { return !!s && s.b >= 3 && s.k >= 3 && DT.skillAcc(s) >= DT.TARGET; };
  /* Auswahl für Wiederholung über ALLE bisher geübten Fertigkeiten: fällige zuerst, dann unter Ziel, dann am längsten nicht gesehen */
  DT.reviewPick = function (st, today, count) {
    var c = [];
    Object.keys(st.srs || {}).forEach(function (k) {
      var s = st.srs[k]; if (!DT.SKILLS[k]) return;
      var due = s.d && s.d <= today, acc = DT.skillAcc(s);
      var sc = (due ? 0 : 40) + (acc >= DT.TARGET ? 25 : 0) + acc * 20 + s.b * 4 - (due ? Math.min(30, diffDays(s.d, today)) : 0) + Math.random() * 6;
      c.push({ k: k, sc: sc });
    });
    c.sort(function (a, b) { return a.sc - b.sc; });
    return c.slice(0, count).map(function (x) { return x.k; });
  };
  DT.wordMastered = function (s) { return !!s && s.b >= 3 && s.k >= 2; };
  DT.dueSkills = function (st, today) {
    var out = [];
    Object.keys(st.srs || {}).forEach(function (k) { var s = st.srs[k]; if (s.d && s.d <= today && DT.SKILLS[k]) out.push({ k: k, over: diffDays(s.d, today), b: s.b }); });
    out.sort(function (a, b) { return a.b - b.b || b.over - a.over; });
    return out;
  };
  /* gesehene Aufgaben-IDs aus den Tagesergebnissen */
  DT.seenIds = function (st) {
    var seen = {}; Object.keys(st.days || {}).forEach(function (d) { (st.days[d].r || []).forEach(function (r) { seen[r[0]] = (seen[r[0]] || 0) + 1; }); });
    return seen;
  };
  /* Variante zum Skill, bevorzugt noch nicht gesehen, nicht in `not` */
  DT.variantFor = function (skill, st, not) {
    var seen = DT.seenIds(st), best = null, bs = 1e9;
    Object.keys(EX).forEach(function (id) {
      var e = EX[id]; if (e.skill !== skill || not.indexOf(id) >= 0) return;
      var sc = (seen[id] || 0) * 10 + (e.pool ? 0 : 1) + Math.random() * 0.5;
      if (sc < bs) { bs = sc; best = id; }
    });
    return best;
  };

  /* ---------- Fortschritt und Tagesplan ---------- */
  DT.units = function () { var u = []; DT.WEEKS.forEach(function (w, wi) { w.days.forEach(function (d, di) { u.push({ w: wi, d: di, key: 'w' + w.n + 'd' + (di + 1) }); }); }); return u; };
  DT.nextUnit = function (st) {
    var us = DT.units(), done = st.done || {};
    for (var i = 0; i < us.length; i++) if (!done[us[i].key]) return us[i];
    return null;
  };
  /* Tagesplan erzeugen: Liste {id, ph, rep} */
  DT.buildDay = function (st, unit, today) {
    var wk = DT.WEEKS[unit.w], dy = wk.days[unit.d], list = [], used = [];
    dy.p.forEach(function (ids, pi) { ids.forEach(function (id) { used.push(id); }); });
    var repl = [], nrep = (unit.w === 0 && unit.d === 0) ? 0 : Math.min(dy.p[0].length, 3);
    DT.reviewPick(st, today, nrep + 2).forEach(function (k) {
      if (repl.length >= nrep) return;
      var v = DT.variantFor(k, st, used.concat(repl)); if (v) repl.push(v);
    });
    dy.p.forEach(function (ids, pi) {
      ids.forEach(function (id, k) {
        if (pi === 0 && k < repl.length) list.push({ id: repl[k], ph: 1, rep: true });
        else list.push({ id: id, ph: pi + 1, rep: false });
      });
    });
    return list;
  };
  /* Freie Wiederholung: bis zu 8 Aufgaben aus fälligen Fertigkeiten */
  DT.buildReview = function (st, today) {
    var sk = DT.reviewPick(st, today, 8), list = [], used = [];
    for (var i = 0; i < 16 && list.length < 8 && sk.length; i++) {
      var v = DT.variantFor(sk[i % sk.length], st, used);
      if (v) { used.push(v); list.push({ id: v, ph: 1 + Math.min(3, Math.floor(list.length / 2)), rep: true }); }
    }
    return list;
  };
  /* Ergebnis-Code aus der Korrektur, z. B. "DT1 min=24 m01=1 m02=0.5 m03=0 ..." (1 = richtig, 0,5 = teilweise, 0 = falsch) */
  DT.parseCode = function (txt, list) {
    var out = { ok: false, f: {}, min: null, err: '' };
    var toks = String(txt || '').replace(/(\d),(\d)/g, '$1.$2').replace(/,/g, ' ').replace(/;/g, ' ').split(/\s+/).filter(Boolean);
    if (toks[0] !== 'DT1') { out.err = 'Der Code muss mit DT1 beginnen.'; return out; }
    toks.slice(1).forEach(function (t) {
      var m = /^([a-z0-9]+)=([0-9]+(?:\.[0-9]+)?)$/i.exec(t.replace(',', '.')); if (!m) return;
      if (m[1] === 'min') out.min = +m[2]; else if (+m[2] >= 0 && +m[2] <= 1) out.f[m[1]] = +m[2];
    });
    var miss = list.filter(function (u) { return out.f[u.id] == null; }).map(function (u) { return u.id; });
    if (miss.length) { out.err = 'Es fehlen Ergebnisse für: ' + miss.join(', '); return out; }
    out.ok = true; return out;
  };
  /* Wörter, die bei einer Aufgabe geübt wurden (für den Wörter-Lernstand) */
  DT.wordsOfTask = function (ex, f) {
    var w = {}, ok = f >= 0.999;
    function mark(x) { if (DT.WORDMAP[x]) w[x] = ok; }
    if (ex.t === 'gap') ex.gaps.forEach(function (g) { mark(g[0]); });
    else if (ex.t === 'text') wordsIn(ex.sol[0]).forEach(mark);
    else if (ex.t === 'fix') ex.errs.forEach(function (k) { mark(ex.right[k].replace(/[.!?,;:]+$/, '')); });
    return w;
  };
  DT.estMinutes = function (list) { var s = 0; list.forEach(function (u) { s += EX[u.id].sec; }); return Math.round(s / 60); };
})();
