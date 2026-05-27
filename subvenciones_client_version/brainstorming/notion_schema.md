# Esquema Notion para Tags y Combinaciones

## Tablas necesarias en Notion

### 1. Tabla: `Beneficiarios`
Almacena los valores del GET benefactors.

| Propiedad     | Tipo     | Descripción                                            |
| ------------- | -------- | ------------------------------------------------------ |
| `id`          | Number   | ID de la API (ej: 3, 4, 2, 1, 5)                       |
| `descripcion` | Text     | Descripción del API (ej: "PYME Y PERSONAS FÍSICAS...") |
| `slug`        | Text     | Versión URL-safe (ej: "pyme-personas-fisicas")         |
| `active`      | Checkbox | ¿Incluir en combinaciones?                             |
| `created_at`  | Date     | Cuándo se sincronizó con la API                        |

**Ejemplo de datos:**
```json
[
  { "id": 1, "descripcion": "PERSONAS FÍSICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA", "slug": "personas-fisicas-no-actividad", "active": true },
  { "id": 2, "descripcion": "PERSONAS JURÍDICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA", "slug": "personas-juridicas-no-actividad", "active": true },
  { "id": 3, "descripcion": "PYME Y PERSONAS FÍSICAS QUE DESARROLLAN ACTIVIDAD ECONÓMICA", "slug": "pyme-personas-fisicas", "active": true },
  { "id": 4, "descripcion": "GRAN EMPRESA", "slug": "gran-empresa", "active": true },
  { "id": 5, "descripcion": "SIN INFORMACION ESPECIFICA", "slug": "sin-info", "active": false }
]
```

---

### 2. Tabla: `Regiones`
Almacena regiones (de forma similar a beneficiarios).

| Propiedad | Tipo     | Descripción                                       |
| --------- | -------- | ------------------------------------------------- |
| `id`      | Number   | ID de la API                                      |
| `nombre`  | Text     | Nombre de la región (ej: "Galicia", "Pontevedra") |
| `slug`    | Text     | URL-safe (ej: "galicia", "pontevedra")            |
| `tipo`    | Select   | `ccaa` \| `provincia` \| `comarca`                |
| `active`  | Checkbox | ¿Incluir en combinaciones?                        |

**Sync desde API:** n8n ejecuta `GET /api/regions` y actualiza esta tabla.

---

### 3. Tabla: `Finalidades`
Almacena los propósitos/sectores (similar).

| Propiedad     | Tipo     | Descripción                                    |
| ------------- | -------- | ---------------------------------------------- |
| `id`          | Number   | ID de la API                                   |
| `descripcion` | Text     | Descripción (ej: "Investigación", "Formación") |
| `slug`        | Text     | URL-safe                                       |
| `active`      | Checkbox | ¿Incluir en combinaciones?                     |

---

### 4. Tabla: `Query History` (Historial de Combinaciones)
**Este es el registro de qué combinaciones ya hemos consultado.**

| Propiedad         | Tipo    | Descripción                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| `id`              | Formula | Unique: `beneficiario_id_region_id_finalidad_id`      |
| `beneficiario`    | Number  | FK a `Beneficiarios.id`                               |
| `region`          | Number  | FK a `Regiones.id`                                    |
| `finalidad`       | Number  | FK a `Finalidades.id`                                 |
| `last_checked_at` | Date    | Última vez que consultamos esta combo a la API        |
| `count_results`   | Number  | Cuántas subvenciones encontró la última vez           |
| `status`          | Select  | `active` \| `low_volume` \| `no_results` \| `pending` |
| `api_url_called`  | Text    | URL exacta que se consultó (para debug)               |
| `priority_score`  | Formula | Calcula automáticamente cuál debe ser prioridad       |

**Fórmula para `priority_score`:**
```
if(empty(prop("last_checked_at")), 1000, 
  dateBetween(now(), prop("last_checked_at"), "days"))
```
(Los sin fecha tienen score 1000 = máxima prioridad; después, los días desde última consulta)

---

### 5. Tabla: `Subvenciones` (Actualizada)
Las subvenciones existentes, ahora con campos de meta-información.

| Propiedad         | Tipo         | Descripción                                              |
| ----------------- | ------------ | -------------------------------------------------------- |
| `id`              | Text         | ID único de la API                                       |
| `titulo`          | Text         | Título de la subvención                                  |
| `descripcion`     | Text         | Descripción                                              |
| `beneficiario_id` | Number       | FK a `Beneficiarios.id`                                  |
| `region_id`       | Number       | FK a `Regiones.id`                                       |
| `finalidad_id`    | Number       | FK a `Finalidades.id`                                    |
| `tags`            | Multi-select | Tags internos (ej: "cultura", "formación", "tecnología") |
| `tag_seo`         | Text         | Tag SEO principal (ej: "musica", "teatro")               |
| `needs_review`    | Checkbox     | ¿Necesita revisión manual?                               |
| `last_tagged_at`  | Date         | Cuándo se etiquetó por última vez                        |
| `status`          | Select       | `active` \| `expired` \| `archived`                      |

---

## Flujo en n8n: Generar combinaciones automáticamente

### Paso 1: Sincronizar catálogos (una vez o cada semana)
```
GET /api/benefactors
  ↓ Upsert en Notion.Beneficiarios
  
GET /api/regions
  ↓ Upsert en Notion.Regiones
  
GET /api/purposes
  ↓ Upsert en Notion.Finalidades
```

### Paso 2: Generar todas las combinaciones posibles
Desde n8n:
```javascript
// Leer activos de Notion
const beneficiarios = await notion.read("Beneficiarios", { filter: "active == true" });
const regiones = await notion.read("Regiones", { filter: "active == true" });
const finalidades = await notion.read("Finalidades", { filter: "active == true" });

// Generar todas las combos
const combos = [];
for (let b of beneficiarios) {
  for (let r of regiones) {
    for (let f of finalidades) {
      combos.push({
        beneficiario_id: b.id,
        region_id: r.id,
        finalidad_id: f.id,
        id: `${b.id}_${r.id}_${f.id}`
      });
    }
  }
}

// Si hay 5 beneficiarios × 6 regiones × 10 finalidades = 300 combos
// Es manejable.

return combos;
```

### Paso 3: Seleccionar siguientes a consultar (prioridad)
```javascript
// Leer historial ordenado por priority_score DESC
const pending = await notion.read("Query History", {
  sort: [{ field: "priority_score", direction: "desc" }],
  limit: 10  // Consultar las 10 más antiguas/sin fecha
});

// Combos sin registro en Query History también deben incluirse
// como "nunca consultadas" = prioridad máxima
```

### Paso 4: Ejecutar consultas a la API
Para cada combo seleccionada:
```
GET /api/grants?beneficiario_id=3&region_id=12&finalidad_id=5
  ↓ Contar resultados
  ↓ Actualizar Query History:
    - last_checked_at = ahora
    - count_results = cantidad
    - status = "active" | "low_volume" | "no_results"
```

### Paso 5: Actualizar o crear Subvenciones en Notion
- Insertar nuevas subvenciones encontradas
- Actualizar beneficiario_id, region_id, finalidad_id si cambian
- Proceder con tagging automático

---

## Ejemplo concreto: Flujo diario en n8n

```
[Trigger] Ejecutar cada día a las 6:00 AM
  ↓
[Paso 1] Sincronizar catálogos (Beneficiarios, Regiones, Finalidades)
  ↓
[Paso 2] Leer "Query History"
  ↓
[Paso 3] Calcular combos "pending" o "never_checked"
  ↓
[Paso 4] Iterar sobre 15-20 combos prioritarias (para no explotar API)
  │ Para cada combo:
  │   - GET /api/grants?beneficiario_id=X&region_id=Y&finalidad_id=Z
  │   - Contar y guardar en Query History
  │   - Crear/actualizar subvenciones en Notion
  │
[Paso 5] Etiquetar todas las subvenciones (tag_seo, tags internos)
  ↓
[Paso 6] Marcar "needs_review" donde sea necesario
  ↓
[Paso 7] Generar lista de combos con volumen >= 5 para nuevas webs
  ↓
[Fin] Notificar: "Consultadas X combos, Y subvenciones nuevas, Z pendientes de revisión"
```

---

## Ventajas de este diseño

1. **Determinista:** Las combos se generan algorítmicamente, sin azar.
2. **Escalable:** Si surgen nuevas regiones o beneficiarios en la API, se actualizan en Notion automáticamente.
3. **Historial:** Nunca consultas lo mismo dos veces en un día; prioriza lo antiguo.
4. **SEO-focused:** Desde `región + tag_seo` calculas rápidamente cuántas webs generar.
5. **IA mínima:** Solo usas IA si no hay regla determinista; el 90% de tags se asignan automáticamente.
6. **No explosión de URLs:** Limitas a `región + tag_seo`, ignoras `beneficiario + agencia + finalidad`.

---

## Estimación de volumen

**Escenario Galicia local:**
- Beneficiarios activos: 5
- Regiones: 6 (Galicia + provincias)
- Finalidades: 10

**Total combos = 5 × 6 × 10 = 300 combinaciones**

Consultando 15-20 diarias:
- Ciclo completo cada ~15 días
- Fácil mantener actualizado sin explotar tokens

**Escenario España completo:**
- Beneficiarios: 5
- Regiones: 52 (CCAA + provincias)
- Finalidades: 20

**Total combos = 5 × 52 × 20 = 5200 combinaciones**
Consultando 50 diarias:
- Ciclo completo cada ~100 días
- Requiere más gestión, pero aún viable

---

## Próximos pasos

1. Crear estas 5 tablas en Notion.
2. Sincronizar los datos actuales de la API.
3. Diseñar el flujo n8n con bucles y query history.
4. Testear con 20-30 combos reales.
