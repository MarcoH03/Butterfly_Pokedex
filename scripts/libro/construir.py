# -*- coding: utf-8 -*-
import json, re, unicodedata
from pathlib import Path
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
REPO = Path("/home/claude/repo")
libro = json.load(open(S/"datos_libro.json"))
corr = json.load(open(S/"correcciones.json"))
pg = json.load(open(S/"paginas.json"))
com = {int(k): v for k, v in json.load(open(S/"comunes.json")).items()}
doc = json.loads((REPO/"src/data/especies.json").read_text(encoding="utf-8"))
meta, esp = doc["meta"], doc["especies"]

CITA = ("Mancina, C. A., R. Núñez Águila y B. Neyra Raola (eds.). 2020. Mariposas de Cuba: "
        "guía de campo. Instituto de Ecología y Sistemática, La Habana.")
MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
# subespecies que el libro trata en una sola ficha junto a su hermana
COMPARTIDAS = {"Parides gundlachianus alayoi": "Parides gundlachianus gundlachianus",
               "Phoebis philea huebneri": "Phoebis philea philea",
               "Dianesia carteri carteri": "Dianesia carteri ramsdeni",
               "Danaus plexippus megalippe": "Danaus plexippus plexippus",
               "Calisto aquilum occidentalis": "Calisto aquilum aquilum"}
# aplica correcciones hechas a mano sobre el libro
for k, v in corr.items():
    if k in libro: libro[k].update({a: b for a, b in v.items() if a != "nota"}); libro[k]["revisado_a_mano"] = True
ARREGLA_LIG = {r"Vu,nera0,e": "Vulnerable", r"En Pe,i(?:\)|,)?[a-z]*r?\.?": "En Peligro",
               r"Crí-i5\.": "Crítico", r"E\) Pel-g\(o": "En Peligro", r"En Pe,i\)r\.": "En Peligro",
               r"En Pe,i- \)r\. Crí-i5\.": "En Peligro Crítico", r"En Pe,i\)%/": "En Peligro"}
def limpia(t):
    if not t: return t
    t = re.sub(r"\s*\b(Lámina \d+|NYMPHALIDAE|LYCAENIDAE|HESPERIIDAE|PIERIDAE|PAPILIONIDAE|RIODINIDAE)\b\s*", " ", t)
    for pat, rep in ARREGLA_LIG.items(): t = re.sub(pat, rep, t)
    t = re.sub(r"\b([A-Z][a-zé]+ [a-zé]+(?: [a-zé]+)?)(?=: vista)", "", t)
    t = ligaduras(t)
    # corta restos de la maquetación: leyendas de foto, créditos y encabezados de subfamilia
    for pat in (r"[A-ZÁÉÍÓÚ][^.;]{0,60}?(?:\([^)]{1,12}\))?\s*:\s*vista (superior|inferior|dorsal).*$",
                r"localidades donde se ha registrado.*$",
                r"\s\S*[A-Za-zá-úñ][0-9][A-Za-zá-úñ]\S*.*$",
                r"\s\S*[A-Za-zá-úñ][()\[\]/][A-Za-zá-úñ]\S*\s+[A-ZÁÉÍÓÚ].*$",
                r"[\s;,.]*\bSu(?!bespecie)(?!bsp)[b0(;]\S{0,12}\b.*$"):
        m = re.search(pat, t)
        if m and m.start() > 50: t = t[:m.start()]
    t = re.sub(r"[\s;,]*\b(Sub|Subf\w*|Su[b0][;a]\w*)\.?$", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    if t and t[-1].isalnum(): t += "."
    return t
ABREV = r"(?<!\bsp\.)(?<!\bspp\.)(?<!\bej\.)(?<!\bcf\.)(?<!\bvar\.)(?<!\bUU\.)(?<!\bEE\.)(?<!\b[A-Z]\.)"
def frases(t): return [f.strip() for f in re.split(ABREV + r"(?<=[.;])\s+", t or "") if f.strip()]
VOC = set(w for w in re.findall(r"[a-záéíóúüñ]{2,}", (S/"paginas.txt").read_text(encoding="utf-8").lower()))
LIG = ["fi", "fl", "ff", "ffi", "ffl", "fj", "ft"]
_fallos = set()
def ligaduras(t):
    if not t: return t
    def arregla(m):
        w = m.group(0)
        for pos in range(len(w)):
            if not w[pos].isdigit(): continue
            for lig in LIG:
                cand = w[:pos] + lig + w[pos+1:]
                if cand.lower() in VOC: return cand
        _fallos.add(w); return w
    return re.sub(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+[0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", arregla, t)
def n(s): return unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii","ignore").decode()
ES_HOSP = r"larva|aliment|cría|criad|oviposi|hospeder|planta nutricia"
ES_RASGO = r"similar a|parecid|se distingue|se diferenc|a diferencia|se separa|se puede separar|distinguirse|se reconoce"
ES_VUELO = r"vuel|activ|crepúsc|posa|territorial|migrator"
con_datos, sin_datos, revisar, truncados = [], [], [], []
for e in esp:
    nom = e["nombre"]
    p = pg.get(str(e["id"]))
    if p: e["libro"] = {"pagina": p["pag"], "lamina": p["lamina"]}
    if e["id"] in com: e["nombres_alternos"] = [x for x in com[e["id"]] if n(x) != n(nom)]
    fuente_nom = nom if nom in libro else COMPARTIDAS.get(nom)
    d = libro.get(fuente_nom)
    if not d: sin_datos.append(nom); continue
    con_datos.append(nom)
    mm = d["mm"]
    if mm: e["tamano_mm"] = {"min": mm[0], "max": mm[1]}
    desc, dist, eco = limpia(d["desc"]), limpia(d["dist"]), limpia(d["eco"])
    e["descripcion"] = desc
    e["rasgos"] = " ".join(f for f in frases(desc) if re.search(ES_RASGO, n(f)))
    e["colores"] = [c for c in d["colores"] if c in meta["colores"]]
    e["habitat"] = d["habitat"]
    fr = frases(eco)
    e["comportamiento"] = " ".join(f for f in fr if not re.search(ES_HOSP, n(f)))
    e["ciclo"]["hospederas"] = d["hospederas"]
    e["ciclo"]["nota_hospederas"] = " ".join(f for f in fr if re.search(ES_HOSP, n(f)))
    e["vuelo"] = {"meses": [i+1 for i, m in enumerate(MESES) if re.search(r"\b" + m + r"\b", n(eco + " " + desc))],
                  "nota": " ".join(f for f in fr if re.search(ES_VUELO, n(f)))}
    e["distribucion"]["nota"] = dist
    base = n(dist) if dist else n(desc)
    e["endemica"] = bool(re.search(r"endemic", base) and not re.search(r"endemic\w* del? (las? )?(antillas|espanola|jamaica|bahamas|caiman|puerto|florida)", base))
    ab = re.match(r"^(Extremadamente rara|Muy rara|Muy común|Poco común|Localmente común|Común|Rara|Escasa|Abundante)", eco or "")
    if ab: e["abundancia"] = ab.group(1)
    cons = re.search(r"categorizada (?:como|En|en) ([^;.]{3,60})", eco or "")
    if cons: e["conservacion"] = re.sub(r"\s*(a la|de) extinción.*$", "", cons.group(1)).strip()
    lam = (e.get("libro") or {}).get("lamina")
    f = [f"{CITA} p. {d['pag']}" + (f", lámina {lam}" if lam else "")]
    notas = []
    if nom in COMPARTIDAS: notas.append(f"El libro trata esta subespecie dentro de la ficha de {COMPARTIDAS[nom]}.")
    if nom in corr and corr[nom].get("nota"): notas.append(corr[nom]["nota"])
    if d.get("revisar"): notas.append("Distribución o ecología reconstruidas de un bloque de texto separado por el salto de columna: conviene comprobarlas en el libro."); revisar.append(nom)
    if d.get("truncado"): notas.append("Algún párrafo quedó cortado por el salto de columna del libro."); truncados.append(nom)
    e["nota_fuente"] = " ".join(notas)
    e["fuentes"] = f
    llenos = sum(bool(x) for x in (e["descripcion"], e["distribucion"]["nota"], e["comportamiento"]))
    e["estado_datos"] = "parcial" if llenos >= 2 else "pendiente"
meta["fuente_datos"] = CITA
meta["nota_datos"] = ("Descripción, distribución y ecología provienen de la guía de campo (sus textos pueden usarse "
                      "citando la fuente). Colores, hábitat y plantas hospederas se derivaron de esos textos. "
                      "distribucion.zonas sigue vacío: el libro da regiones en prosa, no polígonos.")
(REPO/"src/data/especies.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("con datos:", len(con_datos), " sin datos:", len(sin_datos))
print("palabras con dígito que no se pudieron arreglar:", sorted(_fallos)[:40])
print("marcadas revisar:", len(revisar), " truncadas:", len(truncados))
json.dump({"sin_datos": sin_datos, "revisar": revisar, "truncados": truncados}, open(S/"estado_final.json","w"), ensure_ascii=False, indent=1)
