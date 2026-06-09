import { defineField, defineType } from "sanity";

// A single photo: the image plus its alt text (FR-005). Used as an array member
// inside a chapter's `photos` and as a section's `landingHero`.
export const photo = defineType({
  name: "photo",
  title: "Photo",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description: "Describes the photo for screen readers and SEO. Required.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
});
