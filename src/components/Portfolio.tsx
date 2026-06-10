import { Fragment } from "react";

import { cn } from "@/lib/utils";
import type { PortfolioData, Section } from "@/types";

function pad(n: number): string {
  return n < 10 ? "0" + String(n) : String(n);
}

function totalFrames(s: Section): number {
  let t = 0;
  s.groups.forEach((g) => {
    t += g.frames.length + 1;
  });
  return t;
}

// Mirror of the vanilla makeImg() (portfolio.ts:56–65): real <img class="slot">.
function makeImg(src: string, fit: "cover" | "contain", alt: string) {
  return (
    <img
      className="slot"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...(fit === "contain" ? { "data-fit": "contain" } : {})}
    />
  );
}

/**
 * Portfolio scroll-engine island. Phase 1 renders the complete static DOM the
 * vanilla mount() (portfolio.ts:71–334) built, with verbatim class names so the
 * unchanged portfolio.css styles it. Interactivity (handlers, state-driven
 * classes, the overview, the scroll-hijack) is wired in Phase 2.
 */
export default function Portfolio({ data }: { data: PortfolioData }) {
  const SECTIONS = data.sections;
  const CONTACT = data.contact;

  let defaultBg = 0;
  for (let z = 0; z < SECTIONS.length; z++) {
    if (SECTIONS[z]?.key === "portraits") {
      defaultBg = z;
      break;
    }
  }

  return (
    <div className="viewport theme-a" tabIndex={-1}>
      {/* overlays */}
      <div className="vignette" />
      <div className="grain" />

      {/* ---- top bar ---- */}
      <div className="bar">
        <button className="brand">
          MARCIN KULBICKI<small>Photography</small>
        </button>
        <div className="menu">
          <button>Index</button>
          {SECTIONS.map((s) => (
            <button key={s.key}>{s.title}</button>
          ))}
          <button>Contact</button>
        </div>
      </div>

      {/* ---- landing ---- */}
      <div className="landing">
        <div className="intro">
          {/* background layer — mirrors each section's landing hero, crossfades on hover */}
          <div className="intro-bg">
            {SECTIONS.map((s, i) => (
              <div key={s.key} className={cn("bgshot", i === defaultBg && "on")} data-key={s.key}>
                {s.landing ? makeImg(s.landing.src, "cover", s.landing.alt) : null}
              </div>
            ))}
          </div>
          <div className="intro-scrim" />

          <div className="name">
            <span>MARCIN</span>
            <span>KULBICKI</span>
          </div>

          {/* role line with hoverable section names */}
          <div className="role">
            <span className="role-pre">Photographer —</span>
            <div className="role-links">
              {SECTIONS.map((s, i) => (
                <Fragment key={s.key}>
                  {i > 0 ? <span className="role-sep">·</span> : null}
                  <button className={cn("rolelink", i === defaultBg && "active")} data-i={i}>
                    {s.title}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="cue">Scroll</div>
        </div>

        {/* section bands */}
        {SECTIONS.map((s, i) => (
          <div key={s.key} className="band" data-section={i}>
            <div className="ph">{s.landing ? makeImg(s.landing.src, "cover", s.landing.alt) : null}</div>
            <div className="scrim" />
            <div className="label">
              <div>
                <span className="num">
                  {s.n} / {pad(SECTIONS.length)}
                </span>
                <div className="ttl">{s.title}</div>
              </div>
              <div className="view">
                {s.groups.length} chapters · {totalFrames(s)} frames <span>{"↗"}</span>
              </div>
            </div>
          </div>
        ))}

        {/* contact band — minimal: name + email */}
        <div className="contact">
          <span className="c-eyebrow">Contact</span>
          <div className="c-name">{CONTACT.name}</div>
          <a className="c-mail" href={"mailto:" + CONTACT.email}>
            {CONTACT.email}
          </a>
          <div className="c-loc">{CONTACT.location}</div>
        </div>
      </div>

      {/* ---- stage ---- */}
      <div className="stage">
        <div className="progress">
          <div className="progbar" />
        </div>

        <div className="track">
          {SECTIONS.map((s) =>
            s.groups.map((g, gi) => (
              <Fragment key={`${s.key}-${g.key}`}>
                {/* chapter hero (first photo, cover) */}
                <div className="panel hero">
                  <div className="ph">{makeImg(g.hero.full, "cover", g.hero.alt)}</div>
                  <div className="pscrim" />
                  <div className="hero-cap">
                    <div className="eyebrow">
                      {`${s.n} — ${s.title} · Chapter ${pad(gi + 1)} / ${pad(s.groups.length)}`}
                    </div>
                    <div className="big">{g.title}</div>
                    <div className="sub">
                      {g.meta
                        ? g.meta + " · " + String(g.frames.length + 1) + " frames"
                        : String(g.frames.length + 1) + " frames"}
                    </div>
                  </div>
                </div>

                {/* frame photos (contain) */}
                {g.frames.map((fr, fi) => (
                  <div key={`${s.key}-${g.key}-f${fi}`} className="panel">
                    <div className="ph">{makeImg(fr.full, "contain", fr.alt)}</div>
                    <div className="pscrim" />
                  </div>
                ))}
              </Fragment>
            )),
          )}
        </div>

        <div className="hud">
          <div className="idx">01 / 07</div>
          <div className="cap" />
        </div>

        <div className="marker" />

        <div className="rail" />

        <div className="dots" />

        <button className="backbtn">
          <span>{"←"}</span> Index
        </button>

        <div className="pager">
          <button className="psec prev" />
          <button className="psec next" />
        </div>

        <div className="scrollcue">
          Scroll to explore <span>{"↓"}</span>
        </div>

        {/* view toggle (Single | All) */}
        <div className="vtoggle">
          <button className="on">Single</button>
          <button>All</button>
        </div>
      </div>
    </div>
  );
}
