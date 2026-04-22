const fs = require("fs");

let mergeFinalDataRaw, getGrantsRaw, getFinalInfoAgentCreatorRaw;
try {
  mergeFinalDataRaw = JSON.parse(
    fs.readFileSync("./results/merge_final_data.json", "utf8"),
  );
  getGrantsRaw = JSON.parse(
    fs.readFileSync("./results/get_grants.json", "utf8"),
  );
  getFinalInfoAgentCreatorRaw = JSON.parse(
    fs.readFileSync("./results/get_final_info_agent_creator.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const mergeFinalData = mergeFinalDataRaw;
const getGrants = getGrantsRaw;
const getFinalInfoAgentCreator = getFinalInfoAgentCreatorRaw;

//#region Node Logic
// Build a lookup map: { grantCode: Set([clientId, ...]) }
const grantAssignments = {};
for (const grantItem of getGrants) {
  const grantCode = String(grantItem.property_c_digo_bdns);
  const assignedClients = grantItem.property_clientes || [];
  if (grantCode && grantCode !== "null" && grantCode !== "") {
    if (!grantAssignments[grantCode]) grantAssignments[grantCode] = new Set();
    assignedClients.forEach((clientId) =>
      grantAssignments[grantCode].add(String(clientId)),
    );
  }
}

// Build a lookup for agent creator info: { grantCode: { description, requirements } }
const agentCreatorInfo = {};
for (const group of getFinalInfoAgentCreator) {
  for (const grant of group.grants || []) {
    agentCreatorInfo[String(grant.code)] = {
      description: grant.description || null,
      requirements: grant.requirements || null,
    };
  }
}

// Helper to extract grant URL, title, publicationDate, startDate, endDate, agency
function extractGrantFields(grant) {
  return {
    title: grant.title || null,
    url: grant.url || null,
    publicationDate: grant.dates?.publicationDate || null,
    startDate: grant.dates?.startDate || null,
    endDate: grant.dates?.endDate || null,
    agency: grant.agency || null,
  };
}

// Map: { code: { ...fields, clients: Set() } }
const grantsMap = {};

for (const { client, grants = [] } of mergeFinalData) {
  const clientId = String(client.id);
  for (const grant of grants) {
    const code = String(grant.code);
    // Skip if already assigned
    if (grantAssignments[code] && grantAssignments[code].has(clientId))
      continue;

    if (!grantsMap[code]) {
      const { title, url, publicationDate, startDate, endDate, agency } =
        extractGrantFields(grant);
      const agentInfo = agentCreatorInfo[code] || {};
      grantsMap[code] = {
        code,
        title,
        url,
        publicationDate,
        startDate,
        endDate,
        agency,
        description: agentInfo.description || null,
        requirements: agentInfo.requirements || null,
        clients: new Set(),
      };
    }
    grantsMap[code].clients.add(clientId);
  }
}

// Format output
const formattedResults = Object.values(grantsMap).map((grant) => ({
  code: grant.code,
  title: grant.title,
  url: grant.url,
  publicationDate: grant.publicationDate,
  startDate: grant.startDate,
  endDate: grant.endDate,
  agency: grant.agency,
  description: grant.description,
  requirements: grant.requirements,
  clients: Array.from(grant.clients),
}));
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filter_and_format_grants.json",
    JSON.stringify(formattedResults, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
