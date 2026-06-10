// core
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// others
import type { Panel, PortfolioData, Section } from "../../types";

const LOCK_MS = 820;
const WHEEL_DEADZONE = 6;
const TOUCH_THRESHOLD = 46;
const HERO_NAME_MS = 1500;

interface EngineMaps {
  panels: Panel[];
  sectionStart: number[];
  sectionLength: number[];
  groupStart: Map<string, number>;
}

function buildMaps(sections: Section[]): EngineMaps {
  const panels: Panel[] = [];
  const sectionStart: number[] = [];
  const sectionLength: number[] = [];
  const groupStart = new Map<string, number>();

  sections.forEach((section, sectionIndex) => {
    sectionStart[sectionIndex] = panels.length;
    section.groups.forEach((group, groupIndex) => {
      groupStart.set(`${sectionIndex}-${groupIndex}`, panels.length);
      panels.push({ section, sectionIndex, group, groupIndex, kind: "hero", localIndex: 0 });
      group.frames.forEach((_frame, frameIndex) => {
        panels.push({ section, sectionIndex, group, groupIndex, kind: "photo", localIndex: frameIndex + 1 });
      });
    });
    sectionLength[sectionIndex] = panels.length - (sectionStart[sectionIndex] ?? 0);
  });

  return { panels, sectionStart, sectionLength, groupStart };
}

/**
 * Houses the engine state + behavior the vanilla mount() (portfolio.ts:71–710)
 * carried in closures. Returns refs (bound to scroll containers), state (drives
 * declarative rendering), and handlers (bound to UI). Listeners register in
 * effects with cleanup — the vanilla code never removed them; the React version
 * must, to survive island unmount/HMR.
 *
 * The hero-name / role-compact / intro-dim trio is driven imperatively via refs
 * (nameRef/roleRef/viewportRef) to faithfully reproduce the collapse transition
 * (inline max-height start → `.gone`'s `max-height:0 !important` target). Those
 * elements keep a constant className in JSX so React never clobbers the runtime
 * classList writes.
 */
export function usePortfolioEngine(data: PortfolioData) {
  const sections = data.sections;

  const { panels, sectionStart, sectionLength, groupStart } = useMemo(() => buildMaps(sections), [sections]);

  const defaultBackgroundIndex = useMemo(() => {
    for (let index = 0; index < sections.length; index++) {
      if (sections[index]?.key === "portraits") return index;
    }
    return 0;
  }, [sections]);

  // ---- state (drives rendering) ----
  const [panelIndex, setPanelIndex] = useState(0);
  const [stageOn, setStageOn] = useState(false);
  const [overviewOn, setOverviewOn] = useState(false);
  const [overviewSectionIndex, setOverviewSectionIndex] = useState(0);
  const [overviewMounted, setOverviewMounted] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(defaultBackgroundIndex);
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu overlay (S-04)
  const [landingIndex, setLandingIndex] = useState(0); // reactive mirror of landingIndexRef for the mobile section-dots (S-04)

  // ---- refs (containers + mutable engine vars) ----
  const viewportRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const overviewMainRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lockRef = useRef(false);
  const jumpingRef = useRef(false); // current panelIndex change should not animate
  const touchStartYRef = useRef<number | null>(null);
  const nameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // landing discrete-stepping (Phase 3): index into the ordered landing targets
  // (.intro → each .band → .contact) and its own gesture lock.
  const landingIndexRef = useRef(0);
  const landingLockRef = useRef(false);

  // state mirrors so once-attached listeners read fresh values (vanilla closures)
  const panelIndexRef = useRef(panelIndex);
  const stageOnRef = useRef(stageOn);
  const overviewOnRef = useRef(overviewOn);
  const overviewSectionIndexRef = useRef(overviewSectionIndex);
  const menuOpenRef = useRef(menuOpen);
  useEffect(() => {
    panelIndexRef.current = panelIndex;
  }, [panelIndex]);
  useEffect(() => {
    stageOnRef.current = stageOn;
  }, [stageOn]);
  useEffect(() => {
    overviewOnRef.current = overviewOn;
  }, [overviewOn]);
  useEffect(() => {
    overviewSectionIndexRef.current = overviewSectionIndex;
  }, [overviewSectionIndex]);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  // ---- track transform + transition-suppression reflow trick (portfolio.ts:436–440) ----
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (jumpingRef.current) {
      track.style.transition = "none";
      track.style.transform = "translateY(" + String(-panelIndex * 100) + "%)";
      void track.offsetHeight; // force reflow
      track.style.transition = "";
      jumpingRef.current = false;
    } else {
      track.style.transform = "translateY(" + String(-panelIndex * 100) + "%)";
    }
  }, [panelIndex]);

  // overview: reset the active section's scroll to top when shown (portfolio.ts:566–571)
  useLayoutEffect(() => {
    if (!overviewOn) return;
    const main = overviewMainRefs.current[overviewSectionIndex];
    if (main) main.scrollTop = 0;
  }, [overviewOn, overviewSectionIndex]);

  // ---- hero name (imperative, mirrors portfolio.ts:178–194) ----
  const hideHeroName = useCallback(() => {
    const nameElement = nameRef.current;
    const roleElement = roleRef.current;
    const viewport = viewportRef.current;
    if (nameElement) {
      nameElement.style.maxHeight = String(nameElement.scrollHeight) + "px";
      void nameElement.offsetHeight;
      nameElement.classList.add("gone");
    }
    if (roleElement) roleElement.classList.add("compact");
    if (viewport) viewport.style.setProperty("--intro-dim-now", "var(--intro-dim-settled, 0.5)");
  }, []);

  const playHeroName = useCallback(() => {
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    const nameElement = nameRef.current;
    const roleElement = roleRef.current;
    const viewport = viewportRef.current;
    if (nameElement) {
      nameElement.classList.remove("gone");
      nameElement.style.maxHeight = "";
    }
    if (roleElement) roleElement.classList.remove("compact");
    if (viewport) viewport.style.setProperty("--intro-dim-now", "1");
    nameTimerRef.current = setTimeout(hideHeroName, HERO_NAME_MS);
  }, [hideHeroName]);

  // play once on mount; clean up the timer on unmount
  useEffect(() => {
    playHeroName();
    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    };
  }, [playHeroName]);

  // ---- core navigation ----
  const setIntroBackground = useCallback((index: number) => {
    setBackgroundIndex(index);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setPanelIndex(Math.max(0, Math.min(panels.length - 1, index)));
    },
    [panels.length],
  );

  // Ordered landing targets, read fresh each call so offsets stay correct after
  // a resize (.intro → each .band → .contact), mirroring the nav jump idiom.
  const getLandingTargets = useCallback((): HTMLElement[] => {
    const landing = landingRef.current;
    if (!landing) return [];
    const targets: HTMLElement[] = [];
    const intro = landing.querySelector<HTMLElement>(".intro");
    if (intro) targets.push(intro);
    landing.querySelectorAll<HTMLElement>(".band").forEach((band) => {
      targets.push(band);
    });
    const contact = landing.querySelector<HTMLElement>(".contact");
    if (contact) targets.push(contact);
    return targets;
  }, []);

  // Instant landing jump (nav idiom) that also keeps landingIndex in sync, so a
  // subsequent wheel/keyboard step continues from the right target.
  const scrollLandingToTarget = useCallback(
    (target: HTMLElement) => {
      const landing = landingRef.current;
      if (!landing) return;
      landing.scrollTop = target.offsetTop;
      const targetIndex = getLandingTargets().indexOf(target);
      if (targetIndex >= 0) {
        landingIndexRef.current = targetIndex;
        setLandingIndex(targetIndex);
      }
    },
    [getLandingTargets],
  );

  const exit = useCallback(
    (scrollToSelector?: string) => {
      setStageOn(false);
      setOverviewOn(false);
      if (scrollToSelector) {
        const landing = landingRef.current;
        const target = landing?.querySelector<HTMLElement>(scrollToSelector);
        if (target) scrollLandingToTarget(target);
      }
    },
    [scrollLandingToTarget],
  );

  const enter = useCallback(
    (sectionIndex: number) => {
      jumpingRef.current = true;
      setPanelIndex(sectionStart[sectionIndex] ?? 0);
      setStageOn(true);
    },
    [sectionStart],
  );

  const openSingleAt = useCallback(
    (index: number) => {
      setOverviewOn(false);
      jumpingRef.current = true;
      setPanelIndex(Math.max(0, Math.min(panels.length - 1, index)));
      setStageOn(true);
    },
    [panels.length],
  );

  const showOverview = useCallback(
    (sectionIndex: number) => {
      setOverviewMounted(true);
      setOverviewSectionIndex(Math.max(0, Math.min(sections.length - 1, sectionIndex)));
      setStageOn(false);
      setOverviewOn(true);
    },
    [sections.length],
  );

  // ---- landing discrete stepping (Phase 3, S-01) ----
  // Advance exactly one whole landing target per step, mirroring the stage's
  // step/lock pattern. Clamped at both ends; the lock collapses a single wheel
  // gesture into one step and prevents `mandatory` snap from fighting the
  // in-flight smooth scroll. Touch is wired below (S-04) and reuses this directly.
  const landingStep = useCallback(
    (direction: number) => {
      if (landingLockRef.current) return;
      const landing = landingRef.current;
      if (!landing) return;
      const targets = getLandingTargets();
      if (!targets.length) return;
      const nextIndex = landingIndexRef.current + direction;
      if (nextIndex < 0 || nextIndex >= targets.length) return; // clamp: no-op at the ends
      const target = targets[nextIndex];
      if (!target) return;
      landingLockRef.current = true;
      setTimeout(() => {
        landingLockRef.current = false;
      }, LOCK_MS);
      landingIndexRef.current = nextIndex;
      setLandingIndex(nextIndex);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      landing.scrollTo({ top: target.offsetTop, behavior: prefersReducedMotion ? "auto" : "smooth" });
    },
    [getLandingTargets],
  );

  // wheel listener on the landing (attach once; read fresh state via refs)
  useEffect(() => {
    const landing = landingRef.current;
    if (!landing) return;
    const onLandingWheel = (event: WheelEvent) => {
      if (stageOnRef.current || overviewOnRef.current) return; // landing not the visible surface
      event.preventDefault();
      if (Math.abs(event.deltaY) < WHEEL_DEADZONE) return;
      landingStep(event.deltaY > 0 ? 1 : -1);
    };
    landing.addEventListener("wheel", onLandingWheel, { passive: false });
    return () => {
      landing.removeEventListener("wheel", onLandingWheel);
    };
  }, [landingStep]);

  // touch listener on the landing (attach once; read fresh state via refs).
  // Mirrors the stage touch effect (below) but drives landingStep instead of
  // step. Unlike the stage's passive listeners, touchmove registers
  // { passive: false } and preventDefaults so native landing scroll/snap does
  // not fight the engine — the same reason the wheel path preventDefaults. The
  // S-04 mobile fix: this is what makes a swipe advance exactly one section.
  useEffect(() => {
    const landing = landingRef.current;
    if (!landing) return;
    const onTouchStart = (event: TouchEvent) => {
      if (stageOnRef.current || overviewOnRef.current) return; // landing not the visible surface
      const touch = event.touches[0];
      touchStartYRef.current = touch ? touch.clientY : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (stageOnRef.current || overviewOnRef.current) return; // landing not the visible surface
      if (touchStartYRef.current == null) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touchStartYRef.current - touch.clientY;
      if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
        landingStep(deltaY > 0 ? 1 : -1);
        touchStartYRef.current = null;
      }
    };
    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };
    landing.addEventListener("touchstart", onTouchStart, { passive: true });
    landing.addEventListener("touchmove", onTouchMove, { passive: false });
    landing.addEventListener("touchend", onTouchEnd);
    return () => {
      landing.removeEventListener("touchstart", onTouchStart);
      landing.removeEventListener("touchmove", onTouchMove);
      landing.removeEventListener("touchend", onTouchEnd);
    };
  }, [landingStep]);

  // ---- stage scroll-hijack (portfolio.ts:624–658) ----
  const armLock = useCallback(() => {
    setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  }, []);

  const step = useCallback(
    (direction: number) => {
      if (lockRef.current) return;
      const currentIndex = panelIndexRef.current;
      if (direction > 0) {
        if (currentIndex >= panels.length - 1) return;
        lockRef.current = true;
        armLock();
        goTo(currentIndex + 1);
      } else {
        if (currentIndex === 0) {
          const firstPanel = panels[0];
          if (firstPanel) exit('.band[data-section="' + String(firstPanel.sectionIndex) + '"]');
          return;
        }
        lockRef.current = true;
        armLock();
        goTo(currentIndex - 1);
      }
    },
    [panels, goTo, exit, armLock],
  );

  // wheel + touch listeners on the stage (attach once; read fresh state via refs)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) < WHEEL_DEADZONE) return;
      step(event.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartYRef.current = touch ? touch.clientY : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchStartYRef.current == null) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touchStartYRef.current - touch.clientY;
      if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
        const direction = deltaY > 0 ? 1 : -1;
        // Touch must never trigger step()'s "swipe-down-at-the-first-frame leaves
        // the section" exit (a desktop wheel/keyboard affordance). On a phone the
        // gesture direction is ambiguous, so an accidental exit at the hero reads
        // as the app breaking back to the landing. Mobile leaves Single via the
        // hamburger / SINGLE|ALL toggle instead (Phase 4 decision). Desktop wheel
        // and keyboard still reach the exit because they call step() directly.
        if (!(direction < 0 && panelIndexRef.current === 0)) step(direction);
        touchStartYRef.current = null;
      }
    };
    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: true });
    stage.addEventListener("touchend", onTouchEnd);
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
    };
  }, [step]);

  // keyboard (portfolio.ts:689–710)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (menuOpenRef.current) {
        // mobile menu overlay is modal — Escape closes it; swallow other keys.
        if (event.key === "Escape") setMenuOpen(false);
        return;
      }
      if (overviewOnRef.current) {
        if (event.key === "Escape") {
          setOverviewOn(false);
          const landing = landingRef.current;
          const target = landing?.querySelector<HTMLElement>(
            '.band[data-section="' + String(overviewSectionIndexRef.current) + '"]',
          );
          if (target) scrollLandingToTarget(target);
        }
        return;
      }
      if (!stageOnRef.current) {
        // landing is the visible surface — discrete step (coordinated so the two
        // engines never both fire). Space → +1, like the stage.
        if (event.key === "ArrowDown" || event.key === " " || event.key === "PageDown") {
          event.preventDefault();
          landingStep(1);
        } else if (event.key === "ArrowUp" || event.key === "PageUp") {
          event.preventDefault();
          landingStep(-1);
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Escape") {
        const currentPanel = panels[panelIndexRef.current];
        if (currentPanel) exit('.band[data-section="' + String(currentPanel.sectionIndex) + '"]');
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [step, panels, exit, scrollLandingToTarget, landingStep]);

  // ---- composed nav handlers (read fresh refs) ----
  const onBrandIndex = useCallback(() => {
    exit();
    const landing = landingRef.current;
    if (landing) landing.scrollTop = 0;
    landingIndexRef.current = 0; // back to intro; keep landing stepping in sync
    setLandingIndex(0);
    playHeroName();
  }, [exit, playHeroName]);

  const onContact = useCallback(() => {
    exit(".contact");
  }, [exit]);

  // ---- mobile menu overlay (S-04) ----
  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const onBack = useCallback(() => {
    const currentPanel = panels[panelIndexRef.current];
    if (currentPanel) exit('.band[data-section="' + String(currentPanel.sectionIndex) + '"]');
  }, [panels, exit]);

  const onSectionNav = useCallback(
    (sectionIndex: number) => {
      if (overviewOnRef.current) showOverview(sectionIndex);
      else enter(sectionIndex);
    },
    [showOverview, enter],
  );

  const onPrevSection = useCallback(() => {
    const currentPanel = panels[panelIndexRef.current];
    if (currentPanel && currentPanel.sectionIndex > 0) enter(currentPanel.sectionIndex - 1);
  }, [panels, enter]);

  const onNextSection = useCallback(() => {
    const currentPanel = panels[panelIndexRef.current];
    if (currentPanel && currentPanel.sectionIndex < sections.length - 1) enter(currentPanel.sectionIndex + 1);
  }, [panels, enter, sections.length]);

  const onOverviewBack = useCallback(() => {
    setOverviewOn(false);
    const landing = landingRef.current;
    const target = landing?.querySelector<HTMLElement>(
      '.band[data-section="' + String(overviewSectionIndexRef.current) + '"]',
    );
    if (target) scrollLandingToTarget(target);
  }, [scrollLandingToTarget]);

  const onOverviewPrev = useCallback(() => {
    if (overviewSectionIndexRef.current > 0) showOverview(overviewSectionIndexRef.current - 1);
  }, [showOverview]);

  const onOverviewNext = useCallback(() => {
    if (overviewSectionIndexRef.current < sections.length - 1) showOverview(overviewSectionIndexRef.current + 1);
  }, [showOverview, sections.length]);

  // scroll the overview to a chapter heading. scrollIntoView targets whichever
  // ancestor actually scrolls — .ov-main on desktop, .ov-section on mobile
  // (the ≤880 reflow moves overflow to the section) — and honors the per-
  // breakpoint scroll-margin-top on .ov-chead so the heading clears the chrome.
  const onOverviewChapter = useCallback((sectionIndex: number, groupIndex: number) => {
    const main = overviewMainRefs.current[sectionIndex];
    if (!main) return;
    const heading = main.querySelectorAll<HTMLElement>(".ov-chead")[groupIndex];
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const setOverviewMainRef = useCallback((sectionIndex: number, node: HTMLDivElement | null) => {
    overviewMainRefs.current[sectionIndex] = node;
  }, []);

  // derived: which section's nav button is "active"
  const activeSectionKey = overviewOn
    ? (sections[overviewSectionIndex]?.key ?? null)
    : stageOn
      ? (panels[panelIndex]?.section.key ?? null)
      : null;

  return {
    // refs
    viewportRef,
    landingRef,
    trackRef,
    stageRef,
    nameRef,
    roleRef,
    setOverviewMainRef,
    // engine data
    panels,
    sectionStart,
    sectionLength,
    groupStart,
    defaultBackgroundIndex,
    // state
    panelIndex,
    stageOn,
    overviewOn,
    overviewSectionIndex,
    overviewMounted,
    backgroundIndex,
    activeSectionKey,
    menuOpen,
    landingIndex,
    // handlers
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
  };
}
