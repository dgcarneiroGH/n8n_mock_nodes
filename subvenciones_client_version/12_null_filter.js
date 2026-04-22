const fs = require("fs");

let mergeFinalDataRaw;
try {
  mergeFinalDataRaw = JSON.parse(
    fs.readFileSync("./results/merge_final_data.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const mergeFinalData = mergeFinalDataRaw;
const errorReports = [];

//#region Node Logic
for (const { client, grants = [] } of mergeFinalData) {
  for (const grant of grants) {
    const missingFields = [];

    // Check top-level grant fields
    for (const key in grant) {
      if (grant[key] === null) missingFields.push(key);
    }

    // Check nested 'dates' fields if present
    if (grant.dates && typeof grant.dates === "object") {
      for (const dateKey in grant.dates) {
        if (grant.dates[dateKey] === null)
          missingFields.push(`dates.${dateKey}`);
      }
    }

    // Add report if any missing fields found
    if (missingFields.length) {
      errorReports.push({
        client: client.name,
        grant_code: grant.code || "UNKNOWN_CODE",
        grant_title: grant.title,
        missing_fields: missingFields.join(", "),
      });
    }
  }
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/null_filter.json",
    JSON.stringify(errorReports, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! Cruce completado. Revisa results/merged_final_data.json",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
