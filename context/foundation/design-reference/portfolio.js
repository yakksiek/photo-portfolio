/* ============================================================
   Marcin Kulbicki — Photography
   Self-contained, scroll-hijacked photo portfolio.
   Single direction: "Grain" (colour, red accent, full-bleed).

   Structure: Section -> Chapters (subsections) -> hero + frames.
   One continuous vertical track flows through every chapter and
   section; a left "chapter rail" indexes the current section.
   ============================================================ */
(function () {
  "use strict";

  var SECTIONS = [
    {
      key: "concerts", n: "01", title: "Concerts",
      tagline: "Stage light, smoke and the half-second before the noise.",
      tags: ["Live", "2019—25", "35mm · push"],
      groups: [
        { key: "opener", title: "Open’er", meta: "Gdynia · 2023", count: 6 },
        { key: "unsound", title: "Unsound", meta: "Kraków · 2022", count: 5 },
        { key: "clubnights", title: "Club Nights", meta: "Warsaw · 2024", count: 7 },
      ],
    },
    {
      key: "portraits", n: "02", title: "Portraits",
      tagline: "Faces held still long enough to give something away.",
      tags: ["Studio & street", "2018—25", "Medium format"],
      groups: [
        { key: "studio", title: "Studio", meta: "Warsaw · 2021—24", count: 6 },
        { key: "street", title: "Street Faces", meta: "On location · 2019—24", count: 5 },
        { key: "performers", title: "Performers", meta: "Backstage · 2022—25", count: 6 },
      ],
    },
    {
      key: "lifestyle", n: "03", title: "Lifestyle",
      tagline: "The unposed hours — rooms, streets, the in-between.",
      tags: ["Candid", "2020—25", "Available light"],
      groups: [
        { key: "mornings", title: "Mornings", meta: "Interiors · 2023", count: 5 },
        { key: "cityhours", title: "City Hours", meta: "Warsaw · 2022—24", count: 6 },
        { key: "offmap", title: "Off the Map", meta: "Elsewhere · 2020—24", count: 6 },
      ],
    },
    {
      key: "landscape", n: "04", title: "Landscape",
      tagline: "Land and weather, given room to breathe.",
      tags: ["Wide open", "2017—25", "Long exposure"],
      groups: [
        { key: "tatra", title: "Tatra", meta: "Highlands · 2021", count: 6 },
        { key: "baltic", title: "Baltic", meta: "Coast · 2023", count: 5 },
        { key: "north", title: "Northbound", meta: "Iceland · 2024", count: 7 },
      ],
    },
  ];

  var CONTACT = {
    name: "Marcin Kulbicki",
    email: "marcin.kulbicki@gmail.com",
    location: "Switzerland · Poland",
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function makeSlot(id, placeholder) {
    var s = document.createElement("image-slot");
    s.id = id;
    s.setAttribute("shape", "rect");
    s.setAttribute("radius", "0");
    s.setAttribute("placeholder", placeholder);
    return s;
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  // ---------------------------------------------------------------
  function mount(container, dir) {
    container.innerHTML = "";
    // slot id: a-<section>-<group>-<suffix>  (shared across mirror instances)
    var slotId = function (sk, gk, suffix) { return dir + "-" + sk + "-" + gk + "-" + suffix; };
    var firstHeroId = function (s) { return slotId(s.key, s.groups[0].key, "hero"); };
    var totalFrames = function (s) { var t = 0; s.groups.forEach(function (g) { t += g.count; }); return t; };

    // overlays
    container.appendChild(el("div", "vignette"));
    container.appendChild(el("div", "grain"));

    // ---- top bar ------------------------------------------------
    var bar = el("div", "bar");
    var brand = el("button", "brand", "MARCIN KULBICKI<small>Photography</small>");
    bar.appendChild(brand);
    var menu = el("div", "menu");
    var navBtns = {};
    var idxBtn = el("button", null, "Index");
    menu.appendChild(idxBtn);
    SECTIONS.forEach(function (s, i) {
      var b = el("button", null, s.title);
      b.addEventListener("mouseenter", function () { setIntroBg(i); });
      navBtns[s.key] = b;
      menu.appendChild(b);
    });
    var contactBtn = el("button", null, "Contact");
    menu.appendChild(contactBtn);
    menu.addEventListener("mouseleave", function () { setIntroBg(defaultBg); });
    bar.appendChild(menu);
    container.appendChild(bar);

    // ---- landing ------------------------------------------------
    var landing = el("div", "landing");

    var defaultBg = (function () {
      for (var z = 0; z < SECTIONS.length; z++) if (SECTIONS[z].key === "portraits") return z;
      return 0;
    })();

    var intro = el("div", "intro");

    // background layer — mirrors each section's first chapter hero, crossfades on hover
    var introBg = el("div", "intro-bg");
    var bgshots = [];
    SECTIONS.forEach(function (s, i) {
      var shot = el("div", "bgshot");
      shot.dataset.key = s.key;
      var bgslot = makeSlot(firstHeroId(s), "");
      bgslot.setAttribute("fit", "cover");
      shot.appendChild(bgslot);
      if (i === defaultBg) shot.classList.add("on");
      introBg.appendChild(shot);
      bgshots.push(shot);
    });
    intro.appendChild(introBg);
    intro.appendChild(el("div", "intro-scrim"));

    var nameEl = el("div", "name", "<span>MARCIN</span><span>KULBICKI</span>");
    intro.appendChild(nameEl);

    // role line with hoverable section names
    var role = el("div", "role");
    var rolePre = el("span", "role-pre", "Photographer —");
    role.appendChild(rolePre);
    var linksWrap = el("div", "role-links");
    var roleLinks = [];
    SECTIONS.forEach(function (s, i) {
      if (i > 0) linksWrap.appendChild(el("span", "role-sep", "·"));
      var lk = el("button", "rolelink", s.title);
      lk.dataset.i = String(i);
      if (i === defaultBg) lk.classList.add("active");
      lk.addEventListener("mouseenter", function () { setIntroBg(i); });
      lk.addEventListener("focus", function () { setIntroBg(i); });
      lk.addEventListener("click", function () { enter(i); });
      linksWrap.appendChild(lk);
      roleLinks.push(lk);
    });
    role.appendChild(linksWrap);
    role.addEventListener("mouseleave", function () { setIntroBg(defaultBg); });
    intro.appendChild(role);

    intro.appendChild(el("div", "cue", "Scroll"));
    landing.appendChild(intro);

    function setIntroBg(i) {
      for (var b = 0; b < bgshots.length; b++) bgshots[b].classList.toggle("on", b === i);
      for (var r = 0; r < roleLinks.length; r++) roleLinks[r].classList.toggle("active", r === i);
    }

    // hero name: visible briefly on landing, then collapses away
    var nameTimer;
    function hideHeroName() {
      nameEl.style.maxHeight = nameEl.scrollHeight + "px";
      void nameEl.offsetHeight;
      nameEl.classList.add("gone");
      role.classList.add("compact");
      container.style.setProperty("--intro-dim-now", "var(--intro-dim-settled, 0.5)");
    }
    function playHeroName() {
      clearTimeout(nameTimer);
      nameEl.classList.remove("gone");
      role.classList.remove("compact");
      nameEl.style.maxHeight = "";
      container.style.setProperty("--intro-dim-now", "1");
      nameTimer = setTimeout(hideHeroName, 2000);
    }

    // section bands
    SECTIONS.forEach(function (s, i) {
      var band = el("div", "band");
      band.dataset.section = i;
      var ph = el("div", "ph");
      ph.appendChild(makeSlot(firstHeroId(s), "Drop a " + s.title.toLowerCase() + " hero photo"));
      band.appendChild(ph);
      band.appendChild(el("div", "scrim"));

      var label = el("div", "label");
      var left = el("div");
      left.appendChild(el("span", "num", s.n + " / 04"));
      left.appendChild(el("div", "ttl", s.title));
      label.appendChild(left);
      label.appendChild(el("div", "view",
        s.groups.length + " chapters · " + totalFrames(s) + " frames <span>&#8599;</span>"));
      band.appendChild(label);

      band.addEventListener("click", function () { enter(i); });
      landing.appendChild(band);
    });

    // contact band — minimal: name + email
    var contact = el("div", "contact");
    contact.appendChild(el("span", "c-eyebrow", "Contact"));
    contact.appendChild(el("div", "c-name", CONTACT.name));
    var cmail = el("a", "c-mail", CONTACT.email);
    cmail.href = "mailto:" + CONTACT.email;
    contact.appendChild(cmail);
    contact.appendChild(el("div", "c-loc", CONTACT.location));
    landing.appendChild(contact);

    container.appendChild(landing);

    // ---- stage --------------------------------------------------
    var stage = el("div", "stage");

    // progress bar (position within section)
    var progress = el("div", "progress");
    var progBar = el("div", "progbar");
    progress.appendChild(progBar);
    stage.appendChild(progress);

    var track = el("div", "track");

    var panels = [];          // flat list across all sections + chapters
    var sectionStart = [];    // section index -> first panel index
    var sectionLen = [];      // section index -> panel count

    SECTIONS.forEach(function (s, si) {
      sectionStart[si] = panels.length;
      s.groups.forEach(function (g, gi) {
        g._start = panels.length;
        // chapter hero (shares id with the section band when it's the first chapter)
        var hero = el("div", "panel hero");
        var hph = el("div", "ph");
        var heroSlot = makeSlot(slotId(s.key, g.key, "hero"), "Drop the " + g.title + " hero photo");
        heroSlot.setAttribute("fit", "cover");
        hph.appendChild(heroSlot);
        hero.appendChild(hph);
        hero.appendChild(el("div", "pscrim"));
        var cap = el("div", "hero-cap");
        cap.appendChild(el("div", "eyebrow",
          s.n + " — " + s.title + " &nbsp;·&nbsp; Chapter " + pad(gi + 1) + " / " + pad(s.groups.length)));
        cap.appendChild(el("div", "big", g.title));
        cap.appendChild(el("div", "sub", g.meta + " · " + g.count + " frames"));
        hero.appendChild(cap);
        track.appendChild(hero);
        panels.push({ s: s, si: si, g: g, gi: gi, kind: "hero", local: 0 });

        for (var i = 1; i <= g.count; i++) {
          var p = el("div", "panel");
          var pph = el("div", "ph");
          var frameSlot = makeSlot(slotId(s.key, g.key, i), "Drop " + g.title + " frame " + i);
          frameSlot.setAttribute("fit", "contain");
          pph.appendChild(frameSlot);
          p.appendChild(pph);
          p.appendChild(el("div", "pscrim"));
          track.appendChild(p);
          panels.push({ s: s, si: si, g: g, gi: gi, kind: "photo", local: i });
        }
      });
      sectionLen[si] = panels.length - sectionStart[si];
    });

    stage.appendChild(track);

    // HUD (frame counter + chapter caption)
    var hud = el("div", "hud");
    var hudIdx = el("div", "idx", "01 / 07");
    var hudCap = el("div", "cap", "");
    hud.appendChild(hudIdx);
    hud.appendChild(hudCap);
    stage.appendChild(hud);

    // section marker (top-right)
    var marker = el("div", "marker", "");
    stage.appendChild(marker);

    // chapter rail (left) — indexes the current section's chapters
    var rail = el("div", "rail");
    stage.appendChild(rail);

    // frame dots (right) — frames within the current chapter
    var dotsWrap = el("div", "dots");
    stage.appendChild(dotsWrap);

    // back button
    var back = el("button", "backbtn", "<span>&#8592;</span> Index");
    stage.appendChild(back);

    // section pager (prev / next section)
    var pager = el("div", "pager");
    var prevSec = el("button", "psec prev", "");
    var nextSec = el("button", "psec next", "");
    pager.appendChild(prevSec);
    pager.appendChild(nextSec);
    stage.appendChild(pager);

    // scroll cue
    var scrollcue = el("div", "scrollcue", "Scroll to explore <span>&#8595;</span>");
    stage.appendChild(scrollcue);

    // view toggle (Single | All) in the cinematic chrome
    var stToggle = el("div", "vtoggle");
    var stSingle = el("button", "on", "Single");
    var stGrid = el("button", null, "All");
    stToggle.appendChild(stSingle);
    stToggle.appendChild(stGrid);
    stGrid.addEventListener("click", function () { showOverview(panels[idx].si); });
    stage.appendChild(stToggle);

    container.appendChild(stage);

    // overview (per-section editorial grid) — built lazily on first open
    var gridView, overviewSi = 0, gridBuilt = false, ovPrev, ovNext;

    // ---- state + behaviour -------------------------------------
    var idx = 0;
    var panelEls = track.querySelectorAll(".panel");

    function buildRail(si) {
      rail.innerHTML = "";
      SECTIONS[si].groups.forEach(function (g, gi) {
        var b = el("button");
        b.appendChild(el("span", "rn", pad(gi + 1)));
        b.appendChild(el("span", "rt", g.title));
        b.addEventListener("click", function () { goTo(g._start); });
        rail.appendChild(b);
      });
    }

    function buildDots(g) {
      dotsWrap.innerHTML = "";
      var total = g.count + 1;
      for (var j = 0; j < total; j++) {
        (function (j) {
          var b = el("button");
          b.setAttribute("aria-label", "Frame " + (j + 1));
          b.addEventListener("click", function () { goTo(g._start + j); });
          dotsWrap.appendChild(b);
        })(j);
      }
    }

    function updateUI() {
      var p = panels[idx];
      var total = p.g.count + 1;
      var num = p.local + 1;
      hudIdx.textContent = pad(num) + " / " + pad(total);
      hudCap.textContent = p.kind === "hero" ? (p.g.title + " — " + p.g.meta) : p.g.title;
      marker.textContent = p.s.n + " · " + p.s.title;

      // progress within the whole section
      var denom = Math.max(1, sectionLen[p.si] - 1);
      progBar.style.transform = "scaleX(" + ((idx - sectionStart[p.si]) / denom) + ")";

      // nav highlight
      idxBtn.classList.remove("active");
      Object.keys(navBtns).forEach(function (k) {
        navBtns[k].classList.toggle("active", k === p.s.key);
      });

      // pager labels
      var ps = SECTIONS[p.si - 1], ns = SECTIONS[p.si + 1];
      prevSec.innerHTML = ps ? "&#8593; " + ps.title : "";
      prevSec.style.visibility = ps ? "visible" : "hidden";
      nextSec.innerHTML = ns ? ns.title + " &#8595;" : "";
      nextSec.style.visibility = ns ? "visible" : "hidden";

      // chapter rail (rebuild on section change, highlight current chapter)
      if (rail.dataset.si !== String(p.si)) {
        rail.dataset.si = String(p.si);
        buildRail(p.si);
      }
      for (var ri = 0; ri < rail.children.length; ri++) {
        rail.children[ri].classList.toggle("on", ri === p.gi);
      }

      // frame dots (rebuild on chapter change, highlight current frame)
      var gid = p.si + "-" + p.gi;
      if (dotsWrap.dataset.gid !== gid) {
        dotsWrap.dataset.gid = gid;
        buildDots(p.g);
      }
      var dotBtns = dotsWrap.children;
      for (var d = 0; d < dotBtns.length; d++) {
        dotBtns[d].classList.toggle("on", d === p.local);
      }

      // live panel reveal
      for (var e = 0; e < panelEls.length; e++) {
        panelEls[e].classList.toggle("live", e === idx);
      }
      scrollcue.classList.toggle("gone", p.kind !== "hero");
    }

    function goTo(i) {
      idx = Math.max(0, Math.min(panels.length - 1, i));
      track.style.transform = "translateY(" + (-idx * 100) + "%)";
      updateUI();
    }

    function enter(si) {
      idx = sectionStart[si];
      track.style.transition = "none";
      track.style.transform = "translateY(" + (-idx * 100) + "%)";
      void track.offsetHeight;
      track.style.transition = "";
      updateUI();
      stage.classList.add("on");
    }

    function exit(scrollToSelector) {
      stage.classList.remove("on");
      if (gridView) gridView.classList.remove("on");
      if (scrollToSelector) {
        var t = landing.querySelector(scrollToSelector);
        if (t) landing.scrollTop = t.offsetTop;
      }
    }

    // ---- overview (per-section editorial grid) -----------------
    function buildOverview() {
      gridView = el("div", "overview");

      var gback = el("button", "backbtn gback", "<span>&#8592;</span> Index");
      gback.addEventListener("click", function () {
        gridView.classList.remove("on");
        var t = landing.querySelector('.band[data-section="' + overviewSi + '"]');
        if (t) landing.scrollTop = t.offsetTop;
      });
      gridView.appendChild(gback);

      // top-center cluster: ‹ prev · Single|All · next ›
      var chrome = el("div", "ov-chrome");
      ovPrev = el("button", "ov-arrow", "&#8249;");
      ovPrev.addEventListener("click", function () { if (overviewSi > 0) showOverview(overviewSi - 1); });
      var grToggle = el("div", "vtoggle");
      var grSingle = el("button", null, "Single");
      var grGrid = el("button", "on", "All");
      grToggle.appendChild(grSingle);
      grToggle.appendChild(grGrid);
      grSingle.addEventListener("click", function () { openSingleAt(sectionStart[overviewSi]); });
      ovNext = el("button", "ov-arrow", "&#8250;");
      ovNext.addEventListener("click", function () { if (overviewSi < SECTIONS.length - 1) showOverview(overviewSi + 1); });
      chrome.appendChild(ovPrev);
      chrome.appendChild(grToggle);
      chrome.appendChild(ovNext);
      gridView.appendChild(chrome);

      SECTIONS.forEach(function (s, si) {
        var ov = el("div", "ov-section");
        ov.dataset.si = String(si);

        // scrolling image column
        var main = el("div", "ov-main");
        var inner = el("div", "ov-inner");
        s.groups.forEach(function (g, gi) {
          var chead = el("div", "ov-chead");
          chead.appendChild(el("span", "ocn", pad(gi + 1)));
          chead.appendChild(el("span", "oct", g.title));
          chead.appendChild(el("span", "ocm", g.meta));
          inner.appendChild(chead);

          var grid = el("div", "ov-grid");
          for (var j = 0; j <= g.count; j++) {
            (function (j) {
              var panelIndex = g._start + j;
              var cell = el("button", "ov-cell" + (j === 0 ? " lead" : ""));
              var id = j === 0 ? slotId(s.key, g.key, "hero") : slotId(s.key, g.key, j);
              var slot = makeSlot(id, "");
              slot.setAttribute("fit", j === 0 ? "cover" : "contain");
              cell.appendChild(slot);
              cell.appendChild(el("span", "ov-ci", pad(j + 1)));
              cell.addEventListener("click", function () { openSingleAt(panelIndex); });
              grid.appendChild(cell);
            })(j);
          }
          inner.appendChild(grid);
        });
        main.appendChild(inner);
        ov.appendChild(main);

        // sticky side info column
        var side = el("div", "ov-side");
        side.appendChild(el("span", "os-num", s.n + " / 04"));
        side.appendChild(el("div", "os-title", s.title));
        side.appendChild(el("div", "os-tag", s.tagline));
        var chList = el("div", "os-chapters");
        s.groups.forEach(function (g, gi) {
          var r = el("button", "os-ch");
          r.appendChild(el("span", "osc-n", pad(gi + 1)));
          r.appendChild(el("span", "osc-t", g.title));
          r.appendChild(el("span", "osc-m", g.meta + " · " + g.count + " frames"));
          r.addEventListener("click", function () {
            var t = main.querySelectorAll(".ov-chead")[gi];
            if (t) main.scrollTo({ top: t.offsetTop - 24, behavior: "smooth" });
          });
          chList.appendChild(r);
        });
        side.appendChild(chList);
        var tags = el("div", "os-tags");
        s.tags.forEach(function (t) { tags.appendChild(el("span", null, t)); });
        side.appendChild(tags);
        ov.appendChild(side);

        gridView.appendChild(ov);
      });

      container.appendChild(gridView);
      gridBuilt = true;
    }

    function updateOvArrows() {
      if (ovPrev) ovPrev.style.visibility = overviewSi > 0 ? "visible" : "hidden";
      if (ovNext) ovNext.style.visibility = overviewSi < SECTIONS.length - 1 ? "visible" : "hidden";
    }

    function showOverview(si) {
      if (!gridBuilt) buildOverview();
      overviewSi = Math.max(0, Math.min(SECTIONS.length - 1, si));
      stage.classList.remove("on");
      gridView.classList.add("on");
      var secs = gridView.querySelectorAll(".ov-section");
      for (var k = 0; k < secs.length; k++) {
        var on = +secs[k].dataset.si === overviewSi;
        secs[k].classList.toggle("on", on);
        if (on) { var m = secs[k].querySelector(".ov-main"); if (m) m.scrollTop = 0; }
      }
      // nav highlight
      idxBtn.classList.remove("active");
      Object.keys(navBtns).forEach(function (key) {
        navBtns[key].classList.toggle("active", key === SECTIONS[overviewSi].key);
      });
      updateOvArrows();
    }

    function openSingleAt(i) {
      if (gridView) gridView.classList.remove("on");
      idx = Math.max(0, Math.min(panels.length - 1, i));
      track.style.transition = "none";
      track.style.transform = "translateY(" + (-idx * 100) + "%)";
      void track.offsetHeight;
      track.style.transition = "";
      updateUI();
      stage.classList.add("on");
    }

    // nav wiring
    brand.addEventListener("click", function () { exit(); landing.scrollTop = 0; playHeroName(); });
    idxBtn.addEventListener("click", function () { exit(); landing.scrollTop = 0; playHeroName(); });
    contactBtn.addEventListener("click", function () { exit(".contact"); });
    SECTIONS.forEach(function (s, i) {
      navBtns[s.key].addEventListener("click", function () {
        if (gridView && gridView.classList.contains("on")) showOverview(i);
        else enter(i);
      });
    });
    back.addEventListener("click", function () {
      var si = panels[idx].si;
      exit('.band[data-section="' + si + '"]');
    });
    prevSec.addEventListener("click", function () {
      var si = panels[idx].si; if (si > 0) enter(si - 1);
    });
    nextSec.addEventListener("click", function () {
      var si = panels[idx].si; if (si < SECTIONS.length - 1) enter(si + 1);
    });

    // scroll-hijack on the stage
    var lock = false;
    function step(d) {
      if (lock) return;
      if (d > 0) {
        if (idx >= panels.length - 1) return;
        lock = true; armLock();
        goTo(idx + 1);
      } else {
        if (idx === 0) { exit('.band[data-section="' + panels[0].si + '"]'); return; }
        lock = true; armLock();
        goTo(idx - 1);
      }
    }
    function armLock() { setTimeout(function () { lock = false; }, 820); }

    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 6) return;
      step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    // touch
    var touchY = null;
    stage.addEventListener("touchstart", function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchmove", function (e) {
      if (touchY == null) return;
      var dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) > 46) { step(dy > 0 ? 1 : -1); touchY = null; }
    }, { passive: true });
    stage.addEventListener("touchend", function () { touchY = null; });

    // keyboard
    function onKey(e) {
      if (gridView && gridView.classList.contains("on")) {
        if (e.key === "Escape") {
          gridView.classList.remove("on");
          var t = landing.querySelector('.band[data-section="' + overviewSi + '"]');
          if (t) landing.scrollTop = t.offsetTop;
        }
        return;
      }
      if (!stage.classList.contains("on")) return;
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); step(-1); }
      else if (e.key === "Escape") { exit('.band[data-section="' + panels[idx].si + '"]'); }
    }
    document.addEventListener("keydown", onKey);

    playHeroName();

    return { enter: enter };
  }

  function boot() {
    mount(document.getElementById("stageRoot"), "a");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
