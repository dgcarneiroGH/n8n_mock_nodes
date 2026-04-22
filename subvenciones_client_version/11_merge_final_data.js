const fs = require("fs");

let loopBoeRaw, clientInfoRaw;
try {
  loopBoeRaw = JSON.parse(fs.readFileSync("./results/loop_boe.json", "utf8"));
  clientInfoRaw = JSON.parse(
    fs.readFileSync("./results/build_client_info.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const loopBoe = loopBoeRaw.map((item) => (item.json ? item.json : item));
const clientInfo = clientInfoRaw.map((item) => (item.json ? item.json : item));

//#region Node Logic
const grantsByClientId = {};

clientInfo.forEach(({ grant, client }) => {
  const grantCode = grant.code;
  const boeText =
    (
      loopBoe.find(
        (entry) =>
          typeof entry.texto_boe === "string" &&
          entry.texto_boe.includes(grantCode),
      ) || {}
    ).texto_boe || null;

  if (!grantsByClientId[client.id]) {
    grantsByClientId[client.id] = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      grants: [],
    };
  }
  grantsByClientId[client.id].grants.push({
    code: grant.code,
    title: grant.title,
    agency: grant.agency,
    url: grant.portal_url,
    dates: {
      publicationDate: grant.publication_date,
      startDate: grant.calculated_start_date,
      endDate: grant.calculated_end_date,
    },
    boeText: boeText,
  });
});

// Add clients without grants
const allClientIds = new Set(clientInfo.map(({ client }) => client.id));
Object.values(grantsByClientId).forEach((clientObj) => {
  allClientIds.delete(clientObj.client.id);
});

clientInfo.forEach(({ client }) => {
  if (!grantsByClientId[client.id]) {
    grantsByClientId[client.id] = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      grants: [],
    };
  }
});

const mergedResults = Object.values(grantsByClientId);
//#endregion

try {
  fs.writeFileSync(
    "./results/merge_final_data.json",
    JSON.stringify(mergedResults, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! Cruce completado. Revisa results/merged_final_data.json",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
