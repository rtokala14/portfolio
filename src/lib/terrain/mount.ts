/**
 * Boots the map sheet inside a `.relief` element and wires up everything a visitor can do
 * with it. At rest it is a flat map, edge to edge. Drag it (or swipe on a phone) and the sheet
 * lifts into a 3D relief of the real mountain; let go and it settles flat again.
 */
import { KM_PER_UNIT, Terrain } from "./field";
import { Relief, type View } from "./relief";
import { dubaiClock, lightDir, sunPosition } from "./sun";

export interface SummitDatum {
  slug: string;
  name: string;
  x: number;
  z: number;
  featured: boolean;
}

export interface ReliefController {
  go(name: string): void;
  relief: Relief;
}

declare global {
  interface Window {
    __relief?: ReliefController;
  }
}

const mqDark = matchMedia("(prefers-color-scheme: dark)");
const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : mqDark.matches;
};
const NW = lightDir(315, 42); // how cartographers light a map

export async function mountRelief(root: HTMLElement): Promise<ReliefController | null> {
  const canvas = root.querySelector("canvas")!;
  const summits: SummitDatum[] = JSON.parse(root.dataset.summits ?? "[]");
  const centre: [number, number] = JSON.parse(root.dataset.centre ?? "[0,0]");
  const labels = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-summit]").forEach((el) => labels.set(el.dataset.summit!, el));
  const range = root.querySelector<HTMLElement>("[data-range]");
  const scaleBar = document.querySelector<HTMLElement>("[data-scale-bar]");
  const scaleLabel = document.querySelector<HTMLElement>("[data-scale-label]");
  const north = document.querySelector<HTMLElement>("[data-north]");
  const lightNote = document.querySelector<HTMLElement>("[data-light-note]");

  const terrain = await Terrain.load();

  /* ---------- camera views ---------- */
  const FOV = 0.42;
  let occludeFrac = 0;
  // At rest the sheet is tilted about 25° and turned a touch, so it reads as a model, yet fills the screen.
  const REST_PITCH = 1.06;
  const ISO = 0.2; // a long lens: close to isometric, so the tilt reads as 3D without the far edge rushing away
  let relief!: Relief;
  const views = (aspect: number): Record<string, Partial<View>> => {
    const narrow = aspect < 1;
    const [cx, cz] = narrow ? centre : [0.05, 0.08];
    const rest = { tx: cx, tz: cz, yaw: -0.14, pitch: REST_PITCH, fov: ISO, map: 1 };
    const sheet = { tx: cx, tz: cz, yaw: 0, pitch: 1.3, fov: ISO, map: 1 };
    const out: Record<string, Partial<View>> = {
      overview: { ...rest, dist: relief ? relief.coverDistance(rest, 0.84) : 2 },
      sheet: { ...sheet, dist: relief ? relief.coverDistance(sheet, 0.84) : 2 },
    };
    const yaws = [-0.35, 0.3, -0.18, 0.22, -0.28];
    summits.forEach((s, i) => {
      // a gentle oblique view, close enough that the sheet's edges stay off-screen
      out[`summit:${s.slug}`] = { tx: s.x, tz: s.z + 0.02, yaw: yaws[i % yaws.length] ?? 0, pitch: 1.0, fov: FOV, map: 0.5, dist: narrow ? 1.0 : 0.85 };
    });
    return out;
  };

  let current = root.dataset.view ?? "overview";
  relief = new Relief({
    canvas,
    terrain,
    view: { tx: 0, tz: 0, yaw: -0.14, pitch: REST_PITCH, fov: ISO, map: 1, dist: 4 },
    dark: isDark(),
    reducedMotion: mqReduce.matches,
    onFrame: (r) => place(r),
  });
  // a living sheet only where the page is about the sheet
  relief.alive = root.dataset.alive !== "false";

  const occlusion = () => {
    const occ = parseFloat(getComputedStyle(root).getPropertyValue("--occlude")) || 0;
    occludeFrac = Math.min(0.6, occ / Math.max(1, canvas.clientWidth));
    relief.leftFrac = current === "overview" || current === "sheet" ? 0 : occludeFrac;
  };
  occlusion();
  relief.setView(views(relief.aspect)[current] ?? {}, true);

  /* ---------- labels, scale bar and north arrow follow the camera ---------- */
  const NICE = [0.5, 1, 2, 5, 10];
  function place(r: Relief) {
    const v = r.view;
    for (const s of summits) {
      const el = labels.get(s.slug);
      if (!el) continue;
      const p = r.project(s.x, r.terrain.yAt(s.x, s.z) + 0.004, s.z);
      const inside = p.ok && p.x > 8 && p.y > 44 && p.x < r.width - 8 && p.y < r.height - 8;
      el.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
      el.style.visibility = inside ? "visible" : "hidden";
      el.toggleAttribute("data-flip", p.x > r.width - 170);
    }
    if (range) {
      const narrow = r.aspect < 1;
      const ax = narrow ? centre[0] - 0.08 : 0.05,
        az = narrow ? centre[1] + 0.2 : -0.32;
      const p = r.project(ax, r.terrain.yAt(ax, az) + 0.03, az);
      range.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
      range.style.opacity = current === "overview" || current === "sheet" ? String(1 - r.lift) : "0";
    }
    const kmPerPx = ((2 * v.dist * Math.tan(v.fov / 2)) / r.height) * KM_PER_UNIT;
    if (scaleBar && scaleLabel) {
      const km = NICE.find((n) => n / kmPerPx >= 70) ?? 10;
      scaleBar.style.width = `${Math.round(km / kmPerPx)}px`;
      scaleLabel.textContent = `${km} km`;
    }
    if (north) north.style.rotate = `${((r.heading * 180) / Math.PI).toFixed(2)}deg`;
    root.style.setProperty("--lift", r.lift.toFixed(3));
  }

  /* ---------- light: the cartographer's, your pointer's, or the sun over Dubai ---------- */
  let pointerLight = false;
  let timelapse = 0;
  function restingLight() {
    if (timelapse || pointerLight) return;
    const now = new Date();
    const sun = sunPosition(now);
    // Flat, a map is lit from the north-west or it reads inside out. Lifted into 3D, it gets the real sun.
    const lifted = relief.view.map < 0.8 || relief.lift > 0.15;
    if (lifted && sun.elevation > 0) {
      relief.setSun(lightDir(sun.azimuth, Math.max(sun.elevation, 18)));
      if (lightNote) lightNote.textContent = `Lit by the sun over Dubai at ${dubaiClock(now)}.`;
    } else {
      relief.setSun(NW);
      if (lightNote) lightNote.textContent = matchMedia("(hover: hover)").matches ? "Light follows your pointer. Drag to lift the map." : "Swipe the map to lift it into 3D.";
    }
  }
  restingLight();
  const sunTimer = setInterval(restingLight, 60_000);

  /* ---------- theme ---------- */
  const syncTheme = () => relief.setDark(isDark());
  mqDark.addEventListener("change", syncTheme);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- size and visibility ---------- */
  new ResizeObserver(() => {
    occlusion();
    relief.resize();
    relief.setView(views(relief.aspect)[current] ?? {}, true);
  }).observe(canvas);
  new IntersectionObserver(([e]) => {
    relief.visible = !!e?.isIntersecting;
    if (relief.visible) relief.wake();
  }).observe(root);

  /* ---------- lift and turn ---------- */
  let drag: { x: number; y: number; t: number; vx: number } | null = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0 };
    canvas.setPointerCapture(e.pointerId);
    root.dataset.dragging = "";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      const now = performance.now();
      drag.vx = (dx / Math.max(1, now - drag.t)) * 1000;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = now;
      // a swipe both turns the sheet and lifts it; dragging down lifts it further, up lays it back
      relief.dragBy(-dx * 0.005, -Math.abs(dx) * 0.0032 - dy * 0.004);
      root.dataset.touched = "";
      pointerLight = false;
      restingLight();
    } else if (e.pointerType === "mouse") {
      const r = canvas.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5,
        ny = (e.clientY - r.top) / r.height - 0.5;
      // the sheet leans a little toward you, and the light comes from where your pointer is
      relief.lean(-nx * 0.05, -0.04 - Math.hypot(nx, ny) * 0.07);
      if (!timelapse && relief.view.map > 0.8) {
        pointerLight = true;
        const az = (Math.atan2(nx, -ny) * 180) / Math.PI;
        relief.setSun(lightDir((az + 360) % 360, 38));
      }
    }
  });
  const end = () => {
    if (!drag) return;
    relief.release(-drag.vx * 0.005 * 0.25);
    drag = null;
    delete root.dataset.dragging;
    setTimeout(restingLight, 900);
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", () => {
    relief.lean(0, 0);
    pointerLight = false;
    restingLight();
  });
  canvas.addEventListener("keydown", (e) => {
    const k = ({ ArrowLeft: [0.2, -0.4], ArrowRight: [-0.2, -0.4], ArrowUp: [0, -0.6] } as Record<string, [number, number]>)[e.key];
    if (!k) return;
    e.preventDefault();
    relief.dragBy(k[0], k[1]);
    setTimeout(() => relief.release(), 700);
  });

  /* ---------- things nobody is told about ---------- */
  // Double-click (or double-tap) lifts the sheet and squashes the mountain to paper, and back.
  let flat = false;
  canvas.addEventListener("dblclick", () => {
    flat = !flat;
    relief.flatten(flat);
  });
  // ↑↑↓↓←→←→BA: a day over the mountain in six seconds, seen in 3D.
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let typed: string[] = [];
  let word = "";
  addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    typed = [...typed, e.key].slice(-code.length);
    if (typed.join() === code.join()) runTimelapse();
    if (e.key.length === 1) word = (word + e.key.toLowerCase()).slice(-12);
    if (word.endsWith("biryani")) {
      word = "";
      document.dispatchEvent(new CustomEvent("egg:biryani"));
    }
  });
  function runTimelapse() {
    if (mqReduce.matches) return;
    const start = performance.now();
    const dur = 6500;
    relief.dragBy(0.25, -0.75);
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      relief.setSun(lightDir(70 + k * 220, Math.sin(k * Math.PI) * 58 + 8));
      relief.dragBy(-0.0016, 0);
      if (lightNote) lightNote.textContent = `A day over Jebel Jais, ${String(Math.floor(6 + k * 12)).padStart(2, "0")}:00.`;
      if (k < 1) timelapse = requestAnimationFrame(step);
      else {
        timelapse = 0;
        relief.release();
        setTimeout(restingLight, 900);
      }
    };
    timelapse = requestAnimationFrame(step);
  }

  /* ---------- camera choreography ---------- */
  function go(name: string) {
    const v = views(relief.aspect)[name];
    if (!v) return;
    current = name;
    occlusion();
    relief.setView(v);
    const s = name.startsWith("summit:") ? summits.find((x) => `summit:${x.slug}` === name) : undefined;
    relief.setFocus(s?.x ?? 0, s?.z ?? 0, !!s);
    labels.forEach((el, slug) => el.toggleAttribute("data-active", s?.slug === slug));
    root.dataset.view = name;
    setTimeout(restingLight, 50);
  }

  requestAnimationFrame(() => (root.dataset.state = "ready"));
  addEventListener("pagehide", () => {
    clearInterval(sunTimer);
    relief.stop();
  });

  const ctl = { go, relief };
  window.__relief = ctl;
  return ctl;
}
