# Fase 3 — Generación y Despliegue Automático

## 1. Objetivo General
Publicar automáticamente 1 página temática diaria orientada a SEO, basada en la combinación de `region + beneficiario + tag_seo`. El proceso abarca desde la lectura de datos hasta el despliegue automático en CDN, garantizando URLs deterministas y sin errores 404.

## 2. Decisiones de Arquitectura y Stack
- **Fuente de la Verdad (Datos):** Tabla `Subvenciones` en Notion (previamente tageada en Fase 2).
- **Fuente de la Verdad (Archivos):** Repositorio en GitHub (API). No se usa Notion para validar qué páginas existen.
- **Motor Estático:** Hugo (transforma Markdown a HTML y genera el sitemap.xml).
- **Despliegue y Hosting:** Netlify (Webhook automático desde GitHub).
- **Coste Estructural:** ~10€/año (únicamente el dominio).

## 3. Reglas de Negocio Estrictas
- **Volumen de creación:** Se crea un máximo de **1** página nueva al día (`DAILY_PAGES = 1`).
- **Umbral de creación:** Para que una combinación sea candidata a página nueva, debe contener un mínimo de **3** subvenciones activas (`MIN_GRANTS_TO_CREATE_PAGE = 3`).
- **Regla de Actualización (Híbrida):** Todas las páginas que *ya existen* en el repositorio de GitHub se actualizan a diario, independientemente de si bajan del umbral de 3 subvenciones. Esto protege el SEO y evita errores 404.

### 3.1 Criterio de Desempate (Determinista)
Si hay múltiples combinaciones candidatas para crear la página diaria, se elige la ganadora siguiendo este orden estricto:
1. Mayor recencia: La que contenga la subvención más nueva (`max(receivedDate)`).
2. Mayor volumen: La que tenga el `count` total más alto.
3. Orden alfabético: Por la cadena `region + beneficiario + tag_seo`.

## 4. Estructura de URLs y Archivos
La URL de cada página se calcula de forma inmutable para facilitar su trazabilidad sin necesidad de consultar bases de datos intermedias.

* **Slug:** `subvenciones-{region_slug}-{beneficiario_slug}-{tag_seo}`
* **Ruta en GitHub:** `content/grants/{slug}.md`
* **URL Pública:** `/{slug}/`

## 5. El Flujo de Sincronización (Paso a Paso en n8n)

**Paso 1: Extracción y Filtrado (Notion)**
Se consultan las subvenciones con `status = active`, `tag_seo` asignado y `needs_review = false`. Se agrupan y se cuentan. De aquí salen dos listas:
- `desired_create_pages`: Candidatas nuevas (count >= 3). Se somete al desempate para elegir solo 1.
- `desired_update_pages`: Candidatas para refrescar datos.

**Paso 2: Lectura de Estado (GitHub)**
Se consulta la API de GitHub para listar el directorio `content/grants/`, obteniendo los *slugs* existentes y sus *SHAs* técnicos.

**Paso 3: El Cruce (Split Create/Update)**
Se comparan las listas de Notion contra GitHub:
- Si el slug NO está en GitHub -> Acción **CREATE**.
- Si el slug SÍ está en GitHub -> Acción **UPDATE** (requiere adjuntar el SHA).

**Paso 4: Generación de Contenido**
n8n construye un string de texto para cada página con el *Front Matter* (YAML) necesario para las variables de Hugo y el *Body* en Markdown (el listado de códigos de subvención).

**Paso 5: Push a Repositorio**
n8n ejecuta la llamada a la API de GitHub para crear o actualizar los archivos `.md`.

## 6. Flujo de Ejecución Externa (Tras el Push de n8n)
La responsabilidad de n8n termina tras el commit. El resto del ecosistema actúa en cadena:
1. GitHub recibe el nuevo `.md` y lanza un webhook a Netlify.
2. Netlify ejecuta el comando de compilación de Hugo (`hugo`).
3. Hugo lee el nuevo archivo, le aplica las plantillas (`layouts/*.html`), genera el `index.html` estático y actualiza el `sitemap.xml` global de forma automática.
4. Netlify publica los binarios en su CDN mundial.