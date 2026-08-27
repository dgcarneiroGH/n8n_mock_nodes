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

try {
  fs.mkdirSync("./results/filters", { recursive: true });
  fs.writeFileSync(
    "./results/filters/filter_regions.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ${result.length} regions filtered`);
} catch (err) {
  console.error(`❌ Error saving file: ${err.message}`);
}
