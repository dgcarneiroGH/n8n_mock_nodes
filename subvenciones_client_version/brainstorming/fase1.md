# Fase 1 — Sistema de Query History

## Objetivo
Implementar un registro de combinaciones de parámetros ya consultadas a la API de subvenciones, para evitar redundancias, priorizar consultas y mantener control sobre el consumo de tokens.

## Problema a resolver
Sin un historial de consultas, el workflow de n8n podría:
- Consultar la misma combinación (`beneficiario + región + finalidad`) múltiples veces en un día.
- No saber cuáles combinaciones nunca se han consultado.
- Perder tiempo en combos con bajo volumen o sin cambios.
- Desconocer cuándo fue la última vez que se actualizó cada combinación.

## Solución: Tabla Query History en Notion

### Estructura
Una tabla `Query History` en Notion que almacena:

| Campo             | Tipo          | Propósito                                                            |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| `id`              | Text (Unique) | Clave única: `{beneficiario_id}_{región_id}_{finalidad_id}`          |
| `beneficiario_id` | Number        | FK a tabla Beneficiarios                                             |
| `región_id`       | Number        | FK a tabla Regiones                                                  |
| `finalidad_id`    | Number        | FK a tabla Finalidades                                               |
| `last_checked_at` | Date          | Cuándo se consultó por última vez esta combo a la API                |
| `count_results`   | Number        | Cuántas subvenciones encontró la última consulta                     |
| `status`          | Select        | `active` (≥5) \| `low_volume` (1-4) \| `no_results` (0) \| `pending` |
| `api_url_called`  | Text          | URL exacta consultada (para auditoria)                               |
| `priority_score`  | Formula       | Score automático para ordenar prioritarias                           |

### Fórmula de Priority Score
```
if(isEmpty(prop("last_checked_at")), 
  9999,
  dateBetween(now(), prop("last_checked_at"), "days")
)
```

**Lógica:**
- Sin fecha registrada → score 9999 (máxima prioridad)
- Con fecha → score = días desde última consulta
- Ejemplo: si fue consultada hace 10 días, score = 10

## Catálogos base sincronizados

### Tabla: Beneficiarios
Sincronizada desde `GET /api/benefactors`

```json
[
  { "id": 1, "descripcion": "PERSONAS FÍSICAS NO ACTIVIDAD", "slug": "personas-fisicas-no-actividad" },
  { "id": 2, "descripcion": "PERSONAS JURÍDICAS NO ACTIVIDAD", "slug": "personas-juridicas-no-actividad" },
  { "id": 3, "descripcion": "PYME Y PERSONAS FÍSICAS ACTIVIDAD", "slug": "pyme-personas-fisicas" },
  { "id": 4, "descripcion": "GRAN EMPRESA", "slug": "gran-empresa" },
  { "id": 5, "descripcion": "SIN INFORMACIÓN ESPECÍFICA", "slug": "sin-info" }
]
```

Cada beneficiario tiene:
- `id` (Number)
- `descripcion` (Text)
- `slug` (Text, URL-safe)
- `active` (Checkbox) — si incluir en combinaciones diarias

### Tabla: Regiones
Sincronizada desde `GET /api/regiones`

Ejemplo para Galicia:
- ID 15: "Galicia" (ccaa)
- ID 27: "A Coruña" (provincia)
- ID 32: "Lugo" (provincia)
- ID 36: "Pontevedra" (provincia)
- ID 42: "Ourense" (provincia)

### Tabla: Finalidades
Sincronizada desde `GET /api/finalidades?vpd=GE`

Ejemplos:
- ID 1: "Investigación"
- ID 2: "Formación"
- ID 3: "Innovación"
- ID 4: "Cultura"
- ID 5: "Turismo"
- ... (N finalidades total)

## Flujo de esta fase

### Paso 1: Crear las 4 tablas en Notion
1. **Beneficiarios** (campos: id, descripcion, slug, active)
2. **Regiones** (campos: id, nombre, slug, tipo, active)
3. **Finalidades** (campos: id, descripcion, slug, active)
4. **Query History** (estructura descrita arriba)

### Paso 2: Sincronizar catálogos desde las APIs
Crear un workflow n8n que:
1. Ejecuta `GET /api/benefactors` → Upsert en Notion.Beneficiarios
2. Ejecuta `GET /api/regiones` → Upsert en Notion.Regiones
3. Ejecuta `GET /api/finalidades?vpd=GE` → Upsert en Notion.Finalidades

Esto asegura que si aparecen nuevos beneficiarios o regiones en la API, se capturen automáticamente.

### Paso 3: Generar todas las combinaciones posibles
Crear un nodo JavaScript en n8n que:
```javascript
// Combinar todos los beneficiarios activos, regiones activas y finalidades activas
for (let b of beneficiarios) {
  for (let r of regiones) {
    for (let f of finalidades) {
      combinaciones.push({
        id: `${b.id}_${r.id}_${f.id}`,
        beneficiario_id: b.id,
        región_id: r.id,
        finalidad_id: f.id
      });
    }
  }
}
```

**Estimación:**
- 5 beneficiarios × 6 regiones × 10 finalidades = **300 combinaciones posibles**
- Cantidad manejable y determinista

### Paso 4: Identificar combos nuevas y nunca consultadas
Comparar listado de combos posibles contra Query History:
- Combos SIN registro en Query History → nunca consultadas (prioridad máxima)
- Combos CON registro pero `last_checked_at` es null → pendientes (prioridad muy alta)
- Combos CON fecha antigua → bajo en prioridad pero incluir en ciclo de refrescado

### Paso 5: Seleccionar las siguientes a consultar (diariamente)
1. Leer Query History ordenado por `priority_score` DESC
2. Seleccionar TOP 15-20 combos para consultar hoy
3. Para cada combo, ejecutar:
   ```
   GET /api/grants?beneficiario_id=X&región_id=Y&finalidad_id=Z
   ```
4. Contar resultados y actualizar Query History:
   - `last_checked_at` = hoy
   - `count_results` = cantidad encontrada
   - `status` = determinar según volumen
   - `api_url_called` = URL exacta

### Paso 6: Completar la tabla Query History
Después de una semana de ejecuciones diarias:
- ~100 combinaciones tendrán registro en Query History
- Se conoce su volumen y estado
- Se puede proceder a siguientes fases sabiendo qué datos están actualizados

## Beneficios de esta fase

✅ **Determinista:** Las combinaciones se generan algorítmicamente, sin azar.

✅ **Escalable:** Nuevos beneficiarios/regiones en la API se capturan automáticamente.

✅ **Histórico:** Cada combo tiene fecha de última consulta, se evita redundancia.

✅ **Optimización:** n8n sabe exactamente qué consultar hoy sin duplicar esfuerzo.

✅ **Sin tokens desperdiciados:** Aún no usamos IA; solo sincronizamos y priorizamos consultas.

✅ **Visibilidad total:** Desde Notion se puede ver qué combos están actualizadas, cuáles viejas, cuáles nunca consultadas.

## Criterios de éxito de Fase 1

- ✓ Las 4 tablas existen en Notion con estructura correcta.
- ✓ Catálogos sincronizados (beneficiarios, regiones, finalidades) sin errores.
- ✓ Query History tiene 100-150 registros después de 1 semana de ejecuciones.
- ✓ Priority Score se calcula automáticamente.
- ✓ Ninguna combo se consulta dos veces en el mismo día.
- ✓ Próxima semana: conocemos volumen y estado de >100 combos.

## Resultado esperado al final de Fase 1

**Un Notion con:**
- 5 beneficiarios activos sincronizados
- 6 regiones activas sincronizadas
- 10 finalidades activas sincronizadas
- 300 combinaciones posibles generadas
- 100-150 combinaciones ya consultadas con volumen y estado registrado
- Sistema listo para Fase 2: etiquetado automático de subvenciones

## Dependencias
- Acceso a Notion API
- Acceso a InfoSubvenciones API (benefactors, regions, purposes, grants)
- Entorno n8n funcional con nodos HTTP y Notion

## Próximo paso
Una vez Fase 1 esté completa, proceder a **Fase 2: Tagging Automático** (extracción de tags SEO desde títulos y descripciones).
