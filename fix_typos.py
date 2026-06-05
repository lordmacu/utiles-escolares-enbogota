#!/usr/bin/env python3
"""
Corrige typos/acentos comunes en los textos del catálogo (nombre, descripcion,
contenido) de data/scraped/*.json. Conservador: solo palabras españolas
inequívocas, reemplazo por PALABRA COMPLETA preservando mayúsculas. NO toca
slug, marca, tags ni imágenes (los slugs ya están indexados).

Pipeline: ... -> merge_scraped.py
"""

from __future__ import annotations

import glob
import json
import re

# wrong (ASCII, minúscula) -> correcto (con acento)
CORRECTIONS = {
    "boligrado": "bolígrafo",
    "boligrados": "bolígrafos",
    "boligrafo": "bolígrafo",
    "boligrafos": "bolígrafos",
    "lapiz": "lápiz",
    "lapices": "lápices",
    "numero": "número",
    "numeros": "números",
    "pagina": "página",
    "paginas": "páginas",
    "latex": "látex",
    "neon": "neón",
    "plastico": "plástico",
    "plastica": "plástica",
    "plasticos": "plásticos",
    "plasticas": "plásticas",
    "album": "álbum",
    "albumes": "álbumes",
    "decoracion": "decoración",
    "corazon": "corazón",
    "bombon": "bombón",
    "geometrico": "geométrico",
    "geometrica": "geométrica",
    "futbol": "fútbol",
    "articulo": "artículo",
    "articulos": "artículos",
}

# Un solo regex con todas las palabras (whole-word, case-insensitive).
PATTERN = re.compile(r"\b(" + "|".join(sorted(CORRECTIONS, key=len, reverse=True)) + r")\b", re.IGNORECASE)


def case_like(src: str, repl: str) -> str:
    if src.isupper():
        return repl.upper()
    if src[:1].isupper():
        return repl[:1].upper() + repl[1:]
    return repl


def fix(text: str, stats: dict) -> str:
    if not text:
        return text

    def sub(m):
        src = m.group(0)
        repl = case_like(src, CORRECTIONS[src.lower()])
        stats[src.lower()] = stats.get(src.lower(), 0) + 1
        return repl

    return PATTERN.sub(sub, text)


def main():
    stats: dict[str, int] = {}
    for f in sorted(glob.glob("data/scraped/*.json")):
        data = json.load(open(f, encoding="utf-8"))
        if data.get("nombre"):
            data["nombre"] = fix(data["nombre"], stats)
        if data.get("descripcion"):
            data["descripcion"] = fix(data["descripcion"], stats)
        for p in data.get("productos", []):
            if p.get("nombre"):
                p["nombre"] = fix(p["nombre"], stats)
            if p.get("descripcion"):
                p["descripcion"] = fix(p["descripcion"], stats)
            if isinstance(p.get("contenido"), list):
                p["contenido"] = [fix(c, stats) for c in p["contenido"]]
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    total = sum(stats.values())
    print(f"Correcciones aplicadas: {total}")
    for w, c in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {c:>4}  {w} -> {CORRECTIONS[w]}")
    print("\nEjecuta merge_scraped.py para actualizar productos.json")


if __name__ == "__main__":
    main()
