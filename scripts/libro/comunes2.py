import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
pags = json.load(open(S/"paginas_lineas.json"))
esp = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
com = {int(k): v for k, v in json.load(open(S/"comunes.json")).items()}
def n(s):
    s = unicodedata.normalize("NFKD", s.lower()).encode("ascii","ignore").decode()
    return re.sub(r"\s+", " ", s).strip()
NOM = [(e["id"], e["nombre"]) for e in esp]
def casa(linea):
    l = n(re.sub(r"[;,.].*$", "", linea))
    if not (8 <= len(l) <= 46): return None
    mejor = None
    for i, nom in NOM:
        c = n(nom)
        if len(c) != len(l): continue
        d = sum(1 for a, b in zip(c, l) if a != b)
        if d / len(c) <= 0.34 and (mejor is None or d < mejor[1]): mejor = (i, d)
    return mejor[0] if mejor else None
nuevos = 0
for p in sorted(pags, key=int):
    if not (23 <= int(p) <= 166): continue
    L = pags[p]
    for i, ln in enumerate(L):
        eid = casa(ln)
        if not eid or eid in com: continue
        for j in range(i+1, min(i+4, len(L))):
            s = L[j].strip()
            if re.match(r"^[A-ZÁÉÍÓÚ][^:]{3,70}$", s) and "/" in s and not re.search(r"\d|vista |localidades", s):
                com[eid] = [x.strip() for x in s.split("/") if x.strip()]; nuevos += 1; break
print("nombres comunes añadidos desde las cuentas:", nuevos, " total:", len(com))
json.dump(com, open(S/"comunes.json","w"), ensure_ascii=False, indent=0)
falt=[e['nombre'] for e in esp if e['id'] not in com]
print("aún sin nombre común:", len(falt)); print(falt)
