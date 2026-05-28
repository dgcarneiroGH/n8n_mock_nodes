const fs = require("fs");

let updateGrantsDatesRaw, formatAgentResponseToJsonRaw;
try {
  updateGrantsDatesRaw = JSON.parse(
    fs.readFileSync("./results/update_grant_dates.json", "utf8"),
  );
  formatAgentResponseToJsonRaw = JSON.parse(
    fs.readFileSync("./results/format_agent_response_to_json.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const updateGrantsDates = updateGrantsDatesRaw;
const formatAgentResponseToJson = formatAgentResponseToJsonRaw;

//#region Node Logic
const allFormattedGrants = Array.isArray(formatAgentResponseToJson)
  ? formatAgentResponseToJson.flatMap((entry) =>
      Array.isArray(entry.output) ? entry.output : [],
    )
  : [];

const formatterByCode = new Map(
  allFormattedGrants
    .filter((grant) => grant?.code)
    .map((grant) => [
      String(grant.code),
      {
        description: grant.description || null,
        requirements: grant.requirements || null,
      },
    ]),
);

const mergedGrantsByCode = new Map();

for (const { client, grants = [] } of updateGrantsDates) {
  const clientId = String(client?.id || "");

  for (const updateGrant of grants) {
    const grantCode = String(updateGrant.code || "");
    if (!grantCode) continue;

    if (!mergedGrantsByCode.has(grantCode)) {
      const formatterGrant = formatterByCode.get(grantCode) || {};

      mergedGrantsByCode.set(grantCode, {
        code: grantCode,
        title: updateGrant.description || "",
        url: updateGrant.url || "",
        publicationDate: updateGrant.publicationDate || "",
        startDate: updateGrant.startDate || "",
        endDate: updateGrant.endDate || "",
        organization: updateGrant.organization || "",
        description: formatterGrant.description || "",
        requirements: formatterGrant.requirements || "",
        clients: new Set(),
      });
    }

    if (clientId) {
      mergedGrantsByCode.get(grantCode).clients.add(clientId);
    }
  }
}

const formattedResults = Array.from(mergedGrantsByCode.values()).map(
  (grant) => ({
    code: grant.code,
    title: grant.title,
    url: grant.url,
    publicationDate: grant.publicationDate,
    startDate: grant.startDate,
    endDate: grant.endDate,
    organization: grant.organization,
    description: grant.description,
    requirements: grant.requirements,
    clients: Array.from(grant.clients),
  }),
);
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/update_grants_requirements.json",
    JSON.stringify(formattedResults, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
