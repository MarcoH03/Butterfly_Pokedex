# -*- coding: utf-8 -*-
"""Vuelca cada página del libro a XML con posiciones + sus imágenes."""
import subprocess, sys, shutil
from pathlib import Path
PDF = "/root/.claude/uploads/eca042aa-006e-5a9c-8b90-19558da44315/2b581c40-Mariposas_Cuba_Guia_de_Campo_2020.pdf"
S = Path("/tmp/claude-0/-home-claude/eca042aa-006e-5a9c-8b90-19558da44315/scratchpad")
DEST = S / "paginas_xml"
def volcar(p0, p1):
    DEST.mkdir(parents=True, exist_ok=True)
    for p in range(p0, p1 + 1):
        if (DEST / f"p{p}.xml").exists(): continue
        subprocess.run(["pdftohtml", "-xml", "-c", "-f", str(p), "-l", str(p), PDF, str(DEST / f"p{p}")],
                       capture_output=True)
if __name__ == "__main__":
    volcar(int(sys.argv[1]), int(sys.argv[2]))
    print("xml+imágenes en", DEST, "| archivos:", len(list(DEST.glob("*.jpg"))) + len(list(DEST.glob("*.png"))))
