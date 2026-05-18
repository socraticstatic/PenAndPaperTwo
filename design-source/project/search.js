// search.js — global ⌘K command bar for Pen & Paper
//
// Editorial-style search overlay. Triggers on ⌘K / Ctrl-K or click on the
// .topbar-meta "Search ⌘K" hint. Filters a small in-page catalog of pens,
// papers, pairings, and inks; navigates to the matching detail page on
// Enter / click. Recently-viewed items are persisted to localStorage so a
// reader can return to a specimen they had in hand.
//
// CLAUDE CODE · production wiring
// ─────────────────────────────────────────────────────────────────────────
// The CATALOG array below is hard-coded for the prototype. In production,
// replace `loadCatalog()` with a Supabase query that pulls a thin index
// across all four tables. Two options:
//
//  (a) Client-side: cache the index in IndexedDB and refresh on cold start
//        const { data } = await sb.rpc('search_index');
//      where `search_index()` is a Postgres function that unions thin
//      rows from pens / papers / pairings / inks (id, type, title, sub,
//      keywords, url) into one table.
//
//  (b) Server-side: a Postgres function `search_almanac(q text)` that
//      does ilike / websearch_to_tsquery against a generated tsvector
//      column on each table. Recommended once the catalog grows >500
//      entries.
//
// Recently-viewed tracking (recordVisit) should remain client-only.
// ─────────────────────────────────────────────────────────────────────────

(function () {
  const STORAGE_KEY = 'pp.recentlyViewed';
  const MAX_RECENT = 8;

  // ─── catalog (prototype data) ─────────────────────────────────────────
  // In production: replace with Supabase query. Each row needs at minimum:
  //   { type, id, brand, model, archiveNumber, keywords, meta, url, visual }
  const CATALOG = [
    // pens (id matches the slug used in /pens/:id)
    { type: 'pen',  id: 'pilot-custom-823',         archiveNumber: 3,  brand: 'Pilot',         model: 'Custom 823',          variant: 'Amber Demonstrator',  meta: '14k M · Vacuum · Japan · 1992', keywords: 'japan vacuum demonstrator sheen wet medium gold', visual: { kind: 'pen', silhouette: 'pen-classic',  color: 'oklch(28% 0.04 80)'  }, url: 'pen.html' },
    { type: 'pen',  id: 'pelikan-souveran-m800',    archiveNumber: 11, brand: 'Pelikan',       model: 'Souverän M800',       variant: '',                    meta: '18k B · Piston · Germany · 1997', keywords: 'germany piston broad gold pelikan striated', visual: { kind: 'pen', silhouette: 'pen-cigar',    color: 'oklch(32% 0.06 30)'  }, url: 'pen.html' },
    { type: 'pen',  id: 'lamy-2000',                archiveNumber: 24, brand: 'Lamy',          model: '2000 Bauhaus',        variant: '',                    meta: '14k F · Piston · Germany · 1966', keywords: 'germany piston bauhaus makrolon hooded modern', visual: { kind: 'pen', silhouette: 'pen-flat',     color: 'oklch(30% 0.012 255)' }, url: 'pen.html' },
    { type: 'pen',  id: 'sailor-pro-gear-naginata', archiveNumber: 38, brand: 'Sailor',        model: 'Pro Gear · Naginata', variant: '',                    meta: '21k MF · Cartridge · Japan',      keywords: 'japan sailor feedback cartridge', visual: { kind: 'pen', silhouette: 'pen-cigar',    color: 'oklch(22% 0.06 255)' }, url: 'pen.html' },
    { type: 'pen',  id: 'aurora-88-anniversary',    archiveNumber: 52, brand: 'Aurora',        model: '88 Anniversary',      variant: '',                    meta: '18k F · Piston · Italy',          keywords: 'italy piston anniversary aurora', visual: { kind: 'pen', silhouette: 'pen-classic',  color: 'oklch(30% 0.08 25)'  }, url: 'pen.html' },
    { type: 'pen',  id: 'nakaya-portable-heki',     archiveNumber: 69, brand: 'Nakaya',        model: 'Portable · Heki-Tamenuri', variant: '',                meta: '14k SF · Cartridge · Japan',      keywords: 'japan urushi nakaya hand-made tamenuri lacquer', visual: { kind: 'pen', silhouette: 'pen-vintage',  color: 'oklch(28% 0.05 145)' }, url: 'pen.html' },
    { type: 'pen',  id: 'twsbi-diamond-580-al',     archiveNumber: 84, brand: 'TWSBI',         model: 'Diamond 580 AL',      variant: '',                    meta: 'Steel EF · Piston · Taiwan',      keywords: 'taiwan demonstrator piston aluminum twsbi', visual: { kind: 'pen', silhouette: 'pen-faceted',  color: 'oklch(40% 0.012 255)' }, url: 'pen.html' },
    { type: 'pen',  id: 'platinum-3776-century',    archiveNumber: 97, brand: 'Platinum',      model: '#3776 Century UEF',   variant: '',                    meta: '14k UEF · Cartridge · Japan',     keywords: 'japan platinum century ultra-fine slip-cap', visual: { kind: 'pen', silhouette: 'pen-classic',  color: 'oklch(24% 0.07 255)' }, url: 'pen.html' },

    // papers
    { type: 'paper', id: 'tomoegawa-tomoe-river-s', archiveNumber: 1,  brand: 'Tomoegawa',         model: 'Tomoe River S',  variant: '', meta: '52 gsm · Cream · Japan',  keywords: 'japan tomoegawa thin sheen wet cream', visual: { kind: 'paper', tone: 'cream',  overlay: '' },     url: 'paper.html' },
    { type: 'paper', id: 'midori-md-notebook',      archiveNumber: 8,  brand: 'Midori',            model: 'MD Notebook',    variant: '', meta: '80 gsm · Ivory · Japan',  keywords: 'japan midori designphil md notebook', visual: { kind: 'paper', tone: 'ivory',  overlay: 'ruled' },     url: 'paper.html' },
    { type: 'paper', id: 'rhodia-no-16-dot-pad',    archiveNumber: 14, brand: 'Rhodia',            model: '№ 16 Dot Pad',   variant: '', meta: '80 gsm · Bright · France', keywords: 'france rhodia dot grid smooth bright', visual: { kind: 'paper', tone: 'bright', overlay: 'dot' },      url: 'paper.html' },
    { type: 'paper', id: 'clairefontaine-triomphe', archiveNumber: 27, brand: 'Clairefontaine',    model: 'Triomphe',       variant: '', meta: '90 gsm · Bright · France', keywords: 'france clairefontaine triomphe smooth crisp', visual: { kind: 'paper', tone: 'bright', overlay: '' },         url: 'paper.html' },
    { type: 'paper', id: 'crown-mill-cotton',       archiveNumber: 41, brand: 'Crown Mill',        model: 'Pure Cotton Laid', variant: '', meta: '100 gsm · Cream laid · Belgium', keywords: 'belgium crown mill cotton laid letter', visual: { kind: 'paper', tone: 'cream',  overlay: 'laid' },     url: 'paper.html' },
    { type: 'paper', id: 'maruman-mnemosyne',       archiveNumber: 56, brand: 'Maruman',           model: 'Mnemosyne 197',  variant: '', meta: '80 gsm · Ivory grid · Japan', keywords: 'japan maruman mnemosyne grid notes', visual: { kind: 'paper', tone: 'ivory',  overlay: 'grid' },     url: 'paper.html' },
    { type: 'paper', id: 'apica-cd-premium',        archiveNumber: 71, brand: 'Apica',             model: 'CD Premium',     variant: '', meta: '81 gsm · Ivory · Japan',   keywords: 'japan apica cd premium ivory ruled', visual: { kind: 'paper', tone: 'ivory',  overlay: 'ruled' },     url: 'paper.html' },
    { type: 'paper', id: 'g-lalo-velin',            archiveNumber: 88, brand: 'G. Lalo',           model: 'Vélin de France',variant: '', meta: '100 gsm · Cream laid · France', keywords: 'france lalo correspondence laid cream', visual: { kind: 'paper', tone: 'cream',  overlay: 'laid' },     url: 'paper.html' },

    // pairings
    { type: 'pairing', id: 'pairing-047', archiveNumber: 47, brand: 'Pairing', model: 'Custom 823 × Tomoe River',    variant: '', meta: 'Correspondence · Affinity 94', keywords: 'pilot tomoe sheen letter correspondence editor choice contemplative', visual: { kind: 'pairing' }, url: 'pairing.html' },
    { type: 'pairing', id: 'pairing-052', archiveNumber: 52, brand: 'Pairing', model: 'Lamy 2000 × Rhodia № 16',     variant: '', meta: 'Daily notes · Affinity 88',    keywords: 'lamy rhodia dot daily crisp morning notes', visual: { kind: 'pairing' }, url: 'pairing.html' },
    { type: 'pairing', id: 'pairing-061', archiveNumber: 61, brand: 'Pairing', model: 'Nakaya Portable × Crown Mill', variant: '', meta: 'Correspondence · Affinity 91', keywords: 'nakaya urushi crown mill cotton laid letter evening', visual: { kind: 'pairing' }, url: 'pairing.html' },
    { type: 'pairing', id: 'pairing-074', archiveNumber: 74, brand: 'Pairing', model: 'Pelikan M800 × Apica CD',     variant: '', meta: 'Journaling · Affinity 82',     keywords: 'pelikan apica workmanlike journaling daily', visual: { kind: 'pairing' }, url: 'pairing.html' },

    // inks
    { type: 'ink', id: 'iroshizuku-tsuki-yo',     archiveNumber: 14, brand: 'Pilot · Iroshizuku',     model: 'Tsuki-yo',             variant: 'Moonlit Night',  meta: 'Blue-black · Sheen 5/5',  keywords: 'japan iroshizuku tsuki-yo blue-black moonlit copper sheen', visual: { kind: 'ink', hex: 'oklch(24% 0.06 252)'  }, url: 'ink-detail.html' },
    { type: 'ink', id: 'diamine-oxblood',         archiveNumber: 41, brand: 'Diamine',                model: 'Oxblood',              variant: '',               meta: 'Burgundy · Sheen 4/5',    keywords: 'uk diamine oxblood burgundy red correspondence sheen', visual: { kind: 'ink', hex: 'oklch(28% 0.10 22)'   }, url: 'ink-detail.html' },
    { type: 'ink', id: 'sailor-yama-dori',        archiveNumber: 28, brand: 'Sailor',                 model: 'Yama-dori',            variant: 'Mountain Bird',  meta: 'Teal · Sheen 5/5',        keywords: 'japan sailor yama-dori teal sheen mountain bird', visual: { kind: 'ink', hex: 'oklch(34% 0.08 195)'  }, url: 'ink-detail.html' },
    { type: 'ink', id: 'kwz-ig-blue-black',       archiveNumber: 53, brand: 'KWZ Ink',                model: 'Iron Gall Blue-Black', variant: '',               meta: 'Iron gall · Archival',     keywords: 'poland kwz iron gall archival blue black permanent waterproof', visual: { kind: 'ink', hex: 'oklch(22% 0.04 252)'  }, url: 'ink-detail.html' },
    { type: 'ink', id: 'iroshizuku-take-sumi',    archiveNumber: 22, brand: 'Pilot · Iroshizuku',     model: 'Take-sumi',            variant: 'Bamboo Charcoal',meta: 'Black · Standard',         keywords: 'japan iroshizuku take-sumi bamboo charcoal black standard', visual: { kind: 'ink', hex: 'oklch(14% 0.008 250)' }, url: 'ink-detail.html' },
    { type: 'ink', id: 'robert-oster-fire-ice',   archiveNumber: 37, brand: 'Robert Oster',           model: 'Fire & Ice',           variant: '',               meta: 'Turquoise · Sheen 5/5',    keywords: 'australia robert oster fire ice turquoise red sheen', visual: { kind: 'ink', hex: 'oklch(50% 0.13 210)'  }, url: 'ink-detail.html' },
    { type: 'ink', id: 'diamine-magical-forest',  archiveNumber: 49, brand: 'Diamine · Shimmertastic',model: 'Magical Forest',       variant: '',               meta: 'Green · Gold shimmer',     keywords: 'uk diamine shimmertastic magical forest green shimmer gold', visual: { kind: 'ink', hex: 'oklch(32% 0.10 145)'  }, url: 'ink-detail.html' },
    { type: 'ink', id: 'iroshizuku-asa-gao',      archiveNumber: 19, brand: 'Pilot · Iroshizuku',     model: 'Asa-gao',              variant: 'Morning Glory',  meta: 'Blue · Sheen 3/5',         keywords: 'japan iroshizuku asa-gao morning glory blue vivid', visual: { kind: 'ink', hex: 'oklch(38% 0.13 265)'  }, url: 'ink-detail.html' },
  ];

  const TYPE_LABEL = { pen: 'PENS', paper: 'PAPERS', pairing: 'PAIRINGS', ink: 'INKS' };
  const TYPE_ORDER = ['pen', 'paper', 'pairing', 'ink'];

  // ─── styles (injected once) ───────────────────────────────────────────
  const STYLES = `
    .pp-search-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: color-mix(in oklch, var(--ink, #1a1f2e) 60%, transparent);
      backdrop-filter: blur(6px) saturate(120%);
      -webkit-backdrop-filter: blur(6px) saturate(120%);
      opacity: 0; pointer-events: none;
      transition: opacity 200ms ease;
    }
    .pp-search-backdrop.open { opacity: 1; pointer-events: auto; }

    .pp-search-modal {
      position: fixed; left: 50%; top: 12vh;
      transform: translateX(-50%) translateY(-8px) scale(0.985);
      width: min(720px, calc(100vw - 32px));
      max-height: 76vh;
      z-index: 9001;
      background: var(--paper, #f5f3ed);
      border: 1px solid var(--ink, #1a1f2e);
      box-shadow: 0 28px 80px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.08);
      display: flex; flex-direction: column;
      opacity: 0; pointer-events: none;
      transition: opacity 220ms ease, transform 220ms cubic-bezier(.2,.8,.2,1);
      font-family: var(--font-sans, "Helvetica Neue", Helvetica, Arial, sans-serif);
    }
    .pp-search-modal.open {
      opacity: 1; pointer-events: auto;
      transform: translateX(-50%) translateY(0) scale(1);
    }
    .pp-search-head {
      padding: 20px 28px 14px;
      border-bottom: 1px solid var(--hairline, #c5beb1);
    }
    .pp-search-eyebrow {
      display: flex; justify-content: space-between;
      font-family: var(--font-mono, "IBM Plex Mono", monospace);
      font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
      margin-bottom: 12px;
    }
    .pp-search-eyebrow .kbd {
      display: inline-flex; gap: 4px; align-items: center;
    }
    .pp-search-close {
      appearance: none; border: 0; background: transparent;
      font-family: var(--font-display, serif);
      font-size: 28px; line-height: 1;
      color: var(--ink-mute, #837a68);
      cursor: pointer; padding: 0 4px;
      transition: color 100ms;
    }
    .pp-search-close:hover { color: var(--oxblood, #5f1a23); }
    .pp-search-close-foot {
      appearance: none; border: 0; background: transparent;
      font: inherit; cursor: pointer; padding: 0;
      color: inherit;
    }
    .pp-search-close-foot:hover { color: var(--ink, #1a1f2e); }
    .pp-search-eyebrow kbd {
      font-family: var(--font-mono, monospace);
      font-size: 10px; letter-spacing: 0.06em;
      background: var(--paper-2, #ede7d8); color: var(--ink, #1a1f2e);
      border: 1px solid var(--hairline, #c5beb1);
      padding: 1px 6px; border-radius: 3px;
      text-transform: uppercase;
    }
    .pp-search-input {
      width: 100%; border: 0; background: transparent;
      font-family: var(--font-display, "Cormorant Garamond", serif);
      font-style: italic;
      font-size: 32px; line-height: 1.2;
      color: var(--ink, #1a1f2e);
      outline: none; padding: 0;
      letter-spacing: -0.005em;
    }
    .pp-search-input::placeholder {
      color: var(--ink-mute, #837a68);
      opacity: 0.8;
    }

    .pp-search-body {
      overflow-y: auto; flex: 1; min-height: 0;
      padding: 0 0 8px;
    }
    .pp-search-body::-webkit-scrollbar { width: 8px; }
    .pp-search-body::-webkit-scrollbar-thumb {
      background: var(--hairline, #c5beb1); border-radius: 4px;
    }

    .pp-search-empty {
      padding: 32px 28px;
      display: flex; flex-direction: column; gap: 22px;
    }
    .pp-search-empty h3 {
      font-family: var(--font-display, serif); font-weight: 400;
      font-size: 22px; line-height: 1.3;
      color: var(--ink-2, #3a4252);
      font-style: italic;
      max-width: 42ch;
    }
    .pp-search-empty h3 em { color: var(--oxblood, #5f1a23); }

    .pp-suggested-row {
      display: flex; flex-direction: column; gap: 14px;
    }
    .pp-suggested-row .lbl {
      font-family: var(--font-mono, monospace);
      font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
    }
    .pp-suggested-list {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .pp-suggested-list button {
      font: inherit; background: transparent; cursor: pointer;
      font-family: var(--font-display, serif); font-style: italic;
      font-size: 17px; color: var(--ink, #1a1f2e);
      border: 0; border-bottom: 1px solid var(--ink, #1a1f2e);
      padding: 2px 0 4px; line-height: 1;
    }
    .pp-suggested-list button:hover { color: var(--oxblood, #5f1a23); border-bottom-color: var(--oxblood, #5f1a23); }

    .pp-recent-mini {
      display: flex; flex-direction: column; gap: 6px;
    }
    .pp-recent-mini a {
      display: grid; grid-template-columns: 28px 1fr auto;
      gap: 12px; align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--hairline, #c5beb1);
      text-decoration: none; color: inherit;
    }
    .pp-recent-mini a:last-child { border-bottom: 0; }
    .pp-recent-mini a:hover { background: var(--paper-2, #ede7d8); }
    .pp-recent-mini .nm { font-family: var(--font-display, serif); font-size: 17px; }
    .pp-recent-mini .nm em { color: var(--oxblood, #5f1a23); font-style: italic; }
    .pp-recent-mini .meta { font-family: var(--font-mono, monospace); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-mute, #837a68); }

    .pp-result-group { padding: 14px 28px 6px; }
    .pp-result-group:not(:first-child) { border-top: 1px solid var(--hairline, #c5beb1); }
    .pp-result-group h4 {
      font-family: var(--font-mono, monospace);
      font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
      margin: 0 0 8px;
      display: flex; justify-content: space-between;
      font-weight: 500;
    }
    .pp-result {
      display: grid; grid-template-columns: 36px 1fr auto 14px;
      gap: 14px; align-items: center;
      padding: 10px 12px;
      border-radius: 3px;
      cursor: pointer;
      text-decoration: none; color: inherit;
      transition: background 80ms;
    }
    .pp-result + .pp-result { margin-top: -1px; }
    .pp-result:hover, .pp-result.selected {
      background: var(--paper-2, #ede7d8);
    }
    .pp-result .glyph {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--hairline, #c5beb1);
      background: var(--paper, #f5f3ed);
      flex-shrink: 0;
    }
    .pp-result .glyph svg { width: 28px; height: auto; }
    .pp-result .glyph.ink-glyph { padding: 0; }
    .pp-result .glyph.paper-glyph { position: relative; overflow: hidden; }
    .pp-result .glyph.paper-glyph.cream { background: oklch(94% 0.022 90); }
    .pp-result .glyph.paper-glyph.ivory { background: oklch(96% 0.014 85); }
    .pp-result .glyph.paper-glyph.bright { background: oklch(98% 0.005 240); }
    .pp-result .glyph.paper-glyph.ruled::after { content: ""; position: absolute; inset: 4px; background-image: repeating-linear-gradient(to bottom, transparent 0 5px, color-mix(in oklch, var(--sapphire, #1d3460) 50%, transparent) 5px 6px); }
    .pp-result .glyph.paper-glyph.dot::after { content: ""; position: absolute; inset: 4px; background-image: radial-gradient(circle, color-mix(in oklch, var(--sapphire, #1d3460) 60%, transparent) 0.6px, transparent 1px); background-size: 5px 5px; }
    .pp-result .glyph.paper-glyph.grid::after { content: ""; position: absolute; inset: 4px; background-image: linear-gradient(to right, color-mix(in oklch, var(--sapphire, #1d3460) 35%, transparent) 0 .5px, transparent .5px 100%), linear-gradient(to bottom, color-mix(in oklch, var(--sapphire, #1d3460) 35%, transparent) 0 .5px, transparent .5px 100%); background-size: 5px 5px; }
    .pp-result .glyph.paper-glyph.laid::after { content: ""; position: absolute; inset: 0; background-image: repeating-linear-gradient(to right, transparent 0 3px, color-mix(in oklch, var(--ink) 8%, transparent) 3px 4px); }
    .pp-result .glyph.pairing-glyph {
      font-family: var(--font-display, serif); font-style: italic; color: var(--oxblood, #5f1a23);
      font-size: 22px; line-height: 1;
    }
    .pp-result .body { min-width: 0; }
    .pp-result .body .nm {
      font-family: var(--font-display, serif);
      font-size: 20px; line-height: 1.05;
      letter-spacing: -0.005em;
      color: var(--ink, #1a1f2e);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .pp-result .body .nm em { color: var(--oxblood, #5f1a23); font-style: italic; }
    .pp-result .body .brand-line {
      font-family: var(--font-mono, monospace);
      font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
      margin-top: 3px;
    }
    .pp-result .body .meta {
      font-family: var(--font-mono, monospace);
      font-size: 9.5px; letter-spacing: .12em;
      color: var(--ink-mute, #837a68);
      margin-top: 1px;
    }
    .pp-result .archive-num {
      font-family: var(--font-mono, monospace);
      font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
      font-variant-numeric: tabular-nums;
    }
    .pp-result .caret {
      font-family: var(--font-display, serif);
      color: var(--ink-mute, #837a68);
      font-style: italic;
      opacity: 0;
      transition: opacity 80ms, color 80ms;
    }
    .pp-result.selected .caret, .pp-result:hover .caret {
      opacity: 1; color: var(--oxblood, #5f1a23);
    }
    .pp-result mark {
      background: oklch(92% 0.045 80);
      color: inherit;
      padding: 0 1px;
    }

    .pp-search-noresults {
      padding: 40px 28px;
      text-align: center;
      font-family: var(--font-display, serif);
      font-style: italic;
      font-size: 22px;
      color: var(--ink-mute, #837a68);
    }
    .pp-search-noresults em { color: var(--ink, #1a1f2e); font-style: italic; }

    .pp-search-foot {
      padding: 10px 18px;
      border-top: 1px solid var(--hairline, #c5beb1);
      display: flex; justify-content: space-between; align-items: center;
      gap: 18px;
      font-family: var(--font-mono, monospace);
      font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
      color: var(--ink-mute, #837a68);
      background: var(--paper-2, #ede7d8);
    }
    .pp-search-foot kbd {
      font-family: var(--font-mono, monospace);
      font-size: 9.5px; letter-spacing: .04em;
      background: var(--paper, #f5f3ed); color: var(--ink, #1a1f2e);
      border: 1px solid var(--hairline, #c5beb1);
      padding: 1px 6px; border-radius: 3px;
    }
    .pp-search-foot .grp { display: inline-flex; gap: 8px; align-items: center; }
    .pp-search-foot .grp + .grp { margin-left: 18px; }

    /* Make the topbar Search hint clickable */
    .pp-search-trigger { cursor: pointer; }
    .pp-search-trigger:hover { color: var(--ink, #1a1f2e); }

    @media (max-width: 640px) {
      .pp-search-modal { top: 6vh; max-height: 88vh; }
      .pp-search-input { font-size: 26px; }
      .pp-search-head { padding: 16px 20px 12px; }
      .pp-result-group { padding: 12px 18px 4px; }
    }
  `;

  // ─── DOM setup ────────────────────────────────────────────────────────
  let dom = null;
  function ensureDom() {
    if (dom) return dom;

    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'pp-search-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const modal = document.createElement('div');
    modal.className = 'pp-search-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Search the almanac');
    modal.innerHTML = `
      <div class="pp-search-head">
        <div class="pp-search-eyebrow">
          <span>Search · the almanac · ${CATALOG.length} entries</span>
          <button class="pp-search-close" type="button" aria-label="Close search">×</button>
        </div>
        <input class="pp-search-input" type="text" placeholder="by name, maker, hue, country, or year…" autocomplete="off" spellcheck="false" />
      </div>
      <div class="pp-search-body"></div>
      <div class="pp-search-foot">
        <span class="grp"><kbd>↑</kbd><kbd>↓</kbd>navigate</span>
        <span class="grp"><kbd>↵</kbd>open</span>
        <button type="button" class="pp-search-close-foot grp" style="margin-left:auto" aria-label="Close"><kbd>Esc</kbd>close</button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    dom = {
      backdrop, modal,
      input: modal.querySelector('.pp-search-input'),
      body:  modal.querySelector('.pp-search-body')
    };

    // listeners
    backdrop.addEventListener('click', close);
    dom.input.addEventListener('input', render);
    dom.input.addEventListener('keydown', onKey);
    modal.querySelector('.pp-search-close').addEventListener('click', close);
    modal.querySelector('.pp-search-close-foot').addEventListener('click', close);

    return dom;
  }

  // ─── pen silhouette SVG (compact) ─────────────────────────────────────
  // Detail pages have full silhouettes; the search modal lives outside
  // those <svg defs> blocks, so we inline a single tiny pen icon here.
  function penGlyph(silhouette, color) {
    return `<svg viewBox="0 0 240 40" style="color:${color}">
      <path d="M2 20 Q2 14 8 14 L94 14 L96 12 L96 28 L94 26 L8 26 Q2 26 2 20Z" fill="currentColor"/>
      <rect x="20" y="6" width="2" height="14" fill="currentColor"/>
      <path d="M96 12 L196 12 Q204 12 208 16 L222 20 L208 24 Q204 28 196 28 L96 28 Z" fill="currentColor"/>
      <path d="M222 20 L236 19.5 L238 20 L236 20.5 Z" fill="currentColor"/>
    </svg>`;
  }

  function inkGlyph(hex) {
    return `<span style="display:block; width:100%; height:100%; background:${hex};"></span>`;
  }

  function pairingGlyph() {
    return '×';
  }

  function glyphHtml(item) {
    const v = item.visual || {};
    if (v.kind === 'pen')     return `<span class="glyph">${penGlyph(v.silhouette, v.color)}</span>`;
    if (v.kind === 'ink')     return `<span class="glyph ink-glyph">${inkGlyph(v.hex)}</span>`;
    if (v.kind === 'paper')   return `<span class="glyph paper-glyph ${v.tone} ${v.overlay}"></span>`;
    if (v.kind === 'pairing') return `<span class="glyph pairing-glyph">${pairingGlyph()}</span>`;
    return `<span class="glyph"></span>`;
  }

  // ─── matching ─────────────────────────────────────────────────────────
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return escapeHtml(text).replace(re, '<mark>$1</mark>');
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  }

  function score(item, q) {
    if (!q) return 0;
    const ql = q.toLowerCase();
    const tokens = ql.split(/\s+/).filter(Boolean);
    if (!tokens.length) return 0;

    const fields = [
      [item.model || '',         50],
      [item.brand || '',         30],
      [item.variant || '',       20],
      [item.meta || '',          10],
      [item.keywords || '',       5],
      [String(item.archiveNumber).padStart(3, '0'), 40],   // search "003"
    ];

    let total = 0, allFound = true;
    for (const token of tokens) {
      let bestForToken = 0;
      for (const [val, weight] of fields) {
        const lower = val.toLowerCase();
        if (!lower) continue;
        if (lower === token)             bestForToken = Math.max(bestForToken, weight * 3);
        else if (lower.startsWith(token)) bestForToken = Math.max(bestForToken, weight * 2);
        else if (lower.includes(token))   bestForToken = Math.max(bestForToken, weight);
      }
      if (bestForToken === 0) allFound = false;
      total += bestForToken;
    }
    return allFound ? total : 0;
  }

  // ─── render ───────────────────────────────────────────────────────────
  let currentResults = [];   // flat array of items in display order
  let selectedIdx = 0;

  function render() {
    const q = dom.input.value.trim();
    selectedIdx = 0;

    if (!q) {
      renderEmpty();
      return;
    }

    // score & sort
    const scored = CATALOG.map(it => ({ it, s: score(it, q) }))
                          .filter(x => x.s > 0)
                          .sort((a, b) => b.s - a.s);

    if (!scored.length) {
      dom.body.innerHTML = `<div class="pp-search-noresults">Nothing in the cupboard matches <em>"${escapeHtml(q)}"</em>.</div>`;
      currentResults = [];
      return;
    }

    // group by type, preserving global score order within each
    const groups = {};
    for (const { it, s } of scored) {
      (groups[it.type] = groups[it.type] || []).push({ it, s });
    }

    currentResults = [];
    let html = '';
    for (const t of TYPE_ORDER) {
      if (!groups[t] || !groups[t].length) continue;
      html += `<div class="pp-result-group"><h4><span>${TYPE_LABEL[t]}</span><span>${groups[t].length}</span></h4>`;
      for (const { it } of groups[t]) {
        const idx = currentResults.length;
        currentResults.push(it);
        const archive = String(it.archiveNumber).padStart(3, '0');
        const name = highlight(it.model, q);
        const variant = it.variant ? ` <em>· ${escapeHtml(it.variant)}</em>` : '';
        const brand = highlight(it.brand, q);
        html += `<a class="pp-result" data-idx="${idx}" href="${it.url}">
          ${glyphHtml(it)}
          <span class="body">
            <span class="nm">${name}${variant}</span>
            <span class="brand-line">${brand}</span>
            <span class="meta">${escapeHtml(it.meta || '')}</span>
          </span>
          <span class="archive-num">№ ${archive}</span>
          <span class="caret">↵</span>
        </a>`;
      }
      html += '</div>';
    }

    dom.body.innerHTML = html;
    paintSelection();
    dom.body.querySelectorAll('.pp-result').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const it = currentResults[+el.dataset.idx];
        navigateTo(it);
      });
      el.addEventListener('mouseenter', () => {
        selectedIdx = +el.dataset.idx;
        paintSelection();
      });
    });
  }

  function renderEmpty() {
    const recent = readRecent();
    let html = `<div class="pp-search-empty">
      <h3>Search the almanac by maker, model, year, country, hue — or <em>archive number</em>.</h3>
      <div class="pp-suggested-row">
        <span class="lbl">Suggested</span>
        <div class="pp-suggested-list">
          <button data-q="iroshizuku">iroshizuku</button>
          <button data-q="sheen">sheen</button>
          <button data-q="japan">japan</button>
          <button data-q="laid cotton">laid cotton</button>
          <button data-q="vacuum">vacuum</button>
          <button data-q="14k">14k</button>
        </div>
      </div>`;

    if (recent.length) {
      html += `<div class="pp-suggested-row">
        <span class="lbl">Recently viewed</span>
        <div class="pp-recent-mini">${recent.map(r => `
          <a href="${r.url}">
            <span class="meta">№ ${String(r.archiveNumber).padStart(3, '0')}</span>
            <span class="nm">${escapeHtml(r.model)}${r.variant ? ` <em>· ${escapeHtml(r.variant)}</em>` : ''}</span>
            <span class="meta">${TYPE_LABEL[r.type]}</span>
          </a>`).join('')}
        </div>
      </div>`;
    }

    html += `</div>`;
    dom.body.innerHTML = html;
    currentResults = [];
    dom.body.querySelectorAll('button[data-q]').forEach(b => {
      b.addEventListener('click', () => { dom.input.value = b.dataset.q; dom.input.focus(); render(); });
    });
  }

  function paintSelection() {
    const all = dom.body.querySelectorAll('.pp-result');
    all.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
    const sel = all[selectedIdx];
    if (sel) sel.scrollIntoViewIfNeeded ? sel.scrollIntoViewIfNeeded(false) : sel.scrollIntoView({ block: 'nearest' });
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = (selectedIdx + 1) % currentResults.length; paintSelection(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = (selectedIdx - 1 + currentResults.length) % currentResults.length; paintSelection(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = currentResults[selectedIdx];
      if (it) navigateTo(it);
    }
  }

  function navigateTo(item) {
    recordVisit(item);
    window.location = item.url;
  }

  function open() {
    ensureDom();
    dom.backdrop.classList.add('open');
    dom.modal.classList.add('open');
    requestAnimationFrame(() => dom.input.focus());
    render();
  }
  function close() {
    if (!dom) return;
    dom.backdrop.classList.remove('open');
    dom.modal.classList.remove('open');
    dom.input.value = '';
  }
  function toggle() { dom?.modal.classList.contains('open') ? close() : open(); }

  // ─── recently-viewed ──────────────────────────────────────────────────
  function readRecent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function recordVisit(item) {
    const recent = readRecent().filter(r => r.id !== item.id);
    recent.unshift({
      type: item.type, id: item.id,
      brand: item.brand, model: item.model, variant: item.variant,
      meta: item.meta, archiveNumber: item.archiveNumber,
      url: item.url, visual: item.visual,
      visitedAt: Date.now()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  }

  // ─── public API + auto-record on detail pages ─────────────────────────
  window.PenAndPaperSearch = {
    open, close, toggle,
    getCatalog: () => CATALOG.slice(),
    getRecent:  readRecent,
    record:     recordVisit,
  };

  // global ⌘K / Ctrl-K
  document.addEventListener('keydown', (e) => {
    const cmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
    if (cmdK) { e.preventDefault(); toggle(); return; }
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault(); open();
    }
  });

  // make the topbar "Search ⌘K" hint clickable on every page
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.topbar-meta span').forEach(s => {
      if (s.textContent.trim().toLowerCase().startsWith('search')) {
        s.classList.add('pp-search-trigger');
        s.addEventListener('click', open);
      }
    });

    // auto-record a visit when the current page IS a detail page
    const path = location.pathname.split('/').pop();
    const match = CATALOG.find(it => it.url === path);
    if (match) recordVisit(match);
  });
})();
