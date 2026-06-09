import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

import { apiVersion, dataset, projectId } from "./env";

// Read-only client for fetching published content on the public site.
// `useCdn: true` serves from Sanity's edge cache — fine for a public,
// read-only portfolio. Content is fetched at build time for static pages.
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

const builder = createImageUrlBuilder(sanityClient);

// Build a CDN image URL with on-the-fly transforms (responsive variants,
// cover/contain fit, etc. — FR-007). Example: urlFor(photo.image).width(1600).url()
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
