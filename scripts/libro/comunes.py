import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
pags = json.load(open(S/"paginas_lineas.json"))
esp = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
def n(s): return unicodedata.normalize("NFKD", s.lower()).encode("ascii","ignore").decode().strip()
mapa = {n(e["nombre"]): e["id"] for e in esp}
bin_ = {}
for e in esp: bin_.setdefault(" ".join(n(e["nombre"]).split()[:2]), []).append(e["id"])
com, lam = {}, {}
for p in sorted(pags, key=int):
    if int(p) < 165: continue
    L = pags[p]
    for i, ln in enumerate(L):
        m = re.match(r"^([A-Z][^,]{2,60}?),?\s*p\.\s*(\d{1,3})\s*$", ln.strip())
        if not m: continue
        nom = re.sub(r"\s*\(.*?\)\s*", " ", m.group(1)).strip()
        k = n(nom)
        ids = [mapa[k]] if k in mapa else bin_.get(k, [])
        if not ids: continue
        prev = L[i-1].strip() if i else ""
        if "/" in prev and not re.search(r"\d", prev):
            partes = [x.strip() for x in prev.split("/") if x.strip()]
            for i2 in ids: com.setdefault(i2, partes)
print("especies con nombres comunes:", len(com), "de", len(esp))
json.dump(com, open(S/"comunes.json","w"), ensure_ascii=False, indent=0)
falt = [e["nombre"] for e in esp if e["id"] not in com]
print("sin nombres comunes:", len(falt)); print(falt[:40])
