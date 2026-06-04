# CLAUDE.md — Útiles Escolares (clon SEO de Los Tres Elefantes)

Tienda nicho **estática (SSG)** en Next.js, alimentada por JSON scrapeado, pensada
para posicionar en buscadores. Misma arquitectura y optimizaciones que el proyecto
hermano **`sorpresas`** (`/Users/cristian/carros/sorpresas`) — se reutiliza su
lógica; lo único que cambia de raíz es el scraper (Shopify → VTEX).

- **Dominio objetivo:** `utilesescolares.enbogota.app`
- **Fuente:** https://www.lostreselefantes.com.co (plataforma **VTEX IO**)
- **Spec viva:** ver [PROYECTO.md](PROYECTO.md) (decisiones, estado, conteos).

> ⚠️ Este proyecto es **independiente** del `/Users/cristian/carros/CLAUDE.md`
> (plataforma de gamificación AYASA). No mezclar instrucciones de ese repo aquí.

---

## Pipeline de datos

```
scraper_lostreselefantes.py  →  download_images.py  →  optimize_images.py  →  merge_scraped.py  →  app Next.js
```

| Script | Qué hace | Entrada → Salida |
|---|---|---|
| `scraper_lostreselefantes.py` | Scrapea VTEX (stdlib) | API VTEX → `data/scraped/<slug>.json` + `data/categorias.json` |
| `download_images.py` | Baja imágenes remotas a local, reescribe JSON a rutas `/images/shop/`. Idempotente, fallback remoto si falla. | `data/**.json` → `public/images/shop/*` + JSON reescrito |
| `optimize_images.py` | Redimensiona ≤1280px, reconvierte a WebP q80, reescribe JSON | `public/images/shop/*` → WebP + JSON reescrito |
| `merge_scraped.py` | Une todos los `scraped/*.json` en uno solo (dedup por slug) | `data/scraped/*.json` → `data/productos.json` |

**Idempotencia:** `download_images.py` y `optimize_images.py` se pueden re-correr;
no rebajan ni re-descargan lo ya hecho. Tras tocar cualquier `scraped/*.json`,
re-correr `merge_scraped.py` para refrescar `productos.json`.

### ⚠️ Entorno Python (gotcha importante)

El Python de Homebrew (`/opt/homebrew/bin/python3`, **3.14.4**) está **roto**:
`pyexpat` no carga por un conflicto de símbolos con `libexpat` del sistema, lo que
**rompe pip** entero. **No usarlo.**

El pipeline corre en un **venv creado con el Python de Apple** (`/usr/bin/python3`,
3.9.6), con `requests` + `Pillow` instalados:

```bash
# Crear (una sola vez)
/usr/bin/python3 -m venv .venv
.venv/bin/python -m pip install requests Pillow

# Usar SIEMPRE el python del venv para el pipeline
.venv/bin/python download_images.py
.venv/bin/python optimize_images.py
.venv/bin/python merge_scraped.py
```

El scraper (`scraper_lostreselefantes.py`) usa **solo stdlib** → corre con cualquier
Python (`python3 scraper_lostreselefantes.py`).

---

## Esquema de datos

### `data/categorias.json`
```jsonc
{ "categorias": [ {
  "id": "escritura", "nombre": "Escritura", "slug": "escritura",
  "descripcion": "...", "imagen": "/images/shop/...",  // local tras download
  "popular": false,
  "subcategorias": [ { "nombre": "Esferos y Lápices", "slug": "esferos-y-lapices" } ]
} ] }
```
14 categorías principales de la rama "Piñatería y Papelería" (id VTEX 129).

### `data/scraped/<slug>.json` (uno por categoría)
```jsonc
{ "categoria": "...", "nombre": "...", "slug": "...", "descripcion": "...",
  "imagen": "...", "fuente": "...",
  "productos": [ {
    "id": "...", "nombre": "...", "slug": "...",
    "marca": "SCRIBE",            // específico de papelería (no hay camposExtra de regalos)
    "precio": 5900, "precioAnterior": null,
    "descripcion": "...",         // ~66% vienen vacías de VTEX
    "imagen": "/images/shop/...", "galeria": ["/images/shop/..."],
    "contenido": [],              // bullets; casi siempre vacío en papelería
    "tags": ["LOS TRES ELEFANTES"],
    "popular": false, "visible": true, "stock": 10
  } ] }
```

### `data/productos.json` (generado por merge)
`{ "productos": [...] }` — todos los productos únicos por slug, con `categoria`
añadida y `fuente` removida. Es lo que consume la app Next.js.

**Datos validados:** 3.430 productos, 14 categorías, 0 duplicados, 100% con imagen
y precio, 67 marcas. 7.424 URLs de imagen únicas.

---

## App Next.js (pendiente de scaffold — se clona de `sorpresas`)

Cuando se haga el scaffold, se clona de `sorpresas` y se re-brandea:

- **Stack:** Next 16, React 19, Tailwind 4, `sharp` (SSG estático).
- **`next.config.ts`:** topes de memoria para SSG de cientos de páginas
  (`cpus: 4`, `staticGenerationMaxConcurrency: 4`, `imgOptConcurrency: 2`,
  sin source maps). Imprescindible: sin esto el build satura RAM.
- **Imágenes self-host** en `/images/shop/` (WebP q80, ≤1280px) → 0 dependencia del CDN ajeno.
- **`@/`** = raíz del proyecto (ver `tsconfig.json` clonado).
- **Config de marca:** `data/config.json` (nombre, dominio, whatsapp, etc.) — fuente
  única consumida por `lib/site.ts`.
- **Rutas clave:** `/` (home), `/categorias`, `/categorias/[slug]`, `/producto/[slug]`,
  `sitemap.ts`, `robots.ts`, `llms.txt`.
- **SEO por producto:** `scripts/generate-seo.mjs` → `data/seo/<slug>.json` (cargado por `lib/seo.ts`).
- **Quitar de sorpresas:** todo lo de regalos (`camposExtra`, extras tipo whisky/vino,
  ocasiones de regalo) — no aplica a papelería.

Estado actual y siguientes pasos: ver [PROYECTO.md](PROYECTO.md).

---

## Convenciones

- JSON es la única fuente de verdad. La app no tiene base de datos ni backend.
- Archivos en **kebab-case**. Imports en la app con alias **`@/`** (nunca relativos largos).
- Colombia: precios en COP (`Intl.NumberFormat es-CO`), WhatsApp como CTA principal.
- No commitear `node_modules/`, `.venv/`, `.next/`, ni `.env.local` (API key del LLM).
- **Sí se commitean** `public/images/shop/` y `data/productos.json`: el sitio se despliega
  en Vercel vía Git (push-to-deploy), igual que el proyecto hermano `sorpresas`, así que
  las imágenes self-host y el JSON mergeado son parte del repo. Se regeneran con el
  pipeline si hace falta (ver `.gitignore`).

## Despliegue (Vercel + GitHub)

- Repo: `github.com/lordmacu/utiles-escolares-enbogota` (push-to-deploy).
- Cada push a `main` dispara un build en Vercel (`next build`, SSG de ~3.430 productos).
- Identidad git del repo: **lordmacu** (`10134930+lordmacu@users.noreply.github.com`).
- `.env.local` (LLM API key) NO se sube; el build de Vercel no la necesita (el SEO ya
  está pregenerado en `data/seo/`).
