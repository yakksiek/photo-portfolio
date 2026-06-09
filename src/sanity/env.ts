// Sanity project coordinates. projectId and dataset are PUBLIC (not secrets) —
// they ship in the client bundle and are safe to commit. The defaults below are
// this project's real values; override via PUBLIC_SANITY_* env vars if needed.

// `import.meta.env`'s type varies with the astro:env config, so read the public
// vars through an explicit Record to keep access type-safe across tooling.
const env = import.meta.env as unknown as Record<string, string | undefined>;

export const apiVersion = env.PUBLIC_SANITY_API_VERSION ?? "2025-01-01";

export const dataset = env.PUBLIC_SANITY_DATASET ?? "production";

export const projectId = env.PUBLIC_SANITY_PROJECT_ID ?? "bp1ecwdp";
