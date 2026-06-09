import { defineArrayMember, defineField, defineType } from "sanity";

// A chapter (one photoshoot) within a section. Ordered `photos`; the first
// photo is the chapter hero by convention — no separate hero control
// (FR-002, FR-003).
export const chapter = defineType({
  name: "chapter",
  title: "Chapter",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "section",
      type: "reference",
      to: [{ type: "section" }],
      description: "Which section this chapter belongs to.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Order of this chapter within its section.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "place", type: "string" }),
    defineField({ name: "year", type: "number" }),
    defineField({ name: "description", type: "text" }),
    defineField({
      name: "photos",
      type: "array",
      of: [defineArrayMember({ type: "photo" })],
      description: "Ordered photos. The first photo is the chapter hero.",
      validation: (rule) => rule.min(1),
    }),
  ],
  orderings: [{ title: "Chapter order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "place", media: "photos.0.image" },
  },
});
