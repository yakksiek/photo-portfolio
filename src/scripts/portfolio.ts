/* ============================================================
   Marcin Kulbicki — Photography
   Scroll-hijacked photo portfolio engine.
   Ported from context/foundation/design-reference/portfolio.js.
   Differences vs reference:
     - content comes from Sanity (injected as JSON), not a hardcoded array
     - <image-slot> placeholders are real <img class="slot">
     - section landing band uses the dedicated landingHero (FR-004)
   ============================================================ */

interface Photo {
  full: string; // large display URL (cover for heroes, contain for frames)
  thumb: string; // overview-grid URL
  alt: string;
}

interface Group {
  key: string;
  title: string;
  meta: string; // "Place · Year" / "Place" / "Year" / ""
  hero: Photo; // first photo, cover treatment
  frames: Photo[]; // remaining photos, contain treatment
}

interface Section {
  key: string;
  n: string; // "01"
  title: string;
  tagline: string;
  tags: string[];
  landing: { src: string; alt: string } | null; // dedicated landing hero
  groups: Group[];
}

interface PortfolioData {
  sections: Section[];
  contact: { name: string; email: string; location: string };
}

interface Panel {
  s: Section;
  si: number;
  g: Group;
  gi: number;
  kind: "hero" | "photo";
  local: number; // 0 = hero, 1..N = frame index
}

function el(tag: string, cls?: string, html?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function makeImg(src: string, fit: "cover" | "contain", alt: string): HTMLImageElement {
  const img = document.createElement("img");
  img.className = "slot";
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  if (fit === "contain") img.dataset.fit = "contain";
  return img;
}

function pad(n: number): string {
  return n < 10 ? "0" + String(n) : String(n);
}

function mount(container: HTMLElement, data: PortfolioData): void {
  const SECTIONS = data.sections;
  const CONTACT = data.contact;
  container.innerHTML = "";

  const totalFrames = (s: Section): number => {
    let t = 0;
    s.groups.forEach((g) => {
      t += g.frames.length + 1;
    });
    return t;
  };

  // overlays
  container.appendChild(el("div", "vignette"));
  container.appendChild(el("div", "grain"));

  // ---- top bar ------------------------------------------------
  const bar = el("div", "bar");
  const brand = el("button", "brand", "MARCIN KULBICKI<small>Photography</small>");
  bar.appendChild(brand);
  const menu = el("div", "menu");
  const navBtns: Record<string, HTMLElement> = {};
  const idxBtn = el("button", undefined, "Index");
  menu.appendChild(idxBtn);
  SECTIONS.forEach((s, i) => {
    const b = el("button", undefined, s.title);
    b.addEventListener("mouseenter", () => {
      setIntroBg(i);
    });
    navBtns[s.key] = b;
    menu.appendChild(b);
  });
  const contactBtn = el("button", undefined, "Contact");
  menu.appendChild(contactBtn);
  menu.addEventListener("mouseleave", () => {
    setIntroBg(defaultBg);
  });
  bar.appendChild(menu);
  container.appendChild(bar);

  // ---- landing ------------------------------------------------
  const landing = el("div", "landing");

  let defaultBg = 0;
  for (let z = 0; z < SECTIONS.length; z++) {
    if (SECTIONS[z]?.key === "portraits") {
      defaultBg = z;
      break;
    }
  }

  const intro = el("div", "intro");

  // background layer — mirrors each section's landing hero, crossfades on hover
  const introBg = el("div", "intro-bg");
  const bgshots: HTMLElement[] = [];
  SECTIONS.forEach((s, i) => {
    const shot = el("div", "bgshot");
    shot.dataset.key = s.key;
    if (s.landing) shot.appendChild(makeImg(s.landing.src, "cover", s.landing.alt));
    if (i === defaultBg) shot.classList.add("on");
    introBg.appendChild(shot);
    bgshots.push(shot);
  });
  intro.appendChild(introBg);
  intro.appendChild(el("div", "intro-scrim"));

  const nameEl = el("div", "name", "<span>MARCIN</span><span>KULBICKI</span>");
  intro.appendChild(nameEl);

  // role line with hoverable section names
  const role = el("div", "role");
  role.appendChild(el("span", "role-pre", "Photographer —"));
  const linksWrap = el("div", "role-links");
  const roleLinks: HTMLElement[] = [];
  SECTIONS.forEach((s, i) => {
    if (i > 0) linksWrap.appendChild(el("span", "role-sep", "·"));
    const lk = el("button", "rolelink", s.title);
    lk.dataset.i = String(i);
    if (i === defaultBg) lk.classList.add("active");
    lk.addEventListener("mouseenter", () => {
      setIntroBg(i);
    });
    lk.addEventListener("focus", () => {
      setIntroBg(i);
    });
    lk.addEventListener("click", () => {
      enter(i);
    });
    linksWrap.appendChild(lk);
    roleLinks.push(lk);
  });
  role.appendChild(linksWrap);
  role.addEventListener("mouseleave", () => {
    setIntroBg(defaultBg);
  });
  intro.appendChild(role);

  intro.appendChild(el("div", "cue", "Scroll"));
  landing.appendChild(intro);

  function setIntroBg(i: number): void {
    for (let b = 0; b < bgshots.length; b++) bgshots[b]?.classList.toggle("on", b === i);
    for (let r = 0; r < roleLinks.length; r++) roleLinks[r]?.classList.toggle("active", r === i);
  }

  // hero name: visible briefly on landing, then collapses away
  let nameTimer: ReturnType<typeof setTimeout>;
  function hideHeroName(): void {
    nameEl.style.maxHeight = String(nameEl.scrollHeight) + "px";
    void nameEl.offsetHeight;
    nameEl.classList.add("gone");
    role.classList.add("compact");
    container.style.setProperty("--intro-dim-now", "var(--intro-dim-settled, 0.5)");
  }
  function playHeroName(): void {
    clearTimeout(nameTimer);
    nameEl.classList.remove("gone");
    role.classList.remove("compact");
    nameEl.style.maxHeight = "";
    container.style.setProperty("--intro-dim-now", "1");
    nameTimer = setTimeout(hideHeroName, 2000);
  }

  // section bands
  SECTIONS.forEach((s, i) => {
    const band = el("div", "band");
    band.dataset.section = String(i);
    const ph = el("div", "ph");
    if (s.landing) ph.appendChild(makeImg(s.landing.src, "cover", s.landing.alt));
    band.appendChild(ph);
    band.appendChild(el("div", "scrim"));

    const label = el("div", "label");
    const left = el("div");
    left.appendChild(el("span", "num", s.n + " / " + pad(SECTIONS.length)));
    left.appendChild(el("div", "ttl", s.title));
    label.appendChild(left);
    label.appendChild(el("div", "view", `${s.groups.length} chapters · ${totalFrames(s)} frames <span>&#8599;</span>`));
    band.appendChild(label);

    band.addEventListener("click", () => {
      enter(i);
    });
    landing.appendChild(band);
  });

  // contact band — minimal: name + email
  const contact = el("div", "contact");
  contact.appendChild(el("span", "c-eyebrow", "Contact"));
  contact.appendChild(el("div", "c-name", CONTACT.name));
  const cmail = el("a", "c-mail", CONTACT.email) as HTMLAnchorElement;
  cmail.href = "mailto:" + CONTACT.email;
  contact.appendChild(cmail);
  contact.appendChild(el("div", "c-loc", CONTACT.location));
  landing.appendChild(contact);

  container.appendChild(landing);

  // ---- stage --------------------------------------------------
  const stage = el("div", "stage");

  const progress = el("div", "progress");
  const progBar = el("div", "progbar");
  progress.appendChild(progBar);
  stage.appendChild(progress);

  const track = el("div", "track");

  const panels: Panel[] = [];
  const sectionStart: number[] = [];
  const sectionLen: number[] = [];
  const groupStart = new Map<string, number>(); // "si-gi" -> first panel index

  SECTIONS.forEach((s, si) => {
    sectionStart[si] = panels.length;
    s.groups.forEach((g, gi) => {
      groupStart.set(`${si}-${gi}`, panels.length);
      // chapter hero (first photo, cover)
      const hero = el("div", "panel hero");
      const hph = el("div", "ph");
      hph.appendChild(makeImg(g.hero.full, "cover", g.hero.alt));
      hero.appendChild(hph);
      hero.appendChild(el("div", "pscrim"));
      const cap = el("div", "hero-cap");
      cap.appendChild(
        el(
          "div",
          "eyebrow",
          s.n + " — " + s.title + " &nbsp;·&nbsp; Chapter " + pad(gi + 1) + " / " + pad(s.groups.length),
        ),
      );
      cap.appendChild(el("div", "big", g.title));
      cap.appendChild(
        el(
          "div",
          "sub",
          g.meta ? g.meta + " · " + String(g.frames.length + 1) + " frames" : String(g.frames.length + 1) + " frames",
        ),
      );
      hero.appendChild(cap);
      track.appendChild(hero);
      panels.push({ s, si, g, gi, kind: "hero", local: 0 });

      // frame photos (contain)
      g.frames.forEach((fr, fi) => {
        const p = el("div", "panel");
        const pph = el("div", "ph");
        pph.appendChild(makeImg(fr.full, "contain", fr.alt));
        p.appendChild(pph);
        p.appendChild(el("div", "pscrim"));
        track.appendChild(p);
        panels.push({ s, si, g, gi, kind: "photo", local: fi + 1 });
      });
    });
    sectionLen[si] = panels.length - (sectionStart[si] ?? 0);
  });

  stage.appendChild(track);

  // HUD (frame counter + chapter caption)
  const hud = el("div", "hud");
  const hudIdx = el("div", "idx", "01 / 07");
  const hudCap = el("div", "cap", "");
  hud.appendChild(hudIdx);
  hud.appendChild(hudCap);
  stage.appendChild(hud);

  const marker = el("div", "marker", "");
  stage.appendChild(marker);

  const rail = el("div", "rail");
  stage.appendChild(rail);

  const dotsWrap = el("div", "dots");
  stage.appendChild(dotsWrap);

  const back = el("button", "backbtn", "<span>&#8592;</span> Index");
  stage.appendChild(back);

  const pager = el("div", "pager");
  const prevSec = el("button", "psec prev", "");
  const nextSec = el("button", "psec next", "");
  pager.appendChild(prevSec);
  pager.appendChild(nextSec);
  stage.appendChild(pager);

  const scrollcue = el("div", "scrollcue", "Scroll to explore <span>&#8595;</span>");
  stage.appendChild(scrollcue);

  // view toggle (Single | All)
  const stToggle = el("div", "vtoggle");
  const stSingle = el("button", "on", "Single");
  const stGrid = el("button", undefined, "All");
  stToggle.appendChild(stSingle);
  stToggle.appendChild(stGrid);
  stGrid.addEventListener("click", () => {
    const p = panels[idx];
    if (p) showOverview(p.si);
  });
  stage.appendChild(stToggle);

  container.appendChild(stage);

  // overview state
  let gridView: HTMLElement | null = null;
  let overviewSi = 0;
  let gridBuilt = false;
  let ovPrev: HTMLElement | null = null;
  let ovNext: HTMLElement | null = null;

  // ---- state + behaviour -------------------------------------
  let idx = 0;
  const panelEls = track.querySelectorAll(".panel");

  function buildRail(si: number): void {
    rail.innerHTML = "";
    const sec = SECTIONS[si];
    if (!sec) return;
    sec.groups.forEach((g, gi) => {
      const b = el("button");
      b.appendChild(el("span", "rn", pad(gi + 1)));
      b.appendChild(el("span", "rt", g.title));
      b.addEventListener("click", () => {
        goTo(groupStart.get(`${si}-${gi}`) ?? 0);
      });
      rail.appendChild(b);
    });
  }

  function buildDots(g: Group): void {
    dotsWrap.innerHTML = "";
    const total = g.frames.length + 1;
    const gs = groupStart.get(curGid()) ?? 0;
    for (let j = 0; j < total; j++) {
      const b = el("button");
      b.setAttribute("aria-label", "Frame " + String(j + 1));
      b.addEventListener("click", () => {
        goTo(gs + j);
      });
      dotsWrap.appendChild(b);
    }
  }

  function curGid(): string {
    const p = panels[idx];
    return p ? `${p.si}-${p.gi}` : "0-0";
  }

  function updateUI(): void {
    const p = panels[idx];
    if (!p) return;
    const total = p.g.frames.length + 1;
    const num = p.local + 1;
    hudIdx.textContent = pad(num) + " / " + pad(total);
    hudCap.textContent = p.kind === "hero" ? p.g.title + (p.g.meta ? " — " + p.g.meta : "") : p.g.title;
    marker.textContent = p.s.n + " · " + p.s.title;

    const denom = Math.max(1, (sectionLen[p.si] ?? 1) - 1);
    progBar.style.transform = "scaleX(" + String((idx - (sectionStart[p.si] ?? 0)) / denom) + ")";

    idxBtn.classList.remove("active");
    Object.keys(navBtns).forEach((k) => {
      navBtns[k]?.classList.toggle("active", k === p.s.key);
    });

    const ps = SECTIONS[p.si - 1];
    const ns = SECTIONS[p.si + 1];
    prevSec.innerHTML = ps ? "&#8593; " + ps.title : "";
    prevSec.style.visibility = ps ? "visible" : "hidden";
    nextSec.innerHTML = ns ? ns.title + " &#8595;" : "";
    nextSec.style.visibility = ns ? "visible" : "hidden";

    if (rail.dataset.si !== String(p.si)) {
      rail.dataset.si = String(p.si);
      buildRail(p.si);
    }
    for (let ri = 0; ri < rail.children.length; ri++) {
      rail.children[ri]?.classList.toggle("on", ri === p.gi);
    }

    const gid = `${p.si}-${p.gi}`;
    if (dotsWrap.dataset.gid !== gid) {
      dotsWrap.dataset.gid = gid;
      buildDots(p.g);
    }
    for (let d = 0; d < dotsWrap.children.length; d++) {
      dotsWrap.children[d]?.classList.toggle("on", d === p.local);
    }

    for (let e = 0; e < panelEls.length; e++) {
      panelEls[e]?.classList.toggle("live", e === idx);
    }
    scrollcue.classList.toggle("gone", p.kind !== "hero");
  }

  function goTo(i: number): void {
    idx = Math.max(0, Math.min(panels.length - 1, i));
    track.style.transform = "translateY(" + String(-idx * 100) + "%)";
    updateUI();
  }

  function enter(si: number): void {
    idx = sectionStart[si] ?? 0;
    track.style.transition = "none";
    track.style.transform = "translateY(" + String(-idx * 100) + "%)";
    void track.offsetHeight;
    track.style.transition = "";
    updateUI();
    stage.classList.add("on");
  }

  function exit(scrollToSelector?: string): void {
    stage.classList.remove("on");
    if (gridView) gridView.classList.remove("on");
    if (scrollToSelector) {
      const t = landing.querySelector<HTMLElement>(scrollToSelector);
      if (t) landing.scrollTop = t.offsetTop;
    }
  }

  // ---- overview (per-section editorial grid) -----------------
  function buildOverview(): void {
    const gv = el("div", "overview");
    gridView = gv;

    const gback = el("button", "backbtn gback", "<span>&#8592;</span> Index");
    gback.addEventListener("click", () => {
      gv.classList.remove("on");
      const t = landing.querySelector<HTMLElement>('.band[data-section="' + String(overviewSi) + '"]');
      if (t) landing.scrollTop = t.offsetTop;
    });
    gv.appendChild(gback);

    const chrome = el("div", "ov-chrome");
    ovPrev = el("button", "ov-arrow", "&#8249;");
    ovPrev.addEventListener("click", () => {
      if (overviewSi > 0) showOverview(overviewSi - 1);
    });
    const grToggle = el("div", "vtoggle");
    const grSingle = el("button", undefined, "Single");
    const grGrid = el("button", "on", "All");
    grToggle.appendChild(grSingle);
    grToggle.appendChild(grGrid);
    grSingle.addEventListener("click", () => {
      openSingleAt(sectionStart[overviewSi] ?? 0);
    });
    ovNext = el("button", "ov-arrow", "&#8250;");
    ovNext.addEventListener("click", () => {
      if (overviewSi < SECTIONS.length - 1) showOverview(overviewSi + 1);
    });
    chrome.appendChild(ovPrev);
    chrome.appendChild(grToggle);
    chrome.appendChild(ovNext);
    gv.appendChild(chrome);

    SECTIONS.forEach((s, si) => {
      const ov = el("div", "ov-section");
      ov.dataset.si = String(si);

      const main = el("div", "ov-main");
      const inner = el("div", "ov-inner");
      s.groups.forEach((g, gi) => {
        const chead = el("div", "ov-chead");
        chead.appendChild(el("span", "ocn", pad(gi + 1)));
        chead.appendChild(el("span", "oct", g.title));
        if (g.meta) chead.appendChild(el("span", "ocm", g.meta));
        inner.appendChild(chead);

        const grid = el("div", "ov-grid");
        const cells: Photo[] = [g.hero, ...g.frames];
        cells.forEach((photo, j) => {
          const gs = groupStart.get(`${si}-${gi}`) ?? 0;
          const panelIndex = gs + j;
          const cell = el("button", "ov-cell" + (j === 0 ? " lead" : ""));
          cell.appendChild(makeImg(photo.thumb, j === 0 ? "cover" : "contain", photo.alt));
          cell.appendChild(el("span", "ov-ci", pad(j + 1)));
          cell.addEventListener("click", () => {
            openSingleAt(panelIndex);
          });
          grid.appendChild(cell);
        });
        inner.appendChild(grid);
      });
      main.appendChild(inner);
      ov.appendChild(main);

      const side = el("div", "ov-side");
      side.appendChild(el("span", "os-num", s.n + " / " + pad(SECTIONS.length)));
      side.appendChild(el("div", "os-title", s.title));
      if (s.tagline) side.appendChild(el("div", "os-tag", s.tagline));
      const chList = el("div", "os-chapters");
      s.groups.forEach((g, gi) => {
        const r = el("button", "os-ch");
        r.appendChild(el("span", "osc-n", pad(gi + 1)));
        r.appendChild(el("span", "osc-t", g.title));
        r.appendChild(el("span", "osc-m", (g.meta ? g.meta + " · " : "") + String(g.frames.length + 1) + " frames"));
        r.addEventListener("click", () => {
          const heads = main.querySelectorAll<HTMLElement>(".ov-chead");
          const t = heads[gi];
          if (t) main.scrollTo({ top: t.offsetTop - 24, behavior: "smooth" });
        });
        chList.appendChild(r);
      });
      side.appendChild(chList);
      const tags = el("div", "os-tags");
      s.tags.forEach((t) => {
        tags.appendChild(el("span", undefined, t));
      });
      side.appendChild(tags);
      ov.appendChild(side);

      gv.appendChild(ov);
    });

    container.appendChild(gv);
    gridBuilt = true;
  }

  function updateOvArrows(): void {
    if (ovPrev) ovPrev.style.visibility = overviewSi > 0 ? "visible" : "hidden";
    if (ovNext) ovNext.style.visibility = overviewSi < SECTIONS.length - 1 ? "visible" : "hidden";
  }

  function showOverview(si: number): void {
    if (!gridBuilt) buildOverview();
    const gv = gridView;
    if (!gv) return;
    overviewSi = Math.max(0, Math.min(SECTIONS.length - 1, si));
    stage.classList.remove("on");
    gv.classList.add("on");
    const secs = gv.querySelectorAll<HTMLElement>(".ov-section");
    for (const node of secs) {
      const on = Number(node.dataset.si) === overviewSi;
      node.classList.toggle("on", on);
      if (on) {
        const m = node.querySelector<HTMLElement>(".ov-main");
        if (m) m.scrollTop = 0;
      }
    }
    idxBtn.classList.remove("active");
    const ovSec = SECTIONS[overviewSi];
    Object.keys(navBtns).forEach((key) => {
      navBtns[key]?.classList.toggle("active", key === ovSec?.key);
    });
    updateOvArrows();
  }

  function openSingleAt(i: number): void {
    if (gridView) gridView.classList.remove("on");
    idx = Math.max(0, Math.min(panels.length - 1, i));
    track.style.transition = "none";
    track.style.transform = "translateY(" + String(-idx * 100) + "%)";
    void track.offsetHeight;
    track.style.transition = "";
    updateUI();
    stage.classList.add("on");
  }

  // nav wiring
  brand.addEventListener("click", () => {
    exit();
    landing.scrollTop = 0;
    playHeroName();
  });
  idxBtn.addEventListener("click", () => {
    exit();
    landing.scrollTop = 0;
    playHeroName();
  });
  contactBtn.addEventListener("click", () => {
    exit(".contact");
  });
  SECTIONS.forEach((s, i) => {
    navBtns[s.key]?.addEventListener("click", () => {
      if (gridView?.classList.contains("on")) showOverview(i);
      else enter(i);
    });
  });
  back.addEventListener("click", () => {
    const p = panels[idx];
    if (p) exit('.band[data-section="' + String(p.si) + '"]');
  });
  prevSec.addEventListener("click", () => {
    const p = panels[idx];
    if (p && p.si > 0) enter(p.si - 1);
  });
  nextSec.addEventListener("click", () => {
    const p = panels[idx];
    if (p && p.si < SECTIONS.length - 1) enter(p.si + 1);
  });

  // scroll-hijack on the stage
  let lock = false;
  function armLock(): void {
    setTimeout(() => {
      lock = false;
    }, 820);
  }
  function step(d: number): void {
    if (lock) return;
    if (d > 0) {
      if (idx >= panels.length - 1) return;
      lock = true;
      armLock();
      goTo(idx + 1);
    } else {
      if (idx === 0) {
        const p0 = panels[0];
        if (p0) exit('.band[data-section="' + String(p0.si) + '"]');
        return;
      }
      lock = true;
      armLock();
      goTo(idx - 1);
    }
  }

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 6) return;
      step(e.deltaY > 0 ? 1 : -1);
    },
    { passive: false },
  );

  // touch
  let touchY: number | null = null;
  stage.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchY = t ? t.clientY : null;
    },
    { passive: true },
  );
  stage.addEventListener(
    "touchmove",
    (e) => {
      if (touchY == null) return;
      const t = e.touches[0];
      if (!t) return;
      const dy = touchY - t.clientY;
      if (Math.abs(dy) > 46) {
        step(dy > 0 ? 1 : -1);
        touchY = null;
      }
    },
    { passive: true },
  );
  stage.addEventListener("touchend", () => {
    touchY = null;
  });

  // keyboard
  function onKey(e: KeyboardEvent): void {
    if (gridView?.classList.contains("on")) {
      if (e.key === "Escape") {
        gridView.classList.remove("on");
        const t = landing.querySelector<HTMLElement>('.band[data-section="' + String(overviewSi) + '"]');
        if (t) landing.scrollTop = t.offsetTop;
      }
      return;
    }
    if (!stage.classList.contains("on")) return;
    if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Escape") {
      const p = panels[idx];
      if (p) exit('.band[data-section="' + String(p.si) + '"]');
    }
  }
  document.addEventListener("keydown", onKey);

  playHeroName();
}

export function boot(): void {
  const root = document.getElementById("stageRoot");
  const raw = root?.dataset.portfolio;
  if (!root || !raw) return;
  const data = JSON.parse(raw) as PortfolioData;
  if (!data.sections.length) return;
  mount(root, data);
}
