import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Panel, PortfolioData, Section } from "@/types";

const LOCK_MS = 820;
const WHEEL_DEADZONE = 6;
const TOUCH_THRESHOLD = 46;
const HERO_NAME_MS = 1500;

interface EngineMaps {
  panels: Panel[];
  sectionStart: number[];
  sectionLen: number[];
  groupStart: Map<string, number>;
}

function buildMaps(sections: Section[]): EngineMaps {
  const panels: Panel[] = [];
  const sectionStart: number[] = [];
  const sectionLen: number[] = [];
  const groupStart = new Map<string, number>();

  sections.forEach((s, si) => {
    sectionStart[si] = panels.length;
    s.groups.forEach((g, gi) => {
      groupStart.set(`${si}-${gi}`, panels.length);
      panels.push({ s, si, g, gi, kind: "hero", local: 0 });
      g.frames.forEach((_fr, fi) => {
        panels.push({ s, si, g, gi, kind: "photo", local: fi + 1 });
      });
    });
    sectionLen[si] = panels.length - (sectionStart[si] ?? 0);
  });

  return { panels, sectionStart, sectionLen, groupStart };
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
  const SECTIONS = data.sections;

  const { panels, sectionStart, sectionLen, groupStart } = useMemo(() => buildMaps(SECTIONS), [SECTIONS]);

  const defaultBg = useMemo(() => {
    for (let z = 0; z < SECTIONS.length; z++) {
      if (SECTIONS[z]?.key === "portraits") return z;
    }
    return 0;
  }, [SECTIONS]);

  // ---- state (drives rendering) ----
  const [idx, setIdx] = useState(0);
  const [stageOn, setStageOn] = useState(false);
  const [overviewOn, setOverviewOn] = useState(false);
  const [overviewSi, setOverviewSi] = useState(0);
  const [overviewMounted, setOverviewMounted] = useState(false);
  const [bgIdx, setBgIdx] = useState(defaultBg);

  // ---- refs (containers + mutable engine vars) ----
  const viewportRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const ovMainRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lockRef = useRef(false);
  const jumpingRef = useRef(false); // current idx change should not animate
  const touchYRef = useRef<number | null>(null);
  const nameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // state mirrors so once-attached listeners read fresh values (vanilla closures)
  const idxRef = useRef(idx);
  const stageOnRef = useRef(stageOn);
  const overviewOnRef = useRef(overviewOn);
  const overviewSiRef = useRef(overviewSi);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);
  useEffect(() => {
    stageOnRef.current = stageOn;
  }, [stageOn]);
  useEffect(() => {
    overviewOnRef.current = overviewOn;
  }, [overviewOn]);
  useEffect(() => {
    overviewSiRef.current = overviewSi;
  }, [overviewSi]);

  // ---- track transform + transition-suppression reflow trick (portfolio.ts:436–440) ----
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (jumpingRef.current) {
      track.style.transition = "none";
      track.style.transform = "translateY(" + String(-idx * 100) + "%)";
      void track.offsetHeight; // force reflow
      track.style.transition = "";
      jumpingRef.current = false;
    } else {
      track.style.transform = "translateY(" + String(-idx * 100) + "%)";
    }
  }, [idx]);

  // overview: reset the active section's scroll to top when shown (portfolio.ts:566–571)
  useLayoutEffect(() => {
    if (!overviewOn) return;
    const m = ovMainRefs.current[overviewSi];
    if (m) m.scrollTop = 0;
  }, [overviewOn, overviewSi]);

  // ---- hero name (imperative, mirrors portfolio.ts:178–194) ----
  const hideHeroName = useCallback(() => {
    const nameEl = nameRef.current;
    const roleEl = roleRef.current;
    const vp = viewportRef.current;
    if (nameEl) {
      nameEl.style.maxHeight = String(nameEl.scrollHeight) + "px";
      void nameEl.offsetHeight;
      nameEl.classList.add("gone");
    }
    if (roleEl) roleEl.classList.add("compact");
    if (vp) vp.style.setProperty("--intro-dim-now", "var(--intro-dim-settled, 0.5)");
  }, []);

  const playHeroName = useCallback(() => {
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    const nameEl = nameRef.current;
    const roleEl = roleRef.current;
    const vp = viewportRef.current;
    if (nameEl) {
      nameEl.classList.remove("gone");
      nameEl.style.maxHeight = "";
    }
    if (roleEl) roleEl.classList.remove("compact");
    if (vp) vp.style.setProperty("--intro-dim-now", "1");
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
  const setIntroBg = useCallback((i: number) => {
    setBgIdx(i);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setIdx(Math.max(0, Math.min(panels.length - 1, i)));
    },
    [panels.length],
  );

  const exit = useCallback((scrollToSelector?: string) => {
    setStageOn(false);
    setOverviewOn(false);
    if (scrollToSelector) {
      const landing = landingRef.current;
      const t = landing?.querySelector<HTMLElement>(scrollToSelector);
      if (landing && t) landing.scrollTop = t.offsetTop;
    }
  }, []);

  const enter = useCallback(
    (si: number) => {
      jumpingRef.current = true;
      setIdx(sectionStart[si] ?? 0);
      setStageOn(true);
    },
    [sectionStart],
  );

  const openSingleAt = useCallback(
    (i: number) => {
      setOverviewOn(false);
      jumpingRef.current = true;
      setIdx(Math.max(0, Math.min(panels.length - 1, i)));
      setStageOn(true);
    },
    [panels.length],
  );

  const showOverview = useCallback(
    (si: number) => {
      setOverviewMounted(true);
      setOverviewSi(Math.max(0, Math.min(SECTIONS.length - 1, si)));
      setStageOn(false);
      setOverviewOn(true);
    },
    [SECTIONS.length],
  );

  // ---- stage scroll-hijack (portfolio.ts:624–658) ----
  const armLock = useCallback(() => {
    setTimeout(() => {
      lockRef.current = false;
    }, LOCK_MS);
  }, []);

  const step = useCallback(
    (d: number) => {
      if (lockRef.current) return;
      const cur = idxRef.current;
      if (d > 0) {
        if (cur >= panels.length - 1) return;
        lockRef.current = true;
        armLock();
        goTo(cur + 1);
      } else {
        if (cur === 0) {
          const p0 = panels[0];
          if (p0) exit('.band[data-section="' + String(p0.si) + '"]');
          return;
        }
        lockRef.current = true;
        armLock();
        goTo(cur - 1);
      }
    },
    [panels, goTo, exit, armLock],
  );

  // wheel + touch listeners on the stage (attach once; read fresh state via refs)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < WHEEL_DEADZONE) return;
      step(e.deltaY > 0 ? 1 : -1);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchYRef.current = t ? t.clientY : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchYRef.current == null) return;
      const t = e.touches[0];
      if (!t) return;
      const dy = touchYRef.current - t.clientY;
      if (Math.abs(dy) > TOUCH_THRESHOLD) {
        step(dy > 0 ? 1 : -1);
        touchYRef.current = null;
      }
    };
    const onTouchEnd = () => {
      touchYRef.current = null;
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
    const onKey = (e: KeyboardEvent) => {
      if (overviewOnRef.current) {
        if (e.key === "Escape") {
          setOverviewOn(false);
          const landing = landingRef.current;
          const t = landing?.querySelector<HTMLElement>('.band[data-section="' + String(overviewSiRef.current) + '"]');
          if (landing && t) landing.scrollTop = t.offsetTop;
        }
        return;
      }
      if (!stageOnRef.current) return;
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape") {
        const p = panels[idxRef.current];
        if (p) exit('.band[data-section="' + String(p.si) + '"]');
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [step, panels, exit]);

  // ---- composed nav handlers (read fresh refs) ----
  const onBrandIndex = useCallback(() => {
    exit();
    const landing = landingRef.current;
    if (landing) landing.scrollTop = 0;
    playHeroName();
  }, [exit, playHeroName]);

  const onContact = useCallback(() => {
    exit(".contact");
  }, [exit]);

  const onBack = useCallback(() => {
    const p = panels[idxRef.current];
    if (p) exit('.band[data-section="' + String(p.si) + '"]');
  }, [panels, exit]);

  const onSectionNav = useCallback(
    (i: number) => {
      if (overviewOnRef.current) showOverview(i);
      else enter(i);
    },
    [showOverview, enter],
  );

  const onPrevSec = useCallback(() => {
    const p = panels[idxRef.current];
    if (p && p.si > 0) enter(p.si - 1);
  }, [panels, enter]);

  const onNextSec = useCallback(() => {
    const p = panels[idxRef.current];
    if (p && p.si < SECTIONS.length - 1) enter(p.si + 1);
  }, [panels, enter, SECTIONS.length]);

  const onOverviewBack = useCallback(() => {
    setOverviewOn(false);
    const landing = landingRef.current;
    const t = landing?.querySelector<HTMLElement>('.band[data-section="' + String(overviewSiRef.current) + '"]');
    if (landing && t) landing.scrollTop = t.offsetTop;
  }, []);

  const onOvPrev = useCallback(() => {
    if (overviewSiRef.current > 0) showOverview(overviewSiRef.current - 1);
  }, [showOverview]);

  const onOvNext = useCallback(() => {
    if (overviewSiRef.current < SECTIONS.length - 1) showOverview(overviewSiRef.current + 1);
  }, [showOverview, SECTIONS.length]);

  // scroll an overview section's main to a chapter heading (portfolio.ts:529–533)
  const onOvChapter = useCallback((si: number, gi: number) => {
    const main = ovMainRefs.current[si];
    if (!main) return;
    const heads = main.querySelectorAll<HTMLElement>(".ov-chead");
    const t = heads[gi];
    if (t) main.scrollTo({ top: t.offsetTop - 24, behavior: "smooth" });
  }, []);

  const setOvMainRef = useCallback((si: number, node: HTMLDivElement | null) => {
    ovMainRefs.current[si] = node;
  }, []);

  // derived: which section's nav button is "active"
  const activeSectionKey = overviewOn
    ? (SECTIONS[overviewSi]?.key ?? null)
    : stageOn
      ? (panels[idx]?.s.key ?? null)
      : null;

  return {
    // refs
    viewportRef,
    landingRef,
    trackRef,
    stageRef,
    nameRef,
    roleRef,
    setOvMainRef,
    // engine data
    panels,
    sectionStart,
    sectionLen,
    groupStart,
    defaultBg,
    // state
    idx,
    stageOn,
    overviewOn,
    overviewSi,
    overviewMounted,
    bgIdx,
    activeSectionKey,
    // handlers
    goTo,
    enter,
    exit,
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
  };
}
