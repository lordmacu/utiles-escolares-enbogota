#!/usr/bin/env python3
"""
Enriquece los productos con facetas para los filtros del front, SIN tocar
imagen/galeria. Añade `color` y `tipo`, inferidos del nombre del producto (y
tags como respaldo). Marca y precio ya existen.

`tipo` agrupa productos por familia (Tijeras, Pegantes, Colores, Cuadernos…)
para que el front ofrezca un filtro "Tipo de producto" aun cuando VTEX no
expone esa subcategoría. Las reglas se evalúan EN ORDEN (gana la primera que
coincida): van de lo más específico a lo más genérico, así "Cinta Pegante"
cae en Cintas y no en Pegantes.

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


# Tipo de producto canónico -> patrón. ORDEN = prioridad (gana el primero).
# De lo más específico a lo más genérico para evitar capturas codiciosas.
TIPOS = [
    ("Notas adhesivas", r"\b(notas? adhesiv|notas? autoadhe|banderitas? adhesiv|sticky note)"),
    ("Cintas", r"\b(cinta|durex|masking|enmascarar|teipe)"),
    ("Cuadernos y libretas", r"\b(cuaderno|libreta|agenda|argollad|blocnota|mi diario)"),
    ("Stickers y calcomanías", r"\b(stickers?|calcomania)"),
    ("Escarcha, gemas y lentejuelas", r"\b(esc?harcha|escarcha|lentejuela|mostacilla|gemas?|canutillo)"),
    ("Pegantes y silicona", r"\b(pegant|pegament|silicon|colbon|colpega|pegastic|barra de peg|goma de pegar|cemento)"),
    ("Colores y crayones", r"\b(colore?s|crayol|crayon|prismacolor)"),
    ("Marcadores y resaltadores", r"\b(marcador|resaltador|sharpie|rotulador)"),
    ("Lápices", r"\b(lapiz|lapices|portamina|minas?\b)"),
    ("Esferos y bolígrafos", r"\b(esfero|boligrafo|microp|kilometrico)"),
    ("Borradores y correctores", r"\b(borrador|corrector|nata|limpiatipo|miga)"),
    ("Tijeras y bisturíes", r"\b(tijera|bisturi|cuchilla|exacto)"),
    ("Sacapuntas", r"\b(sacapunta|tajalapiz)"),
    ("Reglas y geometría", r"\b(regla|escuadra|transportador|compas|geometr)"),
    ("Calculadoras", r"\b(calculadora)"),
    ("Plastilina y arcilla", r"\b(plastil|arcilla|porce?nalicron|porcelanicron|greda)"),
    ("Pinceles y pintura", r"\b(pincel|pintura|temper|acuarela|vinilo|oleo)"),
    ("Cartulinas y papeles", r"\b(cartulina|papel|fomi|foamy|fomy|origami|carton|iris|pliego)"),
    ("Icopor y manualidades", r"\b(icopor|palito|palillo|molde|ojos mov|mariposa|flores con gema|esferas icopor|foami|\bsello)"),
    ("Clips, ganchos y grapas", r"\b(clip|gancho|broche|alfiler|chinche|cosedora|grapa|sacagrapa|perforadora|pin(es)?\b)"),
    ("Carpetas y archivo", r"\b(carpeta|folder|legajador|sobre|separador|az\b)"),
    ("Hilos, lanas y cordones", r"\b(hilo|lana|cordon|nylon|pabilo|cuerda)"),
    ("Elásticos y caucho", r"\b(elastico|caucho|liga\b|banda)"),
    ("Etiquetas y rótulos", r"\b(etiqueta|rotulo|marquilla)"),
]


def detect_tipo(nombre: str) -> str | None:
    hay = norm(nombre)
    for canon, pat in TIPOS:
        if re.search(pat, hay):
            return canon
    return None


def main():
    total = 0
    con_color = 0
    con_tipo = 0
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

            tipo = detect_tipo(p.get("nombre", ""))
            if tipo:
                p["tipo"] = tipo
                con_tipo += 1
            elif "tipo" in p:
                del p["tipo"]
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Productos: {total} | con color: {con_color} ({100*con_color//max(total,1)}%) | con tipo: {con_tipo} ({100*con_tipo//max(total,1)}%)")
    print("Ejecuta merge_scraped.py para actualizar data/productos.json")


if __name__ == "__main__":
    main()
