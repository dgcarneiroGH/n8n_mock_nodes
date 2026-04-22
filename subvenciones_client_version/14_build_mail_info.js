const fs = require("fs");

let getClientsRaw, filterAndFormatGrantsRaw;
try {
  getClientsRaw = JSON.parse(
    fs.readFileSync("./results/get_clients.json", "utf8"),
  );
  filterAndFormatGrantsRaw = JSON.parse(
    fs.readFileSync("./results/filter_and_format_grants.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getClients = getClientsRaw;
const filterAndFormatGrants = filterAndFormatGrantsRaw;

//#region Node Logic

// Build a map for quick client info lookup by id
const clientInfoMap = {};
for (const client of getClients) {
  clientInfoMap[String(client.id)] = {
    id: String(client.id),
    name: client.name || client.property_nombre || null,
    email: client.property_correo_electr_nico || null,
  };
}

// Build a map to collect grants per client
const clientGrantsMap = {};
for (const grant of filterAndFormatGrants) {
  if (!Array.isArray(grant.clients)) continue;
  for (const clientId of grant.clients) {
    const id = typeof clientId === "string" ? clientId : clientId.id;
    if (!clientGrantsMap[id]) clientGrantsMap[id] = [];
    // Exclude the clients field from grant info
    const { clients, ...grantInfo } = grant;
    clientGrantsMap[id].push(grantInfo);
  }
}

// Build the final result array
const mailInfo = Object.keys(clientGrantsMap).map((id) => ({
  client: clientInfoMap[id] || { id },
  grants: clientGrantsMap[id],
}));

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/build_mail_info.json",
    JSON.stringify(mailInfo, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
