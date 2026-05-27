# Plan de acción — automatización de tags y generación de webs

## Objetivo
Hacer viable la generación automática de webs temáticas sin crear una cantidad excesiva de URLs y sin consumir tokens innecesarios.

## Resumen
Usaremos Notion como base de datos central, y n8n como motor de etiquetado automático y generador de páginas.

### Principios clave
- Notion es la single source of truth.
- n8n enriquece y escribe de vuelta en Notion.
- Las páginas se generan solo para combinaciones relevantes con suficiente volumen.
- El tag SEO concreto se extrae con reglas deterministas y solo usa IA como respaldo.

## Variables a analizar
### 1. Tags estructurales
- `región`
- `sector`
- `finalidad`
- `tipo de beneficiario`
- `agencia`

### 2. Tag SEO concreto
- Extraído de `título`, `descripción` y `requisitos`.
- Usado para temas como `musica`, `teatro`, `cine`, `turismo`, `digitalizacion`, etc.

### 3. Volumen y relevancia
- Cuántas subvenciones activas hay por `región`.
- Cuántas subvenciones activas hay por `tag_seo`.
- Cuántas subvenciones activas hay por combinación `región + tag_seo`.
- Cuántas subvenciones caen en `needs_review` (ambigüedad).

## Cuántas variables analizar diariamente
### Recomendado
- Analizar 2 dimensiones principales destinadas a páginas: `región` + `tag_seo`.
- Mantener el resto de dimensiones como etiquetas internas para filtros y contenido, no para generar páginas separadas.
- Esto evita que el número de webs explote con combinaciones de `beneficiario`, `agencia`, `sector`, etc.

### Ejemplo de foco diario
- Región: Galicia, Pontevedra, Lugo, A Coruña, Ourense, España.
- Tag SEO: música, teatro, cine, formación, agroalimentario, turismo, digitalización, patrimonio.
- Analizar combinaciones de `región + tag_seo` de mayor volumen.

## Cuántas webs generar
### Estrategia inicial
1. Página principal por tema regional relevante: `subvenciones-<tag_seo>-<region>`.
2. No generar página para cada beneficiario o agencia.
3. Si hace falta, esos filtros quedan dentro de la página como opciones adicionales.

### Umbral de generación
- Solo generar una nueva web cuando exista un mínimo de 4-5 subvenciones activas para esa combinación.
- Para combinaciones con 1-3 subvenciones, guardar el contenido en páginas generales o en listados combinados más amplios.

### Cantidad razonable
- Arrancar con 10-20 páginas activas en la primera fase.
- Expandir solo si aparece volumen suficiente.
- Si trabajas solo Galicia/espacio local, es muy probable que 10-15 páginas sean suficientes.

## Estructura de Notion (esquema detallado)

**Ver: `notion_schema.md`**

Necesitas 5 tablas principales:
1. **Beneficiarios** - Sincronizada desde `GET /api/benefactors`
2. **Regiones** - Sincronizada desde `GET /api/regions`
3. **Finalidades** - Sincronizada desde `GET /api/purposes`
4. **Query History** - Registro de qué combinaciones consultaste (con fecha y volumen)
5. **Subvenciones** - Las subvenciones con FK a beneficiario, región y finalidad

### Punto crítico: Query History
Esta tabla es el corazón del sistema. Almacena:
- Cada combo (`beneficiario_id + región_id + finalidad_id`)
- Cuándo se consultó por última vez
- Cuántos resultados tuvo
- Estado (`active`, `low_volume`, `no_results`)

Con esto, n8n puede:
- Saber qué nunca consultó (prioridad máxima)
- Saber qué consultó hace más tiempo (repescar antiguas)
- Evitar consultar lo mismo cada día (eficiencia de API)

---

## Cómo hacerlo: Workflow recomendado en n8n

**Ver: `n8n_workflow_combos.js` para código concreto**

### 1. Sincronizar catálogos (una vez o semanalmente)
- Ejecuta `GET /api/benefactors`, `GET /api/regions`, `GET /api/purposes`
- Upsert cada respuesta en sus tablas correspondientes en Notion
- Esto asegura que si surgen nuevos beneficiarios, se capturan automáticamente

### 2. Leer catálogos activos de Notion
- Query `Beneficiarios where active=true`
- Query `Regiones where active=true`
- Query `Finalidades where active=true`
- Guardar estos listados en variables de n8n

### 3. Generar todas las combinaciones posibles
- Usa un nodo JavaScript de n8n:
  ```javascript
  // 5 beneficiarios × 6 regiones × 10 finalidades = 300 combos
  // Manejable y determinista
  for (let b of beneficiarios) {
    for (let r of regiones) {
      for (let f of finalidades) {
        combinaciones.push({
          id: `${b.id}_${r.id}_${f.id}`,
          beneficiario_id: b.id,
          region_id: r.id,
          finalidad_id: f.id
        });
      }
    }
  }
  ```

### 4. Seleccionar combos prioritarias (no todo de una vez)
- Leer la tabla `Query History` desde Notion
- Ordenar por `priority_score` (DESC)
  - Combos sin fecha de consulta: score = 9999 (máxima prioridad)
  - Combos con fecha antigua: score = días desde última consulta
  - Combos sin registro: nunca consultadas, también prioritarias
- Seleccionar solo 15-20 combos para hoy (no explotar API)

### 5. Consultar cada combo a la API
- Para cada combo prioritaria:
  ```
  GET /api/grants?beneficiario_id=X&region_id=Y&finalidad_id=Z
  ```
- Contar resultados y guardar en `Query History`:
  - `last_checked_at` = hoy
  - `count_results` = cantidad encontrada
  - `status` = "active" (≥5) | "low_volume" (1-4) | "no_results" (0)

### 6. Enriquecer y etiquetar subvenciones
- Guardar nuevas subvenciones en Notion con `beneficiario_id`, `region_id`, `finalidad_id`
- Generar automáticamente tags estructurales
- Extraer el tag SEO concreto con reglas deterministas
- Guardar el array `tags` en Notion
- Marcar `needs_review` si:
  - No se puede asignar ningún tag SEO concreto
  - O si el resultado es ambiguo

### 3. Cálculo de combinaciones útiles
- Calcular recuentos por `región + tag_seo`.
- Calcular recuentos de `needs_review`.
- Ordenar las combinaciones por volumen.

### 4. Selección de páginas a generar
- Generar/actualizar páginas para las combos de mayor volumen.
- Mantener solo las combos con al menos 4-5 subvenciones.
- Para combos con volumen bajo, agrupar en páginas más generales:
  - `subvenciones-cultura-galicia`
  - `subvenciones-formacion-espana`

### 5. Actualización de páginas
- Regenerar las páginas seleccionadas cuando cambie el contenido activo.
- Si estás en un site estático, recomponer solo las páginas afectadas.

## Frecuencia de ejecución
### Diario
- Ejecutar la revisión de subvenciones activas.
- Recalcular tags y combos.
- Actualizar los registros de Notion.
- Marcar los registros que necesitan revisión manual.

### Semanal / quincenal
- Revisar combinaciones nuevas de `región + tag_seo`.
- Decidir si generar nuevas páginas para combos emergentes.
- Limpiar combos con poco tráfico o poco volumen.

### Mensual
- Evaluar el portfolio de páginas activas.
- Ajustar los umbrales de cantidad mínima para generar páginas.
- Analizar si conviene extender a nuevas regiones o temas SEO.

## Cómo cubrir todas las casuísticas sin explotar el número de webs
### Regla 1: solo `región + tag_seo` como dimensión de página
- No generar páginas separadas para `beneficiario`, `agencia` o `sector` adicionales.
- Estos campos se usan en filtros internos y contenido enriquecido.

### Regla 2: usar páginas generales cuando hay poco volumen
- Si `tag_seo` es muy nicho en una región, agruparlo en una página de tema más amplio.
- Ejemplo: `subvenciones-cultura-galicia` en lugar de `subvenciones-opera-galicia` si hay muy pocas.

### Regla 3: priorizar volumen sobre exhaustividad
- Si hay 20 combos posibles, enfócate en las 8-12 que concentran el 80% del contenido.
- El resto puede esperar hasta que tengan más subvenciones.

### Regla 4: mantener un catálogo cerrado
- Solo genera tags SEO de una lista controlada.
- Evita que aparezcan tags demasiado específicos y dispersos.

## Cómo ahorrar tokens
### Sin IA para la mayoría
- Implementa el mapeo de keywords en n8n.
- Usa las palabras clave de `título`, `descripción`, `requisitos`.
- Evita llamar a IA salvo cuando no hay règle clara.

### IA solo como último recurso
- En los casos no resueltos por reglas, enviar a un bloque de revisión manual o un prompt ligero.
- Si se usa IA, guardar el resultado en Notion y no volver a recalcularlo salvo cambio significativo.

## Ejemplo de cadence diaria
1. Ejecutar workflow de actualización de tags.
2. Obtener counts de `region + tag_seo`.
3. Actualizar páginas existentes de combos con cambio en la data.
4. Generar lista de combos candidatos nuevos.
5. Revisar manualmente solo los registros marcados `needs_review`.

## Recomendación de métricas de control
- Número de páginas activas generadas.
- Número de subvenciones con tags completos.
- Número de combos `región + tag_seo` con volumen suficiente.
- Número de subvenciones en `needs_review`.
- Tiempo promedio de revisión manual.

## Paso a paso detallado
### Paso 0: Preparación inicial
1. Revisa la base de datos de Notion y asegura que existe una vista de subvenciones activas.
2. Añade o confirma las propiedades necesarias en Notion:
   - `tags` (multi-select o array)
   - `tag_seo` (text o select)
   - `needs_review` (checkbox)
   - `last_tagged_at` (fecha)
   - `last_checked_combo_at` (fecha) — opcional, si registras la última comprobación por combinación de consulta
3. Crea una tabla de historial de combinaciones consultadas con al menos estas columnas:
   - combinación (`beneficiario + región + finalidad`)
   - `last_checked_at`
   - `count_results`
   - `status` (`active`, `low_volume`, `needs_review`)
4. Genera y guarda los listados de valores posibles:
   - todas las `regiones` disponibles
   - todos los `beneficiarios` / `tipo de beneficiario`
   - todas las `finalidades` / `sector`
   - todas las `agencias`
4. Define el catálogo cerrado de `tag_seo` a usar.

### Paso 1: Extraer los listados base
1. Obtén los listados oficiales desde las APIs de InfoSubvenciones:
   - Beneficiarios: `https://www.infosubvenciones.es/bdnstrans/api/beneficiarios?vpd=GE`
   - Regiones: `https://www.infosubvenciones.es/bdnstrans/api/regiones`
   - Finalidades: `https://www.infosubvenciones.es/bdnstrans/api/finalidades?vpd=GE`
2. Usa los `id` de cada listados para componer las búsquedas de convocatorias.
3. Llama a `https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda` con combinaciones de esos 3 parámetros.
4. Extrae de cada convocatoria:
   - los datos de la subvención,
   - las fechas de publicación, inicio y fin,
   - los campos que ya tengas en Notion.
5. Valida que no existan valores duplicados o variantes no normalizadas.
6. Normaliza las regiones a un conjunto controlado (por ejemplo: `galicia`, `pontevedra`, `lugo`, `a_coruna`, `ourense`, `espana`).

### Paso 2: Diseñar la lógica de tagging en n8n
1. Crea un workflow que lea los registros activos de Notion.
2. Para cada registro:
   - normaliza la región y otros campos principales.
   - asocia tags estructurales según `sector`, `finalidad`, `tipo de beneficiario`, `agencia`.
   - extrae el tag SEO concreto desde `título`, `descripción`, `requisitos` usando mapas de keyword.
3. Calcula el array final `tags` y guarda en Notion.
4. Asigna `tag_seo` internamente para uso de páginas, pero deja `tags` como campo definitivo.
5. Si la regla no resuelve el tag SEO o se detecta ambigüedad, activa `needs_review`.

### Paso 3: Validar las casuísticas diarias sin explotar las webs
1. Cada día, ejecuta la revisión sobre las subvenciones activas.
2. Calcula cuantos registros activos hay por combinación `región + tag_seo`.
3. Registra cada combinación consultada en la tabla de historial con:
   - `beneficiario` id
   - `región` id
   - `finalidad` id
   - fecha de consulta (`last_checked_at`)
   - número de resultados
   - estado de la combinación (`active`, `low_volume`, `no_results`)
4. Prioriza para la próxima ejecución las combinaciones que:
   - no tienen fecha de consulta,
   - tienen la fecha de consulta más antigua,
   - o tienen estado `low_volume` pero podrían haber cambiado.
5. Prioriza siempre las combinaciones de mayor volumen y más antiguas frente a combinaciones nuevas.
6. Prioriza las combos con mayor probabilidad de generar una página: primero las de `región + tag_seo`, no las de `beneficiario` o `agencia` salvo que sean necesarias.
7. Lista los combos nuevos que podrían merecer página.
8. Mantén combos de bajo volumen dentro de páginas generales.

### Paso 4: Generar las webs útiles
1. Decide qué páginas crear/actualizar según el volumen:
   - `subvenciones-<tag_seo>-<region>` para combos con >= 4-5 subvenciones.
2. No hagas páginas separadas por `beneficiario`, `agencia` o `sector` en esta fase.
3. Dentro de cada página, usa los demás tags como filtros internos.
4. Si hay combos muy nicho, agrúpalos en una página más general de `cultura`, `empleo`, `turismo`, etc.

### Paso 5: Automatizar la periodicidad
1. Programa el workflow diario en n8n:
   - actualización de tags,
   - recálculo de combinaciones,
   - escritura en Notion.
2. Programa un flujo semanal para:
   - revisar combos nuevos,
   - decidir páginas a generar o agrupar.
3. Programa un check mensual para:
   - evaluar el portfolio de páginas activas,
   - ajustar umbrales,
   - refinar el catálogo SEO.

### Paso 6: Control de tokens y coste
1. Usa reglas deterministas para la mayor parte del etiquetado.
2. Reserva IA solo para los registros marcados `needs_review`.
3. Guarda los resultados de IA en Notion y evita re-calcularlos repetidamente.
4. Si un registro ya tiene `tags` correctos, no procesarlo de nuevo salvo que cambie.

### Paso 7: Revisión manual y refinamiento
1. Cada día, revisa solo los registros con `needs_review`.
2. Ajusta el mapa de keywords cuando detectes nuevos patrones.
3. Si surgen tags nuevos válidos repetidamente, añádelos al catálogo cerrado.
4. Limpia valores no normalizados en Notion.

## Sugerencia de ejecución inmediata
1. Genera el listado de valores en Notion.
2. Crea el workflow de tagging en n8n y pruébalo con un subset.
3. Ejecuta una primera tanda de actualizaciones de tags.
4. Calcula los combos `región + tag_seo` y decide las primeras 10-15 páginas.
5. Configura la ejecución diaria y la revisión semanal.

## Ejemplo de roles y prioridades
- Día 1: generar listado de regiones, beneficiarios y finalidades.
- Día 2: construir y validar el workflow de n8n.
- Día 3: ejecutar la primera etiqueta automática y revisar resultados.
- Día 4: analizar combinaciones y seleccionar webs iniciales.
- Día 5: configurar el cron diario y la revisión de `needs_review`.

## Resultado esperado
- Un proceso repetible y controlado.
- Notion enriquecido con tags útiles.
- Pocas páginas web bien enfocadas.
- Coste bajo en IA y mantenimiento.

## Próximo paso
Si quieres, ahora concreto el workflow n8n con los nodos exactos y un diseño de la base de datos de Notion. 