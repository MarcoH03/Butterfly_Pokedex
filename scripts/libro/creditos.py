# -*- coding: utf-8 -*-
"""Autor de cada foto: el © va rotado al borde de la imagen."""
import re, json, sys
from pathlib import Path
sys.path.insert(0, "/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
import emparejar as E
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
RE_IMG = E.RE_IMG; RE_TXT = E.RE_TXT
import html
def creditos_pagina(p):
    f = S/"paginas_xml"/f"p{p}.xml"
    if not f.exists(): return []
    x = f.read_text(encoding="utf-8", errors="ignore")
    frag = []
    for t, l, w, h, cont in RE_TXT.findall(x):
        txt = html.unescape(re.sub(r"<[^>]+>", "", cont))
        if int(w) == 0 and txt.strip():
            frag.append({"top": int(t), "left": int(l), "txt": txt})
    # columnas de fragmentos rotados: misma x, tops consecutivos
    frag.sort(key=lambda r: (r["left"], -r["top"]))
    cols, act = [], None
    for r in frag:
        if act and abs(r["left"] - act["left"]) <= 3 and 0 < act["top"] - r["top"] < 30:
            act["txt"] += r["txt"]; act["top"] = r["top"]; act["y1"] = min(act.get("y1", r["top"]), r["top"])
        else:
            act = {"left": r["left"], "top": r["top"], "y0": r["top"], "y1": r["top"], "txt": r["txt"]}
            cols.append(act)
    salida = []
    for c in cols:
        t = re.sub(r"\s+", " ", c["txt"]).strip()
        if "©" in t and len(t) > 4:
            salida.append({"x": c["left"], "y0": c["y1"], "y1": c["y0"], "autor": t})
    return salida

def asigna(datos_img, paginas):
    cred = {p: creditos_pagina(p) for p in paginas}
    for eid, lista in datos_img.items():
        for r in lista:
            cs = cred.get(r["pag"], [])
            if not cs or "top" not in r: continue
            cy = r["top"] + r.get("h_pag", 200) / 2
            cerca = [c for c in cs if abs((c["y0"] + c["y1"]) / 2 - cy) < 260]
            if cerca: r["credito"] = min(cerca, key=lambda c: abs((c["y0"] + c["y1"]) / 2 - cy))["autor"]
    return datos_img

if __name__ == "__main__":
    todos = {}
    for p in range(23, 219):
        for c in creditos_pagina(p):
            a = re.sub(r"^©\s*", "", c["autor"]).strip()
            todos[a] = todos.get(a, 0) + 1
    print("autores distintos:", len(todos))
    for a, n in sorted(todos.items(), key=lambda kv: -kv[1])[:20]: print(f"   {n:4d}  {a}")
    json.dump(todos, open(S/"autores.json", "w"), ensure_ascii=False)
