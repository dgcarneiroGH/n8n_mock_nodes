const fs = require("fs");

let benefactorsRaw, regionsRaw, purposesRaw;
try {
  benefactorsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_notion_benefactors.json", "utf8"),
  );
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_notion_regions.json", "utf8"),
  );
  purposesRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_notion_purposes.json", "utf8"),
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
      const benefactorCode = benefactor.property_c_digo;
      const regionCode = region.property_c_digo;
      const purposeCode = purpose.property_c_digo;

      combinations.push({
        code: `${benefactorCode}_${regionCode}_${purposeCode}`,
        benefactor_id: benefactor.id,
        region_id: region.id,
        purpose_id: purpose.id,
        benefactor_code: benefactor.property_c_digo,
        region_code: region.property_c_digo,
        purpose_code: purpose.property_c_digo,
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
