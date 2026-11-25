// Renders the share card and the map posters from a running preview server.
//   npx astro build && npx astro preview &  then  node scripts/shoot-og.cjs
// Posters show while WebGL loads, so the first paint is already the map.
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const BASE = process.env.BASE ?? "http://127.0.0.1:4321";
(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  await og.goto(`${BASE}/og`, { waitUntil: "networkidle" });
  await og.waitForTimeout(2500);
  await og.screenshot({ path: "public/og.png" });
  execFileSync("python3", ["-c", "from PIL import Image;Image.open('public/og.png').convert('RGB').save('public/og.jpg',quality=84,optimize=True,progressive=True)"]);
  execFileSync("rm", ["public/og.png"]);
  for (const [name, w, h, mobile] of [["wide", 1440, 900, false], ["narrow", 390, 844, true]]) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, colorScheme: scheme, reducedMotion: "reduce" });
      const p = await ctx.newPage();
      await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await p.waitForTimeout(2500);
      await p.addStyleTag({ content: ".summits,.range{display:none!important}" });
      await p.waitForTimeout(100);
      const el = await p.$(".home-relief canvas");
      const out = `public/poster/${name}-${scheme}.png`;
      await el.screenshot({ path: out });
      execFileSync("python3", ["-c", `from PIL import Image;im=Image.open('${out}').convert('RGB');im.save('${out.replace(".png", ".webp")}',quality=62,method=6)`]);
      execFileSync("rm", [out]);
      await ctx.close();
    }
  }
  await browser.close();
})();
