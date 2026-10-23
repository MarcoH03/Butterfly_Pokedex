# -*- coding: utf-8 -*-
import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
REPO = Path("/home/claude/repo")
doc = json.loads((REPO/"src/data/especies.json").read_text(encoding="utf-8"))
esp = doc["especies"]
mapas = json.load(open(S/"mapas.json"))
COMPARTIDAS = {"Parides gundlachianus alayoi": "Parides gundlachianus gundlachianus",
               "Phoebis philea huebneri": "Phoebis philea philea",
               "Dianesia carteri carteri": "Dianesia carteri ramsdeni",
               "Danaus plexippus megalippe": "Danaus plexippus plexippus",
               "Calisto aquilum occidentalis": "Calisto aquilum aquilum"}
ZONAS = {"guanahacabibes": r"guanahacabibes",
         "organos": r"sierra de los organos|vinales|sierra de vinales",
         "rosario": r"sierra del rosario|soroa|guaniguanico",
         "zapata": r"cienaga de zapata|peninsula de zapata|\bzapata\b",
         "escambray": r"guamuhaya|escambray|topes de collantes|trinidad",
         "llanuras": r"llanuras? central",
         "maestra": r"sierra maestra|turquino|gran piedra",
         "nipe": r"nipe|sagua[- ]baracoa|\bbaracoa\b|\bmoa\b|\btoa\b|humboldt|mayari|cuchillas",
         "iju": r"isla de la juventud"}
def n(s): return unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii","ignore").decode()
por_id = {e["id"]: e for e in esp}
con_pol = con_zona = 0
for e in esp:
    m = mapas.get(str(e["id"]))
    if m is None:
        hermana = COMPARTIDAS.get(e["nombre"])
        if hermana:
            h = next((x for x in esp if x["nombre"] == hermana), None)
            if h: m = mapas.get(str(h["id"]))
    if m:
        e["distribucion"]["poligonos"] = m["poligonos"]
        e["distribucion"]["localidades"] = m["puntos"]
        con_pol += 1
    txt = n(e["distribucion"]["nota"] + " " + e.get("comportamiento", "") + " " + e.get("rasgos", ""))
    z = [k for k, pat in ZONAS.items() if re.search(pat, txt)]
    if z: e["distribucion"]["zonas"] = z; con_zona += 1
doc["meta"]["nota_mapas"] = ("distribucion.poligonos y distribucion.localidades salen del mapa que el libro "
                             "publica en cada ficha: las manchas naranjas (municipios con registro) y los puntos "
                             "negros (localidades concretas), vectorizados y georreferenciados sobre los extremos "
                             "reales del archipiélago. Precisión ~3 km; sirven para ver y filtrar, no para medir.")
texto = json.dumps(doc, ensure_ascii=False, indent=1)
# compacta las listas de números (coordenadas) para que el archivo no se dispare
texto = re.sub(r"\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]", r"[\1, \2]", texto)
texto = re.sub(r"\n\s+(?=\[-?\d)", " ", texto)
texto = re.sub(r"\n\s+\](?=,|\n)", "]", texto)
(REPO/"src/data/especies.json").write_text(texto + "\n", encoding="utf-8")
print("especies con polígonos:", con_pol, "| con zonas del catálogo:", con_zona)
print("tamaño especies.json:", (REPO/"src/data/especies.json").stat().st_size // 1024, "KB")
