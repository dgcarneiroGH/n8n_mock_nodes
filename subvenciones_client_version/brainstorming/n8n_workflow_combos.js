// N8N Mock Workflow: Generar Combinaciones y Consultar API
// Este código puede usarse en nodos de JavaScript en n8n

/**
 * PASO 1: Sincronizar catálogos desde la API
 * Nodo: "HTTP Request" → GET /api/benefactors
 * Luego: "Notion" → Upsert en tabla "Beneficiarios"
 */

// Código para sincronizar beneficiarios (ejemplo)
const benefactorsResponse = $input.first().json.benefactors; // Array del GET
// Procesar cada benefactor y upsertar en Notion
// n8n.Notion.records.upsert({
//   database_id: "db_beneficiarios",
//   records: benefactorsResponse.map(b => ({
//     id: b.id,
//     descripcion: b.descripcion,
//     slug: b.descripcion.toLowerCase().replace(/\s+/g, "-").substring(0, 50),
//     active: true
//   }))
// });

---

/**
 * PASO 2: Leer catálogos activos desde Notion
 * Nodo: "Notion" → Query "Beneficiarios" where active=true
 * Output: array de beneficiarios con { id, descripcion, slug }
 */

// Mock: simular lectura de Notion
const beneficiarios = [
  { id: 1, descripcion: "PERSONAS FÍSICAS NO ACTIVIDAD", slug: "personas-fisicas-no-actividad", active: true },
  { id: 3, descripcion: "PYME Y PERSONAS FÍSICAS ACTIVIDAD", slug: "pyme-personas-fisicas", active: true },
  { id: 4, descripcion: "GRAN EMPRESA", slug: "gran-empresa", active: true }
];

const regiones = [
  { id: 15, nombre: "Galicia", slug: "galicia", tipo: "ccaa", active: true },
  { id: 36, nombre: "Pontevedra", slug: "pontevedra", tipo: "provincia", active: true },
  { id: 27, nombre: "A Coruña", slug: "a-coruna", tipo: "provincia", active: true }
];

const finalidades = [
  { id: 1, descripcion: "Investigación", slug: "investigacion", active: true },
  { id: 2, descripcion: "Formación", slug: "formacion", active: true },
  { id: 3, descripcion: "Cultura", slug: "cultura", active: true }
];

---

/**
 * PASO 3: Generar todas las combinaciones posibles
 * Nodo: "JavaScript" 
 */

function generarTodasLasCombinaciones(beneficiarios, regiones, finalidades) {
  const combinaciones = [];

  for (const b of beneficiarios) {
    for (const r of regiones) {
      for (const f of finalidades) {
        const id = `${b.id}_${r.id}_${f.id}`; // Unique key
        
        combinaciones.push({
          id: id,
          beneficiario_id: b.id,
          beneficiario_name: b.descripcion,
          region_id: r.id,
          region_name: r.nombre,
          finalidad_id: f.id,
          finalidad_name: f.descripcion
        });
      }
    }
  }

  return combinaciones;
}

// Ejecutar:
const todasLasCombinaciones = generarTodasLasCombinaciones(beneficiarios, regiones, finalidades);
console.log(`Total combinaciones posibles: ${todasLasCombinaciones.length}`); 
// Output: 3 × 3 × 3 = 27 combinaciones

---

/**
 * PASO 4: Leer historial de combinaciones consultadas
 * Nodo: "Notion" → Query "Query History"
 * Sort por priority_score DESC (sin fecha primero, luego antiguos)
 */

// Mock: lectura del historial
const queryHistory = [
  // Sin fecha = máxima prioridad
  { id: "1_15_1", beneficiario_id: 1, region_id: 15, finalidad_id: 1, 
    last_checked_at: null, count_results: 0, status: "pending" },
  
  // Hace 10 días
  { id: "3_36_2", beneficiario_id: 3, region_id: 36, finalidad_id: 2, 
    last_checked_at: "2026-05-16", count_results: 12, status: "active" },
  
  // Hace 30 días (baja prioridad en ciclo)
  { id: "4_27_3", beneficiario_id: 4, region_id: 27, finalidad_id: 3, 
    last_checked_at: "2026-04-26", count_results: 2, status: "low_volume" }
];


/**
 * PASO 5: Seleccionar combos prioritarias a consultar hoy
 * Nodo: "JavaScript"
 */

function seleccionarCombosPrioritarias(todasLasCombinaciones, queryHistory, limit = 10) {
  const ahora = new Date();
  
  // Crear map de historial para lookup rápido
  const historialMap = {};
  for (const h of queryHistory) {
    historialMap[h.id] = h;
  }

  // Enriquecer combinaciones con info del historial
  const combosPrioritarias = todasLasCombinaciones
    .map(combo => {
      const hist = historialMap[combo.id];
      
      if (!hist) {
        // Nunca consultada = máxima prioridad
        return { ...combo, priority_score: 9999, status: "never_checked" };
      }

      if (!hist.last_checked_at) {
        // Sin fecha registrada = muy prioritaria
        return { ...combo, priority_score: 1000, status: "pending", ...hist };
      }

      // Calcular días desde última consulta
      const lastDate = new Date(hist.last_checked_at);
      const diasDesdeÚltima = Math.floor((ahora - lastDate) / (1000 * 60 * 60 * 24));
      
      // Prioridad: más antiguas primero
      const score = diasDesdeÚltima + (hist.count_results === 0 ? 100 : 0);
      
      return { 
        ...combo, 
        priority_score: score, 
        status: hist.status, 
        last_checked_at: hist.last_checked_at,
        count_results: hist.count_results,
        ...hist 
      };
    })
    // Ordenar por priority_score DESC (máxima prioridad primero)
    .sort((a, b) => b.priority_score - a.priority_score)
    // Seleccionar las top N
    .slice(0, limit);

  return combosPrioritarias;
}

// Ejecutar:
const combosPrioritarias = seleccionarCombosPrioritarias(todasLasCombinaciones, queryHistory, 10);

console.log("Combos a consultar hoy (prioritarias):");
combosPrioritarias.forEach((combo, i) => {
  console.log(`${i+1}. ${combo.beneficiario_name} + ${combo.region_name} + ${combo.finalidad_name} (score: ${combo.priority_score})`);
});

---

/**
 * PASO 6: Para cada combo, llamar a la API de subvenciones
 * Nodo: "HTTP Request" (dentro de un loop)
 * URL: GET /api/grants?beneficiario_id=X&region_id=Y&finalidad_id=Z
 */

async function consultarComboEnApi(combo, apiBaseUrl) {
  const url = `${apiBaseUrl}/api/grants?beneficiario_id=${combo.beneficiario_id}&region_id=${combo.region_id}&finalidad_id=${combo.finalidad_id}`;
  
  console.log(`Consultando: ${url}`);
  
  // En n8n, usar nodo HTTP:
  // GET: {{ $json.url }}
  // La respuesta contendrá el array de grants
  
  return {
    combo_id: combo.id,
    url: url,
    // response vendrá del nodo HTTP
  };
}

---

/**
 * PASO 7: Actualizar Query History en Notion
 * Después de cada consulta a la API
 * Nodo: "Notion" → Upsert en "Query History"
 */

function construirRegistroHistorial(combo, apiResponse) {
  const resultados = apiResponse.data || [];
  
  return {
    id: combo.id,
    beneficiario_id: combo.beneficiario_id,
    region_id: combo.region_id,
    finalidad_id: combo.finalidad_id,
    last_checked_at: new Date().toISOString().split('T')[0], // Hoy
    count_results: resultados.length,
    status: 
      resultados.length === 0 ? "no_results" :
      resultados.length < 5 ? "low_volume" :
      "active",
    api_url_called: combo.url
  };
}

// Ejemplo:
const registroParaNotion = construirRegistroHistorial(
  combosPrioritarias[0],
  { data: [/* 12 grants encontrados */] }
);

// En n8n: Upsert este registro en Notion.Query History

---

/**
 * PASO 8: Crear/Actualizar Subvenciones en Notion
 * Nodo: "Notion" → Insert/Update en "Subvenciones"
 */

function mapearGrantsANotion(grants, combo) {
  return grants.map(grant => ({
    id: grant.id, // ID único de la API
    titulo: grant.titulo,
    descripcion: grant.descripcion,
    beneficiario_id: combo.beneficiario_id,
    region_id: combo.region_id,
    finalidad_id: combo.finalidad_id,
    status: "active",
    tags: [],      // Se completará en siguiente nodo
    tag_seo: null, // Se completará con IA si es necesario
    needs_review: false,
    last_tagged_at: null
  }));
}

---

/**
 * WORKFLOW COMPLETO EN N8N (pseudocódigo)
 * 
 * [Start / Schedule Daily 6:00 AM]
 *   ↓
 * [HTTP GET /api/benefactors]
 *   ↓ Upsert → Notion.Beneficiarios
 *   ↓
 * [HTTP GET /api/regions]
 *   ↓ Upsert → Notion.Regiones
 *   ↓
 * [HTTP GET /api/purposes]
 *   ↓ Upsert → Notion.Finalidades
 *   ↓
 * [Notion Query: Beneficiarios active=true] → Store in $json.beneficiarios
 * [Notion Query: Regiones active=true]     → Store in $json.regiones
 * [Notion Query: Finalidades active=true]  → Store in $json.finalidades
 *   ↓
 * [JS Node: generarTodasLasCombinaciones()]
 *   → Output: $json.todasLasCombinaciones
 *   ↓
 * [Notion Query: Query History sorted by priority_score DESC]
 *   → Store in $json.queryHistory
 *   ↓
 * [JS Node: seleccionarCombosPrioritarias(limit: 15)]
 *   → Output: $json.combosPrioritarias
 *   ↓
 * [Loop over combosPrioritarias (max 15 items)]
 *   │
 *   ├─→ [HTTP GET /api/grants?beneficiario_id=X&region_id=Y&finalidad_id=Z]
 *   │     → Output: $json.apiResponse
 *   │     ↓
 *   │   [JS Node: construirRegistroHistorial()]
 *   │     → Output: $json.historialRecord
 *   │     ↓
 *   │   [Notion Upsert: Query History]
 *   │     ↓
 *   │   [JS Node: mapearGrantsANotion()]
 *   │     → Output: $json.grantsMapped
 *   │     ↓
 *   │   [Notion Upsert: Subvenciones]
 *   │
 * [End] → Send notification
 */

---

/**
 * UTILIDAD: Calcular Notion Filter para combos sin consultar
 * 
 * En Notion Query, usa este filter para obtener combos NUNCA consultadas:
 * NOT(Combo ID = "") AND Query History → is_empty
 * 
 * O via API: 
 * {
 *   "filter": {
 *     "and": [
 *       { "property": "last_checked_at", "date": { "is_empty": true } }
 *     ]
 *   }
 * }
 */

console.log("\n=== Resumen ===");
console.log(`Total combinaciones posibles: ${todasLasCombinaciones.length}`);
console.log(`Combinaciones ya consultadas: ${queryHistory.length}`);
console.log(`Pendientes (nunca consultadas): ${todasLasCombinaciones.length - queryHistory.length}`);
console.log(`Combinaciones prioritarias para hoy: ${combosPrioritarias.length}`);
console.log(`Próxima ejecución: mañana a las 6:00 AM`);
