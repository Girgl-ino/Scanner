/* deutsch.js: Deutschtraining (Realschule Bayern, Jahrgangsstufe 5)
   Inhalt: Aufgabenformate und Auswertung, Punkte, Wiederholungslogik (Leitner-Boxen), Wochenplan, Aufgaben von Woche 1.
   Der Lehrplanbezug ist nur als Lernbereich angegeben (LehrplanPLUS Deutsch Realschule 5: Richtig schreiben, Sprache untersuchen).
   Die genauen Kompetenzerwartungen bitte mit dem Unterricht abgleichen. */
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
  var LPR = 'Richtig schreiben: Groß- und Kleinschreibung', LPS = 'Sprache untersuchen: Wortarten', LPB = 'Sprache untersuchen: Satzbau und Satzglieder';
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
  var NEXT = [
    [2, 'Wortfamilien und Wortstamm, Dehnung (Doppelvokal, ie, h)', 'Satzglieder: Subjekt, Prädikat, Objekt'],
    [3, 'Kurze Vokale: Doppelkonsonanten, ck, tz', 'Wortarten vertiefen, Zeitformen'],
    [4, 'ä oder e, äu oder eu', 'Satzarten und Satzzeichen'],
    [5, 'ss oder ß, das oder dass', 'Zeitformen: Präsens, Perfekt, Präteritum'],
    [6, 'Zusammen- und Getrenntschreibung, Fremdwörter', 'Satzglieder, Attribute'],
    [7, 'Zeichensetzung bei Aufzählungen und wörtlicher Rede', 'Wortbildung'],
    [8, 'Wiederholung aller Rechtschreibregeln', 'Wiederholung aller Grammatikthemen']
  ];
  NEXT.forEach(function (x) { DT.WEEKS.push({ n: x[0], ready: false, title: x[1], rs: x[1], gr: x[2], days: [] }); });

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
  DT.skillMastered = function (s) { return !!s && s.b >= 3 && s.k >= 3; };
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
    var due = DT.dueSkills(st, today).filter(function (x) { return !dy.p[0].some(function (id) { return EX[id].skill === x.k; }) || true; });
    var repl = [];
    due.slice(0, 2).forEach(function (x) { var v = DT.variantFor(x.k, st, used.concat(repl)); if (v) repl.push(v); });
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
    var due = DT.dueSkills(st, today), list = [], used = [];
    var sk = due.length ? due : Object.keys(st.srs || {}).map(function (k) { return { k: k }; });
    for (var i = 0; list.length < 8 && sk.length && i < 24; i++) {
      var v = DT.variantFor(sk[i % sk.length].k, st, used);
      if (v) { used.push(v); list.push({ id: v, ph: 1 + Math.min(3, Math.floor(list.length / 2)), rep: true }); }
      else if (i >= sk.length) break;
    }
    return list;
  };
  DT.estMinutes = function (list) { var s = 0; list.forEach(function (u) { s += EX[u.id].sec; }); return Math.round(s / 60); };
})();
