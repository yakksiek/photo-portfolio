import { sanityClient } from "./client";
import type { Section } from "./types";

// All sections in display order, each with its chapters (and their ordered
// photos) nested via a reference join. Run at build time for the static site.
const siteQuery = `*[_type == "section"] | order(order asc){
  _id, title, order, numberOverride, tagline, tags,
  landingHero,
  "chapters": *[_type == "chapter" && references(^._id)] | order(order asc){
    _id, title, order, place, year, description, photos
  }
}`;

export async function getSections(): Promise<Section[]> {
  return await sanityClient.fetch<Section[]>(siteQuery);
}
