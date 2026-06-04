#!/usr/bin/env python3
"""
Enriquece los productos con facetas para los filtros del front, SIN tocar
imagen/galeria. Por ahora añade `color`, inferido del nombre del producto (y
tags como respaldo). Marca y precio ya existen.

Pipeline: ... -> annotate_subcategorias.py -> enrich_facets.py -> merge_scraped.py
"""

from __future__ import annotations

import glob
import json
import re
import unicodedata

# Color canónico -> patrones (en texto normalizado sin tildes, minúsculas).
COLORES = [
    ("Surtido", r"\b(surtid[oa]s?|multicolor|varios colores|colores surtidos|mix)\b"),
    ("Transparente", r"\b(transparente|cristal)\b"),
    ("Negro", r"\bnegr[oa]s?\b"),
    ("Blanco", r"\bblanc[oa]s?\b"),
    ("Rojo", r"\broj[oa]s?\b"),
    ("Azul", r"\bazul(es)?\b"),
    ("Verde", r"\bverdes?\b"),
    ("Amarillo", r"\bamarill[oa]s?\b"),
    ("Fucsia", r"\bfucsi[ao]s?\b"),
    ("Rosado", r"\b(rosad[oa]s?|rosa)\b"),
    ("Morado", r"\b(morad[oa]s?|lila|violet[ao]s?|purpura)\b"),
    ("Naranja", r"\b(naranja[ds]?|naranjad[oa]s?)\b"),
    ("Café", r"\b(cafe|marron(es)?)\b"),
    ("Gris", r"\bgris(es)?\b"),
    ("Dorado", r"\b(dorad[oa]s?|oro)\b"),
    ("Plateado", r"\b(platead[oa]s?|plata)\b"),
    ("Turquesa", r"\bturquesa\b"),
    ("Beige", r"\b(beige|crema|marfil)\b"),
]


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", s)


def detect_color(nombre: str, tags) -> str | None:
    hay = norm(nombre) + " " + norm(" ".join(tags or []))
    for canon, pat in COLORES:
        if re.search(pat, hay):
            return canon
    return None


def main():
    total = 0
    con_color = 0
    for f in sorted(glob.glob("data/scraped/*.json")):
        data = json.load(open(f, encoding="utf-8"))
        for p in data.get("productos", []):
            total += 1
            color = detect_color(p.get("nombre", ""), p.get("tags"))
            if color:
                p["color"] = color
                con_color += 1
            elif "color" in p:
                del p["color"]
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Productos: {total} | con color detectado: {con_color} ({100*con_color//max(total,1)}%)")
    print("Ejecuta merge_scraped.py para actualizar data/productos.json")


if __name__ == "__main__":
    main()
