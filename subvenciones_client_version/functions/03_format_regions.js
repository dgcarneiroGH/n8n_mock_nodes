const fs = require("fs");

let regionsRaw;
try {
  regionsRaw = JSON.parse(
    fs.readFileSync("./results/getters/get_regions.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

const regions = regionsRaw;

//#region Node Logic

function generateSlug(text) {
  const afterDash = text.includes(" - ") ? text.split(" - ")[1] : text;
  return afterDash
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function determineType(description) {
  const codeMatch = description.match(/^([A-Z]{2})(\d*)/);
  if (!codeMatch) {
    return "pais";
  }

  const digits = codeMatch[2];

  if (digits === "") {
    return "pais";
  } else if (digits.length === 1) {
    return "region";
  } else if (digits.length === 2) {
    return "ccaa";
  } else {
    return "provincia";
  }
}

function extractAllRegions(regionList, collected = []) {
  for (const region of regionList) {
    collected.push({
      id: region.id.toString(),
      description: region.descripcion.split("-").pop().trim(),
      slug: generateSlug(region.descripcion),
      type: determineType(region.descripcion),
    });

    if (region.children && region.children.length > 0) {
      extractAllRegions(region.children, collected);
    }
  }
  return collected;
}

const spainRegion = regions.find((region) => Number(region.id) === 1);
const result = extractAllRegions([spainRegion]);
//#endregion

try {
  fs.mkdirSync("./results/builders", { recursive: true });
  fs.writeFileSync(
    "./results/builders/regions_formatted.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(`✅ ${result.length} regions formatted`);
} catch (err) {
  console.error(`❌ Error saving file: ${err.message}`);
}
