import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const grade = z.enum(["T1", "T2", "T3", "T4", "T5", "T6"]);

/** Work and side projects. Each is a summit on the sheet. */
const routes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/routes" }),
  schema: z.object({
    summit: z.string(), // the name lettered on the map: the problem, in plain words
    title: z.string(), // one-line plain description, intrigue level
    kind: z.enum(["work", "side"]),
    order: z.number(),
    featured: z.boolean().default(false), // visited during the scroll descent
    grade,
    period: z.string(),
    climbs: z
      .array(z.object({ what: z.string(), from: z.string(), to: z.string(), note: z.string().optional() }))
      .default([]),
    stack: z.array(z.string()).default([]),
    link: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Weekly writing: trip reports. */
const reports = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/reports" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    grade,
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { routes, reports };
