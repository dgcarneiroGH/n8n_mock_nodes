const fs = require("fs");

let filterGrantsRaw, filterPurposesRaw, getPurposesRaw, loopSubvencionesRaw;
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
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const filterGrants = filterGrantsRaw;
const filterPurposes = filterPurposesRaw;
const getPurposes = getPurposesRaw;
const loopSubvenciones = loopSubvencionesRaw;

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

const validLoops = loopSubvenciones.filter((item) => {
  if (!Array.isArray(item.anuncios) || item.anuncios.length === 0) return false;
  return item.anuncios.some((anouncement) => normalize(anouncement.url) !== "");
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

const hasPurposeMatch = (grantPurpose, clientPurposes) =>
  clientPurposes.some(
    (clientPurpose) =>
      grantPurpose.includes(clientPurpose) ||
      clientPurpose.includes(grantPurpose),
  );

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
        anouncements: loop.anuncios.map((anouncement) => anouncement.url),
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

const result = filterGrants.map((clientObj) => {
  const clientPurposes = getClientPurposes(clientObj.client.id);
  return {
    ...clientObj,
    grants: filterAndFormatGrants(clientObj.grants, clientPurposes),
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
