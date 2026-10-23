# -*- coding: utf-8 -*-
"""Extrae de paginas_lineas.json un registro por especie."""
import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
pags = json.load(open(S/"paginas_lineas.json"))
esp = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
paginas_esp = json.load(open(S/"paginas.json"))     # id -> {nombre, pag, lamina}

def n(s):
    s = unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip()

NOMBRES = [(e["id"], e["nombre"]) for e in esp] + [(-1, "Battus devilliers")]

def casa(linea):
    """¿la línea es el encabezado de una especie? devuelve (id, nombre, error)"""
    l = n(re.sub(r"[;,.].*$", "", linea))
    if not (8 <= len(l) <= 46): return None
    mejor = None
    for i, nom in NOMBRES:
        c = n(nom)
        if len(c) != len(l): continue
        d = sum(1 for a, b in zip(c, l) if a != b)
        if d / len(c) <= 0.3 and (mejor is None or d < mejor[2]):
            mejor = (i, nom, d)
    return mejor

def junta(lineas):
    t = " ".join(x.strip() for x in lineas)
    t = re.sub(r"([a-záéíóúüñ])-\s+([a-záéíóúüñ])", r"\1\2", t)
    return re.sub(r"\s+", " ", t).strip()

ES_CAPTION = re.compile(r"vista (superior|inferior|dorsal)|localidades donde se ha registrado|Lámina \d+$")
ETIQ = re.compile(r"^(Descripción|Distribución|Ecología|Sinónimos):\s*(.*)$")

flujo = []   # (pag, tipo, dato)
CAP = re.compile(r"[A-Z][a-zé]+ [a-zé]+[^:]{0,60}: vista (superior|inferior|dorsal)|: vista (superior|inferior|dorsal)|localidades donde se ha registrado")
for p in sorted(pags, key=lambda x: int(x)):
    if not (23 <= int(p) <= 166): continue
    buf, modo = [], None
    def cierra():
        global buf, modo
        if modo and buf: flujo.append((int(p), modo, junta(buf)))
        elif buf and not modo:
            t_ = junta(buf)
            if len(t_) > 40: flujo.append((int(p), "texto", t_))
        buf, modo = [], None
    for ln in pags[p]:
        s = ln.strip()
        if not s: continue
        mcap = CAP.search(s)
        if mcap:
            antes = s[:mcap.start()].strip()
            # la leyenda puede empezar con el nombre de la especie: recórtala por el nombre
            m2 = re.search(r"[A-ZÁÉÍÓÚ][a-zé]+ [a-zé]+[^.]{0,80}: vista", s)
            if m2: antes = s[:m2.start()].strip()
            if antes and (modo or len(antes) > 20): buf.append(antes)
            cierra(); continue
        m = ETIQ.match(s)
        if m:
            cierra(); modo, buf = m.group(1), [m.group(2)]; continue
        h = casa(s)
        if h:
            cierra(); flujo.append((int(p), "encabezado", h)); continue
        buf.append(s)
    cierra()

# agrupa cuentas: Descripción -> siguiente Distribución -> siguiente Ecología
cuentas = []
for i, (p, t, d) in enumerate(flujo):
    if t != "Descripción": continue
    c = {"pag": p, "desc": d, "dist": None, "eco": None, "sin": None, "i": i}
    for j in range(i + 1, min(i + 8, len(flujo))):
        pj, tj, dj = flujo[j]
        if tj == "Distribución" and c["dist"] is None: c["dist"] = dj
        elif tj == "Ecología" and c["eco"] is None: c["eco"] = dj; break
    for j in range(max(0, i - 3), i):
        if flujo[j][1] == "Sinónimos": c["sin"] = flujo[j][2]
    cuentas.append(c)

encab = [(p, d) for p, t, d in flujo if t == "encabezado"]
print("encabezados detectados:", len(encab), " cuentas (Descripción):", len(cuentas))
json.dump({"flujo": flujo, "cuentas": cuentas}, open(S/"crudo.json","w"), ensure_ascii=False)
vistos = {}
for p, (i, nom, d) in encab: vistos.setdefault(nom, []).append(p)
print("especies con encabezado:", len(vistos))
sin_enc = [e["nombre"] for e in esp if e["nombre"] not in vistos]
print("sin encabezado detectado:", len(sin_enc)); print(sin_enc)
