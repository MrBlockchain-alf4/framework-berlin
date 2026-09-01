/**
 * Framework Berlin — Chatbot Widget  v2
 *
 * Changes from v1:
 *  - German language detection + bilingual responses (DE/EN)
 *  - Live DOM extraction: pricing + location data read directly from page HTML
 *  - Expanded keyword lists to cover more phrasings
 *
 * Embed: <script src="/framework-berlin/chatbot/chatbot.js" defer></script>
 */

(function () {
  'use strict';
  if (document.getElementById('fw-cb-root')) return;

  /* ─────────────────────────────────────────────────────────────
     LANGUAGE DETECTION
     Returns 'de' when the query contains recognisable German words.
  ───────────────────────────────────────────────────────────── */
  const DE_WORDS = new Set([
    'wie','viel','wieviel','kostet','kosten','was','wann','wo','wer','warum',
    'welche','welcher','welches','haben','gibt','ist','sind','ich','du','wir',
    'sie','der','die','das','ein','eine','und','oder','aber','für','auf','mit',
    'von','zu','bitte','danke','öffnungszeiten','preise','preis','buchen',
    'buchung','kurs','kurse','standort','klasse','klassen','nicht','noch',
    'auch','mehr','viele','keine','kein','mein','dein','hier','dort','mich',
    'dich','mir','dir','kann','können','möchte','macht','geöffnet','teuer',
    'günstig','angebot','zeiten','adresse','studio','studios','trainer',
    'trainerin','mitglied','mitgliedschaft','paket','pakete','stunden',
    'stunde','einheit','kreditpaket','behandlung','verletzung','schmerzen',
    'schwanger','erster','erste','erstes','anfänger','socken','greifen',
    'hallo','moin','servus','tschüss','auf wiedersehen','wie geht',
    'habt','seid','gibt es','wo sind','wo ist','wann sind','wann macht',
    'gutschein','gutscheincode','mitgliedschaft','verspätung','stornieren',
    'abo','abonnement','umbuchen','schwangerschaft',
  ]);

  function detectLang(q) {
    const tokens = q.toLowerCase().replace(/[?!.,;]/g, '').split(/\s+/);
    const matches = tokens.filter(t => DE_WORDS.has(t)).length;
    // Also check multi-word German phrases
    const lower = q.toLowerCase();
    const dePhrase = ['wie viel','wieviel','gibt es','wo sind','wo ist','wie teuer',
                      'was kostet','was sind die','wann sind','öffnungszeiten',
                      'guten morgen','guten tag','guten abend'].some(p => lower.includes(p));
    return (matches >= 1 || dePhrase) ? 'de' : 'en';
  }

  /* ─────────────────────────────────────────────────────────────
     DOM EXTRACTION  — reads live data from the page's HTML
     Falls back to static strings when elements aren't present.
  ───────────────────────────────────────────────────────────── */
  function extractPricing() {
    const cards = document.querySelectorAll('.price-card');
    if (!cards.length) return null;
    const packs = [];
    cards.forEach(card => {
      const tier     = card.querySelector('.price-tier')?.textContent?.trim();
      const credits  = card.querySelector('.price-credits')?.textContent?.trim();
      const amount   = card.querySelector('.price-amount')?.textContent?.trim();
      const note     = card.querySelector('.price-note')?.textContent?.trim();
      const features = [...card.querySelectorAll('.price-features li')].map(li => li.textContent.trim());
      const popular  = card.classList.contains('popular');
      if (tier && amount) packs.push({ tier, credits, amount, note, features, popular });
    });
    return packs.length ? packs : null;
  }

  function extractLocations() {
    const cards = document.querySelectorAll('.loc-card');
    if (!cards.length) return null;
    const locs = [];
    cards.forEach(card => {
      const hood    = card.querySelector('.loc-neighborhood')?.textContent?.trim();
      const name    = card.querySelector('.loc-name')?.textContent?.trim();
      const address = card.querySelector('.loc-address')?.textContent?.trim();
      const hours   = card.querySelector('.loc-hours')?.textContent?.trim();
      if (name) locs.push({ hood, name, address, hours });
    });
    return locs.length ? locs : null;
  }

  function extractTeam() {
    const cards = document.querySelectorAll('.physio-card, .tm-card');
    if (!cards.length) return null;
    const members = [];
    cards.forEach(card => {
      const name = card.querySelector('.physio-name, .tm-name')?.textContent?.trim();
      const role = card.querySelector('.physio-title, .tm-role')?.textContent?.trim();
      if (name) members.push({ name, role });
    });
    return members.length ? members : null;
  }

  /* Build a dynamic pricing response from live DOM data */
  function buildPricingResponse(lang) {
    const packs = extractPricing();
    if (!packs) return null; // signal to use static fallback

    const header = lang === 'de'
      ? 'Alle Creditpakete — gültig in beiden Studios:\n\n'
      : 'All credit packs — valid at both studios:\n\n';

    const lines = packs.map(p => {
      const star    = p.popular ? ' ⭐' : '';
      const per     = p.note    ? ` · ${p.note}` : '';
      const feat    = p.features.filter(f => !f.includes('Both studio')).slice(0, 1);
      const sub     = feat.length ? `\n↳ ${feat[0]}` : '';
      return `**${p.tier}${star}** — ${p.credits} · ${p.amount}${per}${sub}`;
    });

    return header + lines.join('\n\n');
  }

  /* Build a dynamic locations response from live DOM data */
  function buildLocationsResponse(lang) {
    const locs = extractLocations();
    if (!locs) return null;

    const header = lang === 'de'
      ? 'Wir haben zwei Berliner Studios:\n\n'
      : 'We have two Berlin studios:\n\n';

    const lines = locs.map(l =>
      `📍 **${l.hood || l.name}**\n${l.address}` +
      (l.hours ? `\n↳ ${l.hours}` : '')
    );

    const footer = lang === 'de'
      ? '\n\nAlle Creditpakete gelten in beiden Studios.'
      : '\n\nAll credit packs are valid at either studio.';

    return header + lines.join('\n\n') + footer;
  }

  /* ─────────────────────────────────────────────────────────────
     KNOWLEDGE BASE
     Each intent has EN + DE phrases, keywords, responses, chips.
  ───────────────────────────────────────────────────────────── */
  const INTENTS = [
    /* ── GREETING ─────────────────────────────────────────── */
    {
      id: 'greeting',
      phrases:    ['good morning', 'good afternoon', 'good evening', 'hi there', 'hey there'],
      keywords:   ['hello', 'hi', 'hey', 'howdy', 'sup'],
      phrases_de: ['guten morgen', 'guten tag', 'guten abend', 'wie geht es', 'wie gehts'],
      keywords_de:['hallo', 'moin', 'servus', 'grüezi', 'tach', 'nabend'],
      response:    "Hey! 👋 I'm the Framework Berlin assistant. Ask me anything about our classes, pricing, studios, or team.",
      response_de: "Hey! 👋 Ich bin der Framework Berlin Assistent. Frag mich gerne alles zu Kursen, Preisen, Standorten oder dem Team.",
      chips:    ['What is Lagree?', 'Pricing & Credits', 'Studio Locations', 'First-timer tips'],
      chips_de: ['Was ist Lagree?', 'Preise & Credits', 'Standorte', 'Tipps für Einsteiger'],
    },

    /* ── ABOUT ────────────────────────────────────────────── */
    {
      id: 'about',
      phrases:    ['about framework', 'what is framework', 'who are you', 'tell me about', 'teacher owned', 'boutique studio'],
      keywords:   ['about', 'framework', 'boutique', 'teacher', 'owned'],
      phrases_de: ['was ist framework', 'über framework', 'erzähl mir', 'wer seid ihr', 'lehrergeführt'],
      keywords_de:['über', 'boutique', 'lehrer', 'studio'],
      response:    "**Framework Berlin** is a teacher-owned boutique fitness studio with three offerings:\n\n• **Lagree training** — high-intensity, low-impact on the Megaformer™\n• **Personal training** — 1:1 sessions with certified instructors\n• **Physiotherapy** — clinical care integrated with movement\n\nTwo Berlin studios, 32+ specialists.",
      response_de: "**Framework Berlin** ist ein lehrergeführtes Boutique-Fitnessstudio mit drei Angeboten:\n\n• **Lagree Training** — hochintensives, gelenkschonendes Workout auf dem Megaformer™\n• **Personal Training** — Einzelstunden mit zertifizierten Trainern\n• **Physiotherapie** — klinische Behandlung kombiniert mit Bewegung\n\nZwei Berliner Studios, 32+ Spezialisten.",
      chips:    ['What is Lagree?', 'Studio Locations', 'Meet the team'],
      chips_de: ['Was ist Lagree?', 'Standorte', 'Das Team'],
    },

    /* ── LAGREE METHOD ────────────────────────────────────── */
    {
      id: 'lagree',
      phrases:    ['what is lagree', 'how does lagree', 'lagree method', 'the lagree method', 'explain lagree'],
      keywords:   ['lagree', 'megaformer', 'method', 'reformer', 'machine', 'slow twitch', 'workout'],
      phrases_de: ['was ist lagree', 'wie funktioniert lagree', 'lagree methode', 'erkläre lagree', 'die lagree methode'],
      keywords_de:['methode', 'maschine', 'training', 'workout', 'muskeln', 'megaformer'],
      response:    "**Lagree** is a high-intensity, low-impact strength method performed on the **Megaformer™** machine.\n\nIt targets slow-twitch muscle fibers — building lean muscle and deep core strength while staying gentle on your joints. Every session is **50 minutes**, and the afterburn effect keeps your metabolism elevated for up to **24 hours** after class.",
      response_de: "**Lagree** ist eine hochintensive, gelenkschonende Kraftmethode auf dem **Megaformer™**.\n\nSie zielt auf langsam zuckende Muskelfasern ab — für schlanke Muskeln und eine starke Körpermitte, die deine Gelenke schont. Jede Einheit dauert **50 Minuten** und der Nachbrenneffekt hält bis zu **24 Stunden** an.",
      chips:    ['How is it different from Pilates?', 'Pricing', 'First-timer tips'],
      chips_de: ['Unterschied zu Pilates?', 'Preise', 'Tipps für Einsteiger'],
    },

    /* ── LAGREE VS PILATES ────────────────────────────────── */
    {
      id: 'pilates_diff',
      phrases:    ['lagree vs pilates', 'different from pilates', 'compared to pilates', 'same as pilates', 'pilates difference'],
      keywords:   ['pilates', 'difference', 'compare', 'versus', 'vs', 'similar'],
      phrases_de: ['lagree vs pilates', 'unterschied zu pilates', 'im vergleich zu pilates', 'ähnlich wie pilates', 'wie pilates'],
      keywords_de:['pilates', 'unterschied', 'vergleich', 'ähnlich', 'versus'],
      response:    "Lagree uses a Megaformer (similar shape to a Pilates Reformer) but is a very different experience:\n\n• **Intensity** — far more cardiovascular and muscle-fatiguing\n• **Target** — slow-twitch endurance fibers, not just mobility\n• **Afterburn** — metabolism elevated up to 24 hours post-class\n• **Both** are low-impact on joints",
      response_de: "Lagree nutzt einen Megaformer (ähnlich wie ein Pilates Reformer), ist aber ein völlig anderes Erlebnis:\n\n• **Intensität** — deutlich konditionierender und muskelermüdender\n• **Ziel** — langsam zuckende Muskelfasern, nicht nur Mobilität\n• **Nachbrenner** — Metabolismus bis zu 24 Stunden nach dem Kurs erhöht\n• **Beide** schonen die Gelenke",
      chips:    ['What is Lagree?', 'First-timer tips', 'Pricing'],
      chips_de: ['Was ist Lagree?', 'Tipps für Einsteiger', 'Preise'],
    },

    /* ── LOCATIONS ────────────────────────────────────────── */
    {
      id: 'locations',
      phrases:    ['where are you', 'studio location', 'where is framework', 'find you', 'prenzlauer berg', 'kreuzberg', 'christinenstrasse', 'oranienstrasse'],
      keywords:   ['location', 'located', 'address', 'where', 'find', 'pberg', 'xberg', 'kreuzberg', 'prenzlauer', 'christinen', 'oranien', 'studios'],
      phrases_de: ['wo seid ihr', 'wo befindet ihr', 'studio adresse', 'wo ist framework', 'wie finde ich', 'prenzlauer berg', 'kreuzberg', 'wo sind die studios'],
      keywords_de:['adresse', 'standort', 'wo', 'ort', 'finden', 'christinen', 'oranien', 'studios', 'lage'],
      response:    "We have two Berlin studios:\n\n📍 **Prenzlauer Berg**\nChristinenstraße 19a, 10119 Berlin\n↳ Mon–Thu, 8:00am–5:30pm\n\n📍 **Kreuzberg**\nOranienstraße 185, 10999 Berlin\n↳ Mon–Thu, 8:00am–5:30pm\n\nAll credit packs are valid at either studio.",
      response_de: "Wir haben zwei Berliner Studios:\n\n📍 **Prenzlauer Berg**\nChristinenstraße 19a, 10119 Berlin\n↳ Mo–Do, 8:00–17:30 Uhr\n\n📍 **Kreuzberg**\nOranienstraße 185, 10999 Berlin\n↳ Mo–Do, 8:00–17:30 Uhr\n\nAlle Creditpakete gelten in beiden Studios.",
      chips:    ['Studio hours', 'How to book', 'Pricing'],
      chips_de: ['Öffnungszeiten', 'So buchen', 'Preise'],
      dynamic: 'locations',
    },

    /* ── HOURS ────────────────────────────────────────────── */
    {
      id: 'hours',
      phrases:    ['opening hours', 'studio hours', 'when are you open', 'are you open on', 'open on friday', 'open on weekend', 'opening time'],
      keywords:   ['hours', 'open', 'time', 'schedule', 'friday', 'weekend', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'close', 'closing'],
      phrases_de: ['öffnungszeiten', 'wann habt ihr geöffnet', 'wann seid ihr offen', 'wann macht ihr auf', 'wie lange geöffnet', 'wann schließt'],
      keywords_de:['öffnungszeiten', 'öffnung', 'geöffnet', 'uhrzeit', 'wann', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'wochenende', 'samstag', 'sonntag', 'öffnen', 'schließen', 'zeiten'],
      response:    "Both studios are open **Monday through Thursday, 8:00am–5:30pm**.\n\nFor specific class times and live availability, check Bsport or ClassPass.",
      response_de: "Beide Studios sind **Montag bis Donnerstag, 8:00–17:30 Uhr** geöffnet.\n\nFür spezifische Kurszeiten und Verfügbarkeit, check bitte Bsport oder ClassPass.",
      chips:    ['How to book', 'Studio locations', 'Pricing'],
      chips_de: ['So buchen', 'Standorte', 'Preise'],
    },

    /* ── PRICING ──────────────────────────────────────────── */
    {
      id: 'pricing',
      phrases:    ['how much does it cost', 'how much is a class', 'credit pack', 'class prices', 'how much do classes cost', 'membership price', 'how much'],
      keywords:   ['price', 'cost', 'pricing', 'credits', 'pack', 'packs', 'membership', 'euros', 'euro', 'expensive', 'affordable', 'money', 'fee'],
      phrases_de: ['wie viel kostet', 'wieviel kostet', 'was kostet', 'wie teuer ist', 'was sind die preise', 'kosten für', 'preis für', 'wie teuer', 'was kostet ein', 'was kostet das'],
      keywords_de:['preis', 'preise', 'kostet', 'kosten', 'teuer', 'günstig', 'euro', 'zahlen', 'paket', 'pakete', 'mitgliedschaft', 'creditpaket', 'gebühr', 'tarif', 'tarife', 'kurspreise'],
      response:    "**Credit Packs** — valid at both studios:\n\n**First Timer** — 2 Credits · €35 · €17.50/class\n↳ New members only · Valid 2 weeks from first booking · Non-transferable\n\n**Drop In** — 1 Credit · €35\n↳ Valid 1 month\n\n**5 Classes** — 5 Credits · €160 · €32/class\n↳ Valid 6 months\n\n**10 Classes ⭐** — 10 Credits · €290 · €29/class\n↳ Most popular · Valid 6 months\n\n**20 Classes** — 20 Credits · €520 · €26/class\n↳ Valid 6 months\n\n**Lagree + Soundbath** — €45\n\n**Monthly Memberships** (email to book):\n\n**Mega Membership** — €210/month · 10 classes/month\n**10 for Members** — €225 · 10 extra classes for existing members\n↳ Both valid 6 months · Auto-renew · 1 pause up to 4 weeks\n↳ Book by emailing support@frameworkberlin.com",
      response_de: "**Creditpakete** — gültig in beiden Studios:\n\n**First Timer** — 2 Credits · €35 · €17,50/Kurs\n↳ Nur für neue Mitglieder · Gültig 2 Wochen ab erstem Kurs · Nicht übertragbar\n\n**Drop In** — 1 Credit · €35\n↳ Gültig 1 Monat\n\n**5 Kurse** — 5 Credits · €160 · €32/Kurs\n↳ Gültig 6 Monate\n\n**10 Kurse ⭐** — 10 Credits · €290 · €29/Kurs\n↳ Beliebteste Option · Gültig 6 Monate\n\n**20 Kurse** — 20 Credits · €520 · €26/Kurs\n↳ Gültig 6 Monate\n\n**Lagree + Soundbath** — €45\n\n**Monatliche Mitgliedschaften** (per E-Mail buchen):\n\n**Mega Membership** — €210/Monat · 10 Kurse/Monat\n**10 for Members** — €225 · 10 Zusatzkurse für bestehende Mitglieder\n↳ Buchung per E-Mail: support@frameworkberlin.com",
      chips:    ['Monthly membership', 'First-timer tips', 'How to book'],
      chips_de: ['Monatliche Mitgliedschaft', 'Tipps für Einsteiger', 'So buchen'],
      dynamic: 'pricing',
    },

    /* ── FIRST TIMER ──────────────────────────────────────── */
    {
      id: 'first_timer',
      phrases:    ['first time', 'first class', 'new member', 'never done lagree', 'never tried', 'what should i bring', 'what to expect', 'joining for the first time', 'first timer'],
      keywords:   ['first', 'beginner', 'new', 'never', 'bring', 'wear', 'socks', 'grip', 'expect', 'intro', 'prepare', 'start'],
      phrases_de: ['das erste mal', 'erster kurs', 'neues mitglied', 'noch nie lagree', 'was soll ich mitbringen', 'was erwartet mich', 'zum ersten mal', 'noch nie gemacht'],
      keywords_de:['erstes', 'anfänger', 'neu', 'anfang', 'mitbringen', 'tragen', 'socken', 'grip', 'erwarten', 'vorbereiten', 'starten', 'einsteiger'],
      response:    "Everything to know for your first class:\n\n• **Arrive 15 min early** — your instructor will walk you through the Megaformer\n• **Don't arrive less than 5 min before class** — new clients cannot be accepted for safety\n• **Grip socks required** — available to buy in-studio if needed\n• **Wear fitted clothing** — you'll be moving in all directions\n• **It will feel hard** — completely normal, even for very fit people!\n\n**First Timer pack**: 2 classes · €35 · valid 2 weeks from first booking · non-transferable\n↳ Need to reschedule? Cancel your initial booking first, then rebook.",
      response_de: "Alles, was du für deinen ersten Kurs wissen musst:\n\n• **15 Minuten früher kommen** — dein Trainer zeigt dir den Megaformer\n• **Nicht weniger als 5 Min. vorher ankommen** — neue Kunden können aus Sicherheitsgründen nicht mehr eingelassen werden\n• **Gripsocken Pflicht** — im Studio erhältlich, falls du keine hast\n• **Eng anliegende Kleidung** — du wirst dich in alle Richtungen bewegen\n• **Es wird anspruchsvoll** — völlig normal, auch für sehr fitte Menschen!\n\n**First Timer Paket**: 2 Kurse · €35 · gültig 2 Wochen ab erstem Kurs · nicht übertragbar\n↳ Umbuchen? Zuerst die ursprüngliche Buchung stornieren, dann neu buchen.",
      chips:    ['Pricing', 'Late arrival policy', 'How to book'],
      chips_de: ['Preise', 'Was wenn ich zu spät komme?', 'So buchen'],
    },

    /* ── BOOKING ──────────────────────────────────────────── */
    {
      id: 'booking',
      phrases:    ['how to book', 'book a class', 'reserve a spot', 'sign up for a class', 'can i book online', 'where to book', 'i want to schedule', 'make an appointment', 'set up an appointment', 'get an appointment', 'schedule a class', 'schedule an appointment', 'book an appointment', 'i want to book'],
      keywords:   ['book', 'booking', 'reserve', 'sign up', 'bsport', 'classpass', 'online', 'register', 'app', 'schedule', 'appointment'],
      phrases_de: ['wie buche ich', 'einen kurs buchen', 'platz reservieren', 'wie reserviere ich', 'wo buchen', 'kurs anmelden', 'wie kann ich buchen', 'termin vereinbaren', 'einen termin machen', 'ich möchte einen termin', 'ich würde gerne einen termin', 'termin ausmachen', 'termin buchen'],
      keywords_de:['buchen', 'buchung', 'reservieren', 'anmelden', 'bsport', 'classpass', 'online', 'registrieren', 'app', 'reservierung', 'termin'],
      response:    "Classes are booked via two platforms:\n\n📱 **Bsport** — primary platform for all credit packs · valid at both studios\n📱 **ClassPass** — for ClassPass members\n\n⚠️ **ClassPass note**: Framework cannot modify or cancel ClassPass reservations — changes must be made directly through the ClassPass app.\n\nFor **monthly memberships** (Mega Membership / 10 for Members), email support@frameworkberlin.com — these cannot be booked online.",
      response_de: "Kurse können über zwei Plattformen gebucht werden:\n\n📱 **Bsport** — Hauptplattform für alle Creditpakete · gilt in beiden Studios\n📱 **ClassPass** — für ClassPass-Mitglieder\n\n⚠️ **ClassPass-Hinweis**: Framework kann ClassPass-Buchungen nicht ändern oder stornieren — das muss direkt über die ClassPass-App erfolgen.\n\nFür **monatliche Mitgliedschaften** E-Mail an support@frameworkberlin.com — diese sind nicht online buchbar.",
      chips:    ['Pricing', 'Monthly membership', 'First-timer tips'],
      chips_de: ['Preise', 'Monatliche Mitgliedschaft', 'Tipps für Einsteiger'],
    },

    /* ── PHYSIOTHERAPY ────────────────────────────────────── */
    {
      id: 'physiotherapy',
      phrases:    ['physiotherapy', 'physical therapy', 'book physio', 'injury treatment', 'back pain', 'rehabilitation', 'prenatal care', 'postnatal care', 'who is lisanne', 'who is juni'],
      keywords:   ['physio', 'therapy', 'treatment', 'injury', 'pain', 'rehab', 'rehabilitation', 'prenatal', 'postnatal', 'pregnancy', 'recover', 'lisanne', 'juni', 'manual', 'clinical', 'assessment', 'chronic'],
      phrases_de: ['physiotherapie', 'physio', 'physiotherapeut', 'verletzung behandlung', 'rückenschmerzen', 'rehabilitation', 'schwangerschaftsbetreuung', 'wer ist lisanne', 'wer ist juni'],
      keywords_de:['physio', 'therapie', 'behandlung', 'verletzung', 'schmerzen', 'reha', 'rehabilitation', 'schwanger', 'prenatal', 'postnatal', 'erholen', 'lisanne', 'juni', 'therapeu', 'therapeutin'],
      response:    "We offer integrated **Physiotherapy** at Framework Berlin:\n\n• Medical Assessment\n• Manual Therapy\n• Movement Re-Education\n• Injury Rehabilitation\n• Pregnancy & Postnatal Care\n• Performance Optimization\n\n**Physiotherapy team:**\n• **Lisanne** — 6+ years, B.Sc. International Physiotherapy (Netherlands), sports & chronic pain specialist\n• **Juni** — Physiotherapist + Lagree Instructor, prenatal/postnatal specialist\n\nContact us at hello@frameworkberlin.com to book a consultation.",
      response_de: "Wir bieten integrierte **Physiotherapie** bei Framework Berlin:\n\n• Medizinische Eingangsuntersuchung\n• Manuelle Therapie\n• Bewegungsrehabilitation\n• Verletzungsrehabilitation\n• Schwangerschafts- & Nachsorge\n• Performance-Optimierung\n\n**Physiotherapie-Team:**\n• **Lisanne** — 6+ Jahre Erfahrung, B.Sc. Internationale Physiotherapie (Niederlande), Sport & chronische Schmerzen\n• **Juni** — Physiotherapeutin + Lagree-Trainerin, Pre-/Postnatal-Spezialistin\n\nE-Mail: hello@frameworkberlin.com für eine Beratung.",
      chips:    ['Contact the studio', 'Meet the team', 'Personal training'],
      chips_de: ['Kontakt', 'Das Team', 'Personal Training'],
    },

    /* ── PERSONAL TRAINING ────────────────────────────────── */
    {
      id: 'personal_training',
      phrases:    ['personal training', 'one on one', '1 on 1', '1:1 session', 'private session', 'private class'],
      keywords:   ['personal', 'private', 'individual', 'solo', 'trainer', '1:1'],
      phrases_de: ['personal training', 'einzelstunde', 'privatstunde', 'eins zu eins', '1 zu 1', 'persönliches training'],
      keywords_de:['einzelstunde', 'privatstunde', 'persönlich', 'solo', 'einzeln'],
      response:    "Yes — we offer **personal training** as 1:1 sessions with our instructors. Great for beginners, post-injury return, or focused technique work.\n\nFor availability and pricing, contact the studio or check our booking platform.",
      response_de: "Ja — wir bieten **Personal Training** als Einzelstunden mit unseren Trainern an. Ideal für Anfänger, nach einer Verletzung oder für gezieltes Techniktraining.\n\nFür Verfügbarkeit und Preise kontaktiere das Studio oder check unsere Buchungsplattform.",
      chips:    ['How to book', 'Physiotherapy', 'Studio locations'],
      chips_de: ['So buchen', 'Physiotherapie', 'Standorte'],
    },

    /* ── TEAM ─────────────────────────────────────────────── */
    {
      id: 'team',
      phrases:    ['meet the team', 'who are the instructors', 'instructor profiles', 'who teaches', 'the team', 'your trainers'],
      keywords:   ['team', 'instructor', 'trainer', 'teacher', 'staff', 'margot', 'celia', 'coach', 'specialists'],
      phrases_de: ['das team', 'die trainer', 'wer unterrichtet', 'trainer profile', 'eure trainer', 'wer sind die trainer'],
      keywords_de:['team', 'trainer', 'trainerin', 'lehrer', 'lehrerin', 'mitarbeiter', 'margot', 'celia', 'spezialisten'],
      response:    "Framework Berlin has **32+ specialists** across both studios.\n\n**Physiotherapy:**\n• **Lisanne** — Physiotherapist, 6+ years, B.Sc. Netherlands\n• **Juni** — Physiotherapist + Lagree Instructor\n\n**Lagree instructors include:**\n• **Margot** — Level 1 certified, weekend mornings at both studios\n• **Celia** — Level 2 certified, dance background, alignment-focused\n\nVisit the **Team page** for full profiles.",
      response_de: "Framework Berlin hat **32+ Spezialisten** in beiden Studios.\n\n**Physiotherapie:**\n• **Lisanne** — Physiotherapeutin, 6+ Jahre, B.Sc. Niederlande\n• **Juni** — Physiotherapeutin + Lagree-Trainerin\n\n**Lagree-Trainerinnen u.a.:**\n• **Margot** — Level 1 zertifiziert, Wochenendmorgen in beiden Studios\n• **Celia** — Level 2 zertifiziert, Tanzhintergrund, Ausrichtungsspezialistin\n\nVollständige Profile auf der **Team-Seite** unserer Website.",
      chips:    ['Physiotherapy', 'What is Lagree?', 'Studio locations'],
      chips_de: ['Physiotherapie', 'Was ist Lagree?', 'Standorte'],
    },

    /* ── AFTERBURN ────────────────────────────────────────── */
    {
      id: 'afterburn',
      phrases:    ['afterburn effect', 'how long does the burn last', 'sore after class', 'feel it the next day'],
      keywords:   ['afterburn', 'burn', 'sore', 'soreness', 'metabolism', 'calories', 'after class', 'next day'],
      phrases_de: ['nachbrenneffekt', 'wie lange hält der effekt', 'muskelkater nach dem kurs', 'noch am nächsten tag'],
      keywords_de:['nachbrenneffekt', 'nachbrennen', 'muskelkater', 'stoffwechsel', 'kalorien', 'nach dem kurs'],
      response:    "One of Lagree's signature features is the **afterburn effect** — your metabolism stays elevated for up to **24 hours** after training.\n\nSustained tension on slow-twitch fibers demands significant recovery energy. It's why the method is so effective for body composition.",
      response_de: "Eine der besonderen Eigenschaften von Lagree ist der **Nachbrenneffekt** — dein Stoffwechsel bleibt bis zu **24 Stunden** nach dem Training erhöht.\n\nDie anhaltende Spannung auf den langsam zuckenden Muskelfasern erfordert viel Regenerationsenergie — deshalb ist die Methode so effektiv für die Körperzusammensetzung.",
      chips:    ['What is Lagree?', 'Pricing', 'First-timer tips'],
      chips_de: ['Was ist Lagree?', 'Preise', 'Tipps für Einsteiger'],
    },

    /* ── SOUNDBATH ────────────────────────────────────────── */
    {
      id: 'soundbath',
      phrases:    ['sound bath', 'soundbath', 'lagree soundbath', 'lagree + soundbath', 'meditation class'],
      keywords:   ['sound', 'soundbath', 'bath', 'meditation', 'relax'],
      phrases_de: ['klangbad', 'soundbath', 'lagree soundbath', 'lagree und klangbad', 'meditationskurs'],
      keywords_de:['klang', 'klangbad', 'soundbath', 'meditation', 'entspannung'],
      response:    "Yes! We offer a **Lagree + Soundbath** experience for **€45** — combining a Lagree session with a guided sound bath meditation.\n\nBook via Bsport or ClassPass.",
      response_de: "Ja! Wir bieten ein **Lagree + Soundbath**-Erlebnis für **€45** — eine Kombination aus Lagree-Kurs und einer geführten Klangbad-Meditation.\n\nBuchung über Bsport oder ClassPass.",
      chips:    ['Pricing', 'How to book', 'What is Lagree?'],
      chips_de: ['Preise', 'So buchen', 'Was ist Lagree?'],
    },

    /* ── CONTACT ──────────────────────────────────────────── */
    {
      id: 'contact',
      phrases:    ['contact you', 'get in touch', 'how to reach', 'email address', 'speak to someone', 'reach the studio'],
      keywords:   ['contact', 'email', 'phone', 'reach', 'speak', 'talk', 'message'],
      phrases_de: ['kontakt', 'in kontakt treten', 'wie kontaktiere ich', 'email adresse', 'mit jemandem sprechen', 'das studio kontaktieren'],
      keywords_de:['kontakt', 'kontaktieren', 'email', 'telefon', 'erreichen', 'sprechen', 'schreiben', 'nachricht'],
      response:    "Reach us at:\n\n📧 **hello@frameworkberlin.com** — general inquiries\n📧 **support@frameworkberlin.com** — account & booking support\n↳ Support hours: Sat–Sun, 9:00am–6:00pm\n\n📸 Instagram: **@frameworkberlinstudio**\n\nOr visit in person:\n• **Prenzlauer Berg** — Christinenstraße 19a, 10119 Berlin\n• **Kreuzberg** — Oranienstraße 185, 10999 Berlin",
      response_de: "Erreichbar unter:\n\n📧 **hello@frameworkberlin.com** — allgemeine Anfragen\n📧 **support@frameworkberlin.com** — Konto & Buchungs-Support\n↳ Support-Zeiten: Sa–So, 9:00–18:00 Uhr\n\n📸 Instagram: **@frameworkberlinstudio**\n\nOder persönlich:\n• **Prenzlauer Berg** — Christinenstraße 19a, 10119 Berlin\n• **Kreuzberg** — Oranienstraße 185, 10999 Berlin",
      chips:    ['How to book', 'Studio hours', 'Monthly membership'],
      chips_de: ['So buchen', 'Öffnungszeiten', 'Monatliche Mitgliedschaft'],
    },

    /* ── MONTHLY MEMBERSHIP ──────────────────────────────── */
    {
      id: 'membership',
      phrases:    ['monthly membership', 'mega membership', 'monthly plan', '10 for members', 'recurring membership', 'subscription', 'unlimited classes'],
      keywords:   ['membership', 'monthly', 'subscription', 'recurring', 'mega', 'auto-renew', 'autorenew', 'pause'],
      phrases_de: ['monatliche mitgliedschaft', 'mega membership', 'monatsplan', 'abo', 'monatliches abo', 'mitgliedschaft pausieren'],
      keywords_de:['mitgliedschaft', 'monatlich', 'abo', 'abonnement', 'mega', 'automatisch', 'pause', 'pausieren'],
      response:    "We offer two **Monthly Membership** options:\n\n**Mega Membership** — €210/month\n↳ 10 classes per month · Valid 6 months · Auto-renews monthly\n\n**10 for Members** — €225\n↳ 10 extra classes for existing members · Valid 6 months\n\nBoth memberships:\n• Cannot be booked online — email **support@frameworkberlin.com** to sign up\n• Auto-renew monthly (one pause allowed, up to 4 weeks)\n• Valid at both studio locations",
      response_de: "Wir bieten zwei **Monatliche Mitgliedschaften**:\n\n**Mega Membership** — €210/Monat\n↳ 10 Kurse pro Monat · Gültig 6 Monate · Automatische Verlängerung\n\n**10 for Members** — €225\n↳ 10 Zusatzkurse für bestehende Mitglieder · Gültig 6 Monate\n\nBeide Mitgliedschaften:\n• Nicht online buchbar — E-Mail an **support@frameworkberlin.com**\n• Automatische monatliche Verlängerung (eine Pause bis zu 4 Wochen möglich)\n• Gültig in beiden Studios",
      chips:    ['Pricing', 'How to book', 'Contact the studio'],
      chips_de: ['Preise', 'So buchen', 'Kontakt'],
    },

    /* ── LATE ARRIVAL ─────────────────────────────────────── */
    {
      id: 'late_arrival',
      phrases:    ['what if i am late', 'what if i arrive late', 'late arrival', 'arrive late', 'late to class', 'running late', 'if i am late', 'late policy'],
      keywords:   ['late', 'early', 'arrive', 'arrival', 'punctual', 'on time', 'miss', 'door'],
      phrases_de: ['was wenn ich zu spät komme', 'zu spät ankommen', 'zu spät kommen', 'wenn ich zu spät bin', 'verspätung', 'spät ankommen'],
      keywords_de:['spät', 'verspätung', 'pünktlich', 'ankommen', 'früh', 'rechtzeitig', 'tür'],
      response:    "**Late arrival policy:**\n\nNew clients cannot be accepted if they arrive **less than 5 minutes before class starts**. This is for your safety — the instructor needs time to properly introduce you to the Megaformer.\n\nWe recommend arriving **15 minutes early** for your first class.",
      response_de: "**Verspätungsregel:**\n\nNeue Kunden können nicht eingelassen werden, wenn sie **weniger als 5 Minuten vor Kursbeginn** ankommen. Das dient deiner Sicherheit — der Trainer braucht Zeit, um dich richtig in den Megaformer einzuweisen.\n\nWir empfehlen, beim ersten Kurs **15 Minuten früher** zu kommen.",
      chips:    ['First-timer tips', 'Studio hours', 'How to book'],
      chips_de: ['Tipps für Einsteiger', 'Öffnungszeiten', 'So buchen'],
    },

    /* ── PREGNANCY ────────────────────────────────────────── */
    {
      id: 'pregnancy',
      phrases:    ['train while pregnant', 'workout while pregnant', 'lagree during pregnancy', 'pregnant and lagree', 'can i do lagree pregnant', 'prenatal lagree', 'pregnant client', 'pregnancy and lagree'],
      keywords:   ['pregnant', 'pregnancy', 'prenatal', 'expecting', 'baby', 'trimester', 'maternity'],
      phrases_de: ['training während der schwangerschaft', 'lagree in der schwangerschaft', 'schwanger und lagree', 'kann ich schwanger lagree machen', 'schwanger trainieren'],
      keywords_de:['schwanger', 'schwangerschaft', 'pränatal', 'schwangerschafts', 'trimester', 'baby'],
      response:    "**Lagree during pregnancy:**\n\nIf you were already attending Lagree regularly before your pregnancy, you can continue with **your doctor's approval**.\n\nWe strongly recommend booking a **1:1 session with one of our pregnancy-specialized physiotherapists first** — Lisanne and Juni can advise on modifications and what's safe for your stage.\n\nContact **hello@frameworkberlin.com** to arrange a consultation before returning to class.",
      response_de: "**Lagree während der Schwangerschaft:**\n\nWenn du vor der Schwangerschaft regelmäßig Lagree gemacht hast, kannst du mit **Genehmigung deines Arztes/deiner Ärztin** weitermachen.\n\nWir empfehlen dringend, zunächst eine **Einzelstunde bei einer unserer schwangerschaftsspezialisierten Physiotherapeutinnen** zu buchen — Lisanne und Juni können dir sagen, welche Modifikationen für deine Phase sicher sind.\n\nSchreib an **hello@frameworkberlin.com**, um eine Beratung zu vereinbaren.",
      chips:    ['Physiotherapy', 'Personal training', 'Contact the studio'],
      chips_de: ['Physiotherapie', 'Personal Training', 'Kontakt'],
    },

    /* ── GIFT CARD ────────────────────────────────────────── */
    {
      id: 'gift_card',
      phrases:    ['gift card', 'gift voucher', 'redeem gift card', 'use a gift card', 'gift certificate', 'voucher code', 'apply gift card'],
      keywords:   ['gift', 'voucher', 'redeem', 'certificate', 'code', 'giftcard'],
      phrases_de: ['geschenkgutschein', 'gutschein einlösen', 'gutschein verwenden', 'gutscheincode', 'geschenkkarte'],
      keywords_de:['gutschein', 'geschenk', 'einlösen', 'code', 'geschenkkarte', 'gutscheincode'],
      response:    "**Gift card redemption:**\n\nIf your gift card was redeemed **in-studio**, email **hello@frameworkberlin.com** and the team will apply the amount to your account manually.\n\nFor any questions about your gift card balance or how to use it, reach out to hello@frameworkberlin.com.",
      response_de: "**Gutschein einlösen:**\n\nWenn dein Gutschein **im Studio** eingelöst wurde, schreib eine E-Mail an **hello@frameworkberlin.com** — das Team trägt den Betrag manuell auf deinem Konto ein.\n\nBei Fragen zu deinem Gutschein-Guthaben oder zur Verwendung: hello@frameworkberlin.com.",
      chips:    ['Contact the studio', 'Pricing', 'How to book'],
      chips_de: ['Kontakt', 'Preise', 'So buchen'],
    },

    /* ── CLASSPASS CANCEL ─────────────────────────────────── */
    {
      id: 'classpass_cancel',
      phrases:    ['cancel classpass booking', 'modify classpass', 'classpass reservation', 'change my classpass', 'cancel through classpass', 'classpass cancellation'],
      keywords:   ['classpass', 'cancel', 'modify', 'change', 'reschedule', 'reservation'],
      phrases_de: ['classpass buchung stornieren', 'classpass ändern', 'classpass reservierung', 'classpass stornieren'],
      keywords_de:['classpass', 'stornieren', 'ändern', 'reservierung', 'umbuchen'],
      response:    "**ClassPass bookings:**\n\nFramework **cannot modify or cancel** ClassPass reservations on your behalf — all changes must be made directly through the **ClassPass app**.\n\nFor credit pack bookings (Bsport), contact **support@frameworkberlin.com** for account help.",
      response_de: "**ClassPass-Buchungen:**\n\nFramework kann ClassPass-Reservierungen **nicht ändern oder stornieren** — alle Änderungen müssen direkt über die **ClassPass-App** vorgenommen werden.\n\nFür Creditpaket-Buchungen (Bsport): support@frameworkberlin.com.",
      chips:    ['How to book', 'Contact the studio', 'Pricing'],
      chips_de: ['So buchen', 'Kontakt', 'Preise'],
    },

    /* ── THANKS ───────────────────────────────────────────── */
    {
      id: 'thanks',
      phrases:    ['thank you', 'thanks a lot', 'thanks so much', 'that was helpful', 'appreciate it'],
      keywords:   ['thanks', 'thank', 'cheers', 'appreciate', 'helpful', 'perfect', 'awesome', 'great'],
      phrases_de: ['danke schön', 'vielen dank', 'danke sehr', 'das war hilfreich', 'super danke'],
      keywords_de:['danke', 'dankeschön', 'super', 'toll', 'prima', 'wunderbar', 'perfekt', 'hilfreich'],
      response:    "Glad I could help! Feel free to ask anything else — or come find us on the Megaformer. See you at Framework! 💪",
      response_de: "Gerne! Melde dich jederzeit wieder — oder komm uns auf dem Megaformer besuchen. Bis bald bei Framework! 💪",
      chips:    ['What is Lagree?', 'Pricing', 'How to book'],
      chips_de: ['Was ist Lagree?', 'Preise', 'So buchen'],
    },
  ];

  const FALLBACK = {
    response:    "I don't have specific details on that. For the most accurate info:\n\n📧 **hello@frameworkberlin.com**\n\nOr check Bsport / ClassPass for class schedules and live availability.",
    response_de: "Dazu habe ich leider keine genauen Informationen. Für die aktuellsten Infos:\n\n📧 **hello@frameworkberlin.com**\n\nOder check Bsport / ClassPass für Kurszeiten und Verfügbarkeit.",
    chips:    ['Studio locations', 'Pricing', 'How to book', 'What is Lagree?'],
    chips_de: ['Standorte', 'Preise', 'So buchen', 'Was ist Lagree?'],
  };

  /* ─────────────────────────────────────────────────────────────
     INTENT MATCHER
  ───────────────────────────────────────────────────────────── */
  function findIntent(raw) {
    const q      = raw.toLowerCase().trim().replace(/[?!.,;]/g, '');
    const tokens = q.split(/\s+/);
    let best     = { score: 0, intent: null };

    for (const intent of INTENTS) {
      let score = 0;

      const allPhrases  = [...(intent.phrases || []),    ...(intent.phrases_de || [])];
      const allKeywords = [...(intent.keywords || []),   ...(intent.keywords_de || [])];

      // Phrase hit — strongest signal
      for (const phrase of allPhrases) {
        if (q.includes(phrase)) score += 6;
      }

      // Keyword hit
      for (const kw of allKeywords) {
        const kwParts = kw.split(/\s+/);
        if (kwParts.length > 1) {
          if (q.includes(kw)) score += 3;
        } else {
          for (const t of tokens) {
            if (t === kw) score += 2;
            else if (t.length > 3 && kw.length > 3 &&
                     (t.startsWith(kw) || kw.startsWith(t))) score += 0.8;
          }
        }
      }

      if (score > best.score) best = { score, intent };
    }

    return best.score >= 1.5 ? best.intent : null;
  }

  /* ─────────────────────────────────────────────────────────────
     RESPONSE BUILDER — picks language + injects live DOM data
  ───────────────────────────────────────────────────────────── */
  function buildResponse(intent, lang) {
    if (!intent) return {
      text:  lang === 'de' ? FALLBACK.response_de : FALLBACK.response,
      chips: lang === 'de' ? FALLBACK.chips_de    : FALLBACK.chips,
    };

    let text  = lang === 'de' && intent.response_de ? intent.response_de : intent.response;
    const chips = lang === 'de' && intent.chips_de  ? intent.chips_de    : (intent.chips || []);

    // Override with live DOM data when available
    if (intent.dynamic === 'pricing') {
      const live = buildPricingResponse(lang);
      if (live) text = live;
    } else if (intent.dynamic === 'locations') {
      const live = buildLocationsResponse(lang);
      if (live) text = live;
    }

    return { text, chips };
  }

  /* ─────────────────────────────────────────────────────────────
     MARKDOWN RENDERER
  ───────────────────────────────────────────────────────────── */
  function md(raw) {
    let text = raw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = text.split('\n');
    const out = [];
    let inList = false;

    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith('•') || l.startsWith('-')) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + l.replace(/^[•\-]\s*/, '') + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (l.startsWith('↳')) {
          out.push('<div class="fw-sub">' + l.replace(/^↳\s*/, '') + '</div>');
        } else if (l === '') {
          out.push('<div class="fw-gap"></div>');
        } else {
          out.push('<p>' + l + '</p>');
        }
      }
    }
    if (inList) out.push('</ul>');
    return out.join('');
  }

  /* ─────────────────────────────────────────────────────────────
     CSS
  ───────────────────────────────────────────────────────────── */
  const CSS = `
  #fw-cb-root * { box-sizing: border-box; }

  #fw-cb-btn {
    position: fixed; bottom: 28px; right: 28px; z-index: 9990;
    width: 56px; height: 56px; border-radius: 50%;
    background: #1a3a2a; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.07);
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), background 0.2s;
    outline: none;
  }
  #fw-cb-btn:hover  { background: #143020; transform: scale(1.07); }
  #fw-cb-btn:active { transform: scale(0.95); }
  #fw-cb-btn .ico-chat,
  #fw-cb-btn .ico-x  { position: absolute; transition: opacity 0.2s, transform 0.25s; }
  #fw-cb-btn .ico-x  { opacity: 0; transform: rotate(-80deg) scale(0.7); }
  #fw-cb-btn.is-open .ico-chat { opacity: 0; transform: rotate(80deg) scale(0.7); }
  #fw-cb-btn.is-open .ico-x   { opacity: 1; transform: rotate(0) scale(1); }
  .fw-notif-dot {
    position: absolute; top: 3px; right: 3px;
    width: 11px; height: 11px; border-radius: 50%;
    background: #5fa87a; border: 2px solid #fff;
    transition: opacity 0.3s;
  }
  #fw-cb-btn.is-open .fw-notif-dot { opacity: 0; }

  #fw-cb-win {
    position: fixed; bottom: 96px; right: 28px; z-index: 9989;
    width: 440px; height: min(80vh, 700px);
    display: flex; flex-direction: column;
    background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px; overflow: hidden;
    box-shadow:
      0 36px 100px rgba(0,0,0,0.6),
      0 10px 36px rgba(0,0,0,0.3),
      inset 0 0 0 1px rgba(255,255,255,0.035);
    transform-origin: bottom right;
    transform: scale(0.86) translateY(20px);
    opacity: 0; pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s cubic-bezier(0.22,1,0.36,1);
  }
  #fw-cb-win.is-open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

  .fw-hdr {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px;
    background: #0e0e0e;
    border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
  }
  .fw-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: #1a3a2a; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne','Helvetica Neue',Arial,sans-serif;
    font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.9);
  }
  .fw-hdr-name {
    font-family: 'Syne','Helvetica Neue',Arial,sans-serif;
    font-size: 14px; font-weight: 700; color: #fff;
    letter-spacing: -0.01em; line-height: 1; margin-bottom: 5px;
  }
  .fw-hdr-status {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Inter',system-ui,sans-serif;
    font-size: 11px; color: rgba(255,255,255,0.38);
  }
  .fw-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #5fa87a; box-shadow: 0 0 7px rgba(95,168,122,0.7);
  }

  #fw-msgs {
    flex: 1; overflow-y: auto; min-height: 0;
    padding: 18px 14px 10px;
    display: flex; flex-direction: column; gap: 10px;
    scroll-behavior: smooth;
  }
  #fw-msgs::-webkit-scrollbar { width: 3px; }
  #fw-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  .fw-msg {
    display: flex; flex-direction: column; max-width: 88%;
    animation: fw-in 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes fw-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .fw-msg.bot  { align-self: flex-start; }
  .fw-msg.user { align-self: flex-end; }

  .fw-bubble {
    padding: 11px 14px;
    font-family: 'Inter',system-ui,sans-serif;
    font-size: 13.5px; line-height: 1.65;
    color: rgba(245,241,237,0.86);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px 12px 12px 12px;
  }
  .fw-msg.user .fw-bubble {
    background: #1a3a2a; border-color: rgba(255,255,255,0.06);
    border-radius: 12px 12px 4px 12px; color: rgba(255,255,255,0.95);
  }
  .fw-bubble p { margin: 0 0 4px; }
  .fw-bubble p:last-child { margin-bottom: 0; }
  .fw-bubble strong { color: rgba(255,255,255,0.95); font-weight: 600; }
  .fw-bubble ul { margin: 5px 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
  .fw-bubble li { padding-left: 18px; position: relative; }
  .fw-bubble li::before { content: '—'; position: absolute; left: 0; color: rgba(95,168,122,0.65); font-size: 11px; top: 1px; }
  .fw-bubble .fw-gap { height: 8px; }
  .fw-bubble .fw-sub { font-size: 11.5px; color: rgba(255,255,255,0.35); margin: 0 0 3px; }

  .fw-typing {
    display: flex; align-items: center; gap: 5px;
    padding: 12px 15px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px 12px 12px 12px;
    width: fit-content; align-self: flex-start;
    animation: fw-in 0.28s cubic-bezier(0.22,1,0.36,1) both;
  }
  .fw-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.32);
    animation: fw-bounce 1.3s ease-in-out infinite;
  }
  .fw-dot:nth-child(2) { animation-delay: 0.18s; }
  .fw-dot:nth-child(3) { animation-delay: 0.36s; }
  @keyframes fw-bounce { 0%,70%,100% { transform:scale(0.7); opacity:0.4; } 35% { transform:scale(1.1); opacity:1; } }

  .fw-chips-row { padding: 0 14px 12px; flex-shrink: 0; }
  .fw-chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
  .fw-chips::-webkit-scrollbar { display: none; }
  .fw-chip {
    display: inline-flex; align-items: center; white-space: nowrap; flex-shrink: 0;
    font-family: 'Inter',system-ui,sans-serif;
    font-size: 11px; font-weight: 500; letter-spacing: 0.02em;
    color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    padding: 6px 13px; border-radius: 100px; cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
  }
  .fw-chip:hover { background: rgba(26,58,42,0.3); border-color: rgba(95,168,122,0.35); color: rgba(255,255,255,0.82); transform: translateY(-1px); }
  .fw-chip:active { transform: translateY(0); }

  /* Inline action buttons (booking location choice / confirm) — sit inside
     the message bubble itself so they stay in the scroll history, unlike
     the transient chips row which clears on every new query. */
  .fw-inline-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 9px; }
  .fw-btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Syne',sans-serif; font-size: 11.5px; font-weight: 700;
    letter-spacing: 0.04em; color: #fff;
    background: #1a3a2a; border: 1px solid rgba(95,168,122,0.4);
    padding: 9px 16px; border-radius: 8px; cursor: pointer;
    transition: background 0.2s, transform 0.15s, border-color 0.2s;
  }
  .fw-btn-primary:hover { background: #204a35; border-color: rgba(95,168,122,0.65); transform: translateY(-1px); }
  .fw-btn-primary:active { transform: translateY(0); }

  .fw-input-row {
    display: flex; align-items: center; gap: 9px;
    padding: 11px 13px 13px;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: #0e0e0e; flex-shrink: 0;
  }
  #fw-inp {
    flex: 1; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 8px; padding: 9px 13px;
    font-family: 'Inter',system-ui,sans-serif; font-size: 13px; color: rgba(245,241,237,0.9);
    outline: none; transition: border-color 0.2s;
  }
  #fw-inp::placeholder { color: rgba(255,255,255,0.22); }
  #fw-inp:focus { border-color: rgba(95,168,122,0.4); }
  #fw-send {
    width: 36px; height: 36px; border-radius: 8px;
    background: #1a3a2a; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
  }
  #fw-send:hover  { background: #143020; transform: scale(1.06); }
  #fw-send:active { transform: scale(0.94); }
  .fw-foot {
    padding: 7px 14px 9px; text-align: center;
    font-family: 'Inter',system-ui,sans-serif;
    font-size: 10px; color: rgba(255,255,255,0.16); letter-spacing: 0.04em;
    background: #0e0e0e; border-top: 1px solid rgba(255,255,255,0.04); flex-shrink: 0;
  }
  @media (max-width: 480px) {
    #fw-cb-win { width: calc(100vw - 24px); height: min(85vh, 620px); right: 12px; bottom: 76px; }
    #fw-cb-btn { right: 16px; bottom: 16px; }
  }
  `;

  /* ─────────────────────────────────────────────────────────────
     HTML TEMPLATE
  ───────────────────────────────────────────────────────────── */
  const TMPL = `
  <button id="fw-cb-btn" aria-label="Chat with Framework Berlin" aria-expanded="false">
    <div class="fw-notif-dot"></div>
    <span class="ico-chat" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="rgba(255,255,255,0.92)" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </span>
    <span class="ico-x" aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
           stroke="rgba(255,255,255,0.88)" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6"  y1="6" x2="18" y2="18"/>
      </svg>
    </span>
  </button>

  <div id="fw-cb-win" role="dialog" aria-label="Framework Berlin chat" aria-hidden="true">
    <div class="fw-hdr">
      <div class="fw-avatar">F</div>
      <div>
        <div class="fw-hdr-name">Framework Berlin</div>
        <div class="fw-hdr-status"><span class="fw-status-dot"></span>Ask me anything</div>
      </div>
    </div>
    <div id="fw-msgs" aria-live="polite"></div>
    <div class="fw-chips-row"><div class="fw-chips" id="fw-chips"></div></div>
    <div class="fw-input-row">
      <input id="fw-inp" type="text" placeholder="Ask anything about Framework…"
             autocomplete="off" spellcheck="false" aria-label="Type your question" />
      <button id="fw-send" aria-label="Send">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="rgba(255,255,255,0.9)" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div class="fw-foot">Framework Berlin · Studio Assistant</div>
  </div>
  `;

  /* ─────────────────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────────────────── */
  function boot() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'fw-cb-root';
    root.innerHTML = TMPL;
    document.body.appendChild(root);

    const btn   = document.getElementById('fw-cb-btn');
    const win   = document.getElementById('fw-cb-win');
    const msgs  = document.getElementById('fw-msgs');
    const inp   = document.getElementById('fw-inp');
    const send  = document.getElementById('fw-send');
    const chips = document.getElementById('fw-chips');
    let opened  = false;

    btn.addEventListener('click', () => {
      opened = !opened;
      btn.classList.toggle('is-open', opened);
      win.classList.toggle('is-open', opened);
      btn.setAttribute('aria-expanded', opened);
      win.setAttribute('aria-hidden', !opened);
      if (opened) {
        if (!msgs.children.length) welcome();
        setTimeout(() => inp.focus(), 320);
      }
    });

    function welcome() {
      const lang = detectLang(navigator.language || '');
      setTimeout(() => {
        const text = lang === 'de'
          ? "Hey! 👋 Ich bin der Framework Berlin Assistent. Frag mich alles zu Kursen, Preisen, Studios oder dem Team."
          : "Hey! 👋 I'm the Framework Berlin assistant. Ask me anything about our classes, pricing, studios, or team.";
        const wChips = lang === 'de'
          ? ['Was ist Lagree?', 'Preise & Credits', 'Standorte', 'Tipps für Einsteiger']
          : ['What is Lagree?', 'Pricing & Credits', 'Studio Locations', 'First-timer tips'];
        addBot(text, wChips);
      }, 340);
    }

    function query(raw) {
      if (!raw.trim()) return;
      addUser(raw);
      renderChips([]);
      scrollDown();

      const typing = addTyping();
      scrollDown();

      setTimeout(() => {
        typing.remove();
        const lang   = detectLang(raw);
        const intent = findIntent(raw);
        if (intent && intent.id === 'booking') {
          startBookingFlow(lang);
        } else {
          const result = buildResponse(intent, lang);
          addBot(result.text, result.chips);
        }
        scrollDown();
      }, 540 + Math.random() * 460);
    }

    // ── BOOKING FLOW: ask which studio, then hand off to its Schedule page.
    // Kept separate from the normal intent/chip system because these are
    // real decision buttons (pick a studio, confirm) rather than suggested
    // follow-up questions, and the destination page/copy differs per studio. ──
    function startBookingFlow(lang) {
      const text = lang === 'de'
        ? 'Gerne! In welchem Studio möchtest du buchen?'
        : "I'd love to help! Which studio would you like to book at?";
      addBotActions(text, [
        { label: 'Prenzlauer Berg', onClick: () => chooseBookingLocation('pberg', 'Prenzlauer Berg', lang) },
        { label: 'Kreuzberg', onClick: () => chooseBookingLocation('xberg', 'Kreuzberg', lang) },
      ]);
    }

    function chooseBookingLocation(slug, name, lang) {
      addUser(name);
      const text = lang === 'de'
        ? `Perfekt! Um deine Buchung in ${name} abzuschließen, klicke unten:`
        : `Great choice! To complete your booking at ${name}, click below:`;
      addBotActions(text, [
        {
          label: lang === 'de' ? 'Buchung abschließen →' : 'Complete Booking →',
          onClick: () => { window.location.href = `${slug}-schedule.html`; },
        },
      ]);
    }

    function addBotActions(text, actions) {
      const w = document.createElement('div');
      w.className = 'fw-msg bot';
      const b = document.createElement('div');
      b.className = 'fw-bubble';
      b.innerHTML = md(text);
      w.appendChild(b);
      const row = document.createElement('div');
      row.className = 'fw-inline-actions';
      actions.forEach(({ label, onClick }) => {
        const btn = document.createElement('button');
        btn.className = 'fw-btn-primary';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        row.appendChild(btn);
      });
      w.appendChild(row);
      msgs.appendChild(w);
      renderChips([]);
      scrollDown();
    }

    function submit() {
      const t = inp.value.trim();
      if (!t) return;
      inp.value = '';
      query(t);
    }

    send.addEventListener('click', submit);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    function addUser(text) {
      const w = document.createElement('div');
      w.className = 'fw-msg user';
      const b = document.createElement('div');
      b.className = 'fw-bubble';
      b.textContent = text;
      w.appendChild(b);
      msgs.appendChild(w);
    }

    function addBot(text, chipList) {
      const w = document.createElement('div');
      w.className = 'fw-msg bot';
      const b = document.createElement('div');
      b.className = 'fw-bubble';
      b.innerHTML = md(text);
      w.appendChild(b);
      msgs.appendChild(w);
      renderChips(chipList || []);
    }

    function addTyping() {
      const el = document.createElement('div');
      el.className = 'fw-typing';
      el.innerHTML = '<div class="fw-dot"></div><div class="fw-dot"></div><div class="fw-dot"></div>';
      msgs.appendChild(el);
      return el;
    }

    function renderChips(list) {
      chips.innerHTML = '';
      list.forEach(label => {
        const b = document.createElement('button');
        b.className = 'fw-chip';
        b.textContent = label;
        b.addEventListener('click', () => query(label));
        chips.appendChild(b);
      });
    }

    function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();

})();
