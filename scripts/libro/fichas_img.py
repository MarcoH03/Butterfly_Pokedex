# -*- coding: utf-8 -*-
"""Fotos de ejemplar y mapas de distribución de las páginas de ficha."""
import re, json, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, "/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
import emparejar as E
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
# «Battus devilliers: vista superior e inferior; localidades…» / «… macho (arriba) y hembra (debajo): vista…»
RE_PIE = re.compile(r"^([A-ZÁÉÍÓÚ][A-Za-zá-úñ\. ]{5,55}?)\s*(?:\(.*?\))?\s*[,:]")
mapas, fotos, sin = {}, {}, []
for p in range(23, 166):
    ims, lineas = E.pagina(p, columnas=True)
    pies = []
    MARCA = ("vista superior", "vista dorsal", "localidades donde")
    for i, l in enumerate(lineas):
        if not any(m in l["txt"] for m in MARCA): continue
        if l["txt"].lstrip().startswith(("ferior", "rior", "lidades", "inferior", "y hembra", "cubano")) and not RE_PIE.match(l["txt"]):
            pass
        cands = [(l["txt"], l)]
        prev = [x for x in lineas[:i] if abs(x["left"] - l["left"]) < 40 and 0 < l["top"] - x["top"] < 22]
        if prev: cands.insert(0, (prev[-1]["txt"] + " " + l["txt"], prev[-1]))
        for txt, ln in cands:
            m = RE_PIE.match(txt)
            if not m: continue
            eid, modo = E.id_de(m.group(1))
            if not eid: continue
            if any(x["id"] == eid and abs(x["top"] - ln["top"]) < 40 for x in pies): break
            pies.append({"top": ln["top"], "cx": ln["left"] + ln["w"] / 2, "id": eid, "nombre": m.group(1)})
            break
        else:
            sin.append((p, l["txt"][:40]))
    for im in ims:
        if im["w"] < 60 or im["h"] < 40: continue
        cy = im["top"] + im["h"] / 2
        cand = [c for c in pies if c["top"] > cy - 10 and c["top"] - cy < 330 and abs(c["cx"] - im["cx"]) < 230]
        if not cand: continue
        c = min(cand, key=lambda c: (c["top"] - cy) + 0.8 * abs(c["cx"] - im["cx"]))
        try: img = Image.open(im["src"]); w, h = img.size
        except Exception: continue
        reg = {"src": im["src"], "w": w, "h": h, "px": w * h, "espejo": im["espejo"], "pag": p,
               "top": im["top"], "left": im["left"]}
        es_mapa = (2.2 <= w / h <= 3.2) and w >= 300
        (mapas if es_mapa else fotos).setdefault(c["id"], []).append(reg)
print("especies con mapa:", len(mapas), "| con foto de ejemplar:", len(fotos),
      "| fotos:", sum(len(v) for v in fotos.values()))
print("pies sin casar:", sorted(set(sin))[:12])
json.dump({"mapas": mapas, "fotos": fotos}, open(S/"fichas_img.json", "w"), ensure_ascii=False)

# ── segunda pasada: mapas sin asignar en la página de la especie ──
pagina_de = {int(k): v["pag"] for k, v in json.load(open(S/"paginas.json")).items()}
usados = {r["src"] for v in mapas.values() for r in v} | {r["src"] for v in fotos.values() for r in v}
libres = {}
for p in range(23, 166):
    ims, _ = E.pagina(p, columnas=True)
    for im in ims:
        if im["src"] in usados: continue
        try: img = Image.open(im["src"]); w, h = img.size
        except Exception: continue
        if not (2.2 <= w / h <= 3.2 and w >= 300): continue
        libres.setdefault(p, []).append({"src": im["src"], "w": w, "h": h, "px": w * h,
                                         "espejo": im["espejo"], "pag": p, "top": im["top"], "left": im["left"]})
extra = 0
for eid, p in sorted(pagina_de.items()):
    if eid in mapas or str(eid) in mapas: continue
    cand = [r for q in (p, p + 1) for r in libres.get(q, [])]
    if len(cand) == 1:
        mapas.setdefault(eid, []).append({**cand[0], "por_posicion": True})
        libres[cand[0]["pag"]] = [r for r in libres[cand[0]["pag"]] if r["src"] != cand[0]["src"]]
        extra += 1
print("mapas añadidos por posición:", extra, "| total con mapa:", len(mapas))
json.dump({"mapas": mapas, "fotos": fotos}, open(S/"fichas_img.json", "w"), ensure_ascii=False)
