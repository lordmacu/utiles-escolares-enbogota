#!/usr/bin/env python3
"""
Scraper para lostreselefantes.com.co (tienda VTEX IO).

- Descubre las subcategorías reales desde el árbol de catálogo de VTEX
  (/api/catalog_system/pub/category/tree/N), tomando los hijos directos de
  "Piñatería y Papelería" (id 129).
- Por cada subcategoría trae TODOS sus productos vía el endpoint público de
  VTEX /api/catalog_system/pub/products/search/<ruta>?_from=&_to= (datos
  completos: nombre, marca, precio, ListPrice, imágenes, descripción HTML,
  disponibilidad). El parámetro `resources` del header da el total.
- Extrae metadata SEO de cada subcategoría (og:title/description) desde el HTML.
- No usa navegador ni dependencias externas (solo stdlib). Es educado con el
  servidor (UA de navegador + throttling + reintentos con backoff).

Produce EXACTAMENTE el mismo formato que el scraper de sorpresas, para que
download_images.py / optimize_images.py / merge_scraped.py funcionen igual.

Salida:
  data/scraped/<slug>.json     un archivo por subcategoría
  data/categorias.json         índice de categorías (con backup .bak)
"""

import gzip
import html as htmllib
import json
import os
import re
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

BASE_URL = "https://www.lostreselefantes.com.co"
ROOT_CATEGORY_ID = 129          # "Piñatería y Papelería"
PAGE = 50                       # VTEX permite máx 50 productos por página (_to - _from <= 49)
VTEX_OFFSET_CAP = 2500          # VTEX rechaza offsets por encima de esto

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
}


# ---------------------------------------------------------------------------
# HTTP educado (stdlib) con reintentos y backoff ante 403/429/503
# ---------------------------------------------------------------------------
def _request(url, tries=4):
    delay = 4
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=40) as resp:
                raw = resp.read()
                if resp.headers.get("Content-Encoding", "").lower() == "gzip":
                    raw = gzip.decompress(raw)
                return raw.decode("utf-8", "replace"), dict(resp.headers)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 500, 502, 503, 504):
                print(f"      {e.code} en intento {attempt}; espero {delay}s")
                time.sleep(delay)
                delay *= 2
                continue
            print(f"      HTTP {e.code} en {url[:80]}")
            return None, None
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"      error intento {attempt}: {str(e)[:80]}")
            time.sleep(delay)
            delay *= 2
    return None, None


def get_json(url, tries=4):
    text, headers = _request(url, tries)
    if text is None:
        return None, headers
    try:
        return json.loads(text), headers
    except json.JSONDecodeError:
        return None, headers


def get_html(url, tries=3):
    text, _ = _request(url, tries)
    return text


# ---------------------------------------------------------------------------
# Limpieza de HTML (stdlib: html.parser) — sin BeautifulSoup
# ---------------------------------------------------------------------------
class _TextExtractor(HTMLParser):
    """Convierte HTML a texto plano respetando saltos de bloque."""

    _BLOCK = {"br", "p", "li", "div", "tr", "ul", "ol", "h1", "h2", "h3", "h4", "h5"}

    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip += 1
        elif tag in self._BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(h):
    if not h:
        return ""
    p = _TextExtractor()
    try:
        p.feed(h)
    except Exception:
        return re.sub(r"<[^>]+>", " ", h)
    return htmllib.unescape("".join(p.parts))


def _norm_ws(t):
    """Quita espacios no separables / de ancho cero."""
    return (t or "").replace(" ", " ").replace("​", "")


def clean_descripcion(body_html):
    if not body_html:
        return ""
    text = _norm_ws(html_to_text(body_html))
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    return re.sub(r"\n{2,}", "\n", text).strip()


def extract_contenido(body_html):
    """Lista de bullets a partir de los <li> de la descripción."""
    if not body_html:
        return []
    items = []
    for raw in re.findall(r"<li[^>]*>(.*?)</li>", body_html, re.S | re.I):
        t = re.sub(r"[ \t]{2,}", " ", _norm_ws(html_to_text(raw))).strip()
        if t:
            items.append(t)
    return items


# Specs internas/genéricas de VTEX que NO aportan al cliente (tiquetes de
# bodega, eco de la categoría, precio por unidad de medida).
SPECS_IGNORAR = {"EtiquetaProducto", "Beneficios", "Producto", "PUM"}


def extract_ficha(p):
    """Ficha técnica (bullets 'Clave: valor') a partir de las especificaciones
    útiles del producto. Se usa como contenido cuando la descripción no trae
    una lista propia."""
    ficha = []
    for k in p.get("allSpecifications") or []:
        if k in SPECS_IGNORAR:
            continue
        vals = [re.sub(r"\s+", " ", _norm_ws(str(v))).strip()
                for v in (p.get(k) or []) if str(v).strip()]
        if vals:
            ficha.append(f"{k}: {', '.join(vals)}")
    return ficha


# ---------------------------------------------------------------------------
# Imágenes y precios
# ---------------------------------------------------------------------------
def norm_img(url):
    """Normaliza una URL de imagen del CDN de VTEX a https."""
    if not url:
        return ""
    if url.startswith("//"):
        url = "https:" + url
    return url.replace("http://", "https://")


def to_int_price(value):
    """14700.0 -> 14700 ; None/'' -> None."""
    if value in (None, "", "null"):
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Descubrimiento de subcategorías desde el árbol de catálogo
# ---------------------------------------------------------------------------
def path_from_url(url):
    """https://dominio/pinateria-y-papeleria/utiles-escolares -> ese path."""
    return re.sub(r"^https?://[^/]+/", "", (url or "").strip()).strip("/")


def discover_categories():
    """Devuelve la lista de hijos directos de la categoría raíz como
    [{id, nombre, slug, path, subcategorias:[{nombre,slug}]}]."""
    tree, _ = get_json(f"{BASE_URL}/api/catalog_system/pub/category/tree/100")
    if not tree:
        return []

    def find(nodes):
        for n in nodes:
            if n.get("id") == ROOT_CATEGORY_ID:
                return n
            hit = find(n.get("children") or [])
            if hit:
                return hit
        return None

    root = find(tree)
    if not root:
        return []

    cats = []
    for child in root.get("children") or []:
        path = path_from_url(child.get("url"))
        slug = path.split("/")[-1]
        subs = [
            {"nombre": (g.get("name") or "").strip(), "slug": path_from_url(g.get("url")).split("/")[-1]}
            for g in (child.get("children") or [])
        ]
        cats.append({
            "id": child.get("id"),
            "nombre": (child.get("name") or "").strip(),
            "slug": slug,
            "path": path,
            "subcategorias": subs,
        })
    return cats


# ---------------------------------------------------------------------------
# Metadata SEO de la categoría (og:* desde el HTML de la página)
# ---------------------------------------------------------------------------
def _meta(html, *keys):
    for k in keys:
        m = re.search(
            r'<meta[^>]+(?:property|name)=["\']' + re.escape(k) + r'["\'][^>]*\bcontent=["\']([^"\']*)["\']',
            html, re.I,
        ) or re.search(
            r'<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + re.escape(k) + r'["\']',
            html, re.I,
        )
        if m and m.group(1).strip():
            return htmllib.unescape(m.group(1)).strip()
    return ""


def clean_name(n):
    """Quita el sufijo de marca ('… | Los Tres Elefantes')."""
    if not n:
        return n
    n = re.split(r"\s*[|–-]\s*(?:Los\s+Tres\s+Elefantes|lostreselefantes).*$", n, flags=re.I)[0]
    return n.strip() or n


def fetch_category_seo(path):
    """Devuelve (nombre, descripcion) leyendo og:title/og:description."""
    html = get_html(f"{BASE_URL}/{path}")
    if not html:
        return "", ""
    nombre = clean_name(_meta(html, "og:title"))
    descripcion = _meta(html, "og:description", "description")
    descripcion = re.sub(r"\s+", " ", _norm_ws(descripcion)).strip()
    return nombre, descripcion


# ---------------------------------------------------------------------------
# Productos de la categoría (paginando el endpoint público de VTEX)
# ---------------------------------------------------------------------------
def fetch_products(path):
    """Descarga TODOS los productos de la categoría paginando por offset."""
    products = []
    frm = 0
    total = None
    while frm < VTEX_OFFSET_CAP:
        to = frm + PAGE - 1
        url = f"{BASE_URL}/api/catalog_system/pub/products/search/{path}?_from={frm}&_to={to}"
        batch, headers = get_json(url)
        if total is None and headers:
            res = headers.get("resources") or headers.get("Resources") or ""
            m = re.search(r"/(\d+)$", res)
            total = int(m.group(1)) if m else None
        if not batch:
            break
        products.extend(batch)
        if len(batch) < PAGE or (total is not None and frm + PAGE >= total):
            break
        frm += PAGE
        time.sleep(0.4)
    return products


def map_product(p, categoria_slug):
    """Mapea un producto de VTEX al esquema que consume la app."""
    items = p.get("items") or []
    item0 = items[0] if items else {}
    seller = (item0.get("sellers") or [{}])[0]
    co = seller.get("commertialOffer") or {}

    precio = to_int_price(co.get("Price")) or 0
    precio_anterior = to_int_price(co.get("ListPrice"))
    if precio_anterior is not None and precio_anterior <= precio:
        precio_anterior = None

    # Galería: todas las imágenes de todos los items (variantes), deduplicadas.
    galeria = []
    for it in items:
        for im in it.get("images") or []:
            u = norm_img(im.get("imageUrl", ""))
            if u and u not in galeria:
                galeria.append(u)
    imagen = galeria[0] if galeria else ""

    body = p.get("description") or ""
    descripcion = clean_descripcion(body)
    if not descripcion:  # fallback al meta description cuando no hay cuerpo
        descripcion = re.sub(r"\s+", " ", _norm_ws(p.get("metaTagDescription") or "")).strip()
    contenido = extract_contenido(body) or extract_ficha(p)
    marca = (p.get("brand") or "").strip()
    clusters = list((p.get("productClusters") or {}).values())
    highlights = list((p.get("clusterHighlights") or {}).values())
    # Tags útiles para búsqueda/SEO: marca + colecciones del producto.
    tags = [t for t in [marca] + clusters if t]
    popular = any(re.search(r"vendid|destacad|\btop\b|popular|favorit", t, re.I)
                  for t in clusters + highlights)
    disponible = bool(co.get("IsAvailable"))

    return {
        "id": p.get("linkText", ""),
        "nombre": (p.get("productName") or "").strip(),
        "slug": p.get("linkText", ""),
        "marca": marca,
        "precio": precio,
        "precioAnterior": precio_anterior,
        "descripcion": descripcion,
        "imagen": imagen,
        "galeria": galeria,
        "contenido": contenido,
        "tags": tags,
        "popular": popular,
        "visible": True,
        "stock": 10 if disponible else 0,
        "categoria": categoria_slug,
    }


# ---------------------------------------------------------------------------
# Orquestación
# ---------------------------------------------------------------------------
def main():
    out_dir = "data/scraped"
    os.makedirs(out_dir, exist_ok=True)

    print("Descubriendo subcategorías desde el árbol de catálogo…")
    categories = discover_categories()
    print(f"  {len(categories)} subcategorías bajo la categoría raíz {ROOT_CATEGORY_ID}")
    if not categories:
        print("  (no se pudo leer el árbol; abortando)")
        return

    # Limpiar JSONs anteriores
    for f in os.listdir(out_dir):
        if f.endswith(".json"):
            os.remove(os.path.join(out_dir, f))

    categorias_index = []
    resumen = {}

    for i, cat in enumerate(categories, 1):
        path, slug = cat["path"], cat["slug"]
        print(f"\n[{i}/{len(categories)}] === {slug} ({path}) ===")

        nombre_seo, descripcion_seo = fetch_category_seo(path)
        time.sleep(0.5)

        nombre = nombre_seo or cat["nombre"] or slug.replace("-", " ").title()
        raw = fetch_products(path)

        productos = []
        vistos = set()
        for p in raw:
            s = p.get("linkText", "")
            if not s or s in vistos:
                continue
            prod = map_product(p, slug)
            if prod["nombre"]:
                vistos.add(s)
                productos.append(prod)

        if not productos:
            print("  (sin productos, se omite)")
            continue

        imagen = productos[0]["imagen"]  # primera imagen de producto como portada
        descripcion = descripcion_seo or f"{nombre} a domicilio en Bogotá."

        data = {
            "categoria": slug,
            "nombre": nombre,
            "slug": slug,
            "descripcion": descripcion,
            "imagen": imagen,
            "fuente": BASE_URL,
            "productos": productos,
        }
        with open(os.path.join(out_dir, f"{slug}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        categorias_index.append({
            "id": slug,
            "nombre": nombre,
            "slug": slug,
            "descripcion": descripcion,
            "imagen": imagen,
            "popular": False,
            "subcategorias": cat["subcategorias"],
        })
        resumen[slug] = len(productos)
        print(f"  -> {slug}.json ({len(productos)} productos) | img: {'sí' if imagen else 'no'}")
        time.sleep(0.6)

    # Regenerar categorias.json (con backup de la versión anterior)
    cat_file = "data/categorias.json"
    if os.path.exists(cat_file) and not os.path.exists(cat_file + ".bak"):
        os.rename(cat_file, cat_file + ".bak")
        print(f"\nBackup de categorias.json -> {cat_file}.bak")
    with open(cat_file, "w", encoding="utf-8") as f:
        json.dump({"categorias": categorias_index}, f, ensure_ascii=False, indent=2)

    total = sum(resumen.values())
    print("\n=== RESUMEN ===")
    print(f"Categorías con productos: {len(resumen)}")
    print(f"Total productos (con duplicados entre categorías): {total}")
    for slug, count in sorted(resumen.items(), key=lambda x: -x[1]):
        print(f"  {count:>4}  {slug}")


if __name__ == "__main__":
    main()
