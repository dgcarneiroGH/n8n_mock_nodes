# Ejemplo visual: Cómo se vería en Notion

## Tabla: Beneficiarios

```
ID  Descripción                                          Slug                     Active
1   PERSONAS FÍSICAS QUE NO DESARROLLAN ACTIVIDAD       personas-fisicas-no      ✓
2   PERSONAS JURÍDICAS QUE NO DESARROLLAN ACTIVIDAD     personas-juridicas-no    ✓
3   PYME Y PERSONAS FÍSICAS ACTIVIDAD ECONÓMICA         pyme-personas-fisicas    ✓
4   GRAN EMPRESA                                        gran-empresa             ✓
5   SIN INFORMACIÓN ESPECÍFICA                          sin-info                 ✗
```

---

## Tabla: Regiones

```
ID   Nombre          Slug           Tipo        Active
15   Galicia         galicia        ccaa        ✓
27   A Coruña        a-coruna       provincia   ✓
32   Lugo            lugo           provincia   ✓
36   Pontevedra      pontevedra     provincia   ✓
42   Ourense         ourense        provincia   ✓
28   España          espana         pais        ✓
```

---

## Tabla: Finalidades

```
ID   Descripción     Slug            Active
1    Investigación   investigacion   ✓
2    Formación       formacion       ✓
3    Innovación      innovacion      ✓
4    Cultura         cultura         ✓
5    Turismo         turismo         ✓
6    Agricultura     agricultura     ✓
... (10+ total)
```

---

## Tabla: Query History (Lo importante)

Este es el registro de qué combinaciones ya consultaste.

```
Combo ID           Beneficiario     Región       Finalidad    Last Checked   Results  Status         Priority Score
1_15_1             PYME             Galicia      Investigación (sin fecha)    0       pending        9999
1_27_2             PYME             A Coruña     Formación    2026-05-16     12       active         10
3_36_3             GRAN EMPRESA     Pontevedra   Innovación   2026-04-26     2        low_volume     30
2_15_4             PERSONAS JUR.    Galicia      Cultura      2026-05-10     8        active         16
4_42_5             GRAN EMPRESA     Ourense      Turismo      (sin fecha)    0       pending        9999
... (300 total posibles)
```

**Columnas clave:**
- **Combo ID**: Unique identifier: `beneficiario_id_region_id_finalidad_id`
- **Last Checked**: Cuándo se consultó a la API por última vez
- **Results**: Cuántas subvenciones encontró la última vez
- **Status**: 
  - `pending` = nunca consultada o sin fecha
  - `active` = ≥5 resultados
  - `low_volume` = 1-4 resultados
  - `no_results` = 0 resultados
- **Priority Score**: Calculado automáticamente
  - 9999 = nunca consultada (máxima prioridad)
  - N días = fue consultada hace N días
  - Los antiguos salen primero cada día

---

## Flujo visual diario

### 6:00 AM: Ejecutar workflow en n8n

```
[n8n Scheduler: 6:00 AM]
           ↓
[Sincronizar catálogos desde API]
  ✓ GET /api/benefactors → Upsert Notion.Beneficiarios
  ✓ GET /api/regions → Upsert Notion.Regiones
  ✓ GET /api/purposes → Upsert Notion.Finalidades
           ↓
[Leer catálogos de Notion]
  - Beneficiarios activos: 5
  - Regiones activas: 6
  - Finalidades activas: 10
           ↓
[Generar todas las combos posibles]
  5 × 6 × 10 = 300 combinaciones totales
           ↓
[Leer Query History] → Ordenar por Priority Score DESC
           ↓
[Seleccionar TOP 15 combos prioritarias]
  Ejemplo de TOP 5 a consultar hoy:
  1. PYME + Galicia + Investigación (nunca consultada)
  2. PERSONAS JUR. + A Coruña + Formación (nunca consultada)
  3. GRAN EMPRESA + Ourense + Turismo (nunca consultada)
  4. PYME + A Coruña + Formación (consultada hace 10 días)
  5. GRAN EMPRESA + Pontevedra + Innovación (consultada hace 30 días)
           ↓
[Loop: Para cada combo]
  GET /api/grants?beneficiario_id=1&region_id=15&finalidad_id=1
    → Encontrados 5 grants
       ↓
    [Upsert Query History]
      - Combo ID: 1_15_1
      - Last Checked: 2026-05-26
      - Results: 5
      - Status: "active"
      - Priority Score: 0 (reseteado)
       ↓
    [Crear/Actualizar Subvenciones en Notion]
      - Crear 5 nuevos registros
      - Asignar beneficiario_id=1, region_id=15, finalidad_id=1
           ↓
[Luego, etiquetar todas las subvenciones activas]
  - Asignar tags automáticos
  - Extraer tag_seo
  - Marcar needs_review si es necesario
           ↓
[Generar reporte]
  - Consultadas 15 combos
  - 112 subvenciones nuevas encontradas
  - 8 pendientes de revisión manual
  - 320 subvenciones activas en total
           ↓
[Fin] 7:30 AM
```

---

## Ventaja: Visibilidad total de lo consultado

Desde Notion, en cualquier momento puedes:

1. **Ver cuándo fue la última consulta de cada combo**
   → Filter: `Last Checked < 7 days ago` → Identifica lo que necesita actualización

2. **Ver combos nunca consultadas**
   → Filter: `Last Checked is_empty` → Son las siguientes a consultar

3. **Analizar volúmenes por región**
   → Group by: `Región` → Ve dónde hay más oportunidades

4. **Identificar lo obsoleto**
   → Filter: `Last Checked > 30 days ago AND Status = low_volume` → Posible limpiar

5. **Calcular coverage**
   → Count total combos posibles vs. combos con `Last Checked is_not_empty`
   → "Hemos consultado el 45% de todas las combos posibles"

---

## Ejemplo: Tabla Query History después de 1 semana

```
Combo ID           Beneficiario     Región       Finalidad      Last Checked   Results  Status
1_15_1             PYME             Galicia      Investigación  2026-05-26     5        active
1_27_2             PYME             A Coruña     Formación      2026-05-26     12       active
4_42_5             GRAN EMPRESA     Ourense      Turismo        2026-05-26     0        no_results
2_15_4             PERSONAS JUR.    Galicia      Cultura        2026-05-25     8        active
3_36_3             GRAN EMPRESA     Pontevedra   Innovación     2026-05-24     2        low_volume
1_32_6             PYME             Lugo         Agricultura    2026-05-23     15       active
... (15-20 consultadas cada día, después de 1 semana: 105-140 consultadas)
```

---

## Próximo paso: Integración con Notion

1. **Crear database `Query History`** en tu workspace Notion
2. **Crear las propiedades:**
   - `Combo ID` (Text, Unique)
   - `Beneficiario` (Number)
   - `Región` (Number)
   - `Finalidad` (Number)
   - `Last Checked At` (Date)
   - `Count Results` (Number)
   - `Status` (Select: active, low_volume, no_results, pending)
   - `Priority Score` (Formula: mismatch calculation)

3. **Crear database `Subvenciones`** (actualizar si existe)
   - Añadir propiedades: `beneficiario_id`, `region_id`, `finalidad_id`

4. **Conectar n8n a Notion**
   - Autenticación con Notion API
   - Nodes: "Notion Create/Update Records"
   - Usar las functions de `n8n_workflow_combos.js`

5. **Testear con 1 semana de ejecuciones**
   - Ejecutar workflow manual cada mañana
   - Ver cómo crece Query History
   - Validar que no hay duplicados
   - Verificar que Priority Score se recalcula correctamente
