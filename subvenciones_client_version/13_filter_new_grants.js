const fs = require("fs");

let mergeFinalDataRaw, getGrantsRaw;
try {
  mergeFinalDataRaw = JSON.parse(
    fs.readFileSync("./results/merge_final_data.json", "utf8"),
  );
  getGrantsRaw = JSON.parse(
    fs.readFileSync("./results/get_grants.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const mergeFinalData = mergeFinalDataRaw;
const getGrants = getGrantsRaw;

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

// Filter out grants already assigned to clients
const filteredResults = [];
for (const { client, grants = [] } of mergeFinalData) {
  const clientId = String(client.id);
  const newGrants = grants.filter((grant) => {
    const code = String(grant.code);
    return !(grantAssignments[code] && grantAssignments[code].has(clientId));
  });
  if (newGrants.length) {
    filteredResults.push({ client, grants: newGrants });
  }
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filter_new_grants.json",
    JSON.stringify(filteredResults, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
