#!/usr/bin/env python3
"""Elige un simulador de iPhone disponible entre los que trae el
runner de CI, el runtime de iOS más reciente. Imprime solo el UDID
(o nada si no encuentra ninguno), para que el workflow lo capture
directamente en una variable de entorno."""
import json
import subprocess
import sys

salida = subprocess.run(
    ["xcrun", "simctl", "list", "devices", "available", "--json"],
    capture_output=True, text=True, check=True
).stdout

datos = json.loads(salida)
candidatos = []
for runtime, dispositivos in datos["devices"].items():
    if "iOS" not in runtime:
        continue
    for d in dispositivos:
        if "iPhone" in d.get("name", "") and d.get("isAvailable"):
            candidatos.append((runtime, d))

candidatos.sort(key=lambda c: c[0], reverse=True)

if not candidatos:
    print("No se encontró ningún simulador de iPhone disponible", file=sys.stderr)
    sys.exit(1)

runtime, dispositivo = candidatos[0]
print(f"Elegido: {dispositivo['name']} ({runtime})", file=sys.stderr)
print(dispositivo["udid"])
