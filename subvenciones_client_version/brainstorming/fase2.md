# Fase 2 — Obtención y Tagging Automático de Subvenciones

## Objetivo
Obtener subvenciones usando las combinaciones prioritarias de Fase 1 (Query History) y etiquetarlas automáticamente con reglas deterministas, minimizando el uso de IA. En una primera pasada, el tagging se hace con TITULO (sin depender de descripcion), y la descripcion se enriquece después desde el detalle de la subvencion.

## Dependencias de Fase 1
- ✓ Tabla Query History con combinaciones prioritarias
- ✓ Catálogos sincronizados (Beneficiarios, Regiones, Finalidades)
- ✓ Priority Score calculado

## Flujo de Fase 2

### Paso 1: Leer combinaciones prioritarias de Query History
Cada día, n8n:
1. Lee Query History filtrando solo `status = active`
2. Ordena las activas por `priority_score` DESC
3. Selecciona las TOP 100 combos activas para procesar hoy
4. Para cada combo, ejecuta:
   ```
   GET /api/grants?beneficiario_id=X&región_id=Y&finalidad_id=Z
   ```

**Regla de eficiencia (filtro duro):**
- `low_volume` y `no_results` NO pasan a Fase 2.
- `pending` NO pasa a Fase 2 (se resuelve en Fase 1 al recalcular estado).
- El umbral de `active` es configurable en el nodo de Query History (`MIN_RESULTS_FOR_ACTIVE`, por defecto 10).

### Paso 2: Almacenar subvenciones en Notion
Crear/actualizar registros en la tabla `Subvenciones` con:
- `id` (ID único de la API)
- `titulo`
- `descripcion` (nullable al inicio)
- `beneficiario_id` (FK)
- `región_id` (FK)
- `finalidad_id` (FK)
- `status` = `active`
- `tags` = [] (se llena en Paso 3)
- `tag_seo` = null (se calcula en Paso 3)
- `needs_review` = false (se marca según necesidad en Paso 3)
- `last_tagged_at` = null (se actualiza en Paso 3)

Campos recomendados adicionales para trazabilidad:
- `has_descripcion` = false al crear (true cuando se enriquece)
- `tag_source` = `title_only` | `title_description` | `manual` | `ia`
- `tag_confidence` = 0-100 (opcional)

### Paso 2.1: Modelo recomendado para almacenar tags en Notion

Para escalar y filtrar bien, separar responsabilidades por campo:

- `tags` (Multi-select): conjunto final para filtros generales y export web.
- `tag_seo` (Select): tema principal unico por subvencion.
- `tags_requisitos` (Multi-select): tags solo de requisitos.
- `tag_source` (Select): de donde salio el tagging (`title_only`, `title_description`, `manual`, `ia`).
- `needs_review` (Checkbox): falta tag SEO principal.

Regla practica:
- Mantener `tag_seo` como single source of truth del tema principal.
- Mantener `tags` como union de estructurales + `tag_seo` + `tags_requisitos`.
- No duplicar logica de negocio en formulas de Notion; calcular en n8n y persistir valores finales.

### Paso 2.2: Enriquecimiento diferido de descripcion

Como la API inicial no trae descripcion, el flujo recomendado es de dos etapas:

1. Ingestion inicial: guardar subvencion con `titulo`, FKs y `descripcion = null`.
2. Tagging inicial: calcular `tag_seo` usando solo TITULO (`tag_source = title_only`).
3. Enriquecimiento: job posterior entra al detalle de la subvencion, extrae `descripcion` y actualiza `has_descripcion = true`.
4. Re-tag opcional: si entra nueva descripcion, volver a evaluar `tag_seo` con TITULO+DESCRIPCION (`tag_source = title_description`).

Esto evita bloquear Fase 2 por scraping/detalle y acelera publicacion.

### Paso 3: Tagging automático con reglas deterministas
Para cada subvención nueva o sin tagear:

#### Substep 3.1: Tags estructurales obligatorios
```
1. región → normalizar y asignar tag geográfico
   Ej: región_id=15 (Galicia) → tag: "galicia"

2. beneficiario_id → buscar nombre en tabla Beneficiarios y asignar tag
   Ej: beneficiario_id=3 (PYME) → tag: "pyme"

3. finalidad_id → buscar descripción en tabla Finalidades
   Ej: finalidad_id=4 (Cultura) → tag: "cultura"
```

#### Substep 3.2: Tags SEO concretos desde TITULO

Esta es la búsqueda principal para identificar el tema central de la subvención.
Regla: TITULO es obligatorio; DESCRIPCION solo se usa cuando ya fue enriquecida.

**Palabras clave por tema (buscar en TITULO primero, luego DESCRIPCION):**
```javascript
const tagsSeoPrincipales = {
  "musica": ["música", "orquesta", "concierto", "festival musical", "compositor"],
  "teatro": ["teatro", "dramático", "escénico", "representación", "actores"],
  "cine": ["cine", "rodaje", "producción audiovisual", "película"],
  "danza": ["danza", "ballet", "coreografía", "danzarín"],
  "patrimonio": ["patrimonio", "restauración", "museo", "histórico"],
  "formacion": ["formación", "cursos", "capacitación", "educación", "aprendizaje"],
  "economia_digital": ["digitalización", "transformación digital", "software", "TIC"],
  "agroalimentario": ["agro", "agricultura", "ganadería", "alimentos"],
  "turismo": ["turismo", "turístico", "experiencia turística", "hospedaje"],
  "gastronomia": ["gastronomía", "restauración", "hostelería", "cocina"],
  "salud": ["salud", "bienestar", "sanitario", "médico"],
  "energia": ["energía", "renovable", "sostenible", "eléctrico"],
  "economia_circular": ["economía circular", "reciclaje", "residuos"],
  "innovacion": ["innovación", "I+D", "investigación", "desarrollo"],
  "internacionalizacion": ["internacionalización", "exportación", "comercio exterior"],
  "comercio": ["comercio", "retail", "venta", "distribución"],
  "movilidad": ["movilidad", "transporte", "logística"]
};

// 1. Buscar en TITULO (máxima confianza)
for (let [tag, keywords] of Object.entries(tagsSeoPrincipales)) {
  if (keywords.some(kw => titulo.toLowerCase().includes(kw))) {
    tags.push(tag);
    tagSeoEncontrado = true;
    break; // Solo un tag SEO concreto principal
  }
}

// 2. Si no encontró en TITULO, buscar en DESCRIPCION
if (!tagSeoEncontrado) {
  for (let [tag, keywords] of Object.entries(tagsSeoPrincipales)) {
    if (keywords.some(kw => descripcion.toLowerCase().includes(kw))) {
      tags.push(tag);
      tagSeoEncontrado = true;
      break;
    }
  }
}

// 3. Si no encontró en TITULO (ni en DESCRIPCION cuando exista) → needs_review
if (!tagSeoEncontrado) {
  necesitaRevision = true;
  // No añadir ningún tag SEO concreto, será revisado manualmente
}

// 4. Marcar fuente del tagging
const tagSource = descripcion && descripcion.trim().length > 0
  ? "title_description"
  : "title_only";
```

#### Substep 3.3: Tags específicos desde REQUISITOS (fase separada)

Los requisitos contienen información diferente: capacidades, experiencias, certificaciones requeridas.
Se procesan **independientemente** del paso anterior.

**Palabras clave específicas de requisitos:**
```javascript
const tagsRequisitos = {
  "certificacion": ["certificado", "acreditación", "licencia", "titulación", "colegiado"],
  "experiencia": ["experiencia", "años de experiencia", "trayectoria", "historial"],
  "capacidad_tecnica": ["conocimientos técnicos", "programación", "software", "herramientas"],
  "capacidad_gestion": ["gestión", "dirección", "liderazgo", "coordinación"],
  "recursos": ["vehículos", "maquinaria", "equipos", "infraestructura", "instalaciones"],
  "personal": ["empleados", "equipo", "trabajadores", "personal contratado"],
  "sostenibilidad": ["sostenible", "medioambiental", "ISO", "certificación ambiental"],
  "innovacion_req": ["innovador", "nueva metodología", "tecnología cutting-edge"]
};

// Buscar en REQUISITOS
let tagsRequisitosEncontrados = [];
for (let [tag, keywords] of Object.entries(tagsRequisitos)) {
  if (keywords.some(kw => requisitos.toLowerCase().includes(kw))) {
    tagsRequisitosEncontrados.push(tag);
  }
}

// Si encontró tags de requisitos, añadirlos
if (tagsRequisitosEncontrados.length > 0) {
  tags = tags.concat(tagsRequisitosEncontrados);
  requisitosEncontrados = true;
} else {
  // Si no encontró nada específico en requisitos → marcar para revisión
  necesitaRevisionRequisitos = true;
}
```

#### Substep 3.4: Consolidar tags
```javascript
// tags ahora contiene:
// - tags estructurales: región, beneficiario, finalidad
// - tags SEO principales: (si se encontró en título/descripción)
// - tags de requisitos: (si se encontraron en requisitos)
// Ej: ["galicia", "pyme", "cultura", "musica", "certificacion", "experiencia"]

// Eliminar duplicados y ordenar
tags = [...new Set(tags)].sort();

// tag_seo es el más importante (del título/descripción)
// Los tags de requisitos son complementarios
```

#### Substep 3.5: Decisión sobre needs_review

Hay dos casos de revisión:

**Caso 1: No se encontró tag SEO principal (de título/descripción)**
```
- necesitaRevision = true
- Razón: No se puede determinar el tema central
- Acción: Revisor manual decide qué tema es + IA opcional
```

**Caso 2: No se encontraron tags específicos en requisitos**
```
- necesitaRevisionRequisitos = true
- Razón: Los requisitos son genéricos o sin palabras clave detectadas
- Acción: Revisor manual extrae info de requisitos o marca como "no especificado"
```

**Ambos flags se guardan en Notion:**
```
- needs_review = true/false (falta tag SEO del tema principal)
- needs_review_requisitos = true/false (falta info específica en requisitos)
```

Una subvención puede tener:
- ✓ Tag SEO correcto + requisitos identificados → NO necesita revisión
- ⚠️ Tag SEO correcto + requisitos SIN identificar → needs_review_requisitos = true
- ⚠️ Tag SEO SIN identificar + requisitos correctos → needs_review = true
- ❌ Ni tag SEO ni requisitos → ambos flags = true (revisión completa)

### Paso 4: Guardar tags y flags en Notion
Actualizar cada subvención con:
- `tags` = array final de tags (estructurales + SEO principales + requisitos)
- `tag_seo` = el tag SEO principal del tema (o null si no hay)
- `tags_requisitos` = array solo con tags de requisitos (puede ser vacío)
- `tag_source` = `title_only` | `title_description` | `manual` | `ia`
- `needs_review` = true/false (falta tag SEO del título/descripción)
- `needs_review_requisitos` = true/false (falta info específica en requisitos)
- `last_tagged_at` = hoy

### Paso 5: Procesamiento de needs_review y needs_review_requisitos

Hay dos procesos de revisión independientes:

#### Revisión A: Tag SEO del tema principal (needs_review = true)

**Opción A1: Revisión manual**
1. Filtrar en Notion: `needs_review = true`
2. Revisor humano lee título + descripción
3. Asigna tag_seo correcto manualmente
4. Desmarca needs_review
5. Guardar

**Opción A2: IA ligera como respaldo**
```
Prompt conciso:
"Título: '{titulo}' | Descripción: '{descripcion}'
¿Cuál es el tema principal?
Responde solo con una palabra:
musica | teatro | cine | danza | patrimonio | formacion | economia_digital | 
agroalimentario | turismo | gastronomia | salud | energia | economia_circular | 
innovacion | internacionalizacion | comercio | movilidad | general"
```
- Si IA responde → actualizar tag_seo y desmarcar needs_review
- Si responde "general" → dejar para revisión manual

#### Revisión B: Tags de requisitos (needs_review_requisitos = true)

**Opción B1: Revisión manual**
1. Filtrar en Notion: `needs_review_requisitos = true`
2. Revisor extrae manualmente de requisitos:
   - ¿Qué experiencia se requiere? → añadir tags
   - ¿Qué certificaciones? → añadir tags
   - ¿Qué recursos? → añadir tags
3. Desmarca needs_review_requisitos
4. Guardar

**Opción B2: IA ligera para requisitos**
```
Prompt:
"Requisitos: '{requisitos}'
¿Qué se requiere?
Extrae palabras clave de estas categorías:
- certificacion (certificados, licencias, acreditaciones)
- experiencia (años de experiencia, trayectoria)
- capacidad_tecnica (conocimientos técnicos, software)
- capacidad_gestion (dirección, coordinación)
- recursos (vehículos, equipos, maquinaria)
- personal (empleados, equipo)
- sostenibilidad (certificaciones ambientales)

Responde solo con los tags encontrados, separados por comas."
```
- Añadir tags encontrados al array tags
- Desmarcar needs_review_requisitos

## Catálogo de tags

### Tags estructurales (de campos base)
- **Región:** `galicia`, `pontevedra`, `lugo`, `a_coruna`, `ourense`, `espana`
- **Beneficiario:** `personas_fisicas`, `personas_juridicas`, `pyme`, `gran_empresa`, `sin_info`
- **Finalidad:** `investigacion`, `formacion`, `innovacion`, `cultura`, `turismo`, `agricultura`, etc.

### Tags SEO concretos (del catálogo cerrado)
```
musica
teatro
cine
danza
audiovisual
formacion
economia_circular
restauracion
patrimonio
artes_plasticas
gastronomia
diseno
videojuegos
salud
rural
agroalimentario
energia
turismo
movilidad
bienestar
internacionalizacion
comercio
economia_digital
ciberseguridad
creatividad
general (fallback)
```

## Ejemplo end-to-end

### Input: Subvención de la API
```json
{
  "id": "SUB001",
  "titulo": "Ayudas para producciones cinematográficas en Galicia",
  "descripcion": null,
  "has_descripcion": false,
  "requisitos": "Se requiere experiencia de 3 años en producción, certificado de audiovisual, equipo técnico propio",
  "beneficiario_id": 3,
  "región_id": 15,
  "finalidad_id": 4
}
```

### Proceso Fase 2

**1. Obtener de Query History**
```
Combo: 3_15_4 (PYME + Galicia + Cultura)
Status: active
Last checked: 2026-05-26
Count results: 12 subvenciones
```

**2. Tags estructurales obligatorios**
- beneficiario_id=3 → "PYME Y PERSONAS FÍSICAS ACTIVIDAD" → tag: "pyme"
- región_id=15 → "Galicia" → tag: "galicia"
- finalidad_id=4 → "Cultura" → tag: "cultura"

**3. Buscar tag SEO principal en TITULO**
```
Título: "Ayudas para producciones cinematográficas en Galicia"
Buscar en tagsSeoPrincipales:
- "cine" ← Match en "cinematográficas"
- Tag SEO encontrado: "cine"
- necesitaRevision = false
```

**4. Buscar tags específicos en REQUISITOS**
```
Requisitos: "Se requiere experiencia de 3 años en producción, 
            certificado de audiovisual, equipo técnico propio"

Buscar en tagsRequisitos:
- "experiencia" ← Match: "experiencia de 3 años" ✓
- "certificacion" ← Match: "certificado de audiovisual" ✓
- "recursos" ← Match: "equipo técnico propio" ✓

Tags de requisitos encontrados: ["experiencia", "certificacion", "recursos"]
necesitaRevisionRequisitos = false
```

**5. Consolidar todos los tags**
```
Tags finales: ["galicia", "pyme", "cultura", "cine", "certificacion", "experiencia", "recursos"]
(ordenados alfabéticamente, sin duplicados)
```

### Output: Subvención guardada en Notion
```json
{
  "id": "SUB001",
  "titulo": "Ayudas para producciones cinematográficas en Galicia",
  "beneficiario_id": 3,
  "región_id": 15,
  "finalidad_id": 4,
  "tags": ["certificacion", "cine", "cultura", "experiencia", "galicia", "pyme", "recursos"],
  "tag_seo": "cine",
  "needs_review": false,
  "needs_review_requisitos": false,
  "last_tagged_at": "2026-05-26",
  "status": "active"
}
```

---

## Otro ejemplo: Con revisión necesaria

### Input: Subvención genérica
```json
{
  "id": "SUB002",
  "titulo": "Subvenciones para emprendedores",
  "requisitos": "Persona física con DNI",
  "beneficiario_id": 1,
  "región_id": 15,
  "finalidad_id": 1
}
```

### Proceso

**1. Tags estructurales**
- tag: "personas_fisicas", "galicia", "investigacion"

**2. Buscar tag SEO en TITULO**
```
Título: "Subvenciones para emprendedores"
NO match en tagsSeoPrincipales
necesitaRevision = true ⚠️
```

**3. Buscar tags en DESCRIPCION**
```
Descripción: "Apoyo general a emprendimiento"
NO match en tagsSeoPrincipales
Sigue siendo: necesitaRevision = true ⚠️
```

**4. Buscar tags en REQUISITOS**
```
Requisitos: "Persona física con DNI"
NO match significativo en tagsRequisitos
necesitaRevisionRequisitos = true ⚠️
```

### Output: Necesita revisión completa
```json
{
  "id": "SUB002",
  "titulo": "Subvenciones para emprendedores",
  "beneficiario_id": 1,
  "región_id": 15,
  "finalidad_id": 1,
  "tags": ["galicia", "investigacion", "personas_fisicas"],
  "tag_seo": null,
  "needs_review": true,
  "needs_review_requisitos": true,
  "last_tagged_at": "2026-05-26",
  "status": "active"
}
```

Revisor manual debe:
- ✓ Asignar tag_seo correcto (desmarcar needs_review)
- ✓ Extraer información de requisitos (desmarcar needs_review_requisitos)

## Workflow n8n para Fase 2

```
[Inicio diario 8:00 AM - después de Fase 1]
    ↓
[Leer Query History] → Filtrar status = active
  ↓
[Ordenar activas por priority_score DESC]
    ↓
[Seleccionar TOP 100 combos activas]
    ↓
[Loop: Para cada combo]
│
├─→ [HTTP GET /api/grants?beneficiario_id=X&región_id=Y&finalidad_id=Z]
│    ↓
│   [JS: Procesar cada grant]
│    ├─ Extraer tags estructurales desde FKs
│    ├─ Buscar keywords en título → tag_seo
│    ├─ Si no hay tag_seo, buscar en descripción
│    ├─ Si no hay tag_seo, buscar en requisitos
│    ├─ Si sigue sin tag_seo → needs_review = true
│    │
│   [Notion Upsert: Subvenciones]
│    └─ Guardar con tags, tag_seo, needs_review, last_tagged_at
│
[End] → Listar subvenciones con needs_review
```

**Nota:** Las combinaciones `low_volume`, `no_results` y `pending` se gestionan en Fase 1 y no consumen recursos de tagging en Fase 2.

## Revisión manual de subvenciones

### Vista en Notion

**Filtro 1: Subvenciones sin tag SEO**
```
needs_review = true
```
Revisor asigna el tema principal y desmarca needs_review.

**Filtro 2: Subvenciones sin info de requisitos**
```
needs_review_requisitos = true
```
Revisor extrae detalles de requisitos (experiencia, certificaciones, recursos) y desmarca.

**Filtro 3: Ambos flags activos (revisión completa)**
```
needs_review = true AND needs_review_requisitos = true
```
Revisor completa tanto el tema principal como los detalles de requisitos.

## Métricas de Fase 2

- Subvenciones procesadas por día
- Porcentaje de registros con `tag_source = title_only`
- Porcentaje enriquecido con descripcion (`has_descripcion = true`)
- Porcentaje etiquetadas automáticamente sin needs_review
- Número de registros con needs_review pendiente
- Tiempo promedio de revisión manual
- Distribución de tags por región y tema

## Criterios de éxito de Fase 2

- ✓ Todas las subvenciones nuevas tienen `tags` completos
- ✓ 80%+ tienen `tag_seo` asignado automáticamente (needs_review = false)
- ✓ 70%+ tienen tags de requisitos (needs_review_requisitos = false)
- ✓ 20% o menos con needs_review = true (pendiente tema principal)
- ✓ 30% o menos con needs_review_requisitos = true (pendiente requisitos)
- ✓ Ninguna subvención procesada dos veces en el mismo día
- ✓ Tags consistentes (no hay variaciones de slug)
- ✓ Últimas 100 subvenciones revisadas manualmente → validadas correctas

## Resultado esperado al final de Fase 2

**Un Notion con:**
- 500-1000 subvenciones activas
- 100% tienen tags estructurales (región, beneficiario, finalidad)
- 80%+ tienen tag_seo asignado automáticamente
- 70%+ tienen tags de requisitos identificados
- 20% o menos con needs_review pendiente
- 30% o menos con needs_review_requisitos pendiente
- Sistema listo para Fase 3: generación de páginas web basadas en combinaciones `región + tag_seo`

## Optimizaciones posibles

### Si needs_review > 30%
- Revisar y expandir reglas de keywords para tags SEO principales
- Ajustar búsqueda en título → descripción
- Añadir nuevas palabras clave al catálogo

### Si needs_review_requisitos > 40%
- Revisar y expandir palabras clave de requisitos
- Añadir nuevas categorías si descubres patrones
- Considerar si los requisitos son naturalmente genéricos (esperado en algunas subvenciones)

### Si necesitas IA para acelerar revisiones
- Usar prompts ligeros en ambos flags (tema + requisitos)
- NO usar IA para todas las subvenciones (desperdicio de tokens)
- Guardar resultados de IA en Notion para no recalcular
- Usar como complemento a la búsqueda determinista, no como sustituto

### Si descubres nuevos patrones
- Documentar en mapas de keywords (tagsSeoPrincipales o tagsRequisitos)
- Testear con 10 subvenciones antes de añadir a reglas
- Si funciona, incorporar al flujo determinista
- Mantener catálogo cerrado pero actualizable

## Próximo paso
Una vez Fase 2 esté completa y validada, proceder a **Fase 3: Generación de Páginas Web** (crear URLs por combinación `región + tag_seo` con suficiente volumen).
