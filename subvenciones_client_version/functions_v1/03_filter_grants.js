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
const toArray = (value) => (Array.isArray(value) ? value : []);
const toClientGrantKey = (clientId, grantCode) =>
  `${String(clientId)}::${String(grantCode)}`;

const buildClientGrantPairs = (savedGrants) =>
  new Set(
    toArray(savedGrants).flatMap((savedGrant) => {
      const grantCode = savedGrant.property_c_digo_bdns;
      const clientIds = toArray(savedGrant.property_clientes);

      if (!grantCode || clientIds.length === 0) return [];

      return clientIds
        .filter(Boolean)
        .map((clientId) => toClientGrantKey(clientId, grantCode));
    }),
  );

const mapGrantOutput = (grant) => ({
  grantId: grant.numeroConvocatoria,
  description: grant.descripcion,
  receivedDate: grant.fechaRecepcion,
  organization: grant.nivel3 ?? grant.nivel2,
  urlHtml: `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatoria/${grant.numeroConvocatoria}`,
  urlApi: `https://www.pap.hacienda.gob.es/bdnstrans/api/convocatorias?numConv=${grant.numeroConvocatoria}&vpd=GE`,
});

const notionClientGrantPairs = buildClientGrantPairs(subvencionesGuardadas);
const alignedSubvenciones = toArray(subvenciones);
if (alignedSubvenciones.length !== clientes.length) {
  throw new Error(
    `Error crítico de paridad: Hay ${clientes.length} clientes y ${alignedSubvenciones.length} arrays de subvenciones. Se aborta la ejecución para evitar cruce de datos.`,
  );
}

const results = clientes.map((client, idx) => {
  // This guarantees client[idx] only uses subvenciones[idx]
  const grantsSource = alignedSubvenciones[idx];
  const grants = toArray(grantsSource?.content);
  const clientId = String(client.id);

  const filteredGrants = grants
    .filter(
      (g) =>
        !notionClientGrantPairs.has(
          toClientGrantKey(clientId, g.numeroConvocatoria),
        ),
    )
    .map(mapGrantOutput);
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
