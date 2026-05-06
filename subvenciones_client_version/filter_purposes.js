const fs = require("fs");

let getPurposesRaw, getClientsRaw;
try {
  getPurposesRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_purposes.json", "utf8"),
  );
  getClientsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_clients.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getPurposes = getPurposesRaw;
const getClients = getClientsRaw;

//#region Node Logic
const normalizeString = (str) =>
  str
    ? str
        .normalize("NFD")
        //Remove accents
        .replace(/[\u0300-\u036f]/g, "")
        //Remove commas
        .replace(/,/g, "")
        .toLowerCase()
    : "";
const EXPECTED_PURPOSES = 21;

function getPurposeIds(purposes, clientPurposes) {
  const ids = purposes
    .filter((p) =>
      (clientPurposes || []).some(
        (cp) => normalizeString(cp) === normalizeString(p.descripcion),
      ),
    )
    .map((p) => p.id);

  // Always include these general ids
  [21, 18, 4, 19].forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  });
  return ids;
}

function findInvalidPurpose(purposes, clientPurposes) {
  return (clientPurposes || []).find(
    (purpose) =>
      !purposes.some(
        (p) => normalizeString(p.descripcion) === normalizeString(purpose),
      ),
  );
}

function filterPurposes(clients, purposes) {
  return clients.map((client) => {
    const invalidPurpose = findInvalidPurpose(
      purposes,
      client.property_finalidades,
    );
    if (invalidPurpose) {
      return { status: `ERROR: Purpose '${invalidPurpose}' is not valid` };
    }
    const ids = getPurposeIds(purposes, client.property_finalidades);
    return {
      status: "OK",
      client_id: client.id,
      purposes_ids: ids.join(","),
    };
  });
}

let result;
if (getPurposes.length !== EXPECTED_PURPOSES) {
  result = { status: "ERROR: Purpose count mismatch" };
} else {
  // Check for any invalid purposes in all clients
  let invalidPurpose = null;
  for (const client of getClients) {
    invalidPurpose = findInvalidPurpose(
      getPurposes,
      client.property_finalidades,
    );
    if (invalidPurpose) break;
  }
  if (invalidPurpose) {
    result = { status: `ERROR: Purpose '${invalidPurpose}' is not valid` };
  } else {
    result = filterPurposes(getClients, getPurposes);
  }
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_purposes.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
