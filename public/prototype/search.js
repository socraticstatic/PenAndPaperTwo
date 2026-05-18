// search.js — global ⌘K command bar for Pen & Paper
//
// Editorial-style search overlay. Triggers on ⌘K / Ctrl-K or click on the
// .topbar-meta "Search ⌘K" hint. Queries Supabase across pens, papers,
// pairings, and inks via two RPCs:
//
//   public.search_index()     → thin catalogue, fetched once at init,
//                              used for recently-viewed lookup by URL
//                              and the empty-state recents rail.
//   public.search_almanac(q)  → ts_rank live search across all four
//                              entity types, called on each keystroke.
//
// Recently-viewed items persist to localStorage under the same key as
// the prototype. Modal DOM, keyboard contract, and styling are
// unchanged from the design — only the data layer is rewritten.
//
// Browser config (set by app/layout.tsx as window.ppSupabaseConfig):
//   { url: 'https://<project>.supabase.co', anonKey: '<jwt>' }

(function () {
  const STORAGE_KEY = "pp.recentlyViewed";
  const MAX_RECENT = 8;

  // Catalogue populated from DB on init. Empty initially. Used for the
  // empty-state recents rail and for matching the current pathname to
  // a row on detail-page visits.
  const CATALOG = [];

  const TYPE_LABEL = { pen: "PENS", paper: "PAPERS", pairing: "PAIRINGS", ink: "INKS" };
  const TYPE_ORDER = ["pen", "paper", "pairing", "ink"];

  const STYLES = `
  .pp-search-backdrop { position: fixed; inset: 0; background: oklch(20% 0.02 80 / 0.55); backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 120ms ease; z-index: 9998; }
  .pp-search-backdrop.open { opacity: 1; pointer-events: auto; }
  .pp-search-modal { position: fixed; top: 8vh; left: 50%; transform: translateX(-50%) scale(.98); width: min(720px, 92vw); max-height: 78vh; display: flex; flex-direction: column; background: oklch(97.2% 0.008 82); border: .5px solid oklch(40% 0.02 80 / .25); box-shadow: 0 24px 60px oklch(20% 0.02 80 / .25); opacity: 0; pointer-events: none; transition: opacity 120ms ease, transform 120ms ease; z-index: 9999; font-family: var(--font-sans, "Helvetica Neue", Arial, sans-serif); color: oklch(22% 0.02 80); }
  .pp-search-modal.open { opacity: 1; pointer-events: auto; transform: translateX(-50%) scale(1); }
  .pp-search-head { padding: 16px 20px 12px; border-bottom: .5px solid oklch(40% 0.02 80 / .15); }
  .pp-search-eyebrow { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--font-mono, "IBM Plex Mono", monospace); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: oklch(40% 0.02 80 / .6); margin-bottom: 10px; }
  .pp-search-close { appearance: none; background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; color: oklch(40% 0.02 80); }
  .pp-search-input { width: 100%; appearance: none; border: none; outline: none; background: transparent; font-family: var(--font-display, "Cormorant Garamond", serif); font-size: 28px; line-height: 1.2; color: oklch(20% 0.02 80); }
  .pp-search-input::placeholder { color: oklch(40% 0.02 80 / .35); font-style: italic; }
  .pp-search-body { overflow-y: auto; padding: 8px 4px 0; flex: 1; min-height: 0; }
  .pp-result-group { padding: 6px 16px 14px; }
  .pp-result-group h4 { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--font-mono, monospace); font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; color: oklch(40% 0.02 80 / .6); margin: 8px 0 6px; padding-bottom: 6px; border-bottom: .5px solid oklch(40% 0.02 80 / .15); }
  .pp-result { display: grid; grid-template-columns: 56px 1fr auto auto; gap: 14px; align-items: center; padding: 10px 12px; border-radius: 2px; text-decoration: none; color: inherit; cursor: pointer; }
  .pp-result.selected, .pp-result:hover { background: oklch(94% 0.012 82); }
  .pp-result .glyph { width: 56px; height: 28px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .pp-result .glyph svg { width: 56px; height: auto; }
  .pp-result .glyph.ink-glyph { width: 18px; height: 18px; border-radius: 50%; }
  .pp-result .glyph.paper-glyph { width: 20px; height: 26px; background: oklch(94% 0.022 90); border: .5px solid oklch(40% 0.02 80 / .2); }
  .pp-result .glyph.paper-glyph.bright { background: oklch(98% 0.005 240); }
  .pp-result .glyph.paper-glyph.ivory  { background: oklch(95% 0.015 75); }
  .pp-result .glyph.paper-glyph.cream  { background: oklch(94% 0.022 90); }
  .pp-result .glyph.pairing-glyph { font-family: var(--font-display, serif); font-style: italic; font-size: 22px; color: oklch(35% 0.13 25); }
  .pp-result .body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .pp-result .nm { font-family: var(--font-display, serif); font-size: 17px; line-height: 1.2; }
  .pp-result .nm em { color: oklch(35% 0.13 25); font-style: italic; }
  .pp-result .brand-line { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: oklch(40% 0.02 80 / .65); }
  .pp-result .meta { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: .1em; color: oklch(40% 0.02 80 / .55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pp-result .archive-num { font-family: var(--font-mono, monospace); font-size: 10.5px; letter-spacing: .14em; color: oklch(40% 0.02 80 / .55); }
  .pp-result .caret { font-family: var(--font-mono, monospace); font-size: 11px; color: oklch(40% 0.02 80 / .35); }
  .pp-search-noresults, .pp-search-loading { padding: 28px 28px 30px; color: oklch(40% 0.02 80 / .65); font-family: var(--font-display, serif); font-style: italic; }
  .pp-search-empty { padding: 18px 24px 22px; }
  .pp-search-empty h3 { font-family: var(--font-display, serif); font-weight: 300; font-size: 22px; line-height: 1.3; color: oklch(30% 0.02 80); margin: 0 0 16px; max-width: 540px; }
  .pp-search-empty h3 em { color: oklch(35% 0.13 25); font-style: italic; }
  .pp-suggested-row { display: flex; align-items: flex-start; gap: 16px; margin-top: 14px; }
  .pp-suggested-row .lbl { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: oklch(40% 0.02 80 / .6); padding-top: 6px; min-width: 110px; }
  .pp-suggested-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .pp-suggested-list button { appearance: none; border: .5px solid oklch(40% 0.02 80 / .25); background: transparent; padding: 4px 10px; font-family: var(--font-mono, monospace); font-size: 11px; letter-spacing: .04em; cursor: pointer; color: oklch(28% 0.02 80); }
  .pp-suggested-list button:hover { background: oklch(94% 0.012 82); }
  .pp-recent-mini { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .pp-recent-mini a { display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: baseline; text-decoration: none; color: inherit; padding: 4px 0; }
  .pp-recent-mini a:hover .nm { text-decoration: underline; }
  .pp-recent-mini .meta { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: .1em; color: oklch(40% 0.02 80 / .55); }
  .pp-recent-mini .nm { font-family: var(--font-display, serif); font-size: 16px; line-height: 1.2; }
  .pp-recent-mini .nm em { color: oklch(35% 0.13 25); font-style: italic; }
  .pp-search-foot { padding: 10px 18px; border-top: .5px solid oklch(40% 0.02 80 / .15); display: flex; gap: 18px; font-family: var(--font-mono, monospace); font-size: 10.5px; letter-spacing: .1em; color: oklch(40% 0.02 80 / .55); }
  .pp-search-foot .grp { display: inline-flex; align-items: center; gap: 6px; }
  .pp-search-foot kbd { font-family: inherit; font-size: 10px; padding: 1px 5px; border: .5px solid oklch(40% 0.02 80 / .25); border-radius: 2px; color: oklch(28% 0.02 80); margin-right: 2px; }
  .pp-search-foot .pp-search-close-foot { appearance: none; background: transparent; border: none; padding: 0; cursor: pointer; color: inherit; font: inherit; }
  .pp-search-trigger { cursor: pointer; }
  .pp-search-trigger:hover { color: oklch(35% 0.13 25); }
  mark { background: oklch(35% 0.13 25 / .18); color: inherit; padding: 0 2px; border-radius: 1px; }
  `;

  // ─── DB plumbing ──────────────────────────────────────────────────────
  function cfg() {
    return (typeof window !== "undefined" && window.ppSupabaseConfig) || null;
  }
  async function rpc(fn, args) {
    const c = cfg();
    if (!c?.url || !c?.anonKey) {
      console.warn("[search] ppSupabaseConfig missing — search disabled");
      return [];
    }
    let res;
    try {
      res = await fetch(`${c.url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: c.anonKey,
          Authorization: `Bearer ${c.anonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(args || {}),
      });
    } catch (err) {
      console.warn("[search] rpc", fn, "network error", err);
      return [];
    }
    if (!res.ok) {
      console.warn("[search] rpc", fn, "status", res.status);
      return [];
    }
    try { return await res.json(); } catch (_) { return []; }
  }

  function toCatalogItem(r) {
    return {
      type: r.type,
      id: r.id,
      archiveNumber: r.archive_number,
      brand: r.brand,
      model: r.model,
      variant: r.variant,
      meta: r.meta,
      keywords: r.keywords,
      visual: r.visual || {},
      url: r.url,
    };
  }

  async function loadCatalog() {
    const rows = await rpc("search_index", {});
    if (!Array.isArray(rows)) return;
    CATALOG.length = 0;
    for (const r of rows) CATALOG.push(toCatalogItem(r));
    // Catalogue is loaded — try to record the current detail page as a
    // visit (the earlier DOMContentLoaded pass may have run before
    // CATALOG had any rows to match against).
    const match = CATALOG.find((it) => it.url === location.pathname);
    if (match) recordVisit(match);
  }

  // ─── modal DOM ────────────────────────────────────────────────────────
  let dom = null;
  function ensureDom() {
    if (dom) return dom;

    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    const backdrop = document.createElement("div");
    backdrop.className = "pp-search-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const modal = document.createElement("div");
    modal.className = "pp-search-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Search the almanac");
    modal.innerHTML = `
      <div class="pp-search-head">
        <div class="pp-search-eyebrow">
          <span>Search · the almanac</span>
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
      input: modal.querySelector(".pp-search-input"),
      body:  modal.querySelector(".pp-search-body"),
    };

    backdrop.addEventListener("click", close);
    dom.input.addEventListener("input", scheduleRender);
    dom.input.addEventListener("keydown", onKey);
    modal.querySelector(".pp-search-close").addEventListener("click", close);
    modal.querySelector(".pp-search-close-foot").addEventListener("click", close);

    return dom;
  }

  // ─── glyphs ────────────────────────────────────────────────────────────
  function penGlyph(_silhouette, color) {
    return `<svg viewBox="0 0 240 40" style="color:${color || "oklch(28% 0.04 80)"}">
      <path d="M2 20 Q2 14 8 14 L94 14 L96 12 L96 28 L94 26 L8 26 Q2 26 2 20Z" fill="currentColor"/>
      <rect x="20" y="6" width="2" height="14" fill="currentColor"/>
      <path d="M96 12 L196 12 Q204 12 208 16 L222 20 L208 24 Q204 28 196 28 L96 28 Z" fill="currentColor"/>
      <path d="M222 20 L236 19.5 L238 20 L236 20.5 Z" fill="currentColor"/>
    </svg>`;
  }
  function inkGlyph(hex) {
    return `<span style="display:block; width:100%; height:100%; background:${hex || "#222"};"></span>`;
  }
  function pairingGlyph() { return "×"; }
  function glyphHtml(item) {
    const v = item.visual || {};
    if (v.kind === "pen")     return `<span class="glyph">${penGlyph(v.silhouette, v.color)}</span>`;
    if (v.kind === "ink")     return `<span class="glyph ink-glyph">${inkGlyph(v.hex)}</span>`;
    if (v.kind === "paper")   return `<span class="glyph paper-glyph ${v.tone || ""} ${v.overlay || ""}"></span>`;
    if (v.kind === "pairing") return `<span class="glyph pairing-glyph">${pairingGlyph()}</span>`;
    return `<span class="glyph"></span>`;
  }

  // ─── text helpers ──────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return escapeHtml(text).replace(re, "<mark>$1</mark>");
  }

  // ─── render ────────────────────────────────────────────────────────────
  let currentResults = [];
  let selectedIdx = 0;
  let renderToken = 0;
  let renderTimer = null;

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 150);
  }

  async function render() {
    const q = (dom.input.value || "").trim();
    selectedIdx = 0;
    if (!q) {
      renderEmpty();
      return;
    }
    const token = ++renderToken;
    // optimistic loading state
    dom.body.innerHTML = `<div class="pp-search-loading">Searching the almanac…</div>`;
    const rows = await rpc("search_almanac", { q, lim: 30 });
    if (token !== renderToken) return; // newer query in flight
    const items = (Array.isArray(rows) ? rows : []).map(toCatalogItem);
    if (!items.length) {
      dom.body.innerHTML = `<div class="pp-search-noresults">Nothing in the cupboard matches <em>"${escapeHtml(q)}"</em>.</div>`;
      currentResults = [];
      return;
    }

    const groups = {};
    for (const it of items) (groups[it.type] = groups[it.type] || []).push(it);

    currentResults = [];
    let html = "";
    for (const t of TYPE_ORDER) {
      if (!groups[t] || !groups[t].length) continue;
      html += `<div class="pp-result-group"><h4><span>${TYPE_LABEL[t]}</span><span>${groups[t].length}</span></h4>`;
      for (const it of groups[t]) {
        const idx = currentResults.length;
        currentResults.push(it);
        const archive = String(it.archiveNumber ?? "").padStart(3, "0");
        const name = highlight(it.model || "", q);
        const variant = it.variant ? ` <em>· ${escapeHtml(it.variant)}</em>` : "";
        const brand = highlight(it.brand || "", q);
        html += `<a class="pp-result" data-idx="${idx}" href="${escapeHtml(it.url)}">
          ${glyphHtml(it)}
          <span class="body">
            <span class="nm">${name}${variant}</span>
            <span class="brand-line">${brand}</span>
            <span class="meta">${escapeHtml(it.meta || "")}</span>
          </span>
          <span class="archive-num">№ ${archive}</span>
          <span class="caret">↵</span>
        </a>`;
      }
      html += "</div>";
    }

    dom.body.innerHTML = html;
    paintSelection();
    dom.body.querySelectorAll(".pp-result").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const it = currentResults[+el.dataset.idx];
        navigateTo(it);
      });
      el.addEventListener("mouseenter", () => {
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
        <div class="pp-recent-mini">${recent.map((r) => `
          <a href="${escapeHtml(r.url)}">
            <span class="meta">№ ${String(r.archiveNumber ?? "").padStart(3, "0")}</span>
            <span class="nm">${escapeHtml(r.model)}${r.variant ? ` <em>· ${escapeHtml(r.variant)}</em>` : ""}</span>
            <span class="meta">${TYPE_LABEL[r.type] || ""}</span>
          </a>`).join("")}
        </div>
      </div>`;
    }

    html += `</div>`;
    dom.body.innerHTML = html;
    currentResults = [];
    dom.body.querySelectorAll("button[data-q]").forEach((b) => {
      b.addEventListener("click", () => { dom.input.value = b.dataset.q; dom.input.focus(); render(); });
    });
  }

  function paintSelection() {
    const all = dom.body.querySelectorAll(".pp-result");
    all.forEach((el, i) => el.classList.toggle("selected", i === selectedIdx));
    const sel = all[selectedIdx];
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (!currentResults.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); selectedIdx = (selectedIdx + 1) % currentResults.length; paintSelection(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selectedIdx = (selectedIdx - 1 + currentResults.length) % currentResults.length; paintSelection(); }
    else if (e.key === "Enter") {
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
    dom.backdrop.classList.add("open");
    dom.modal.classList.add("open");
    requestAnimationFrame(() => dom.input.focus());
    render();
  }
  function close() {
    if (!dom) return;
    dom.backdrop.classList.remove("open");
    dom.modal.classList.remove("open");
    dom.input.value = "";
  }
  function toggle() { dom?.modal.classList.contains("open") ? close() : open(); }

  // ─── recently-viewed ──────────────────────────────────────────────────
  function readRecent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (_) { return []; }
  }
  function recordVisit(item) {
    if (!item || !item.id) return;
    const recent = readRecent().filter((r) => r.id !== item.id);
    recent.unshift({
      type: item.type, id: item.id,
      brand: item.brand, model: item.model, variant: item.variant,
      meta: item.meta, archiveNumber: item.archiveNumber,
      url: item.url, visual: item.visual,
      visitedAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  }

  // ─── public API + auto-record on detail pages ─────────────────────────
  window.PenAndPaperSearch = {
    open, close, toggle,
    getCatalog: () => CATALOG.slice(),
    getRecent: readRecent,
    record: recordVisit,
    reloadCatalog: loadCatalog,
  };

  // global ⌘K / Ctrl-K  +  "/" Slack-style shortcut
  document.addEventListener("keydown", (e) => {
    const cmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
    if (cmdK) { e.preventDefault(); toggle(); return; }
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault(); open();
    }
  });

  // Topbar "Search ⌘K" hint clickable on every page. Plus auto-record
  // the current detail page once the catalogue arrives.
  function wireTopbar() {
    document.querySelectorAll(".topbar-meta span").forEach((s) => {
      if (s.textContent.trim().toLowerCase().startsWith("search")) {
        s.classList.add("pp-search-trigger");
        s.addEventListener("click", open);
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireTopbar);
  } else {
    wireTopbar();
  }

  // Kick off the catalogue load. recordVisit for the current path will
  // fire from inside loadCatalog() once rows arrive.
  loadCatalog();
})();
