import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schema";

// Configures Sanity Studio, mounted by @sanity/astro at /admin.
// This is where the owner logs in (Sanity-managed auth) and edits content.
export default defineConfig({
  name: "default",
  title: "Marcin Kulbicki — Photography Portfolio",
  projectId,
  dataset,
  basePath: "/admin",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
