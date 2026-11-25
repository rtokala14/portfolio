"""
Bake the Jebel Jais heightfield for the relief model.

Source: AWS Terrain Tiles (Mapzen "terrarium" encoding), zoom 13, which aggregate SRTM,
GMTED and other open elevation data. Run once; the output is committed under public/terrain/.

  python3 scripts/bake-terrain.py <tile-dir>

Outputs
  public/terrain/jais.bin   Uint16 little-endian, W*H, metres above sea level
  public/terrain/jais.json  size, bounds, peaks (x/z in world units, metres), attribution
"""
import json, math, sys, os
import numpy as np
from PIL import Image

TILE_DIR = sys.argv[1]
Z = 13
X0, X1, Y0, Y1 = 5369, 5378, 3480, 3488
W, H = 768, 480            # output grid (aspect 1.6, matches the world's 3.2 x 2.0)
SPAN_KM = 34.0             # east-west extent of the sheet
CENTER = (25.955, 56.180)  # lat, lon: the Jebel Jais massif, mountain front on the west edge

def tile_lonlat(x, y):
    n = 2 ** Z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon, lat

# mosaic
cols, rows = X1 - X0 + 1, Y1 - Y0 + 1
mosaic = np.zeros((rows * 256, cols * 256), dtype=np.float32)
for x in range(X0, X1 + 1):
    for y in range(Y0, Y1 + 1):
        im = np.asarray(Image.open(os.path.join(TILE_DIR, f"t_{x}_{y}.png")).convert("RGB")).astype(np.float32)
        h = im[..., 0] * 256 + im[..., 1] + im[..., 2] / 256 - 32768
        mosaic[(y - Y0) * 256:(y - Y0 + 1) * 256, (x - X0) * 256:(x - X0 + 1) * 256] = h

def px_of(lat, lon):
    n = 2 ** Z
    fx = (lon + 180) / 360 * n
    fy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return (fx - X0) * 256, (fy - Y0) * 256

# metres per mosaic pixel at this latitude
lat0, lon0 = CENTER
m_per_px = 156543.03392 * math.cos(math.radians(lat0)) / (2 ** Z)
span_px = SPAN_KM * 1000 / m_per_px
cx, cy = px_of(lat0, lon0)
xs = cx + (np.arange(W) / (W - 1) - 0.5) * span_px
ys = cy + (np.arange(H) / (H - 1) - 0.5) * span_px * (H / W) * (W - 1) / (H - 1)

def bilinear(img, x, y):
    x0 = np.clip(np.floor(x).astype(int), 0, img.shape[1] - 2)
    y0 = np.clip(np.floor(y).astype(int), 0, img.shape[0] - 2)
    fx, fy = x - x0, y - y0
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

gx, gy = np.meshgrid(xs, ys)
assert gx.min() >= 0 and gy.min() >= 0 and gx.max() < mosaic.shape[1] - 1 and gy.max() < mosaic.shape[0] - 1, "crop outside mosaic"
# light 3x3 pre-blur against SRTM speckle before resampling
k = np.array([1, 2, 1], dtype=np.float32) / 4
blur = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, mosaic)
blur = np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), 0, blur)
hm = bilinear(blur, gx, gy)
hm = np.clip(hm, 0, 65535)

# peaks: local maxima with real prominence-ish separation
from numpy.lib.stride_tricks import sliding_window_view
R = 9
pad = np.pad(hm, R, mode="edge")
win = sliding_window_view(pad, (2 * R + 1, 2 * R + 1))
locmax = (hm >= win.max(axis=(2, 3))) & (hm > 600)
cand = sorted([(float(hm[j, i]), i, j) for j, i in zip(*np.nonzero(locmax))], reverse=True)
peaks, min_sep = [], 40  # px (~1.3 km)
for h, i, j in cand:
    if i < 24 or j < 20 or i > W - 25 or j > H - 21:
        continue
    if all((i - p[1]) ** 2 + (j - p[2]) ** 2 > min_sep ** 2 for p in peaks):
        peaks.append((h, i, j))
    if len(peaks) >= 24:
        break

def world(i, j):
    return (i / (W - 1) * 2 - 1) * 1.6, (j / (H - 1) * 2 - 1) * 1.0

# wadis: D8 flow accumulation, steepest descent, cells processed high to low
# priority-flood pit filling (with a tiny epsilon) so every cell drains to the edge
import heapq
filled = hm.astype(np.float64).copy()
seen = np.zeros((H, W), dtype=bool)
pq = []
for j in range(H):
    for i in (0, W - 1):
        heapq.heappush(pq, (filled[j, i], j, i)); seen[j, i] = True
for i in range(W):
    for j in (0, H - 1):
        if not seen[j, i]:
            heapq.heappush(pq, (filled[j, i], j, i)); seen[j, i] = True
while pq:
    hgt, j, i = heapq.heappop(pq)
    for dj in (-1, 0, 1):
        for di in (-1, 0, 1):
            jj, ii = j + dj, i + di
            if 0 <= jj < H and 0 <= ii < W and not seen[jj, ii]:
                seen[jj, ii] = True
                if filled[jj, ii] <= hgt:
                    filled[jj, ii] = hgt + 1e-3
                heapq.heappush(pq, (filled[jj, ii], jj, ii))
order = np.argsort(-filled, axis=None)
acc = np.ones(W * H, dtype=np.float64)
flat = filled.ravel()
nbrs = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]
for idx in order:
    j, i = divmod(int(idx), W)
    best, bd = -1, 0.0
    for di, dj in nbrs:
        ii, jj = i + di, j + dj
        if 0 <= ii < W and 0 <= jj < H:
            drop = (flat[idx] - flat[jj * W + ii]) / (1.414 if di and dj else 1.0)
            if drop > bd:
                bd, best = drop, jj * W + ii
    if best >= 0:
        acc[best] += acc[idx]
wadi = np.clip((np.log(acc.reshape(H, W)) - math.log(60)) / (math.log(6000) - math.log(60)), 0, 1)
wadi[hm < 40] = 0  # streams fade out on the coastal plain
# soften the one-pixel raster so the GPU draws a smooth line, not stair steps
kk = np.array([1, 4, 6, 4, 1], dtype=np.float64) / 16
wadi = np.apply_along_axis(lambda r: np.convolve(r, kk, mode="same"), 1, wadi)
wadi = np.apply_along_axis(lambda c: np.convolve(c, kk, mode="same"), 0, wadi)
wadi = np.clip(wadi / max(wadi.max(), 1e-6) * 1.6, 0, 1)

os.makedirs("public/terrain", exist_ok=True)
(wadi * 255).astype(np.uint8).tofile("public/terrain/jais-wadi.bin")
hm.astype("<u2").tofile("public/terrain/jais.bin")
lon_w = lon0 - SPAN_KM / 2 / (111.320 * math.cos(math.radians(lat0)))
lon_e = lon0 + SPAN_KM / 2 / (111.320 * math.cos(math.radians(lat0)))
lat_n = lat0 + SPAN_KM * H / W / 2 / 110.574
lat_s = lat0 - SPAN_KM * H / W / 2 / 110.574
meta = {
    "width": W, "height": H,
    "spanKm": SPAN_KM,
    "bounds": {"west": lon_w, "east": lon_e, "north": lat_n, "south": lat_s},
    "min": float(hm.min()), "max": float(hm.max()),
    "peaks": [{"x": round(world(i, j)[0], 4), "z": round(world(i, j)[1], 4), "m": round(h)} for h, i, j in peaks],
    "attribution": "Elevation: AWS Terrain Tiles (SRTM, GMTED and others), via Mapzen terrarium encoding.",
}
json.dump(meta, open("public/terrain/jais.json", "w"), indent=1)

# preview hillshade for a human eye
gyy, gxx = np.gradient(hm, 40.0)
az, el = math.radians(315), math.radians(45)
slope = np.pi / 2 - np.arctan(np.hypot(gxx, gyy))
aspect = np.arctan2(-gxx, gyy)
shade = np.sin(el) * np.sin(slope) + np.cos(el) * np.cos(slope) * np.cos(az - aspect)
Image.fromarray((np.clip(shade, 0, 1) * 255).astype(np.uint8)).save(sys.argv[2] if len(sys.argv) > 2 else "/tmp/preview.png")
print(meta["min"], meta["max"], [(p["m"], p["x"], p["z"]) for p in meta["peaks"][:12]])
