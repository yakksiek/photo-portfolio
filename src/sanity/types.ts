import type { SanityImageSource } from "@sanity/image-url";

// Shapes returned by the GROQ queries in queries.ts. These mirror the schema
// in src/sanity/schema/ but only the fields the public site reads.

export interface Photo {
  image: SanityImageSource;
  alt: string;
}

export interface Chapter {
  _id: string;
  title: string;
  order: number;
  place?: string | null;
  year?: number | null;
  description?: string | null;
  photos?: Photo[] | null;
}

export interface Section {
  _id: string;
  title: string;
  order: number;
  numberOverride?: number | null;
  tagline?: string | null;
  tags?: string[] | null;
  landingHero?: Photo | null;
  chapters?: Chapter[];
}

// The 01–0N label: manual override if set, else the order, zero-padded.
export function sectionNumber(section: Section): string {
  return String(section.numberOverride ?? section.order).padStart(2, "0");
}
