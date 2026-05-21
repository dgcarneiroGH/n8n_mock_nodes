const fs = require("fs");

let subvencionesRaw, getClients, subvencionesNotionRaw;
try {
  getClients = JSON.parse(
    fs.readFileSync("./results/getters/get_clients.json", "utf8"),
  );
  subvencionesRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_subvenciones.json", "utf8"),
  );
  subvencionesNotionRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_subvenciones_notion.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const subvenciones = subvencionesRaw;
const clientes = getClients;
const subvencionesGuardadas = subvencionesNotionRaw;

//#region Node Logic
// Build set of Notion codes to filter
const notionCodes = new Set(
  (subvencionesGuardadas || [])
    .map((s) => s.property_c_digo_bdns)
    .filter(Boolean),
);

const results = clientes.map((client, idx) => {
  const grants = (subvenciones[idx] && subvenciones[idx].content) || [];
  const filteredGrants = grants
    .filter((g) => !notionCodes.has(String(g.numeroConvocatoria)))
    .map((g) => ({
      grantId: g.numeroConvocatoria,
      description: g.descripcion,
      receivedDate: g.fechaRecepcion,
      organization: g.nivel3 ?? g.nivel2,
      urlHtml: `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatoria/${g.numeroConvocatoria}`,
      urlApi: `https://www.pap.hacienda.gob.es/bdnstrans/api/convocatorias?numConv=${g.numeroConvocatoria}&vpd=GE`,
    }));
  return {
    client: {
      id: client.id,
      name: client.name,
    },
    grants: filteredGrants,
  };
});
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_grants.json",
    JSON.stringify(results, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
