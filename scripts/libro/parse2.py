import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
lineas = (S/"libro/libro.txt").read_text(encoding="utf-8").split("\n")
def norm(s): return unicodedata.normalize("NFKD", s.lower()).encode("ascii","ignore").decode().strip()
ent = {}
pat = re.compile(r"^([A-Z][a-zé]+(?: [a-zé\-]+){1,2})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?\s*$")
for ln in lineas[9035:]:
    m = pat.match(ln.strip())
    if m: ent[norm(m.group(1))] = (int(m.group(2)), int(m.group(3)) if m.group(3) else None)
esp = json.loads(Path("/home/claude/repo/src/data/especies.json").read_text(encoding="utf-8"))["especies"]
res, falt = {}, []
for e in esp:
    k = norm(e["nombre"]); p = k.split()
    for cand in (k, " ".join(p[:2])):
        if cand in ent: res[e["id"]] = {"nombre": e["nombre"], "pag": ent[cand][0], "lamina": ent[cand][1], "via": cand}; break
    else: falt.append((e["id"], e["nombre"]))
print("con pagina:", len(res), " sin pagina:", len(falt))
for f in falt: print("   sin cuenta:", f)
# lista taxonomica: asteriscos
lista = "\n".join(lineas[8143:8497])
ast = re.findall(r"Ƒ ([A-Z][a-zé]+(?: [a-zé]+){1,2})[^\n]*\*", lista)
print("\nocasionales/accidentales (*) en la lista:", ast)
json.dump(res, open(S/"paginas.json","w"), ensure_ascii=False, indent=0)
