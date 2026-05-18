// tweaks.jsx — Pen & Paper site tweaks
// Loaded after tweaks-panel.jsx (which provides TweaksPanel, useTweaks, controls).

const PP_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#3a1a1f","#1c2c47","#3a4426"],
  "accent": "#5b1f24",
  "density": "regular",
  "displayFont": "Cormorant Garamond",
  "bodyFont": "Helvetica Neue",
  "paperTone": "ivory",
  "heroVariant": "editorial",
  "filterStyle": "facets"
}/*EDITMODE-END*/;

// Curated palettes — each is [accent, secondary, tertiary]
const PALETTES = [
  ["#5b1f24","#1c2c47","#3a4426"],  // oxblood + sapphire + moss (default)
  ["#3a1a1f","#2a1a08","#4a3a1a"],  // deep ink + sepia
  ["#1c2c47","#2c4458","#5a6b7a"],  // midnight blues
  ["#3a2a1a","#4a3520","#6a5530"],  // walnut + brass
  ["#22232a","#5a5a62","#8a8a8e"]   // pure mono
];

const DISPLAY_FONTS = [
  "Cormorant Garamond",
  "Spectral",
  "EB Garamond",
  "Tenor Sans"
];
const BODY_FONTS = [
  "Helvetica Neue",
  "Inter Tight",
  "DM Sans",
  "Public Sans"
];

// ensure new google fonts get loaded as user switches
function ensureFontLoaded(family) {
  const id = `gf-${family.replace(/\s+/g,'-')}`;
  if (document.getElementById(id)) return;
  if (family === "Helvetica Neue") return; // system
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g,'+')}:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap`;
  document.head.appendChild(link);
}

function App() {
  const [t, setTweak] = useTweaks(PP_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    const body = document.body;
    // palette
    const [a, b, c] = t.palette;
    r.setProperty('--oxblood', a);
    r.setProperty('--sapphire', b);
    r.setProperty('--moss', c);
    // fonts
    ensureFontLoaded(t.displayFont);
    ensureFontLoaded(t.bodyFont);
    r.setProperty('--font-display', `"${t.displayFont}", "Cormorant Garamond", serif`);
    r.setProperty('--font-sans', `"${t.bodyFont}", "Helvetica Neue", Arial, sans-serif`);
    // paper tone
    const tones = {
      ivory:  { paper: 'oklch(97.2% 0.008 82)',  paper2: 'oklch(94.5% 0.012 82)', paper3: 'oklch(91% 0.014 82)' },
      bright: { paper: 'oklch(98.5% 0.003 240)', paper2: 'oklch(96% 0.005 240)', paper3: 'oklch(93% 0.007 240)' },
      warm:   { paper: 'oklch(95.5% 0.018 75)',  paper2: 'oklch(92.5% 0.022 75)', paper3: 'oklch(89% 0.026 75)' }
    };
    const tone = tones[t.paperTone] || tones.ivory;
    r.setProperty('--paper', tone.paper);
    r.setProperty('--paper-2', tone.paper2);
    r.setProperty('--paper-3', tone.paper3);
    // density
    body.classList.toggle('dense', t.density === 'compact');
    body.classList.toggle('roomy', t.density === 'comfy');
    // hero variant
    body.dataset.hero = t.heroVariant;
    body.dataset.filterstyle = t.filterStyle;
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Palette" />
      <TweakColor
        label="Ink palette"
        value={t.palette}
        options={PALETTES}
        onChange={(v) => setTweak('palette', v)}
      />
      <TweakRadio
        label="Paper tone"
        value={t.paperTone}
        options={['ivory','bright','warm']}
        onChange={(v) => setTweak('paperTone', v)}
      />

      <TweakSection label="Typography" />
      <TweakSelect
        label="Display"
        value={t.displayFont}
        options={DISPLAY_FONTS}
        onChange={(v) => setTweak('displayFont', v)}
      />
      <TweakSelect
        label="Body"
        value={t.bodyFont}
        options={BODY_FONTS}
        onChange={(v) => setTweak('bodyFont', v)}
      />

      <TweakSection label="Layout" />
      <TweakRadio
        label="Density"
        value={t.density}
        options={['compact','regular']}
        onChange={(v) => setTweak('density', v)}
      />
      <TweakRadio
        label="Hero"
        value={t.heroVariant}
        options={['editorial','triptych']}
        onChange={(v) => setTweak('heroVariant', v)}
      />
      <TweakRadio
        label="Filter style"
        value={t.filterStyle}
        options={['facets','spectrum']}
        onChange={(v) => setTweak('filterStyle', v)}
      />
    </TweaksPanel>
  );
}

const __ppRoot = document.createElement('div');
document.body.appendChild(__ppRoot);
ReactDOM.createRoot(__ppRoot).render(<App/>);
