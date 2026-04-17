const fs = require('fs');

let loopBoeRaw, clientInfoRaw;
try {
  loopBoeRaw = JSON.parse(fs.readFileSync('./results/loop_boe.json', 'utf8'));
  clientInfoRaw = JSON.parse(fs.readFileSync('./results/build_client_info.json', 'utf8'));
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const loopBoe = loopBoeRaw.map(item => item.json ? item.json : item);
const clientInfo = clientInfoRaw.map(item => item.json ? item.json : item);



//#region Node Logic
// Primero, agrupamos las subvenciones por cliente
const grantsByClientId = {};
clientInfo.forEach(({ grant, client }) => {
  const grantId = grant.id;
  const boeText = (loopBoe.find(
    entry => typeof entry.texto_boe === 'string' && entry.texto_boe.includes(grantId)
  ) || {}).texto_boe || null;

  if (!grantsByClientId[client.id]) {
    grantsByClientId[client.id] = {
      ...client,
      grants: []
    };
  }
  grantsByClientId[client.id].grants.push({
    id: grant.id,
    title: grant.title,
    reception_date: grant.reception_date,
    agency: grant.agency,
    boe_text: boeText
  });
});

// Si hay clientes sin subvenciones, los añadimos con grants: []
const allClientIds = new Set(clientInfo.map(({ client }) => client.id));
Object.values(grantsByClientId).forEach(clientObj => allClientIds.delete(clientObj.id));
// Si hay algún cliente sin subvenciones, añadirlo
clientInfo.forEach(({ client }) => {
  if (!grantsByClientId[client.id]) {
    grantsByClientId[client.id] = {
      ...client,
      grants: []
    };
  }
});

const mergedResults = Object.values(grantsByClientId);
//#endregion

try {
  fs.writeFileSync('./results/merge_final_data.json', JSON.stringify(mergedResults, null, 2), 'utf8');
  console.log("✅ ¡Éxito! Cruce completado. Revisa results/merged_final_data.json");
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}