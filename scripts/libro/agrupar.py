import json, re
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
fl = json.load(open(S/"crudo.json"))["flujo"]
MAP = {"Sinónimos":"sin","Descripción":"desc","Distribución":"dist","Ecología":"eco"}
def abierto(txt): return not re.search(r"[.)]\s*$", txt)
runs, cur, sueltos = [], [], []
for i, (p, t, d) in enumerate(fl):
    if t == "encabezado":
        if cur: runs.append(cur); cur = []
        continue
    if t == "texto":
        if cur and abierto(cur[-1][2]) and d[:1].islower():
            cur[-1] = (cur[-1][0], cur[-1][1], cur[-1][2] + " " + d, cur[-1][3])
        else:
            sueltos.append({"i": i, "pag": p, "t": d})
        continue
    if cur and (t in {x[1] for x in cur} or t == "Sinónimos" or
                (t == "Descripción" and any(x[1] in ("Distribución","Ecología") for x in cur))):
        runs.append(cur); cur = []
    cur.append((i, t, d, p))
if cur: runs.append(cur)
cuentas, orfanos = [], []
for r in runs:
    rec = {"i": r[0][0], "pag": r[0][3], "ifin": r[-1][0]}
    for i, t, d, p in r: rec[MAP[t]] = d
    (cuentas if "desc" in rec else orfanos).append(rec)
print("cuentas:", len(cuentas), "huérfanos:", len(orfanos), "textos sueltos:", len(sueltos))
print("completas:", sum(1 for c in cuentas if c.get("dist") and c.get("eco")))
print("campos cortados a media frase:", sum(1 for c in cuentas for k in ("desc","dist","eco") if c.get(k) and abierto(c[k])))
json.dump({"cuentas": cuentas, "orfanos": orfanos, "textos": sueltos}, open(S/"cuentas2.json","w"), ensure_ascii=False)
