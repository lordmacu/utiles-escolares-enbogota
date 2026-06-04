#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-content.py

Port en Python del generador de contenido (antes scripts/generate-content.mjs).
Genera contenido editorial para el blog usando MiniMax y lo agrega a
data/blog.json (noticias) o data/guias.json (guías). Pensado para correr 3 veces
por semana vía cron y, con --commit, hace git add + commit + push (dispara el
deploy en Vercel).

Por qué Python: en el celular (Termux/Android) `sharp` no compila (node-gyp pide
el NDK de Android). Pillow convierte a WebP sin compilar nada, y ya se usa en el
pipeline de imágenes del proyecto. Solo depende de la stdlib + Pillow (opcional).

NOTICIAS: "búsqueda" real vía Google News RSS (Colombia, español, sin API key).
GUÍAS: parten del catálogo (categorías), no necesitan búsqueda.
En ambos casos el contenido se humaniza (prompts/humanize-text.md), referencia
categorías REALES del sitio y trae metaTitle/metaDescription/FAQ para SEO.

Uso:
  python scripts/generate-content.py                 # auto (rota noticia/guía)
  python scripts/generate-content.py --type=noticia  # forzar noticia
  python scripts/generate-content.py --type=guia     # forzar guía
  python scripts/generate-content.py --dry-run       # genera pero NO escribe
  python scripts/generate-content.py --commit        # escribe + git push
  python scripts/generate-content.py --no-pull       # no hace git pull al inicio

Variables de entorno (.env.local o entorno real):
  LLM_API_KEY, LLM_BASE_URL (default https://api.minimax.io/anthropic),
  LLM_MODEL (default MiniMax-M3), LLM_API_STYLE (auto), LLM_MAX_TOKENS.
"""

import io
import json
import os
import re
import sys
import time
import html
import subprocess
import unicodedata
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG_FILE = os.path.join(ROOT, "data", "blog.json")
GUIAS_FILE = os.path.join(ROOT, "data", "guias.json")
CATEGORIAS_FILE = os.path.join(ROOT, "data", "categorias.json")
PRODUCTOS_FILE = os.path.join(ROOT, "data", "productos.json")
CONFIG_FILE = os.path.join(ROOT, "data", "config.json")
HUMANIZE_FILE = os.path.join(ROOT, "prompts", "humanize-text.md")


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def _s(x):
    """String(x) tolerante: None -> "" (en vez de 'None')."""
    return "" if x is None else str(x)


# ───────────────────────────── entorno ─────────────────────────────
def load_env():
    for fn in (".env.local", ".env"):
        p = os.path.join(ROOT, fn)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as fh:
            for line in fh:
                m = re.match(r"^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$", line)
                if m and m.group(1) not in os.environ:
                    v = m.group(2)
                    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                        v = v[1:-1]
                    os.environ[m.group(1)] = v


def parse_args(argv):
    args = {"type": "auto", "dry_run": False, "commit": False, "no_pull": False}
    for a in argv[1:]:
        if a == "--dry-run":
            args["dry_run"] = True
        elif a == "--commit":
            args["commit"] = True
        elif a == "--no-pull":
            args["no_pull"] = True
        elif a.startswith("--type="):
            args["type"] = a[7:]
    return args


# ──────────────────────────── utilidades ───────────────────────────
def slugify(text, max_len=65):
    base = unicodedata.normalize("NFD", _s(text).lower())
    base = "".join(c for c in base if unicodedata.category(c) != "Mn")
    base = re.sub(r"[^a-z0-9\s-]", "", base).strip()
    base = re.sub(r"\s+", "-", base)
    base = re.sub(r"-+", "-", base)
    # Corta en límite de palabra (no a mitad de palabra).
    words = [w for w in base.split("-") if w]
    slug = ""
    for w in words:
        if slug and len(slug) + 1 + len(w) > max_len:
            break
        slug = f"{slug}-{w}" if slug else w
    return slug or "articulo"


def decode_entities(s):
    s = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", s, flags=re.S)
    return html.unescape(s).strip()


def hoy_bogota():
    """YYYY-MM-DD en zona horaria de Bogotá (Colombia = UTC-5 fijo, sin DST)."""
    return (datetime.now(timezone.utc) - timedelta(hours=5)).strftime("%Y-%m-%d")


def read_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        if default is not None:
            return default
        raise


def read_text(path, default=""):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except Exception:
        return default


# ──────────────────────── HTTP (stdlib) ────────────────────────────
def http_post_json(url, headers, body, timeout=180):
    """POST JSON. Devuelve (status, texto) sin lanzar en 4xx/5xx (como fetch)."""
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return getattr(r, "status", 200), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        try:
            txt = e.read().decode("utf-8", "replace")
        except Exception:
            txt = str(e)
        return e.code, txt


# ───────────────── "búsqueda" real: Google News RSS ────────────────
def buscar_noticias(query, max_n=8):
    url = (
        "https://news.google.com/rss/search?q="
        + urllib.parse.quote(query, safe="")
        + "&hl=es-419&gl=CO&ceid=CO:es-419"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            if getattr(r, "status", 200) != 200:
                return []
            xml = r.read().decode("utf-8", "replace")
    except Exception:
        return []

    items = re.findall(r"<item>([\s\S]*?)</item>", xml)[:max_n]
    out = []
    for block in items:
        mt = re.search(r"<title>([\s\S]*?)</title>", block)
        ms = re.search(r"<source[^>]*>([\s\S]*?)</source>", block)
        mp = re.search(r"<pubDate>([\s\S]*?)</pubDate>", block)
        raw_title = mt.group(1) if mt else ""
        source = ms.group(1) if ms else ""
        pub = mp.group(1) if mp else ""
        title = decode_entities(raw_title)
        src = decode_entities(source)
        if src and title.endswith(f" - {src}"):
            title = title[: -(len(src) + 3)]
        title = title.strip()
        if len(title) > 15:
            out.append({"title": title, "source": src, "date": pub.strip()})
    return out


# ────────────────────────── LLM (MiniMax) ──────────────────────────
def resolve_api_style(style, base_url):
    s = (style or "auto").lower()
    if s in ("openai", "anthropic"):
        return s
    return "anthropic" if re.search(r"/anthropic(/|$)", base_url, re.I) else "openai"


def extract_json(text):
    t = text.strip()
    m = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```\s*$", t)
    if m:
        t = m.group(1).strip()
    try:
        return json.loads(t)
    except Exception:
        start = t.find("{")
        end = t.rfind("}")
        if start != -1 and end > start:
            return json.loads(t[start : end + 1])
        raise ValueError("No se encontró JSON válido en la respuesta del modelo")


def call_llm(system, user, base_url, api_key, model, api_style, max_tokens=16000, max_retries=4):
    base = base_url.rstrip("/")
    last_err = None
    tokens = max_tokens
    for attempt in range(1, max_retries + 1):
        try:
            if api_style == "anthropic":
                url = f"{base}/v1/messages"
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                }
                body = {
                    "model": model,
                    "max_tokens": tokens,
                    "temperature": 0.8,
                    "system": system,
                    "messages": [{"role": "user", "content": user}],
                }
            else:
                url = f"{base}/chat/completions"
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
                body = {
                    "model": model,
                    "temperature": 0.8,
                    "max_tokens": tokens,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                }
            status, text = http_post_json(url, headers, body, timeout=300)
            if status < 200 or status >= 300:
                last_err = RuntimeError(f"HTTP {status}: {text[:300]}")
                if 400 <= status < 500 and status != 429:
                    raise last_err
            else:
                data = json.loads(text)
                choices = data.get("choices") or [{}]
                stop = data.get("stop_reason") or choices[0].get("finish_reason")
                if api_style == "anthropic":
                    content = "".join(
                        b.get("text", "")
                        for b in (data.get("content") or [])
                        if isinstance(b, dict) and b.get("type") == "text"
                    )
                else:
                    content = (choices[0].get("message") or {}).get("content")
                if stop in ("max_tokens", "length") and tokens < 32000:
                    tokens = min(tokens * 2, 32000)
                    continue
                if not content:
                    raise RuntimeError("Respuesta vacía del modelo")
                return content
        except Exception as e:  # noqa: BLE001
            last_err = e
        if attempt < max_retries:
            time.sleep(0.8 * 2 ** (attempt - 1))
    raise last_err


# ──────────────────── imagen (MiniMax image-01) ────────────────────
# Endpoint NATIVO (PAYG), no el de /anthropic. Fotorrealista, personas reales.
IMG_BASE = "https://api.minimax.io"
IMG_STYLE = (
    "photorealistic editorial photography, REAL PEOPLE, candid, Colombian / Latin "
    "American families, parents and school children, students in a classroom or at "
    "home studying, natural daylight, warm authentic tones, shallow depth of field, "
    "high quality magazine look, no text, no letters, no words, no watermark, no logo, "
    "no brand names"
)


def generate_imagen(slug, image_prompt, api_key, out_dir):
    if not image_prompt:
        return None
    try:
        status, text = http_post_json(
            f"{IMG_BASE}/v1/image_generation",
            {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            {
                "model": "image-01",
                "prompt": f"{image_prompt}. {IMG_STYLE}",
                "width": 1536,
                "height": 960,
                "response_format": "url",
                "n": 1,
                "prompt_optimizer": True,
            },
            timeout=180,
        )
        j = json.loads(text)
        base_resp = j.get("base_resp") or {}
        urls = ((j.get("data") or {}).get("image_urls")) or []
        if base_resp.get("status_code") != 0 or not urls:
            log("  ⚠ imagen:", json.dumps(base_resp or j, ensure_ascii=False)[:200])
            return None

        req = urllib.request.Request(urls[0], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as r:
            buf = r.read()

        os.makedirs(out_dir, exist_ok=True)
        # WebP si hay Pillow; si no, guarda el JPG original (Next lo re-optimiza al servir).
        ext = "jpg"
        out = buf
        try:
            from PIL import Image  # type: ignore

            im = Image.open(io.BytesIO(buf)).convert("RGB")
            bio = io.BytesIO()
            im.save(bio, format="WEBP", quality=84, method=6)
            out = bio.getvalue()
            ext = "webp"
        except Exception:
            pass  # sin Pillow: se guarda el original

        file = os.path.join(out_dir, f"{slug}.{ext}")
        with open(file, "wb") as f:
            f.write(out)
        log(f"  🎨 imagen: /images/blog/{slug}.{ext} ({len(out) // 1024} KB)")
        return {"rel": f"/images/blog/{slug}.{ext}", "file": file}
    except Exception as e:  # noqa: BLE001
        log("  ⚠ imagen falló (continúo sin imagen):", str(e).split("\n")[0])
        return None


# ───────────────────────── prompts ─────────────────────────
def reglas_humanas(humanize_text):
    es = "\n".join(
        [
            "## REGLAS DE ESCRITURA HUMANA (OBLIGATORIAS, máxima prioridad)",
            "El texto se publica para posicionar en Google y debe leerse 100% humano, nunca como IA.",
            "- Frases cortas (10-20 palabras), voz activa, vocabulario cotidiano y concreto.",
            "- Varía el largo de las frases. Ritmo natural, no mecánico.",
            "- PROHIBIDO el guion largo (—) y el punto y coma (;). Usa punto o coma.",
            "- PROHIBIDOS clichés de IA en español: 'En resumen', 'En conclusión', 'En definitiva',",
            "  'Es importante destacar/mencionar', 'cabe resaltar', 'cabe destacar', 'sin lugar a dudas',",
            "  'en la era digital', 'en el mundo de', 'sumérgete en', 'descubre el mundo de', 'eleva tu',",
            "  'lleva al siguiente nivel', 'no es solo... es', 'ya sea... o', 'cuando se trata de', 'a la hora de'.",
            "- No empieces oraciones ni ítems con conectores tipo 'Además', 'Asimismo', 'Sin embargo',",
            "  'Por lo tanto', 'Por ende', 'Igualmente', 'De igual manera'.",
            "- Nada de metáforas de viajes, música o paisajes. Nada de emojis. Sin mayúsculas para enfatizar.",
            "- No te refieras a ti mismo ni a que eres una IA. No te disculpes. Afirma con seguridad.",
            "- Español de Colombia (Bogotá), natural y cercano.",
        ]
    )
    ht = (humanize_text or "").strip()
    if ht:
        return f"{es}\n\n--- Guía completa (inglés, aplica por analogía) ---\n{ht}"
    return es


def system_base(store, humanize_text):
    return "\n".join(
        [
            f'Eres el editor del blog de "{store["nombre"]}", una tienda de útiles escolares y papelería a domicilio en Bogotá, Colombia.',
            "Pedidos por WhatsApp. Vendes: cuadernos, esferos, lápices, colores, témperas, morrales, loncheras, carpetas, artículos de oficina y de fiesta escolar.",
            "Escribes contenido editorial original, útil y optimizado para SEO, que ayuda a posicionar el sitio y a que los lectores compren.",
            "",
            reglas_humanas(humanize_text),
            "",
            "## SEO (obligatorio)",
            "- metaTitle: 50-60 caracteres, con la keyword principal y mención a Bogotá cuando aplique.",
            "- metaDescription: 140-155 caracteres, con keyword y un llamado a la acción.",
            "- El h1 debe contener la keyword principal de forma natural.",
            "- Incluye SIEMPRE referencias a categorías/productos REALES del sitio (enlazado interno).",
            "- Las FAQ deben responder dudas reales de compra (entrega, precios, cómo pedir).",
            "",
            "Devuelves SOLO un objeto JSON válido, sin texto extra ni fences de markdown.",
        ]
    )


NOTICIA_JSON_SHAPE = """{
  "metaTitle": "string 50-60 chars con keyword + Bogotá",
  "h1": "titular periodístico atractivo con keyword",
  "metaDescription": "string 140-155 chars con keyword y CTA",
  "excerpt": "1 frase gancho de 120-160 chars",
  "etiqueta": "etiqueta corta (ej: Regreso a clases, Ahorro, Tendencias, Calendario)",
  "heroCategoria": "un slug de la lista",
  "lead": "1 frase potente que abre el artículo",
  "intro": ["párrafo 1", "párrafo 2"],
  "items": [
    { "titulo": "subtítulo con gancho", "texto": "2-3 frases que conectan la noticia con un tipo de producto/categoría que vendemos", "ctaCategoria": "slug de la lista", "ctaTexto": "Ver cuadernos" }
  ],
  "secciones": [
    { "titulo": "subtítulo de análisis", "parrafos": ["párrafo de contexto de fondo, útil y con keywords naturales", "segundo párrafo"] }
  ],
  "cierre": ["párrafo de cierre con invitación a pedir por WhatsApp / a domicilio en Bogotá"],
  "faq": [ { "pregunta": "...", "respuesta": "..." } ],
  "categoriasRelacionadas": ["slug", "slug", "slug"],
  "imagePrompt": "descripción EN INGLÉS de una foto fotorrealista con PERSONAS REALES sobre el tema; si habla de colegio, muestra niños en el colegio/salón o papás con sus hijos comprando o alistando útiles; escena natural y cálida, sin texto en la imagen"
}"""

GUIA_JSON_SHAPE = """{
  "title": "string SEO 50-60 chars con keyword",
  "h1": "título con keyword",
  "metaDescription": "string 140-155 chars con keyword y CTA",
  "excerpt": "1 frase gancho de 120-160 chars",
  "imagenCategoria": "un slug de la lista",
  "categoriasRelacionadas": ["slug", "slug", "slug"],
  "lead": "1 frase que abre la guía",
  "secciones": [ { "titulo": "subtítulo claro", "parrafos": ["párrafo 1", "párrafo 2"] } ],
  "faq": [ { "pregunta": "...", "respuesta": "..." } ],
  "imagePrompt": "descripción EN INGLÉS de una foto fotorrealista con PERSONAS REALES sobre el tema; si habla de colegio, muestra niños en el colegio/salón o papás con sus hijos alistando útiles; escena natural y cálida, sin texto en la imagen"
}"""


def prompt_noticia(store, cats, noticias, fecha, humanize_text):
    cat_list = ", ".join(f'{c["slug"]} ({c["nombre"]})' for c in cats)
    if noticias:
        titulares = "\n".join(
            f'{i + 1}. {n["title"]}{(" [" + n["source"] + "]") if n["source"] else ""}'
            for i, n in enumerate(noticias)
        )
    else:
        titulares = "(sin titulares disponibles: escribe una noticia de temporada escolar basada en la fecha actual)"
    system = system_base(store, humanize_text)
    user = "\n".join(
        [
            f"Hoy es {fecha}. Escribe una NOTICIA para el blog, partiendo de la actualidad reciente de Colombia.",
            "",
            "Titulares recientes (contexto; NO los copies, inspírate y conéctalos con útiles escolares / papelería / regreso a clases):",
            titulares,
            "",
            f"Categorías reales del sitio (usa SOLO estos slugs): {cat_list}",
            "",
            "Devuelve un JSON con EXACTAMENTE esta forma:",
            NOTICIA_JSON_SHAPE,
            "",
            "Requisitos: 4 a 5 items (cada uno con un ctaCategoria distinto y real), 2 a 3 secciones de análisis (prosa de fondo), 3 a 4 faq, 3 categoriasRelacionadas reales, e imagePrompt en inglés con personas reales.",
            "La noticia debe ser ORIGINAL y útil, conectando la actualidad con la compra de útiles. Solo JSON.",
        ]
    )
    return system, user


def prompt_guia(store, cats, brief, fecha, humanize_text):
    cat_list = ", ".join(f'{c["slug"]} ({c["nombre"]})' for c in cats)
    system = system_base(store, humanize_text)
    user = "\n".join(
        [
            f"Hoy es {fecha}. Escribe una GUÍA práctica (evergreen) sobre el siguiente tema:",
            f"TEMA: {brief['tema']}",
            f"Categoría principal sugerida: {brief['categoria']}",
            "",
            f"Categorías reales del sitio (usa SOLO estos slugs): {cat_list}",
            "",
            "Devuelve un JSON con EXACTAMENTE esta forma:",
            GUIA_JSON_SHAPE,
            "",
            "Requisitos: 4 a 5 secciones, 3 a 4 faq, 3 categoriasRelacionadas reales (la primera = imagenCategoria), e imagePrompt en inglés con personas reales.",
            "La guía debe mencionar tipos de producto que vendemos y orientar a comprar por WhatsApp / a domicilio en Bogotá. Solo JSON.",
        ]
    )
    return system, user


# ─────────────────────── validación / saneo ───────────────────────
def fix_cat(slug, valid_set, fallback="utiles-escolares"):
    return slug if slug in valid_set else fallback


def trim_meta(s, max_len):
    if not isinstance(s, str):
        return ""
    if len(s) <= max_len:
        return s
    cut = s[:max_len]
    sp = cut.rfind(" ")
    return (cut[:sp] if sp > max_len - 20 else cut).strip()


def dedupe_cats(arr, valid_set, first):
    out = []
    for c in [first] + (list(arr) if isinstance(arr, list) else []):
        v = fix_cat(c, valid_set)
        if v not in out:
            out.append(v)
    while len(out) < 3:
        out.append("utiles-escolares")
    return out[:4]


def unique_slug(base, existing):
    base = base or "articulo"
    slug = base
    i = 2
    while slug in existing:
        slug = f"{base}-{i}"
        i += 1
    existing.add(slug)
    return slug


def sanitize_noticia(obj, valid_set, fecha, existing_slugs):
    req = ["metaTitle", "h1", "metaDescription", "excerpt", "etiqueta", "lead", "intro", "items", "cierre", "faq"]
    for k in req:
        if k not in obj:
            raise ValueError(f'noticia: falta campo "{k}"')
    if not isinstance(obj.get("items"), list) or len(obj["items"]) < 3:
        raise ValueError("noticia: items < 3")
    if not isinstance(obj.get("faq"), list) or len(obj["faq"]) < 3:
        raise ValueError("noticia: faq < 3")

    out = {
        "slug": unique_slug(slugify(obj["h1"]), existing_slugs),
        "metaTitle": trim_meta(obj.get("metaTitle"), 60),
        "h1": _s(obj.get("h1")).strip(),
        "metaDescription": trim_meta(obj.get("metaDescription"), 158),
        "excerpt": _s(obj.get("excerpt")).strip(),
        "fecha": fecha,
        "etiqueta": _s(obj.get("etiqueta")).strip()[:24],
        "heroCategoria": fix_cat(obj.get("heroCategoria"), valid_set),
        "lead": _s(obj.get("lead")).strip(),
        "intro": [_s(x) for x in (obj.get("intro") or [])],
        "items": [
            {
                "titulo": _s(it.get("titulo")).strip(),
                "texto": _s(it.get("texto")).strip(),
                "ctaCategoria": fix_cat(it.get("ctaCategoria"), valid_set),
                "ctaTexto": (_s(it.get("ctaTexto")) or "Ver productos").strip()[:32],
            }
            for it in obj["items"][:5]
        ],
        "cierre": [_s(x) for x in (obj.get("cierre") or [])],
        "faq": [
            {"pregunta": _s(f.get("pregunta")).strip(), "respuesta": _s(f.get("respuesta")).strip()}
            for f in obj["faq"][:5]
        ],
        "categoriasRelacionadas": dedupe_cats(obj.get("categoriasRelacionadas"), valid_set, obj.get("heroCategoria")),
    }
    # Secciones de fondo (opcionales): solo si vienen bien formadas.
    secciones = obj.get("secciones")
    if isinstance(secciones, list) and secciones:
        buenas = [
            s
            for s in secciones
            if s and s.get("titulo") and isinstance(s.get("parrafos"), list) and s.get("parrafos")
        ][:4]
        out["secciones"] = [
            {"titulo": _s(s.get("titulo")).strip(), "parrafos": [_s(p) for p in s["parrafos"]]} for s in buenas
        ]
    return out


def sanitize_guia(obj, valid_set, fecha, existing_slugs):
    req = ["title", "h1", "metaDescription", "excerpt", "lead", "secciones", "faq"]
    for k in req:
        if k not in obj:
            raise ValueError(f'guia: falta campo "{k}"')
    if not isinstance(obj.get("secciones"), list) or len(obj["secciones"]) < 3:
        raise ValueError("guia: secciones < 3")
    if not isinstance(obj.get("faq"), list) or len(obj["faq"]) < 3:
        raise ValueError("guia: faq < 3")

    imagen_categoria = fix_cat(obj.get("imagenCategoria"), valid_set)
    return {
        "slug": unique_slug(slugify(obj.get("h1") or obj.get("title")), existing_slugs),
        "title": trim_meta(obj.get("title"), 60),
        "h1": _s(obj.get("h1")).strip(),
        "metaDescription": trim_meta(obj.get("metaDescription"), 158),
        "excerpt": _s(obj.get("excerpt")).strip(),
        "fecha": fecha,
        "imagenCategoria": imagen_categoria,
        "categoriasRelacionadas": dedupe_cats(obj.get("categoriasRelacionadas"), valid_set, imagen_categoria),
        "lead": _s(obj.get("lead")).strip(),
        "secciones": [
            {"titulo": _s(s.get("titulo")).strip(), "parrafos": [_s(p) for p in (s.get("parrafos") or [])]}
            for s in obj["secciones"][:6]
        ],
        "faq": [
            {"pregunta": _s(f.get("pregunta")).strip(), "respuesta": _s(f.get("respuesta")).strip()}
            for f in obj["faq"][:5]
        ],
    }


# ─────────────────────── briefs / rotación ─────────────────────────
NOTICIA_QUERIES = [
    "regreso a clases Colombia 2026",
    "calendario escolar Colombia",
    "útiles escolares precios Colombia",
    "educación colegios Bogotá",
    "lista de útiles escolares Colombia",
    "matrículas colegios Colombia",
    "costo regreso a clases Colombia",
    "papelería Colombia temporada escolar",
]
GUIA_BRIEFS = [
    {"tema": "Cómo elegir el cuaderno correcto para cada materia", "categoria": "utiles-escolares"},
    {"tema": "Guía para comprar morral y lonchera que duren todo el año", "categoria": "morrales-y-loncheras"},
    {"tema": "Qué útiles de escritura necesita un estudiante (esferos, lápices, resaltadores)", "categoria": "escritura"},
    {"tema": "Materiales de arte y manualidades para el colegio", "categoria": "pintar"},
    {"tema": "Cómo organizar y clasificar los trabajos del colegio con carpetas y folders", "categoria": "archivos-y-clasificacion"},
    {"tema": "Papel, blocks y resmas: cuál elegir para cada uso", "categoria": "papeles-y-blocks"},
    {"tema": "Cómo montar un escritorio de estudio en casa", "categoria": "accesorios-de-escritorio-y-oficina"},
    {"tema": "Ideas para celebrar fechas especiales en el salón de clases", "categoria": "decoracion-de-fiesta"},
]


def pick_index(lst, n):
    return lst[((n % len(lst)) + len(lst)) % len(lst)]


# ───────────────────────────── git ─────────────────────────────────
def git(args):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or f"git {' '.join(args)} falló").strip())
    return r.stdout.strip()


def current_branch():
    try:
        return git(["rev-parse", "--abbrev-ref", "HEAD"])
    except Exception:
        return "main"


def commit_push(files, message):
    # Asegura identidad lordmacu (no la cuenta de trabajo).
    try:
        git(["config", "user.name", "lordmacu"])
    except Exception:
        pass
    try:
        git(["config", "user.email", "10134930+lordmacu@users.noreply.github.com"])
    except Exception:
        pass
    for f in files if isinstance(files, list) else [files]:
        git(["add", os.path.relpath(f, ROOT)])
    # Solo commitea si NUESTRO archivo quedó staged (no toca el resto del working tree).
    if not git(["diff", "--cached", "--name-only"]):
        log("· nada que commitear")
        return
    git(["commit", "-m", message])
    branch = current_branch()
    # Cron-safe: trae cambios remotos (la PC también empuja) antes de pushear.
    try:
        git(["pull", "--rebase", "origin", branch])
    except Exception as e:  # noqa: BLE001
        log("⚠ pull --rebase:", str(e).split("\n")[0])
    git(["push", "origin", branch])
    log("✓ commit + push hechos")


def git_pull():
    """Trae cambios remotos antes de generar. No fatal: si falla, sigue con lo local."""
    try:
        branch = current_branch()
        out = git(["pull", "--rebase", "--autostash", "origin", branch])
        last = (out.split("\n")[-1].strip() if out else "") or "ok"
        log(f"↻ git pull --rebase origin {branch}: {last}")
    except Exception as e:  # noqa: BLE001
        log("⚠ git pull falló (continúo con lo local):", str(e).split("\n")[0])


# ───────────────────────────── main ────────────────────────────────
def main():
    load_env()
    args = parse_args(sys.argv)

    base_url = os.environ.get("LLM_BASE_URL") or "https://api.minimax.io/anthropic"
    model = os.environ.get("LLM_MODEL") or "MiniMax-M3"
    api_key = os.environ.get("LLM_API_KEY") or ""
    api_style = resolve_api_style(os.environ.get("LLM_API_STYLE"), base_url)
    try:
        max_tokens = int(os.environ.get("LLM_MAX_TOKENS") or "") or 16000
    except Exception:
        max_tokens = 16000
    if not api_key:
        log("Error: falta LLM_API_KEY (definir en .env.local)")
        sys.exit(1)

    # Antes de generar nada, traemos lo último del remoto (salvo --no-pull).
    if not args["no_pull"]:
        git_pull()

    categorias_data = read_json(CATEGORIAS_FILE)
    config = read_json(CONFIG_FILE)
    humanize_text = read_text(HUMANIZE_FILE, default="")
    cats = [{"slug": c["slug"], "nombre": c["nombre"]} for c in categorias_data["categorias"]]
    valid_set = set(c["slug"] for c in cats)
    store = {"nombre": config.get("nombre"), "dominio": config.get("dominio"), "whatsapp": config.get("whatsapp")}
    fecha = hoy_bogota()

    blog = read_json(BLOG_FILE)
    guias = read_json(GUIAS_FILE)

    # Tipo: auto rota 2 noticias : 1 guía según el total ya publicado.
    type_ = args["type"]
    if type_ == "auto":
        total = len(blog["posts"]) + len(guias["guias"])
        type_ = "guia" if total % 3 == 2 else "noticia"
    if type_ not in ("noticia", "guia"):
        log(f"--type inválido: {type_}")
        sys.exit(1)

    log(f"[generate-content] type={type_} model={model} fecha={fecha} {'DRY-RUN' if args['dry_run'] else ''}")

    if type_ == "noticia":
        query = pick_index(NOTICIA_QUERIES, len(blog["posts"]))
        noticias = buscar_noticias(query)
        log(f'  búsqueda: query="{query}" titulares={len(noticias)}')
        system, user = prompt_noticia(store, cats, noticias, fecha, humanize_text)
        target_file, data_obj, arr_key = BLOG_FILE, blog, "posts"
    else:
        brief = pick_index(GUIA_BRIEFS, len(guias["guias"]))
        log(f'  tema: brief="{brief["tema"]}"')
        system, user = prompt_guia(store, cats, brief, fecha, humanize_text)
        target_file, data_obj, arr_key = GUIAS_FILE, guias, "guias"

    existing_slugs = set(x["slug"] for x in data_obj[arr_key])
    content = call_llm(system, user, base_url, api_key, model, api_style, max_tokens)
    raw = extract_json(content)
    nuevo = (
        sanitize_noticia(raw, valid_set, fecha, existing_slugs)
        if type_ == "noticia"
        else sanitize_guia(raw, valid_set, fecha, existing_slugs)
    )

    titulo_seo = nuevo.get("metaTitle") or nuevo.get("title") or ""
    log(f"\n→ {type_}: {nuevo['h1']}")
    log(f"  slug: {nuevo['slug']}")
    log(f"  título SEO ({len(titulo_seo)}): {titulo_seo}")
    log(f"  metaDescription ({len(nuevo['metaDescription'])})")
    refs = (
        ", ".join(i["ctaCategoria"] for i in nuevo["items"])
        if type_ == "noticia"
        else ", ".join(nuevo["categoriasRelacionadas"])
    )
    log(f"  categorías referenciadas: {refs}")

    if args["dry_run"]:
        log(f"  imagePrompt: {(raw.get('imagePrompt') or '(ninguno)')[:120]}")
        log("\nDRY-RUN: no se escribió nada (ni imagen).\n" + json.dumps(nuevo, ensure_ascii=False, indent=2)[:800] + " …")
        return

    # Imagen del blog (best-effort): MiniMax image-01, escena fotorrealista con personas reales.
    img_dir = os.path.join(ROOT, "public", "images", "blog")
    img = generate_imagen(nuevo["slug"], raw.get("imagePrompt"), api_key, img_dir)
    if img:
        nuevo["heroImagen"] = img["rel"]

    # Inserta al inicio (lo más nuevo primero) y escribe.
    data_obj[arr_key].insert(0, nuevo)
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(data_obj, ensure_ascii=False, indent=2) + "\n")
    log(f"✓ agregado a {os.path.relpath(target_file, ROOT)} ({len(data_obj[arr_key])} en total)")

    if args["commit"]:
        ruta = f"/blog/{nuevo['slug']}" if type_ == "noticia" else f"/guias/{nuevo['slug']}"
        files = [target_file]
        if img:
            files.append(img["file"])
        commit_push(files, f'Contenido auto: {type_} "{nuevo["h1"]}" ({ruta})')


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        log("ERROR:", str(e).split("\n")[0])
        sys.exit(1)
