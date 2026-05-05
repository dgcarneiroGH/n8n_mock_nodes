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
const regionesJerarquia = regionsRaw;
const clientesOriginales = clientsRaw;

//#region Node Logic

//Helpers
const flattenRegions = (regions) => {
  let result = [];
  for (const region of regions) {
    if (region.id && region.descripcion) {
      result.push({ id: region.id, desc: region.descripcion });
    }
    if (region.children && region.children.length > 0) {
      result = result.concat(flattenRegions(region.children));
    }
  }
  return result;
};

const removeAccents = (str) =>
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
const isExactMatch = (text, word) => {
  if (!word || word.trim() === "") return false;
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp(`\\b${escapedWord}\\b`, "i").test(text);
};

const flatRegions = flattenRegions(regionesJerarquia);
let processedClients = [];

for (const client of clientesOriginales) {
  const province = removeAccents(client.property_provincia?.toLowerCase());
  const region = removeAccents(client.property_ccaa?.toLowerCase());
  let matchedRegions = [];

  for (const reg of flatRegions) {
    const regDesc = removeAccents(reg.desc.toLowerCase());
    const matchProvince = province && isExactMatch(regDesc, province);
    const matchRegion = region && isExactMatch(regDesc, region);
    if (matchProvince || matchRegion) {
      matchedRegions.push(reg);
    }
  }

  // Always include 'Todo el mundo' (1) and 'España' (521)
  const worldRegion = flatRegions.find((r) => r.id === 1) || {
    id: 1,
    desc: "Todo el mundo",
  };
  const spainRegion = flatRegions.find((r) => r.id === 521) || {
    id: 521,
    desc: "España",
  };
  matchedRegions.push(worldRegion, spainRegion);

  // Remove duplicates
  const uniqueRegions = [
    ...new Map(matchedRegions.map((r) => [r.id, r])).values(),
  ];
  const apiRegionIds = uniqueRegions.map((r) => r.id).join(",");

  processedClients.push({
    client: {
      id: client.id,
      name: client.property_nombre || client.name,
      sectors: client.property_sectores || [],
      beneficiary_type: client.property_tipo_beneficiario || [],
    },
    regiones: uniqueRegions,
    regiones_ids_api: apiRegionIds,
  });
}

//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/filters/filter_regiones.json",
    JSON.stringify(processedClients, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
