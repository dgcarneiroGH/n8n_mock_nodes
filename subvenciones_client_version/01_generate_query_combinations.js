const fs = require("fs");

let benefactorsRaw, regionsRaw, purposesRaw;
try {
  benefactorsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_benefactors.json", "utf8"),
  );
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_regions.json", "utf8"),
  );
  purposesRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_purposes.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
const benefactors = benefactorsRaw;
const regions = regionsRaw;
const purposes = purposesRaw;

//#region Node Logic

const topLevelRegions = regions.filter(
  (r) =>
    !regions.some(
      (other) =>
        other.children && other.children.some((child) => child.id === r.id),
    ),
);

const combinations = [];
for (const benefactor of benefactors) {
  for (const region of topLevelRegions) {
    for (const purpose of purposes) {
      combinations.push({
        id: `${benefactor.id}_${region.id}_${purpose.id}`,
        benefactor_id: benefactor.id,
        region_id: region.id,
        purpose_id: purpose.id,
        benefactor_description: benefactor.descripcion,
        region_description: region.descripcion,
        purpose_description: purpose.descripcion,
      });
    }
  }
}

//#endregion

// Sustituye esto por el return de datos correspondiente
try {
  fs.mkdirSync("./results/builders", { recursive: true });
  fs.writeFileSync(
    "./results/builders/query_combinations.json",
    JSON.stringify(combinations, null, 2),
    "utf8",
  );
  console.log(
    `✅ ¡Éxito! Se generaron ${combinations.length} combinaciones de query.`,
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
