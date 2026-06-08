/* Tweaks panel for Marcin Kulbicki portfolio.
   Mounts a small React control panel that drives the vanilla-JS site
   through CSS variables + a data attribute on #stageRoot. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroLayout": "oneline",
  "nameScale": 1,
  "accent": "#ff3b1d",
  "introDim": 0.5
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const root = document.getElementById("stageRoot");
  if (!root) return;
  root.setAttribute("data-hero-layout", t.heroLayout);
  root.style.setProperty("--name-scale", String(t.nameScale));
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--intro-dim-settled", String(t.introDim));
}

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Hero name" />
      <TweakRadio
        label="Layout"
        value={t.heroLayout}
        options={[{ label: "One line", value: "oneline" }, { label: "Stacked", value: "stacked" }]}
        onChange={(v) => setTweak("heroLayout", v)}
      />
      <TweakSlider
        label="Size"
        value={t.nameScale}
        min={0.6} max={1.35} step={0.05}
        onChange={(v) => setTweak("nameScale", v)}
      />
      <TweakSection label="Backdrop" />
      <TweakSlider
        label="Dimming"
        value={t.introDim}
        min={0.35} max={1} step={0.05}
        onChange={(v) => setTweak("introDim", v)}
      />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={["#ff3b1d", "#ff8a1d", "#2a6fdb", "#e8c33f", "#edeae4"]}
        onChange={(v) => setTweak("accent", v)}
      />
    </TweaksPanel>
  );
}

// apply persisted/default tweaks immediately so the site reflects them on load
applyTweaks(TWEAK_DEFAULTS);

(function mountWhenReady() {
  const host = document.getElementById("tweaks-root");
  if (!host || typeof useTweaks === "undefined") { requestAnimationFrame(mountWhenReady); return; }
  ReactDOM.createRoot(host).render(<TweaksApp />);
})();
