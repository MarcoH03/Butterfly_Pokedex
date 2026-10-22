# -*- coding: utf-8 -*-
"""Empareja cada imagen de una página con la especie de su pie de foto."""
import re, json, unicodedata, html
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
XML = S / "paginas_xml"
ESP = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
def nn(s):
    s = unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z ]", " ", re.sub(r"\s+", " ", s)).strip()
POR_NOMBRE, POR_BINOMIO = {}, {}
for e in ESP:
    POR_NOMBRE[nn(e["nombre"])] = e["id"]
    POR_BINOMIO.setdefault(" ".join(nn(e["nombre"]).split()[:2]), []).append(e["id"])
ALIAS = {"asterocampa idyia idyia": "asterocampa idyja idyja", "asterocampa idyia": "asterocampa idyja idyja",
         "neographium celadon": "neographium celadon", "cymatogramma echemus echemus": "cymatogramma verticordia echemus"}
def id_de(nombre):
    k = ALIAS.get(nn(nombre), nn(nombre))
    if k in POR_NOMBRE: return POR_NOMBRE[k], "exacto"
    b = " ".join(k.split()[:2])
    if b in POR_BINOMIO and len(POR_BINOMIO[b]) == 1: return POR_BINOMIO[b][0], "binomio"
    if b in POR_BINOMIO: return POR_BINOMIO[b][0], "ambiguo"
    return None, "no"

RE_IMG = re.compile(r'<image top="(-?\d+)" left="(-?\d+)" width="(-?\d+)" height="(-?\d+)" src="([^"]+)"')
RE_TXT = re.compile(r'<text top="(-?\d+)" left="(-?\d+)" width="(-?\d+)" height="(-?\d+)"[^>]*>(.*?)</text>', re.S)

def pagina(p, columnas=False):
    f = XML / f"p{p}.xml"
    if not f.exists(): return [], []
    x = f.read_text(encoding="utf-8", errors="ignore")
    ims = []
    for t, l, w, h, src in RE_IMG.findall(x):
        t, l, w, h = int(t), int(l), int(w), int(h)
        espejo = w < 0
        if espejo: l, w = l + w, -w
        if h < 0: t, h = t + h, -h
        ims.append({"top": t, "left": l, "w": w, "h": h, "src": src, "espejo": espejo,
                    "cx": l + w / 2, "abajo": t + h, "pag": p})
    bruto = []
    for t, l, w, h, cont in RE_TXT.findall(x):
        txt = html.unescape(re.sub(r"<[^>]+>", "", cont)).strip()
        if txt and not (int(w) == 0 and len(txt) <= 4): bruto.append({"top": int(t), "left": int(l), "w": int(w), "txt": txt})
    bruto.sort(key=lambda r: r["top"])
    bandas, act = [], None
    for r in bruto:                      # agrupa por franja vertical
        if act and abs(r["top"] - act[0]["top"]) <= 5: act.append(r)
        else: act = [r]; bandas.append(act)
    lineas = []
    if columnas:                      # páginas de ficha: dos columnas estrictas
        bandas = [g for b in bandas for g in ([x for x in b if x["left"] < 310],
                                              [x for x in b if x["left"] >= 310]) if g]
    for banda in bandas:
        banda.sort(key=lambda r: r["left"])
        cur = None
        for r in banda:
            if cur and r["left"] - (cur["left"] + cur["w"]) < 60:
                sep = "" if (cur["txt"].endswith(("(", "-", " ")) or r["txt"][:1] in ",.;)") else " "
                cur["txt"] += sep + r["txt"]
                cur["w"] = max(cur["w"], r["left"] + r["w"] - cur["left"])
            else:
                cur = dict(r); lineas.append(cur)
    lineas.sort(key=lambda r: (r["top"], r["left"]))
    return ims, lineas
