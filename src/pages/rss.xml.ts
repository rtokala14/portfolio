import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "../lib/site";

export async function GET(context: APIContext) {
  const reports = (await getCollection("reports", (r) => !r.data.draft)).sort((a, b) => +b.data.date - +a.data.date);
  return rss({
    title: "Rohit Tokala · Trip reports",
    description: "Weekly notes: something built or tested, and what the numbers said.",
    site: context.site ?? SITE.url,
    items: reports.map((r) => ({ title: r.data.title, description: r.data.description, pubDate: r.data.date, link: `/reports/${r.id}`, categories: r.data.tags })),
    customData: "<language>en</language>",
  });
}
