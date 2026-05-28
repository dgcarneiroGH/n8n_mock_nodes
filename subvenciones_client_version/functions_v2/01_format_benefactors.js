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

// Sustituye esto por la injección de datos real en N8N Ej: $input.all().map(item => item.json)
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

// Sustituye esto por el return de datos correspondiente
try {
  fs.mkdirSync("./results/builders", { recursive: true });
  fs.writeFileSync(
    "./results/builders/benefactors_formatted.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ¡Éxito! Se formatearon ${result.length} beneficiarios.`);
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
