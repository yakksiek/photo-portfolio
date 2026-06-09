import { defineArrayMember, defineField, defineType } from "sanity";

// A top-level section (Concerts, Portraits, Lifestyle, Landscape).
// Nav order and the 01–0N number derive from `order`, with an optional
// manual `numberOverride` (FR-001, FR-006).
export const section = defineType({
  name: "section",
  title: "Section",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Controls nav order and the auto-generated 01–0N section number.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "numberOverride",
      title: "Manual number override",
      type: "number",
      description: "Optional. Overrides the auto-generated section number for this section only.",
    }),
    defineField({ name: "tagline", type: "string" }),
    defineField({
      name: "tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "landingHero",
      title: "Landing hero",
      type: "photo",
      description: "Dedicated hero image for this section's landing band and intro backdrop crossfade (FR-004).",
    }),
  ],
  orderings: [{ title: "Section order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "tagline", media: "landingHero.image" },
  },
});
