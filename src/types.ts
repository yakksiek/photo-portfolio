// Engine (portfolio scroll-engine) data contracts.
// Shared between src/pages/index.astro (data shaping) and the React island
// (src/components/Portfolio.tsx). NOTE: this `Photo` is the *engine* photo
// ({full, thumb, alt}), distinct from the Sanity `Photo` in src/sanity/types.ts
// — keep them separate; do not merge.

export interface Photo {
  full: string; // large display URL (cover for heroes, contain for frames)
  thumb: string; // overview-grid URL
  alt: string;
}

export interface Group {
  key: string;
  title: string;
  meta: string; // "Place · Year" / "Place" / "Year" / ""
  hero: Photo; // first photo, cover treatment
  frames: Photo[]; // remaining photos, contain treatment
}

export interface Section {
  key: string;
  number: string; // "01"
  title: string;
  tagline: string;
  tags: string[];
  landing: { src: string; alt: string } | null; // dedicated landing hero
  groups: Group[];
}

export interface PortfolioData {
  sections: Section[];
  contact: { name: string; email: string; location: string };
}

export interface Panel {
  section: Section;
  sectionIndex: number;
  group: Group;
  groupIndex: number;
  kind: "hero" | "photo";
  localIndex: number; // 0 = hero, 1..N = frame index
}
