// core
import { Fragment } from "react";

// others
import { usePortfolioEngine } from "./hooks/usePortfolioEngine";
import { cn } from "../lib/utils";
import type { PortfolioData, Section } from "../types";

function pad(value: number): string {
  return value < 10 ? "0" + String(value) : String(value);
}

function totalFrames(section: Section): number {
  let total = 0;
  section.groups.forEach((group) => {
    total += group.frames.length + 1;
  });
  return total;
}

// Mirror of the vanilla makeImg() (portfolio.ts:56–65): real <img class="slot">.
function makeImage(src: string, fit: "cover" | "contain", alt: string) {
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
 * with the vanilla site, plus the discrete landing stepping (Phase 3).
 */
export default function Portfolio({ data }: { data: PortfolioData }) {
  const sections = data.sections;
  const contact = data.contact;

  const engine = usePortfolioEngine(data);
  const {
    viewportRef,
    landingRef,
    trackRef,
    stageRef,
    nameRef,
    roleRef,
    setOverviewMainRef,
    panels,
    sectionStart,
    sectionLength,
    groupStart,
    defaultBackgroundIndex,
    panelIndex,
    stageOn,
    overviewOn,
    overviewSectionIndex,
    overviewMounted,
    backgroundIndex,
    activeSectionKey,
    menuOpen,
    toggleMenu,
    closeMenu,
    goTo,
    enter,
    openSingleAt,
    showOverview,
    setIntroBackground,
    onBrandIndex,
    onContact,
    onBack,
    onSectionNav,
    onPrevSection,
    onNextSection,
    onOverviewBack,
    onOverviewPrev,
    onOverviewNext,
    onOverviewChapter,
  } = engine;

  const currentPanel = panels[panelIndex];
  const frameCount = currentPanel ? currentPanel.group.frames.length + 1 : 0;
  const prevSection = currentPanel ? sections[currentPanel.sectionIndex - 1] : undefined;
  const nextSection = currentPanel ? sections[currentPanel.sectionIndex + 1] : undefined;
  const progressScale = currentPanel
    ? (panelIndex - (sectionStart[currentPanel.sectionIndex] ?? 0)) /
      Math.max(1, (sectionLength[currentPanel.sectionIndex] ?? 1) - 1)
    : 0;

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
            setIntroBackground(defaultBackgroundIndex);
          }}
        >
          <button onClick={onBrandIndex}>Index</button>
          {sections.map((section, sectionIndex) => (
            <button
              key={section.key}
              className={cn(activeSectionKey === section.key && "active")}
              onMouseEnter={() => {
                setIntroBackground(sectionIndex);
              }}
              onClick={() => {
                onSectionNav(sectionIndex);
              }}
            >
              {section.title}
            </button>
          ))}
          <button onClick={onContact}>Contact</button>
        </div>
        {/* hamburger — mobile only (CSS-gated); opens the full-screen overlay */}
        <button className="menu-toggle" aria-label="Open menu" aria-expanded={menuOpen} onClick={toggleMenu}>
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ---- mobile menu overlay (mockup 03) — display:none above the breakpoint ---- */}
      <div className={cn("menu-overlay", menuOpen && "open")}>
        <div className="mo-bar">
          <button
            className="brand"
            onClick={() => {
              onBrandIndex();
              closeMenu();
            }}
          >
            MARCIN KULBICKI<small>Photography</small>
          </button>
          <button className="menu-close" aria-label="Close menu" onClick={closeMenu}>
            <span />
            <span />
          </button>
        </div>
        <nav className="mo-list">
          <button
            className="mo-item"
            onClick={() => {
              onBrandIndex();
              closeMenu();
            }}
          >
            <span className="mo-num">{"–"}</span>
            <span className="mo-label">Index</span>
          </button>
          {sections.map((section, sectionIndex) => (
            <button
              key={section.key}
              className={cn("mo-item", activeSectionKey === section.key && "active")}
              onClick={() => {
                onSectionNav(sectionIndex);
                closeMenu();
              }}
            >
              <span className="mo-num">{section.number}</span>
              <span className="mo-label">{section.title}</span>
            </button>
          ))}
          <button
            className="mo-item"
            onClick={() => {
              onContact();
              closeMenu();
            }}
          >
            <span className="mo-num">{"·"}</span>
            <span className="mo-label">Contact</span>
          </button>
        </nav>
        <a className="mo-mail" href={"mailto:" + contact.email}>
          {contact.email}
        </a>
      </div>

      {/* ---- landing ---- */}
      <div className="landing" ref={landingRef}>
        <div className="intro">
          {/* background layer — mirrors each section's landing hero, crossfades on hover */}
          <div className="intro-bg">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.key}
                className={cn("bgshot", sectionIndex === backgroundIndex && "on")}
                data-key={section.key}
              >
                {section.landing ? makeImage(section.landing.src, "cover", section.landing.alt) : null}
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
              setIntroBackground(defaultBackgroundIndex);
            }}
          >
            <span className="role-pre">Photographer —</span>
            <div className="role-links">
              {sections.map((section, sectionIndex) => (
                <Fragment key={section.key}>
                  {sectionIndex > 0 ? <span className="role-sep">·</span> : null}
                  <button
                    className={cn("rolelink", sectionIndex === backgroundIndex && "active")}
                    data-i={sectionIndex}
                    onMouseEnter={() => {
                      setIntroBackground(sectionIndex);
                    }}
                    onFocus={() => {
                      setIntroBackground(sectionIndex);
                    }}
                    onClick={() => {
                      enter(sectionIndex);
                    }}
                  >
                    {section.title}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="cue">Scroll</div>
        </div>

        {/* section bands */}
        {sections.map((section, sectionIndex) => (
          <div
            key={section.key}
            className="band"
            data-section={sectionIndex}
            onClick={() => {
              enter(sectionIndex);
            }}
          >
            <div className="ph">
              {section.landing ? makeImage(section.landing.src, "cover", section.landing.alt) : null}
            </div>
            <div className="scrim" />
            <div className="label">
              <div>
                <span className="num">
                  {section.number} / {pad(sections.length)}
                </span>
                <div className="ttl">{section.title}</div>
              </div>
              <div className="view">
                {section.groups.length} chapters · {totalFrames(section)} frames <span>{"↗"}</span>
              </div>
            </div>
          </div>
        ))}

        {/* contact band — minimal: name + email */}
        <div className="contact">
          <span className="c-eyebrow">Contact</span>
          <div className="c-name">{contact.name}</div>
          <a className="c-mail" href={"mailto:" + contact.email}>
            {contact.email}
          </a>
          <div className="c-loc">{contact.location}</div>
        </div>
      </div>

      {/* ---- stage ---- */}
      <div className={cn("stage", stageOn && "on")} ref={stageRef}>
        <div className="progress">
          <div className="progbar" style={{ transform: "scaleX(" + String(progressScale) + ")" }} />
        </div>

        <div className="track" ref={trackRef}>
          {panels.map((panel, index) => {
            const live = index === panelIndex;
            if (panel.kind === "hero") {
              return (
                <div key={index} className={cn("panel hero", live && "live")}>
                  <div className="ph">{makeImage(panel.group.hero.full, "cover", panel.group.hero.alt)}</div>
                  <div className="pscrim" />
                  <div className="hero-cap">
                    <div className="eyebrow">
                      {`${panel.section.number} — ${panel.section.title} · Chapter ${pad(panel.groupIndex + 1)} / ${pad(panel.section.groups.length)}`}
                    </div>
                    <div className="big">{panel.group.title}</div>
                    <div className="sub">
                      {panel.group.meta
                        ? panel.group.meta + " · " + String(panel.group.frames.length + 1) + " frames"
                        : String(panel.group.frames.length + 1) + " frames"}
                    </div>
                  </div>
                </div>
              );
            }
            const frame = panel.group.frames[panel.localIndex - 1];
            return (
              <div key={index} className={cn("panel", live && "live")}>
                <div className="ph">{frame ? makeImage(frame.full, "contain", frame.alt) : null}</div>
                <div className="pscrim" />
              </div>
            );
          })}
        </div>

        <div className="hud">
          <div className="idx">{currentPanel ? pad(currentPanel.localIndex + 1) + " / " + pad(frameCount) : ""}</div>
          <div className="cap">
            {currentPanel
              ? currentPanel.kind === "hero"
                ? currentPanel.group.title + (currentPanel.group.meta ? " — " + currentPanel.group.meta : "")
                : currentPanel.group.title
              : ""}
          </div>
        </div>

        <div className="marker">
          {currentPanel ? currentPanel.section.number + " · " + currentPanel.section.title : ""}
        </div>

        <div className="rail" data-si={currentPanel ? String(currentPanel.sectionIndex) : undefined}>
          {currentPanel
            ? currentPanel.section.groups.map((group, groupIndex) => (
                <button
                  key={group.key}
                  className={cn(groupIndex === currentPanel.groupIndex && "on")}
                  onClick={() => {
                    goTo(groupStart.get(`${currentPanel.sectionIndex}-${groupIndex}`) ?? 0);
                  }}
                >
                  <span className="rn">{pad(groupIndex + 1)}</span>
                  <span className="rt">{group.title}</span>
                </button>
              ))
            : null}
        </div>

        <div
          className="dots"
          data-gid={currentPanel ? `${currentPanel.sectionIndex}-${currentPanel.groupIndex}` : undefined}
        >
          {currentPanel
            ? Array.from({ length: frameCount }).map((_, frameIndex) => {
                const groupStartIndex = groupStart.get(`${currentPanel.sectionIndex}-${currentPanel.groupIndex}`) ?? 0;
                return (
                  <button
                    key={frameIndex}
                    aria-label={"Frame " + String(frameIndex + 1)}
                    className={cn(frameIndex === currentPanel.localIndex && "on")}
                    onClick={() => {
                      goTo(groupStartIndex + frameIndex);
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
          <button
            className="psec prev"
            style={{ visibility: prevSection ? "visible" : "hidden" }}
            onClick={onPrevSection}
          >
            {prevSection ? "↑ " + prevSection.title : ""}
          </button>
          <button
            className="psec next"
            style={{ visibility: nextSection ? "visible" : "hidden" }}
            onClick={onNextSection}
          >
            {nextSection ? nextSection.title + " ↓" : ""}
          </button>
        </div>

        <div className={cn("scrollcue", currentPanel && currentPanel.kind !== "hero" && "gone")}>
          Scroll to explore <span>{"↓"}</span>
        </div>

        {/* view toggle (Single | All) */}
        <div className="vtoggle">
          <button className="on">Single</button>
          <button
            onClick={() => {
              if (currentPanel) showOverview(currentPanel.sectionIndex);
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
              style={{ visibility: overviewSectionIndex > 0 ? "visible" : "hidden" }}
              onClick={onOverviewPrev}
            >
              {"‹"}
            </button>
            <div className="vtoggle">
              <button
                onClick={() => {
                  openSingleAt(sectionStart[overviewSectionIndex] ?? 0);
                }}
              >
                Single
              </button>
              <button className="on">All</button>
            </div>
            <button
              className="ov-arrow"
              style={{ visibility: overviewSectionIndex < sections.length - 1 ? "visible" : "hidden" }}
              onClick={onOverviewNext}
            >
              {"›"}
            </button>
          </div>

          {sections.map((section, sectionIndex) => (
            <div
              key={section.key}
              className={cn("ov-section", sectionIndex === overviewSectionIndex && "on")}
              data-si={sectionIndex}
            >
              <div
                className="ov-main"
                ref={(node) => {
                  setOverviewMainRef(sectionIndex, node);
                }}
              >
                <div className="ov-inner">
                  {section.groups.map((group, groupIndex) => (
                    <Fragment key={group.key}>
                      <div className="ov-chead">
                        <span className="ocn">{pad(groupIndex + 1)}</span>
                        <span className="oct">{group.title}</span>
                        {group.meta ? <span className="ocm">{group.meta}</span> : null}
                      </div>
                      <div className="ov-grid">
                        {[group.hero, ...group.frames].map((photo, cellIndex) => {
                          const cellPanelIndex = (groupStart.get(`${sectionIndex}-${groupIndex}`) ?? 0) + cellIndex;
                          return (
                            <button
                              key={cellIndex}
                              className={cn("ov-cell", cellIndex === 0 && "lead")}
                              onClick={() => {
                                openSingleAt(cellPanelIndex);
                              }}
                            >
                              {makeImage(photo.thumb, cellIndex === 0 ? "cover" : "contain", photo.alt)}
                              <span className="ov-ci">{pad(cellIndex + 1)}</span>
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
                  {section.number} / {pad(sections.length)}
                </span>
                <div className="os-title">{section.title}</div>
                {section.tagline ? <div className="os-tag">{section.tagline}</div> : null}
                <div className="os-chapters">
                  {section.groups.map((group, groupIndex) => (
                    <button
                      key={group.key}
                      className="os-ch"
                      onClick={() => {
                        onOverviewChapter(sectionIndex, groupIndex);
                      }}
                    >
                      <span className="osc-n">{pad(groupIndex + 1)}</span>
                      <span className="osc-t">{group.title}</span>
                      <span className="osc-m">
                        {(group.meta ? group.meta + " · " : "") + String(group.frames.length + 1) + " frames"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="os-tags">
                  {section.tags.map((tag, tagIndex) => (
                    <span key={tagIndex}>{tag}</span>
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
