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

Recomendación adicional para trazabilidad:

- Guardar en Notion (tabla de páginas o en la propia `Subvenciones` agregada por grupo):
  - `slug`
  - `last_published_at`
  - `last_grant_count`
  - `last_content_hash` (opcional)

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

## Implementación en n8n

### Paso 1: Obtener y filtrar datos

- Leer `Subvenciones` desde Notion.
- Aplicar filtros operativos (`active`, `tag_seo`, `needs_review = false`).
- Agrupar por `region + beneficiario + tag_seo`.
- Generar `desired_create_pages` con grupos que cumplan `count >= 3`.
- Generar `desired_update_pages` sin umbral mínimo (para actualizar existentes).

### Paso 1.1: Detectar create/update por slug

- Listar archivos existentes en `content/subvenciones/`.
- Convertir nombre de archivo a `slug`.
- Comparar contra `desired_create_pages` y `existing_pages` para obtener:
  - `pages_to_create`
  - `pages_to_update` (todas las existentes)

### Paso 2: Generar Markdown

Crear o actualizar archivo en `content/subvenciones/{slug}.md` con front matter:

```yaml
---
title: Subvenciones para {tag} en {region} para {beneficiario}
region: {region_slug}
beneficiario: {beneficiario_slug}
tag_seo: {tag}
count: {total}
date: {YYYY-MM-DD}
slug: subvenciones-{region_slug}-{beneficiario_slug}-{tag}
---
```

### Paso 3: Actualizar índices

- Regenerar índice general de subvenciones.
- Regenerar índice por región y/o por temática (si aplica en el sitio).

### Paso 4: Generar sitemap

El sitemap debe incluir:

- `/` (home)
- páginas índice (`/subvenciones/`, y las que apliquen)
- páginas temáticas (`/subvenciones-{region}-{beneficiario}-{tag}/`)

Opción recomendada:
- usar sitemap automático de Hugo y verificar que todos los tipos de páginas estén incluidos.

### Paso 5: Push y deploy

1. Commit de cambios en `content/` (y archivos de índices si cambian).
2. Push a `main`.
3. Netlify despliega automáticamente.

### Paso 6: Registrar publicación (opcional pero recomendado)

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

- [ ] Se selecciona exactamente 1 combinación válida al día.
- [ ] Las páginas nuevas se crean solo si tienen al menos 3 subvenciones.
- [ ] Las páginas existentes se actualizan diariamente aunque tengan menos de 3.
- [ ] Se genera el Markdown de la página.
- [ ] Se actualizan índices.
- [ ] Se actualiza sitemap.
- [ ] Se hace push y Netlify despliega sin errores.

## Coste

- Netlify: €0
- GitHub: €0
- Dominio: ~€10/año
- Total: ~€10/año
