# -*- coding: utf-8 -*-
import json, re, unicodedata, numpy as np
from pathlib import Path
from scipy.optimize import linear_sum_assignment
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
fl = json.load(open(S/"crudo.json"))["flujo"]
d2 = json.load(open(S/"cuentas2.json")); cuentas, orfanos, textos = d2["cuentas"], d2["orfanos"], d2["textos"]
esp = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
pg = json.load(open(S/"paginas.json")); 
def n(s):
    s = unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii","ignore").decode()
    return re.sub(r"\s+", " ", s).strip()
from collections import Counter
_pal = re.findall(r"[a-záéíóúüñ]{3,}", (S/"paginas.txt").read_text(encoding="utf-8").lower())
VOCAB = set(_pal); FREC = Counter(_pal)
def abierto(t): return bool(t) and not re.search(r"[.)]\s*$", t.strip())

# 1) continuaciones: sólo si el corte es a mitad de palabra y la unión existe en el libro
usados = set()
def pega_texto(c, k):
    for _ in range(4):
        t = c.get(k)
        if not abierto(t): return
        ult = re.search(r"([a-záéíóúüñ]+)$", t.strip())
        if not ult: return
        cand = [x for x in textos if x["i"] not in usados and 0 < x["i"] - c["i"] < 20 and abs(x["pag"] - c["pag"]) <= 1]
        elegido = None
        for x in sorted(cand, key=lambda y: y["i"]):
            pri = re.match(r"^([a-záéíóúüñ]+)", x["t"])
            if pri and (ult.group(1) + pri.group(1)) in VOCAB:
                elegido = x; break
        if not elegido: return
        usados.add(elegido["i"]); c[k] = t.strip() + elegido["t"]; c["continuado"] = True
for c in cuentas:
    for k in ("desc", "dist", "eco"): pega_texto(c, k)

# 2) huérfanos dist/eco: sólo si hay un único destino posible en la ventana
cuentas.sort(key=lambda c: c["i"])
for o in orfanos:
    for k in ("dist", "eco"):
        if not o.get(k): continue
        cand = [c for c in cuentas if abs(c["pag"] - o["pag"]) <= 1 and not c.get(k) and abs(c["i"] - o["i"]) < 16]
        if len(cand) == 1:
            cand[0][k] = o[k]; cand[0]["pegado"] = True
print("completas:", sum(1 for c in cuentas if c.get("dist") and c.get("eco")), "/", len(cuentas))

# 3) encabezados y asignación
enc, vistos = [], set()
for i, (p, t, dd) in enumerate(fl):
    if t != "encabezado": continue
    if dd[1] in vistos: continue
    vistos.add(dd[1]); enc.append((i, p, dd[1]))
MANUAL = {(31, "Esta especie muestra variación clinal"): "Parides gundlachianus gundlachianus",
          (39, "La cara superior es de color pardo oscuro con la base"): "Aguna asander haitiensis",
          (48, "Marcado dimorfismo sexual: los machos"): "Atalopedes mesogramma mesogramma",
          (56, "Por la cara superior las alas son de color pardo"): "Panoquina panoquinoides panoquinoides",
          (129, "La parte superior es de color rojo pard"): "Cymatogramma verticordia echemus",
          (140, "La superficie superior es de color pardo"): "Libytheana carinenta bachmanii",
          (154, "Esta especie es similar a C. dissimulatum pero de menor"): "Calisto aquilum aquilum",
          (157, "Esta especie es similar a C. herophile, pero más oscura"): "Calisto disjunctus"}
pag_de = {v["nombre"]: v["pag"] for v in pg.values()}
fijadas = {}
for c in cuentas:
    cuerpo0 = re.sub(r"^Envergadura[^.]*\.\s*", "", c["desc"]).strip()
    for (p, ini), nom in MANUAL.items():
        if c["pag"] == p and cuerpo0.startswith(ini): fijadas[c["i"]] = nom
faltan = [k for k in MANUAL.values() if k not in fijadas.values()]
if faltan: print("¡OJO! fijaciones manuales que no casaron:", faltan)
libres_c = [c for c in cuentas if c["i"] not in fijadas]
libres_e = [e for e in enc if e[2] not in set(fijadas.values())]
def punt(c, e):
    i_e, p_e, nom = e
    txt = n((c.get("sin") or "") + " " + c["desc"][:300])
    eps = n(nom).split()[1:]
    s = 6.0 if any(ep in txt for ep in eps) else 0.0
    pp = pag_de.get(nom)
    if pp is not None:
        dp = abs(pp - c["pag"]); s += 3 if dp == 0 else (1.5 if dp == 1 else (-3 if dp > 2 else 0))
    dfl = abs(i_e - c["i"]); s += max(0, 3 - dfl * 0.25) - (5 if dfl > 20 else 0)
    return s
M = np.array([[punt(c, e) for e in libres_e] for c in libres_c])
fi, co = linear_sum_assignment(-M)
asig = {libres_c[a]["i"]: (libres_e[b][2], float(M[a, b])) for a, b in zip(fi, co)}
asig.update({k: (v, 99.0) for k, v in fijadas.items()})

COLOR = [("negro", r"negr"), ("blanco", r"blanc"), ("amarillo", r"amarill"), ("naranja", r"naranja|anaranjad"),
         ("pardo", r"pard"), ("azul", r"azul"), ("verde", r"verd"), ("rojo", r"roj|grana|carmes"),
         ("gris", r"gris"), ("iridiscente", r"iridisc|metalic|tornasol")]
HAB = [("bosques siempreverdes", r"siempreverde"), ("bosques semideciduos", r"semidecidu"),
       ("bosques micrófilos", r"microfil"), ("bosques de galería", r"galeria"),
       ("matorrales costeros", r"matorral\w* costero|matorrales? xeromorfo"), ("hábitats xerofíticos", r"xerofitic"),
       ("costas y uverales", r"uveral|costas?\b|costero"), ("vegetación secundaria", r"vegetacion secundaria"),
       ("pastizales y herbazales", r"pastizal|herbazal"), ("jardines y arboledas urbanas", r"jardin|arboleda"),
       ("montañas", r"montan|macizo|sierra"), ("mogotes", r"mogote"), ("pinares", r"pinar"),
       ("ciénagas y humedales", r"cienaga|manglar|humedal|pantano"), ("cultivos y cafetales", r"cafetal|cultivo|agricola"),
       ("claros y bordes de bosque", r"claro|borde|margen|ecotono"), ("charrascales", r"charrascal")]
NO_PLANTA = {"Cuba","Antillas","Bahamas","Florida","Española","Jamaica","Caimán","Puerto","Isla","Islas","Sus","Las","Los","Esta","Este","En","Se","Su","Sierra","Valle"}
def mm(desc):
    t = desc.replace("–", "-")
    m = re.search(r"Envergadura (?:entre )?(\d{1,3})\s*(?:y|-|a)\s*(\d{1,3})\s*(?:mm|cm)", t)
    if m: return int(m.group(1)), int(m.group(2))
    m = re.search(r"Envergadura (?:de |alrededor de |aproximadamente |cercana a los )?(\d{1,3})\s*mm", t)
    if m: return int(m.group(1)), int(m.group(1))
    return None
GEN_MARIPOSA = {e["nombre"].split()[0] for e in esp} | {"Calephelis", "Dianesia", "Papilio", "Eurema", "Terias", "Hesperia", "Pamphila"}
def plantas(texto):
    out = [f"{g} {e2}" for g, e2 in re.findall(r"\b([A-Z][a-zé]{3,})\s+(sp\.|spp\.|[a-z]{3,})", texto)]
    out += [f"{g} sp." for g in re.findall(r"géneros?\s+([A-Z][a-zé]{3,})", texto)]
    fam = re.findall(r"\b([A-Z][a-z]+aceae)\b", texto)
    lim = []
    for x in out:
        g, ep = x.split()[0], x.split()[1]
        if g in NO_PLANTA or g in GEN_MARIPOSA or g.endswith("aceae"): continue
        if FREC[g.lower()] > 15: continue                 # palabra española corriente, no un género
        if ep not in ("sp.", "spp.") and FREC[ep] > 15: continue
        lim.append(x)
    vis, res = set(), []
    for x in lim + fam:
        if x not in vis: vis.add(x); res.append(x)
    return res

sal = {}
for c in cuentas:
    nom, pt = asig.get(c["i"], (None, 0))
    if not nom: continue
    desc, dist, eco = c["desc"], c.get("dist", ""), c.get("eco", "")
    cuerpo = re.sub(r"^Envergadura[^.]*\.\s*", "", desc).strip()
    nh = " ".join(f for f in re.split(r"(?<=\.)\s+", eco or "") if re.search(r"larva|aliment|cría|criad|oviposi|hospeder", n(f)))
    sal[nom] = {"nombre": nom, "punt": round(pt, 2), "pag": c["pag"], "mm": mm(desc), "desc": cuerpo,
                "dist": dist, "eco": eco, "sin": c.get("sin"),
                "colores": [k for k, p in COLOR if re.search(p, n(cuerpo))],
                "habitat": [k for k, p in HAB if re.search(p, n(eco))],
                "hospederas": plantas(nh), "nota_hospederas": nh,
                "revisar": bool(c.get("pegado") or c.get("continuado")),
                "truncado": any(abierto(x) for x in (cuerpo, dist, eco))}
print("especies con datos:", len(sal), " marcadas para revisar:", sum(1 for v in sal.values() if v["revisar"]),
      " con texto cortado:", sum(1 for v in sal.values() if v["truncado"]))
print("sin mm:", [k for k, v in sal.items() if not v["mm"]])
print("sin dist:", [k for k, v in sal.items() if not v["dist"]])
print("sin eco:", [k for k, v in sal.items() if not v["eco"]])
json.dump(sal, open(S/"datos_libro.json","w"), ensure_ascii=False, indent=0)
