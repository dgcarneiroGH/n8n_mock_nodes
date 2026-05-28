const fs = require("fs");

let getBenefactorsRaw, getClientsRaw;
try {
  getBenefactorsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_benefactors.json", "utf8"),
  );
  getClientsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_clients.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getBenefactors = getBenefactorsRaw;
const getClients = getClientsRaw;

//#region Node Logic
const EXPECTED_BENEFACTORS = 5;
const synonymMap = {
  "Asociacion u ONG":
    "PERSONAS JURÍDICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA",
  "PYME o autónomo":
    "PYME Y PERSONAS FÍSICAS QUE DESARROLLAN ACTIVIDAD ECONÓMICA",
  "Particular": "PERSONAS FÍSICAS QUE NO DESARROLLAN ACTIVIDAD ECONÓMICA",
  "Gran empresa": "GRAN EMPRESA",
};

function mapBenefactorTypes(clientTypes, synonymMap) {
  return (clientTypes || []).map((type) => synonymMap[type]).filter(Boolean);
}

function getBenefactorIds(benefactors, mappedDescriptions) {
  const ids = benefactors
    .filter((b) => mappedDescriptions.includes(b.descripcion))
    .map((b) => b.id);
  // Include always general IDS
  if (!ids.includes(5)) ids.push(5);
  return ids;
}

function filterBenefactors(clients, benefactors, synonymMap) {
  return clients.map((client) => {
    const mappedDescriptions = mapBenefactorTypes(
      client.property_tipo_beneficiario,
      synonymMap,
    );
    const ids = getBenefactorIds(benefactors, mappedDescriptions);
    return {
      status: "OK",
      client_id: client.id,
      benefactors_ids: ids.join(","),
    };
  });
}

let result;
if (getBenefactors.length !== EXPECTED_BENEFACTORS) {
  result = { status: "ERROR: Benefactor count mismatch" };
} else {
  result = filterBenefactors(getClients, getBenefactors, synonymMap);
}

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_benefactors.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
