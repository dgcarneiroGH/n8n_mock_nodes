const fs = require("fs");

let benefactorsRaw;
try {
  benefactorsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_benefactors.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

const benefactors = benefactorsRaw;

//#region Node Logic

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const result = benefactors.map((item) => ({
  id: item.id.toString(),
  description: item.descripcion,
  slug: generateSlug(item.descripcion),
}));

//#endregion

try {
  fs.mkdirSync("./results/builders", { recursive: true });
  fs.writeFileSync(
    "./results/builders/benefactors_formatted.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ${result.length} benefactors formatted`);
} catch (err) {
  console.error(`❌ Error saving file: ${err.message}`);
}
