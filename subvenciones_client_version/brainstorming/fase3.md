# Fase 3 — Generación y despliegue automático (Hugo + GitHub + Netlify)

## Objetivo
Publicar automáticamente 1 página temática diaria basada en `region + beneficiario + tag_seo`, con despliegue automático y SEO técnico correcto.

## Decisiones cerradas

- Stack: Hugo + GitHub + Netlify.
- Fuente de datos: tabla `Subvenciones` ya tageada (Fase 2).
- Volumen diario: 1 página/día (`DAILY_PAGES = 1`).
- Mínimo para crear página nueva: 3 subvenciones (`MIN_GRANTS_TO_CREATE_PAGE = 3`).
- Sitemap: incluir `home` + índices + páginas de subvenciones.

## Requisitos previos

- Cuenta GitHub y Netlify.
- Repositorio web base con Hugo.
- n8n con acceso a Notion.
- Fase 1 y Fase 2 operativas.
- En `Subvenciones`: `tag_seo`, `tags`, `status`, `needs_review` y tags estructurales (`region`, `beneficiario`) completos.

## Flujo diario (simplificado)

```
06:00  Fase 1 actualiza Query History
06:30  Fase 2 actualiza Subvenciones y tags
07:00  Fase 3 genera 1 página y hace push
07:02  Netlify build + deploy
07:05  Página y sitemap publicados
```

## Selección de la página del día

1. Consultar combinaciones candidatas desde `Subvenciones`:
   - `status = active`
   - `tag_seo` no vacío
   - `needs_review = false`
2. Agrupar por `region + beneficiario + tag_seo`.
3. Contar subvenciones por grupo.
4. Para creación de nuevas páginas, filtrar grupos con `count >= MIN_GRANTS_TO_CREATE_PAGE`.
5. Ordenar por prioridad (recencia y volumen).
6. Seleccionar 1 grupo (`DAILY_PAGES`).

Regla de desempate (determinista):
1. Mayor recencia (`max(receivedDate)` más reciente).
2. Si empata, mayor volumen (`count` más alto).
3. Si sigue empatado, orden alfabético por `region + beneficiario + tag_seo`.

## Control de páginas ya publicadas (create/update)

Clave: la URL/slug se calcula de forma determinista desde los tags.

```text
slug = "subvenciones-" + {region_slug} + "-" + {beneficiario_slug} + "-" + {tag_seo}
url  = "/" + slug + "/"
archivo = content/subvenciones/{slug}.md
```

Con este criterio, no necesitas adivinar si un tag "ya fue subido":

1. Si `archivo` no existe en el repo -> **CREATE**.
2. Si `archivo` existe -> **UPDATE** (regenerar contenido diario).

### Fuente de `existing_pages` (decisión cerrada 2026-06-23)

**GitHub API como fuente autoritativa.** El nodo GitHub en n8n lista `content/subvenciones/`, extrae los slugs (nombre de archivo sin `.md`) y alimenta el split. La tabla `PageRegistry` en Notion queda como recomendación opcional para **metadatos de trazabilidad** (`last_published_at`, `last_grant_count`, `last_content_hash`), pero **no** como fuente del split — GitHub nunca miente sobre qué está en el repo.

Trade-off evaluado:

| Fuente | Verdict |
|---|---|
| GitHub API | ✅ Autoritativo, rate limit aceptable (1 call/día), credenciales ya necesarias para el push |
| Notion `PageRegistry` | ⚠️ Útil solo para metadatos; usar como fuente del split introduce drift |
| Sitemap post-deploy | ❌ Chicken-and-egg: solo existe tras el primer deploy |

En el mock, `results/getters/get_existing_pages.json` simula la respuesta del nodo GitHub con el formato `{ existing_slugs: [...] }` pre-procesado.

### Enfoque de split (decisión cerrada 2026-06-23)

**Enfoque A — Híbrido:**

- `pages_to_create = desired_create_pages − existing_pages` (slugs del desired_create que NO están en el repo)
- `pages_to_update = existing_pages` (TODOS los slugs del repo, sin filtrar por desired_update)

Implicación: una página huérfana (en existing pero no en ningún desired) se sigue regenerando. Esto preserva URLs ya desplegadas y evita 404s — alineado con la frase del doc *"Las existentes se actualizan todos los días aunque bajen de 3 subvenciones"*.

Alternativas evaluadas y descartadas:

- **B — Desired-driven:** `pages_to_update = desired_update ∩ existing`. Descarta orphans; riesgo de 404 si la URL ya tiene SEO.
- **C — Conservador (B + delete):** añade `pages_to_delete` para orphans. Complejidad extra; requiere decisión de política de borrado.

## Sincronización diaria recomendada (lo que pediste)

Cada día, Fase 3 hace sincronización completa de páginas objetivo:

1. Construir dos listas desde `Subvenciones`:
  - `desired_create_pages`: grupos `region + beneficiario + tag_seo` con `count >= MIN_GRANTS_TO_CREATE_PAGE`.
  - `desired_update_pages`: grupos `region + beneficiario + tag_seo` sin aplicar mínimo de creación.
2. Cargar `existing_pages` del repo (slugs en `content/subvenciones/*.md`).
3. Calcular:
  - `pages_to_create = desired_create_pages - existing_pages`
  - `pages_to_update = existing_pages`
4. Generar Markdown para `pages_to_create` y `pages_to_update`.
5. Commit + push (Netlify despliega).

Resultado:

- Las no existentes se crean automáticamente.
- Las existentes se actualizan todos los días aunque bajen de 3 subvenciones.
- El mínimo de 3 se usa solo para crear páginas nuevas.

## Arquitectura — quién hace qué

Es **crítico** entender la separación de responsabilidades. El mock solo cubre la parte de n8n; el resto lo hacen sistemas externos.

| Actor | Responsabilidad | Input | Output |
|---|---|---|---|
| **n8n (mock 31-34)** | Generar archivos `.md` y orquestar el push | Datos de Notion + GitHub API | `content/subvenciones/{slug}.md` + commit |
| **GitHub** | Almacenar el repo (Hugo source) | Commits de n8n | Repo con `content/`, `layouts/`, `config.toml` |
| **Hugo** | Compilador: convierte `.md` → `.html` | `.md` + `layouts/*.html` + `config.toml` | `public/{slug}/index.html`, `public/sitemap.xml` |
| **Netlify** | Build + deploy | Push a GitHub (webhook) | Sitio público en CDN |

**Implicaciones:**

- El **Markdown NO es el sitemap**. Es la fuente del contenido que Hugo convierte a HTML.
- El **HTML NO lo creamos nosotros**. Lo genera Hugo desde el Markdown + los templates.
- El **sitemap.xml lo genera Hugo automáticamente** (no lo escribimos a mano).
- El **slug sí lo decidimos nosotros** (determinista desde los tags): se convierte en `content/subvenciones/{slug}.md` → `/subvenciones-{slug}/` en el sitio.

### Flujo end-to-end (orden correcto)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. n8n genera .md     →  archivo en disco local             │
│    (Pasos 1-2 del doc → nodos 31-34 del mock)               │
└────────────────────────┬────────────────────────────────────┘
                         │ git commit + push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub recibe los .md                                    │
└────────────────────────┬────────────────────────────────────┘
                         │ webhook a Netlify
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Netlify ejecuta `hugo` (build command)                   │
│    • Hugo lee todos los .md de content/                     │
│    • Hugo aplica layouts/*.html                             │
│    • Hugo genera public/{slug}/index.html                   │
│    • Hugo genera public/sitemap.xml (automático)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Netlify publica public/ en CDN                           │
└─────────────────────────────────────────────────────────────┘
```

### Qué cubre el mock vs qué NO

| Lo hace el mock (nodos 31-34) | Lo hace el sistema externo |
|---|---|
| Generar `.md` con front matter + body | Build de Hugo (Markdown → HTML) |
| Determinar qué slugs crear/actualizar | Push a GitHub (en el futuro, nodo 35+) |
| Validar datos antes del commit | Generar HTML desde Markdown |
| Componer el sitemap index (futuro) | Generar `sitemap.xml` (Hugo lo hace) |
| | Deploy vía Netlify (automático) |

## Implementación en n8n

### Paso 1: Obtener y filtrar datos

- Leer `Subvenciones` desde Notion.
- Aplicar filtros operativos (`active`, `tag_seo`, `needs_review = false`).
- Agrupar por `region + beneficiario + tag_seo`.
- Generar `desired_create_pages` con grupos que cumplan `count >= 3`.
- Generar `desired_update_pages` sin umbral mínimo (para actualizar existentes).

### Paso 1.1: Detectar create/update por slug

**Origen de datos:**

- `existing_pages` viene de **GitHub API** (operación `Get Repository Content` sobre `content/subvenciones/`). En el mock: `results/getters/get_existing_pages.json`.
- `desired_create_pages` y `desired_update_pages` vienen del **Paso 1** (nodo 32 en el mock: `32_filter_page_candidates.js`).

**Lógica (enfoque A — híbrido):**

```
existing_set = Set(existing_pages.existing_slugs)

pages_to_create = [
  group for group in desired_create_pages
  if group.slug not in existing_set
]

pages_to_update = existing_pages.existing_slugs  # todos los slugs del repo
```

**Output:** `page_actions.json` con `{ pages_to_create: [...], pages_to_update: [...] }`.

En el mock: nodo `functions_v2/33_split_page_actions.js`.

### Paso 2: Generar Markdown (nodo 34 del mock)

**Qué hace el mock:** por cada entry en `pages_to_create` y `pages_to_update`, genera un string con front matter + body mínimo (listado de códigos de subvención). **No escribe el archivo** — eso lo hará el nodo de push (Paso 5).

**Por qué string y no archivo:** desacopla generación de contenido del commit. Permite reusar el mismo output para preview, dry-run, o múltiples destinos (GitHub + backup local).

**Front matter generado:**

```yaml
---
title: Subvenciones para {tag_seo} en {region} para {beneficiario}
region: {region_slug}
beneficiario: {beneficiario_slug}
tag_seo: {tag_seo}
count: {total}
date: {YYYY-MM-DD}
slug: {slug}
---
```

**Body mínimo (decisión cerrada 2026-06-23):** listado de `grant_codes` en Markdown plano. Hugo lo renderiza con el layout por defecto; el contenido rico (tabla formateada, etc.) lo añade el template del sitio, no el mock.

```markdown
# Subvenciones para {tag_seo} en {region} para {beneficiario}

Subvenciones activas ({count}):

- {code_1}
- {code_2}
- {code_3}
```

**Output:** `results/builders/page_markdowns.json`:

```json
[
  { "action": "create", "slug": "...", "content": "---\n...\n---\n\n# ..." },
  { "action": "update", "slug": "...", "content": "---\n...\n---\n\n# ..." }
]
```

**En n8n real:** nodo Code con template literal; el array alimenta un nodo GitHub posterior.

### Paso 3: Actualizar índices

> **Estado:** pendiente de mock. En n8n real se regeneran páginas índice (`/subvenciones/`, `/region/`, `/tag/`); Hugo las construye desde `layouts/_default/list.html` o similar.

- Regenerar índice general de subvenciones.
- Regenerar índice por región y/o por temática (si aplica en el sitio).

### Paso 4: Generar sitemap

> **Estado:** responsabilidad de Hugo, no del mock. El mock no genera `sitemap.xml`.

- `/` (home)
- páginas índice (`/subvenciones/`, y las que apliquen)
- páginas temáticas (`/subvenciones-{region}-{beneficiario}-{tag}/`)

Opción recomendada:
- usar sitemap automático de Hugo y verificar que todos los tipos de páginas estén incluidos.

### Paso 5: Push y deploy

> **Estado:** pendiente de mock. En n8n real: nodo GitHub `Create or Update File` por cada item de `page_markdowns.json`, luego commit + push. Netlify hace el resto.

1. Commit de cambios en `content/` (y archivos de índices si cambian).
2. Push a `main`.
3. Netlify despliega automáticamente.

### Paso 6: Registrar publicación (opcional pero recomendado)

> **Estado:** pendiente. En n8n real: nodo Notion `Update Page` por cada slug desplegado, actualizando `last_published_at` y metadatos.

- Actualizar metadatos de publicación:
  - `last_published_at`
  - `last_grant_count`
  - `last_content_hash` (si lo usas)

## Configuración mínima de Hugo/Netlify

### Estructura

```
subvenciones-site/
├── config.toml
├── content/
│   └── subvenciones/
├── layouts/
├── static/
└── netlify.toml
```

### netlify.toml

```toml
[build]
  command = "hugo"
  publish = "public"

[build.environment]
  HUGO_VERSION = "0.111.0"
```

## Variables recomendadas (n8n)

- `DAILY_PAGES = 1`
- `MIN_GRANTS_TO_CREATE_PAGE = 3`
- `MAX_GRANTS_PER_PAGE` opcional para limitar longitud de página

## Checklist de salida

### Mock (responsabilidad n8n)

- [x] Se selecciona exactamente 1 combinación válida al día (nodo 31 → sort por prioridad).
- [x] Se filtran desired_create / desired_update por `count >= MIN_GRANTS_TO_CREATE_PAGE` (nodo 32).
- [x] Se detectan create/update comparando contra slugs existentes en GitHub (nodo 33).
- [x] Se genera el Markdown de cada página (nodo 34).
- [ ] Se hace commit + push a GitHub (nodo 35, **próximo**).
- [ ] (Opcional) Se actualiza `last_published_at` en Notion (nodo 36, pendiente).

### Sistema externo (responsabilidad Hugo + Netlify)

- [ ] Hugo renderiza HTML desde `.md` + `layouts/`.
- [ ] Hugo genera `sitemap.xml` automáticamente.
- [ ] Netlify hace build + deploy tras el push.

## Coste

- Netlify: €0
- GitHub: €0
- Dominio: ~€10/año
- Total: ~€10/año
