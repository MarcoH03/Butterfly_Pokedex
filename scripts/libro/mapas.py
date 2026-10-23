# -*- coding: utf-8 -*-
"""Convierte los mapas naranjas del libro en polígonos lon/lat."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")

# Extremos reales del archipiélago, para calibrar cada mapa con su propia caja de tierra
LON0, LON1 = -84.95, -74.13          # Cabo de San Antonio ↔ Punta de Maisí
LAT1, LAT0 = 23.25, 19.84            # norte (cayos de Hicacos) ↔ sur (Cabo Cruz)

def mascaras(ruta):
    im = np.array(Image.open(ruta).convert("RGB")).astype(int)
    R, G, B = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    naranja = (R > 165) & (G > 45) & (G < 165) & (B < 100) & (R - B > 80)
    gris = (abs(R - G) < 30) & (abs(G - B) < 30) & (R > 105) & (R < 220)
    negro = (R < 95) & (G < 95) & (B < 95)
    return naranja, gris, negro

def calibra(naranja, gris, negro):
    tierra = naranja | gris | negro
    ys, xs = np.where(tierra)
    if len(xs) < 500: return None
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    if x1 - x0 < 100 or y1 - y0 < 40: return None
    return lambda x, y: (round(LON0 + (x - x0) * (LON1 - LON0) / (x1 - x0), 3),
                         round(LAT1 - (y - y0) * (LAT1 - LAT0) / (y1 - y0), 3))

def rdp(pts, tol):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0]), np.array(pts[-1])
    d = b - a; n = np.hypot(*d)
    P = np.array(pts)
    V = P - a
    dist = (np.abs(d[0] * V[:, 1] - d[1] * V[:, 0]) / n) if n else np.hypot(V[:, 0], V[:, 1])
    i = int(np.argmax(dist))
    if dist[i] > tol:
        return rdp(pts[:i + 1], tol)[:-1] + rdp(pts[i:], tol)
    return [pts[0], pts[-1]]

def poligonos(ruta, tol=0.035, min_px=6):
    naranja, gris, negro = mascaras(ruta)
    f = calibra(naranja, gris, negro)
    if f is None: return None, None
    m = ndimage.binary_closing(naranja, np.ones((3, 3)))
    m = ndimage.binary_fill_holes(m)
    etq, n = ndimage.label(m, np.ones((3, 3)))
    salida = []
    for i in range(1, n + 1):
        comp = etq == i
        if comp.sum() < min_px: continue
        pad = np.pad(comp.astype(float), 1)
        cs = plt.contour(pad, levels=[0.5])
        for path in cs.get_paths():
            for v in path.to_polygons():           # cada subtrazo cerrado por separado
                if len(v) < 4: continue
                pts = [f(x - 1, y - 1) for x, y in v]
                simple = rdp(pts, tol)
                if len(simple) >= 4: salida.append(simple)
        plt.close("all")
    # localidades: puntos negros
    etqn, nn_ = ndimage.label(negro, np.ones((3, 3)))
    puntos = []
    for i in range(1, nn_ + 1):
        ys, xs = np.where(etqn == i)
        if 2 <= len(xs) <= 120: puntos.append(f(xs.mean(), ys.mean()))
    return salida, puntos

if __name__ == "__main__":
    d = json.load(open(S / "fichas_img.json"))["mapas"]
    out = {}
    for k, v in sorted(d.items(), key=lambda kv: int(kv[0])):
        r = max(v, key=lambda r: r["px"])
        pol, pts = poligonos(r["src"])
        if pol is None: continue
        out[k] = {"poligonos": pol, "puntos": pts, "pag": r["pag"]}
    json.dump(out, open(S / "mapas.json", "w"))
    tot = sum(len(x["poligonos"]) for x in out.values())
    vert = sum(len(p) for x in out.values() for p in x["poligonos"])
    print("mapas vectorizados:", len(out), "| polígonos:", tot, "| vértices:", vert,
          "| puntos negros:", sum(len(x["puntos"]) for x in out.values()))
    print("tamaño json:", (S / "mapas.json").stat().st_size // 1024, "KB")
