# Útiles Escolares — clon SEO de Los Tres Elefantes

Sitio nicho alimentado por JSON, clonando el catálogo de papelería/útiles escolares
de Los Tres Elefantes para posicionar en buscadores. Misma arquitectura y
optimizaciones que el proyecto **sorpresas** (`/Users/cristian/carros/sorpresas`).

- **Dominio objetivo:** `utilesescolares.enbogota.app`
- **Fuente:** https://www.lostreselefantes.com.co/pinateria-y-papeleria/utiles-escolares
- **Plataforma fuente:** VTEX IO (headers `x-vtex-*`) → API pública de catálogo en JSON.

---

## Qué queremos hacer

Replicar el modelo de **sorpresas**: una web Next.js estática (SSG) que se alimenta
de archivos JSON scrapeados, con imágenes self-host optimizadas, pensada para
posicionarse en unos meses. Reutilizamos **toda** la lógica y optimizaciones ya
hechas en sorpresas; lo único que cambia de raíz es el scraper (Shopify → VTEX).

### Pipeline heredado de sorpresas (no se reinventa)

```
scraper → download_images.py → optimize_images.py → merge_scraped.py → app Next.js
```

| Paso | Qué hace | Estado aquí |
|---|---|---|
| `scraper_lostreselefantes.py` | Scrapea VTEX → `data/scraped/<slug>.json` + `data/categorias.json` | ✅ Hecho |
| `download_images.py` | Baja imágenes remotas a `public/images/shop/`, reescribe JSON a rutas locales (idempotente, con fallback remoto) | ⬜ Pendiente (se copia de sorpresas tal cual) |
| `optimize_images.py` | Redimensiona a ≤1280px y reconvierte a WebP q80, reescribe JSON | ⬜ Pendiente (se copia tal cual) |
| `merge_scraped.py` | Une todos los `scraped/*.json` en `data/productos.json` (dedup por slug) | ⬜ Pendiente (se copia tal cual) |
| App Next.js (app/, components/, lib/, scripts SEO/IG) | Render estático, SEO, OG, sitemap, etc. | ⬜ Pendiente (scaffold posterior) |

### Optimizaciones clave que ya trae sorpresas y heredamos
- **Imágenes self-host** en `/images/shop/` (WebP q80, ≤1280px) → 0 dependencia del CDN ajeno.
- **`next.config.ts`** con topes de memoria para SSG de cientos de páginas
  (`cpus: 4`, `staticGenerationMaxConcurrency: 4`, `imgOptConcurrency: 2`, sin source maps).
- Generación SEO por producto (`scripts/generate-seo.mjs`), brand cards 4:5, OG images, sitemap, llms.txt, etc.

---

## Decisiones tomadas

- **Alcance:** scrapeamos **toda la rama "Piñatería y Papelería"** (id 129), las 14
  subcategorías directas (no solo "Útiles Escolares"). → ~3.430 productos.
- **Base del proyecto:** por ahora **solo el scraper**, para validar la data. El
  scaffold del Next (clonar sorpresas y adaptar) queda para después.
- **Sin `camposExtra`:** los campos de sorpresas-regalo (motivo del regalo, foto,
  extras tipo whisky/vino) no aplican a papelería → se omiten. Se añadió `marca`.

---

## Cómo se scrapea (VTEX) — referencia técnica

VTEX expone el catálogo en JSON, sin navegador ni anti-bot (equivalente al
`products.json` de Shopify, pero más limpio):

- **Árbol de categorías:** `GET /api/catalog_system/pub/category/tree/100`
  → de ahí se sacan los 14 hijos de la categoría raíz 129.
- **Productos por categoría:** `GET /api/catalog_system/pub/products/search/<ruta>?_from=N&_to=N+49`
  - Máx **50 productos por página**; se pagina por offset.
  - El total viene en el header `resources: 0-49/597`.
  - Tope de offset de VTEX: 2.500 (ninguna categoría se acerca).

### Mapeo de campos VTEX → esquema de la app

| Campo app | Origen VTEX |
|---|---|
| `slug` / `id` | `linkText` |
| `nombre` | `productName` |
| `marca` | `brand` |
| `precio` | `items[0].sellers[0].commertialOffer.Price` (ya en pesos) |
| `precioAnterior` | `commertialOffer.ListPrice` (si > Price) |
| `stock` | `10 if IsAvailable else 0` |
| `imagen` / `galeria` | `items[].images[].imageUrl` (CDN `*.vteximg.com.br`) |
| `descripcion` | `description` (HTML → texto); fallback a `metaTagDescription` |
| `contenido` | bullets `<li>` de la descripción; si no hay, **ficha técnica** desde specs útiles (`Material`, `Composición`, `Color`, `Incluye`, `Indicaciones de Uso`, `Género`…) |
| `tags` | `brand` + `productClusters` |
| `categoria` | slug de la subcategoría |

### Gotchas resueltos
- VTEX devuelve **500/502/504 transitorios** a mitad de paginación (le pasó a
  `desechables`) → se reintenta con backoff. Sin esto se perdían páginas.
- Sin dependencias externas: el scraper usa **solo stdlib** (`urllib` + `html.parser`),
  porque `requests`/`bs4` no están instalados globalmente.

---

## Lo que ya hicimos ✅

1. Identificada la plataforma (VTEX IO) y los endpoints públicos de catálogo.
2. Mapeada la rama "Piñatería y Papelería" (14 subcategorías, conteos por categoría).
3. Escrito `scraper_lostreselefantes.py` (stdlib) que produce el **mismo formato**
   que el scraper de sorpresas.
4. Ejecutado el scrape completo → **3.430 productos** en 14 archivos.

### Resultado del scrape (validación)

- **3.430 productos**, 14 categorías. 0 duplicados entre categorías → 3.430 únicos.
- **100% con imagen y con precio.** Rango $200 – $439.900 COP.
- **67 marcas** distintas (SCRIBE, BAZIC, SEMPERTEX, LOS TRES ELEFANTES, …).
- 19 productos con oferta (`precioAnterior`).

| Productos | Categoría |
|---|---|
| 673 | decoracion-de-fiesta |
| 597 | utiles-escolares |
| 550 | desechables |
| 366 | fiestas-tematicas |
| 268 | morrales-y-loncheras |
| 214 | escritura |
| 175 | confiteria |
| 105 | papeles-y-blocks |
| 103 | accesorios-de-escritorio-y-oficina |
| 102 | pintar |
| 74 | entretenimiento |
| 71 | archivos-y-clasificacion |
| 67 | accesorios-de-fiesta |
| 65 | empaques-de-regalos |

### Calidad de texto (medida sobre los 3.430)
Se midió la cobertura de campos alternativos y se ajustó el scraper:
- **`descripcion`: 34% → 68%** tras el fallback `description` → `metaTagDescription`.
- **`contenido` (ficha técnica): 0% → 39%** construyendo bullets desde las specs
  útiles (se excluyen las basura: `EtiquetaProducto` —tiquetes de bodega—,
  `Beneficios`, `Producto`, `PUM`).
- El **~32% restante sin texto** lo rellenará la capa SEO/IA (`generate-seo.mjs`),
  igual que en sorpresas. No es bloqueante.

---

## Lo que falta ⬜ (siguientes pasos)

1. Copiar de sorpresas: `download_images.py`, `optimize_images.py`, `merge_scraped.py`
   y ejecutarlos → imágenes self-host + `data/productos.json`.
2. Scaffold del Next.js: clonar la app de sorpresas, re-brandear (nombre, dominio,
   WhatsApp, colores), quitar lo de regalos (camposExtra, extras) y ajustar copy.
3. SEO: regenerar `data/seo/*`, sitemap, OG, brand cards para las marcas de papelería.
4. Deploy a Vercel bajo `utilesescolares.enbogota.app`.

---

## Archivos de este proyecto (por ahora)

```
utiles-escolares/
├── PROYECTO.md                      # este documento
├── scraper_lostreselefantes.py      # scraper VTEX (stdlib)
└── data/
    ├── categorias.json              # índice de 14 categorías (con subcategorías)
    └── scraped/*.json               # 14 archivos, un producto-set por categoría
```
