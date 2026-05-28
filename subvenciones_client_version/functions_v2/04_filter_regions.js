const fs = require("fs");

let regionsRaw, notionRegionsRaw;
try {
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/builders/regions_formatted.json", "utf8"),
  );
  notionRegionsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_notion_regions.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
const regions = regionsRaw;
const notionResults = notionRegionsRaw;

//#region Node Logic

const result = regions.map((originalItem) => {
  const match = notionResults.find(
    (notionItem) => notionItem.property_id === originalItem.id,
  );

  return {
    ...originalItem,
    existsInNotion: !!match,
    notionPageId: match ? match.id : null,
  };
});

//#endregion

// Sustituye esto por el return de datos correspondiente
try {
  fs.mkdirSync("./results/filters", { recursive: true });
  fs.writeFileSync(
    "./results/filters/filter_regions.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ¡Éxito! Se filtraron ${result.length} regiones.`);
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
