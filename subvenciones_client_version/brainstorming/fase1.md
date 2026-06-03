# Fase 1 — Sistema de Query History

## Objetivo
Implementar un registro de combinaciones de parámetros ya consultadas a la API de subvenciones, para evitar redundancias, priorizar consultas y mantener control sobre el consumo de tokens. Antes de pasar a Fase 2, contar solo subvenciones realmente activas (filtradas por fecha y anuncios).

## Problema a resolver
Sin un historial de consultas, el workflow de n8n podría:
- Consultar la misma combinación (`beneficiario + región + finalidad`) múltiples veces en un día.
- No saber cuáles combinaciones nunca se han consultado.
- Perder tiempo en combos con bajo volumen o sin cambios.
- Desconocer cuándo fue la última vez que se actualizó cada combinación.

## Solución: Tabla Query History en Notion

### Estructura
Una tabla `Query History` en Notion que almacena:

| Campo                | Tipo          | Propósito                                                                        |
| -------------------- | ------------- | -------------------------------------------------------------------------------- |
| `id`                 | Text (Unique) | Clave única: `{beneficiario_id}_{región_id}_{finalidad_id}`                      |
| `beneficiario_id`    | Number        | FK a tabla Beneficiarios                                                         |
| `región_id`          | Number        | FK a tabla Regiones                                                              |
| `finalidad_id`       | Number        | FK a tabla Finalidades                                                           |
| `last_checked_at`    | Date          | Cuándo se consultó por última vez esta combo a la API                            |
| `count_results_raw`  | Number        | Cuántas subvenciones devolvió la API sin filtrar                                 |
| `count_results`      | Number        | Cuántas subvenciones activas quedaron tras filtrar (fecha + anuncios)            |
| `grant_codes_active` | Text/JSON     | Array con códigos BDNS activos tras el filtrado                                  |
| `status`             | Select        | `active` (>=MIN_RESULTS_FOR_ACTIVE) \| `low_volume` \| `no_results` \| `pending` |
| `api_url_called`     | Text          | URL exacta consultada (para auditoria)                                           |
| `priority_score`     | Formula       | Score automático para ordenar prioritarias                                       |

`MIN_RESULTS_FOR_ACTIVE` es configurable (valor inicial recomendado: 10).

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
1. **Beneficiarios** (campos: id, descripcion, slug)
2. **Regiones** (campos: id, nombre, slug, tipo)
3. **Finalidades** (campos: id, descripcion, slug)
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
- Volumen real actual: **~16.000 combinaciones posibles**
- Cantidad alta pero manejable con priorización diaria por `priority_score`

### Paso 4: Identificar combos nuevas y nunca consultadas
Comparar listado de combos posibles contra Query History:
- Combos SIN registro en Query History → nunca consultadas (prioridad máxima)
- Combos CON registro pero `last_checked_at` es null → pendientes (prioridad muy alta)
- Combos CON fecha antigua → bajo en prioridad pero incluir en ciclo de refrescado

### Paso 5: Seleccionar las siguientes a consultar (diariamente)
1. Leer Query History ordenado por `priority_score` DESC
2. Seleccionar TOP 100 combos para consultar hoy
3. Para cada combo, ejecutar:
   ```
   GET /api/grants?beneficiario_id=X&región_id=Y&finalidad_id=Z
   ```
4. Filtrar subvenciones por actividad real antes de contar:
  - Debe tener anuncios: `anuncios.length > 0`.
  - Si no tiene anuncios (vacío o ausente), se asume convocatoria no abierta.
  - Si tiene anuncios, se considera activa por defecto.
  - Excepción: si `fechaFinSolicitud` existe y ya pasó, NO pasa el filtro.

  Ejemplo de filtro:
  ```javascript
  const hoy = new Date().toISOString().slice(0, 10);

  const activas = grants.filter((g) => {
    const fin = g.fechaFinSolicitud;
    const tieneAnuncios = Array.isArray(g.anuncios) && g.anuncios.length > 0;
     const noCaducada = !fin || hoy <= fin;

     return tieneAnuncios && noCaducada;
  });

  const countResultsRaw = grants.length;
  const countResults = activas.length;
  const grantCodesActive = activas.map((g) => String(g.codigoBDNS));
  ```

5. Guardar y actualizar Query History:
   - `last_checked_at` = hoy
  - `count_results_raw` = total sin filtrar
  - `count_results` = total activo tras filtro
  - `grant_codes_active` = array de códigos activos BDNS
  - `status` = determinar según `count_results` (filtrado)
   - `api_url_called` = URL exacta

6. Enlace con Fase 2 (optimización):
  - Fase 2 usa `grant_codes_active` y hace 1 llamada de detalle por código:
  ```
  GET /bdnstrans/api/convocatorias?numConv={codigo}&vpd=GE
  ```
  - Esto evita relistar datos completos de la combinación y reduce procesamiento innecesario.

### Paso 6: Completar la tabla Query History
Después de una semana de ejecuciones diarias:
- hasta ~700 combinaciones tendrán registro en Query History (según ejecuciones reales)
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
- ✓ Query History tiene 500+ registros después de 1 semana de ejecuciones (objetivo con TOP 100/día).
- ✓ Priority Score se calcula automáticamente.
- ✓ Ninguna combo se consulta dos veces en el mismo día.
- ✓ `count_results` refleja solo subvenciones activas (fecha + anuncios).
- ✓ `grant_codes_active` se almacena para el consumo eficiente de Fase 2.
- ✓ Próxima semana: conocemos volumen y estado de >100 combos.

## Resultado esperado al final de Fase 1

**Un Notion con:**
- 5 beneficiarios activos sincronizados
- 6 regiones activas sincronizadas
- 10 finalidades activas sincronizadas
- ~16.000 combinaciones posibles generadas
- 500+ combinaciones ya consultadas con volumen bruto, volumen activo real y estado registrado
- Códigos BDNS activos listos para llamar detalle por `numConv` en Fase 2
- Sistema listo para Fase 2: etiquetado automático de subvenciones

## Dependencias
- Acceso a Notion API
- Acceso a InfoSubvenciones API (benefactors, regions, purposes, grants)
- Entorno n8n funcional con nodos HTTP y Notion

## Próximo paso
Una vez Fase 1 esté completa, proceder a **Fase 2: Tagging Automático** (extracción de tags SEO desde títulos y descripciones).
