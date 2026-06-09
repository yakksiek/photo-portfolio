import { defineCliConfig } from "sanity/cli";

// Used by the Sanity CLI (dataset/cors/deploy commands). projectId and dataset
// are public, non-secret coordinates — safe to commit.
export default defineCliConfig({
  api: {
    projectId: "bp1ecwdp",
    dataset: "production",
  },
});
