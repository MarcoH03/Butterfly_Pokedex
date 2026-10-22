# -*- coding: utf-8 -*-
import re, json, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, "/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
import emparejar as E
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
RE_PIE = re.compile(r"([A-ZÁÉÍÓÚ][^;:/]{3,70}?)\s*[;,:]?\s*p\.\s*(\d{1,3})")
res, sin_casar = {}, []
for p in range(160, 219):
    ims, lineas = E.pagina(p)
    pies = []
    for l in lineas:
        txt = l["txt"]
        for m in RE_PIE.finditer(txt):
            nombre = re.sub(r"\s*\((?:cópula|hembra|macho|ninfa)[^)]*\)\s*", " ", m.group(1))
            nombre = re.sub(r"[;,:.\s]+$", "", nombre).strip()
            eid, modo = E.id_de(nombre)
            if not eid:
                sin_casar.append((p, nombre)); continue
            medio = (m.start(1) + m.end(2)) / 2 / max(1, len(txt))
            pies.append({"top": l["top"], "cx": l["left"] + l["w"] * medio, "id": eid,
                         "nombre": nombre, "modo": modo})
    for im in ims:
        if im["w"] < 90 or im["h"] < 90: continue
        cy = im["top"] + im["h"] / 2
        cand = [c for c in pies if c["top"] > cy and c["top"] - cy < 330 and abs(c["cx"] - im["cx"]) < 240]
        if not cand: continue
        c = min(cand, key=lambda c: (c["top"] - cy) + 0.8 * abs(c["cx"] - im["cx"]))
        try:
            img = Image.open(im["src"]); w, h = img.size
        except Exception: continue
        res.setdefault(c["id"], []).append({"src": im["src"], "px": w * h, "w": w, "h": h,
                                            "espejo": im["espejo"], "pag": p, "nombre": c["nombre"]})
print("especies con lámina:", len(res), "| fotos emparejadas:", sum(len(v) for v in res.values()))
print("pies sin casar:", sorted(set(sin_casar))[:15])
json.dump(res, open(S/"laminas.json", "w"), ensure_ascii=False)
