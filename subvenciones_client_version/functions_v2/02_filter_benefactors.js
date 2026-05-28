const fs = require("fs");

let benefactorsRaw, notionBenefactorsRaw;
try {
  benefactorsRaw = JSON.parse(
    fs.readFileSync("./results/builders/benefactors_formatted.json", "utf8"),
  );
  notionBenefactorsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_notion_benefactors.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
const benefactors = benefactorsRaw;
const notionResults = notionBenefactorsRaw;

//#region Node Logic

const result = benefactors.map((originalItem) => {
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
    "./results/filters/filter_benefactors.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ¡Éxito! Se filtraron ${result.length} beneficiarios.`);
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
