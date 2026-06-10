import { Fragment } from "react";

import { usePortfolioEngine } from "@/components/hooks/usePortfolioEngine";
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
 * Portfolio scroll-engine island. Renders the full DOM the vanilla mount()
 * (portfolio.ts:71–334) built with verbatim class names, now state-driven:
 * engine state + behavior live in usePortfolioEngine. Behavior is at parity
 * with the vanilla site (the landing still uses native scroll here; discrete
 * stepping is Phase 3).
 */
export default function Portfolio({ data }: { data: PortfolioData }) {
  const SECTIONS = data.sections;
  const CONTACT = data.contact;

  const eng = usePortfolioEngine(data);
  const {
    viewportRef,
    landingRef,
    trackRef,
    stageRef,
    nameRef,
    roleRef,
    setOvMainRef,
    panels,
    sectionStart,
    sectionLen,
    groupStart,
    defaultBg,
    idx,
    stageOn,
    overviewOn,
    overviewSi,
    overviewMounted,
    bgIdx,
    activeSectionKey,
    goTo,
    enter,
    openSingleAt,
    showOverview,
    setIntroBg,
    onBrandIndex,
    onContact,
    onBack,
    onSectionNav,
    onPrevSec,
    onNextSec,
    onOverviewBack,
    onOvPrev,
    onOvNext,
    onOvChapter,
  } = eng;

  const p = panels[idx];
  const total = p ? p.g.frames.length + 1 : 0;
  const prevS = p ? SECTIONS[p.si - 1] : undefined;
  const nextS = p ? SECTIONS[p.si + 1] : undefined;
  const progScale = p ? (idx - (sectionStart[p.si] ?? 0)) / Math.max(1, (sectionLen[p.si] ?? 1) - 1) : 0;

  return (
    <div className="viewport theme-a" tabIndex={-1} ref={viewportRef}>
      {/* overlays */}
      <div className="vignette" />
      <div className="grain" />

      {/* ---- top bar ---- */}
      <div className="bar">
        <button className="brand" onClick={onBrandIndex}>
          MARCIN KULBICKI<small>Photography</small>
        </button>
        <div
          className="menu"
          onMouseLeave={() => {
            setIntroBg(defaultBg);
          }}
        >
          <button onClick={onBrandIndex}>Index</button>
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              className={cn(activeSectionKey === s.key && "active")}
              onMouseEnter={() => {
                setIntroBg(i);
              }}
              onClick={() => {
                onSectionNav(i);
              }}
            >
              {s.title}
            </button>
          ))}
          <button onClick={onContact}>Contact</button>
        </div>
      </div>

      {/* ---- landing ---- */}
      <div className="landing" ref={landingRef}>
        <div className="intro">
          {/* background layer — mirrors each section's landing hero, crossfades on hover */}
          <div className="intro-bg">
            {SECTIONS.map((s, i) => (
              <div key={s.key} className={cn("bgshot", i === bgIdx && "on")} data-key={s.key}>
                {s.landing ? makeImg(s.landing.src, "cover", s.landing.alt) : null}
              </div>
            ))}
          </div>
          <div className="intro-scrim" />

          <div className="name" ref={nameRef}>
            <span>MARCIN</span>
            <span>KULBICKI</span>
          </div>

          {/* role line with hoverable section names */}
          <div
            className="role"
            ref={roleRef}
            onMouseLeave={() => {
              setIntroBg(defaultBg);
            }}
          >
            <span className="role-pre">Photographer —</span>
            <div className="role-links">
              {SECTIONS.map((s, i) => (
                <Fragment key={s.key}>
                  {i > 0 ? <span className="role-sep">·</span> : null}
                  <button
                    className={cn("rolelink", i === bgIdx && "active")}
                    data-i={i}
                    onMouseEnter={() => {
                      setIntroBg(i);
                    }}
                    onFocus={() => {
                      setIntroBg(i);
                    }}
                    onClick={() => {
                      enter(i);
                    }}
                  >
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
          <div
            key={s.key}
            className="band"
            data-section={i}
            onClick={() => {
              enter(i);
            }}
          >
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
      <div className={cn("stage", stageOn && "on")} ref={stageRef}>
        <div className="progress">
          <div className="progbar" style={{ transform: "scaleX(" + String(progScale) + ")" }} />
        </div>

        <div className="track" ref={trackRef}>
          {panels.map((pan, i) => {
            const live = i === idx;
            if (pan.kind === "hero") {
              return (
                <div key={i} className={cn("panel hero", live && "live")}>
                  <div className="ph">{makeImg(pan.g.hero.full, "cover", pan.g.hero.alt)}</div>
                  <div className="pscrim" />
                  <div className="hero-cap">
                    <div className="eyebrow">
                      {`${pan.s.n} — ${pan.s.title} · Chapter ${pad(pan.gi + 1)} / ${pad(pan.s.groups.length)}`}
                    </div>
                    <div className="big">{pan.g.title}</div>
                    <div className="sub">
                      {pan.g.meta
                        ? pan.g.meta + " · " + String(pan.g.frames.length + 1) + " frames"
                        : String(pan.g.frames.length + 1) + " frames"}
                    </div>
                  </div>
                </div>
              );
            }
            const fr = pan.g.frames[pan.local - 1];
            return (
              <div key={i} className={cn("panel", live && "live")}>
                <div className="ph">{fr ? makeImg(fr.full, "contain", fr.alt) : null}</div>
                <div className="pscrim" />
              </div>
            );
          })}
        </div>

        <div className="hud">
          <div className="idx">{p ? pad(p.local + 1) + " / " + pad(total) : ""}</div>
          <div className="cap">
            {p ? (p.kind === "hero" ? p.g.title + (p.g.meta ? " — " + p.g.meta : "") : p.g.title) : ""}
          </div>
        </div>

        <div className="marker">{p ? p.s.n + " · " + p.s.title : ""}</div>

        <div className="rail" data-si={p ? String(p.si) : undefined}>
          {p
            ? p.s.groups.map((g, gi) => (
                <button
                  key={g.key}
                  className={cn(gi === p.gi && "on")}
                  onClick={() => {
                    goTo(groupStart.get(`${p.si}-${gi}`) ?? 0);
                  }}
                >
                  <span className="rn">{pad(gi + 1)}</span>
                  <span className="rt">{g.title}</span>
                </button>
              ))
            : null}
        </div>

        <div className="dots" data-gid={p ? `${p.si}-${p.gi}` : undefined}>
          {p
            ? Array.from({ length: total }).map((_, j) => {
                const gs = groupStart.get(`${p.si}-${p.gi}`) ?? 0;
                return (
                  <button
                    key={j}
                    aria-label={"Frame " + String(j + 1)}
                    className={cn(j === p.local && "on")}
                    onClick={() => {
                      goTo(gs + j);
                    }}
                  />
                );
              })
            : null}
        </div>

        <button className="backbtn" onClick={onBack}>
          <span>{"←"}</span> Index
        </button>

        <div className="pager">
          <button className="psec prev" style={{ visibility: prevS ? "visible" : "hidden" }} onClick={onPrevSec}>
            {prevS ? "↑ " + prevS.title : ""}
          </button>
          <button className="psec next" style={{ visibility: nextS ? "visible" : "hidden" }} onClick={onNextSec}>
            {nextS ? nextS.title + " ↓" : ""}
          </button>
        </div>

        <div className={cn("scrollcue", p && p.kind !== "hero" && "gone")}>
          Scroll to explore <span>{"↓"}</span>
        </div>

        {/* view toggle (Single | All) */}
        <div className="vtoggle">
          <button className="on">Single</button>
          <button
            onClick={() => {
              if (p) showOverview(p.si);
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* ---- overview (per-section editorial grid; lazily mounted) ---- */}
      {overviewMounted ? (
        <div className={cn("overview", overviewOn && "on")}>
          <button className="backbtn gback" onClick={onOverviewBack}>
            <span>{"←"}</span> Index
          </button>

          <div className="ov-chrome">
            <button
              className="ov-arrow"
              style={{ visibility: overviewSi > 0 ? "visible" : "hidden" }}
              onClick={onOvPrev}
            >
              {"‹"}
            </button>
            <div className="vtoggle">
              <button
                onClick={() => {
                  openSingleAt(sectionStart[overviewSi] ?? 0);
                }}
              >
                Single
              </button>
              <button className="on">All</button>
            </div>
            <button
              className="ov-arrow"
              style={{ visibility: overviewSi < SECTIONS.length - 1 ? "visible" : "hidden" }}
              onClick={onOvNext}
            >
              {"›"}
            </button>
          </div>

          {SECTIONS.map((s, si) => (
            <div key={s.key} className={cn("ov-section", si === overviewSi && "on")} data-si={si}>
              <div
                className="ov-main"
                ref={(node) => {
                  setOvMainRef(si, node);
                }}
              >
                <div className="ov-inner">
                  {s.groups.map((g, gi) => (
                    <Fragment key={g.key}>
                      <div className="ov-chead">
                        <span className="ocn">{pad(gi + 1)}</span>
                        <span className="oct">{g.title}</span>
                        {g.meta ? <span className="ocm">{g.meta}</span> : null}
                      </div>
                      <div className="ov-grid">
                        {[g.hero, ...g.frames].map((photo, j) => {
                          const panelIndex = (groupStart.get(`${si}-${gi}`) ?? 0) + j;
                          return (
                            <button
                              key={j}
                              className={cn("ov-cell", j === 0 && "lead")}
                              onClick={() => {
                                openSingleAt(panelIndex);
                              }}
                            >
                              {makeImg(photo.thumb, j === 0 ? "cover" : "contain", photo.alt)}
                              <span className="ov-ci">{pad(j + 1)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>

              <div className="ov-side">
                <span className="os-num">
                  {s.n} / {pad(SECTIONS.length)}
                </span>
                <div className="os-title">{s.title}</div>
                {s.tagline ? <div className="os-tag">{s.tagline}</div> : null}
                <div className="os-chapters">
                  {s.groups.map((g, gi) => (
                    <button
                      key={g.key}
                      className="os-ch"
                      onClick={() => {
                        onOvChapter(si, gi);
                      }}
                    >
                      <span className="osc-n">{pad(gi + 1)}</span>
                      <span className="osc-t">{g.title}</span>
                      <span className="osc-m">
                        {(g.meta ? g.meta + " · " : "") + String(g.frames.length + 1) + " frames"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="os-tags">
                  {s.tags.map((t, ti) => (
                    <span key={ti}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
