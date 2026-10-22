# -*- coding: utf-8 -*-
"""Escribe public/img/{laminas,montados} con los nombres que espera la app."""
import json, re, unicodedata
from pathlib import Path
from PIL import Image, ImageOps
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
REPO = Path("/home/claude/repo")
esp = json.loads((REPO/"src/data/especies.json").read_text(encoding="utf-8"))["especies"]
RUTA = {e["id"]: e["imagenes"] for e in esp}
lam = json.load(open(S/"laminas.json"))
fic = json.load(open(S/"fichas_img.json"))
CAL = 86

def abre(r):
    im = Image.open(r["src"]).convert("RGB")
    if r.get("espejo"): im = ImageOps.mirror(im)
    return im

def guarda(im, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    if im.width > 1200: im.thumbnail((1200, 1200), Image.LANCZOS)
    im.save(destino, "JPEG", quality=CAL, optimize=True, progressive=True)

n_lam = n_mon = 0
for k, v in lam.items():
    eid = int(k)
    if eid not in RUTA: continue
    r = max(v, key=lambda r: r["px"])
    guarda(abre(r), REPO/"public"/RUTA[eid]["lamina"])
    n_lam += 1
for k, v in fic["fotos"].items():
    eid = int(k)
    if eid not in RUTA: continue
    ims = [abre(r) for r in sorted(v, key=lambda r: (r["top"], r["left"]))[:4]]
    if not ims: continue
    h = max(i.height for i in ims)
    ims = [i.resize((max(1, int(i.width * h / i.height)), h), Image.LANCZOS) for i in ims]
    sep = 10
    lienzo = Image.new("RGB", (sum(i.width for i in ims) + sep * (len(ims) - 1), h), (255, 255, 255))
    x = 0
    for i in ims:
        lienzo.paste(i, (x, 0)); x += i.width + sep
    guarda(lienzo, REPO/"public"/RUTA[eid]["montado"])
    n_mon += 1
print("láminas escritas:", n_lam, "| montados escritos:", n_mon)
import subprocess
print(subprocess.run(["du", "-sh", str(REPO/"public/img")], capture_output=True, text=True).stdout.strip())
