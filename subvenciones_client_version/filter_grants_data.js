const fs = require("fs");

let filterGrantsRaw,
  filterPurposesRaw,
  getPurposesRaw,
  loopSubvencionesRaw,
  getSubvencionesNotionRaw;
try {
  filterGrantsRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_grants.json", "utf8"),
  );
  filterPurposesRaw = JSON.parse(
    fs.readFileSync("./results/filters/filter_purposes.json", "utf8"),
  );
  getPurposesRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_purposes.json", "utf8"),
  );
  loopSubvencionesRaw = JSON.parse(
    fs.readFileSync("./results/loops/loop_subvenciones.json", "utf8"),
  );
  getSubvencionesNotionRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_subvenciones_notion.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const filterGrants = filterGrantsRaw;
const filterPurposes = filterPurposesRaw;
const getPurposes = getPurposesRaw;
const loopSubvenciones = loopSubvencionesRaw;
const getNotionGrants = getSubvencionesNotionRaw;

//#region Node Logic
const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const purposeIdToDesc = new Map(
  getPurposes.map((purpose) => [
    String(purpose.id),
    normalize(purpose.descripcion),
  ]),
);

// Filter valid loops by ensuring they have non-empty announcements
const validLoops = loopSubvenciones.filter((item) => {
  if (!Array.isArray(item.anuncios) || item.anuncios.length === 0) return false;
  return item.anuncios.some(
    (anouncement) => normalize(anouncement.texto) !== "",
  );
});

const purposeByBdns = new Map();
const loopByBdns = new Map();
for (const loop of validLoops) {
  const bdns = String(loop.codigoBDNS ?? "");
  if (!bdns) continue;

  loopByBdns.set(bdns, loop);
  const purpose = normalize(loop.descripcionFinalidad);
  if (purpose) purposeByBdns.set(bdns, purpose);
}

const getClientPurposes = (clientId) => {
  const clientPurpose = filterPurposes.find(
    (item) => item.client_id === clientId,
  );
  if (!clientPurpose?.purposes_ids) return [];

  return clientPurpose.purposes_ids
    .split(",")
    .map((id) => purposeIdToDesc.get(id.trim()))
    .filter(Boolean);
};

const getBdnsFromUrl = (urlApi) => urlApi?.match(/numConv=(\d+)/)?.[1] ?? null;

// Check if a grant's purpose matches any of the client's purposes
const hasPurposeMatch = (grantPurpose, clientPurposes) =>
  clientPurposes.some(
    (clientPurpose) =>
      grantPurpose.includes(clientPurpose) ||
      clientPurpose.includes(grantPurpose),
  );

// Filter grants that are not already in Notion for the specific client
const filterOutNotionGrants = (grants, clientId) => {
  return grants.filter((grant) => {
    const bdns = getBdnsFromUrl(grant.urlApi);
    if (!bdns) return false;

    const notionGrant = getNotionGrants.find(
      (notionGrant) =>
        notionGrant.property_c_digo_bdns === bdns &&
        notionGrant.property_clientes.includes(clientId),
    );

    return !notionGrant;
  });
};

// Filter and format grants based on client purposes and loop data
const filterAndFormatGrants = (grants, clientPurposes) => {
  if (!Array.isArray(grants) || clientPurposes.length === 0) return [];

  return grants
    .map((grant) => {
      const bdns = getBdnsFromUrl(grant.urlApi);
      if (!bdns) return null;

      const purpose = purposeByBdns.get(bdns);
      if (!purpose || !hasPurposeMatch(purpose, clientPurposes)) return null;

      const loop = loopByBdns.get(bdns);
      if (!loop) return null;

      return {
        code: grant.grantId,
        description: grant.description,
        organization: grant.organization,
        url: grant.urlHtml,
        anouncements: loop.anuncios.map((anouncement) => anouncement.texto),
        dates: {
          receptionDate: loop.fechaRecepcion,
          applicationStartDate: loop.fechaInicioSolicitud,
          applicationEndDate: loop.fechaFinSolicitud,
          startText: loop.textInicio,
          endText: loop.textFin,
        },
      };
    })
    .filter(Boolean);
};

// Main processing: filter grants for each client and format the results
const result = filterGrants.map((clientObj) => {
  const clientId = clientObj.client.id;
  const clientPurposes = getClientPurposes(clientId);
  return {
    ...clientObj,
    grants: filterAndFormatGrants(
      filterOutNotionGrants(clientObj.grants, clientId),
      clientPurposes,
    ),
  };
});
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_grants_data.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
