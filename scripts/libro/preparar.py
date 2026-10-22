import re, json
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
import unicodedata as _u
bruto = (S/"libro/libro.txt").read_text(encoding="utf-8")
bruto = "".join(ch if ch == "\n" else ("" if _u.category(ch) in ("Cf","Cc") else ch) for ch in bruto)
lin = bruto.split("\n")[700:8142]

PAL = {
 "super7cie":"superficie","super6cie":"superficie","super5cie":"superficie","super4cie":"superficie",
 "super6cies":"superficies","per7cie":"perficie","per5cies":"perficies","super4cial":"superficial",
 "dimor5smo":"dimorfismo","dimor6smo":"dimorfismo","dimor7smo":"dimorfismo","dimor4smo":"dimorfismo",
 "dimor5s":"dimorfis","dimor6s":"dimorfis","dimor7s":"dimorfis",
 "geográ2cas":"geográficas","geográ2ca":"geográfica","identi2car":"identificar","identi2cación":"identificación",
 "identi5ca":"identifica","identi5car":"identificar","bibliográ2cas":"bibliográficas",
 "modi4cadas":"modificadas","modi5cadas":"modificadas","modi6cadas":"modificadas",
 "mesó7los":"mesófilos","micró4los":"micrófilos","Passi6oraceae":"Passifloraceae",
 "re5ejos":"reflejos","re6ejos":"reflejos","bí5das":"bífidas","ultramá5cos":"ultramáficos",
 "camu6aje":"camuflaje","atro7a":"atrofia","di5eren":"diferen","di7eren":"diferen",
 "pre5ere":"prefiere","Pre5ere":"Prefiere","pre7ere":"prefiere","pre4ere":"prefiere","pre7e":"prefie",
 "de7nidas":"definidas","de5nidos":"definidos","de7nidos":"definidos","polimór7cas":"polimórficas",
 "á5dos":"áfidos","Sub5amilia":"Subfamilia","Dismor5a":"Dismorphia","i3inae":"idinae",
 "Cra4er":"Cramer","e4l":"efl",
}
def arregla(t):
    for k, v in PAL.items(): t = t.replace(k, v)
    return t

ETIQ = []
def etiqueta(ln):
    s = ln.strip()
    m = re.match(r"^(\S{6,16}):\s*(.*)$", s)
    if not m: return None
    tok, resto = m.group(1), m.group(2)
    L = len(tok)
    if   tok[0] == "D" and L == 11: nom = "Descripción"
    elif tok[0] == "D" and L == 12: nom = "Distribución"
    elif tok[0] == "E" and L == 8:  nom = "Ecología"
    elif tok[0] == "S" and L == 9:  nom = "Sinónimos"
    else: return None
    ETIQ.append(tok)
    return f"{nom}: {resto}"

salida, pagina = [], None
paginas = {}
for ln in lin:
    s = ln.strip()
    if re.fullmatch(r"(1\d\d|2[01]\d|[2-9]\d)", s):
        pagina = int(s); paginas.setdefault(pagina, []); continue
    if s.startswith("©") or not s: continue
    if re.search(r"vista (superior|dorsal)", s) and ":" in s: pass   # leyenda de lámina: se conserva
    e = etiqueta(ln)
    s = arregla(e if e else s)
    if pagina is not None: paginas[pagina].append(s)

pags = sorted(paginas)
print("páginas detectadas:", len(pags), pags[:5], "...", pags[-5:])
print("variantes de etiqueta distintas:", len(set(ETIQ)))
out = []
for p in pags:
    out.append(f"\n===== PÁGINA {p} =====")
    out += paginas[p]
(S/"paginas.txt").write_text("\n".join(out), encoding="utf-8")
print("bytes:", (S/"paginas.txt").stat().st_size)
json.dump({str(p): paginas[p] for p in pags}, open(S/"paginas_lineas.json","w"), ensure_ascii=False)
