const fs = require("fs");

let clientsRaw, regionsRaw;
try {
  clientsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_clients.json", "utf8"),
  );
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_regions.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const getRegions = regionsRaw;
const getClients = clientsRaw;

//#region Node Logic

function findRegion(regions, name) {
  const norm = name.trim().toLowerCase();
  for (const r of regions) {
    if (r.descripcion && r.descripcion.toLowerCase().includes(norm)) return r;
    if (r.children) {
      const found = findRegion(r.children, name);
      if (found) return found;
    }
  }
  return null;
}

function getRegionIds(regions, name) {
  const region = findRegion(regions, name);
  if (!region) return null;
  const ids = [
    region.id,
    ...(region.children ? region.children.map((c) => c.id) : []),
  ];
  [1, 521].forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  });
  return ids;
}

const processedClients = getClients.map((client) => {
  const ids = getRegionIds(getRegions, client.property_ccaa);
  if (!ids) {
    return {
      status: `ERROR: Region '${client.property_ccaa}' is not valid`,
      clientId: client.id,
      regions_ids: "",
    };
  }
  return { status: "OK", clientId: client.id, regions_ids: ids.join(",") };
});

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_regions.json",
    JSON.stringify(processedClients, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
