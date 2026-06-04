#!/usr/bin/env python3
"""
Anota la subcategoría real de cada producto en data/scraped/<main>.json.

El scraper original guardó cada producto solo con su categoría principal. VTEX
expone en cada producto el campo `categories` con la ruta completa, p. ej.
"/Piñatería y Papelería/Útiles Escolares/Cuadernos Agendas y Libretas/". Aquí
re-consultamos VTEX (solo el catálogo JSON, sin imágenes), mapeamos cada producto
(por linkText/slug) a su subcategoría y AÑADIMOS el campo `subcategoria` a los
productos existentes SIN tocar imagen/galeria/etc.

Después: ejecutar merge_scraped.py para refrescar data/productos.json.
"""

import json
import os
import re
import unicodedata

from scraper_lostreselefantes import discover_categories, fetch_products


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def deepest_sub(categories_paths, sub_by_name, sub_by_slug):
    """De las rutas de categoría del producto, devuelve el slug de la
    subcategoría más profunda que coincida con una subcategoría conocida."""
    for path in categories_paths or []:
        segs = [x for x in path.strip("/").split("/") if x]
        for seg in reversed(segs):  # de lo más profundo a lo más general
            key = seg.strip().lower()
            if key in sub_by_name:
                return sub_by_name[key]
            sl = slugify(seg)
            if sl in sub_by_slug:
                return sl
    return None


def main():
    cats = discover_categories()
    if not cats:
        print("No se pudo leer el árbol de categorías; abortando.")
        return

    total_anotados = 0
    for cat in cats:
        main_slug = cat["slug"]
        subs = cat.get("subcategorias") or []
        path_file = os.path.join("data", "scraped", f"{main_slug}.json")
        if not subs or not os.path.exists(path_file):
            continue

        sub_by_name = {s["nombre"].strip().lower(): s["slug"] for s in subs}
        sub_by_slug = {s["slug"]: s["slug"] for s in subs}

        print(f"[{main_slug}] subcategorías: {[s['slug'] for s in subs]}")
        raw = fetch_products(cat["path"])
        mapping = {}
        for p in raw:
            link = p.get("linkText")
            if not link:
                continue
            sub = deepest_sub(p.get("categories"), sub_by_name, sub_by_slug)
            if sub:
                mapping[link] = sub

        data = json.load(open(path_file, encoding="utf-8"))
        anotados = 0
        conteo = {}
        for prod in data.get("productos", []):
            sub = mapping.get(prod.get("slug"))
            if sub:
                prod["subcategoria"] = sub
                anotados += 1
                conteo[sub] = conteo.get(sub, 0) + 1
        json.dump(data, open(path_file, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        total_anotados += anotados
        print(f"  -> {anotados}/{len(data.get('productos', []))} anotados | {conteo}")

    print(f"\nTotal productos anotados con subcategoría: {total_anotados}")
    print("Ejecuta merge_scraped.py para actualizar data/productos.json")


if __name__ == "__main__":
    main()
