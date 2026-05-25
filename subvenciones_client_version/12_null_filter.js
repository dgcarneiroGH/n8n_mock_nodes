const fs = require("fs");

let updateGrantDatesRaw;
try {
  updateGrantDatesRaw = JSON.parse(
    fs.readFileSync("./results/update_grant_dates.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const updateGrantDates = updateGrantDatesRaw;
const errorReports = [];

//#region Node Logic
for (const { client, grants = [] } of updateGrantDates) {
  for (const grant of grants) {
    const missingFields = [];

    // Check top-level grant fields (new schema: publicationDate/startDate/endDate)
    for (const [key, value] of Object.entries(grant)) {
      if (value === null) missingFields.push(key);
    }

    // Backward compatibility: old schema with nested dates object
    if (grant.dates && typeof grant.dates === "object") {
      for (const [dateKey, dateValue] of Object.entries(grant.dates)) {
        if (dateValue === null) missingFields.push(`dates.${dateKey}`);
      }
    }

    // Add report if any missing fields found
    if (missingFields.length) {
      errorReports.push({
        client: client.name,
        grant_code: grant.code || "UNKNOWN_CODE",
        grant_title: grant.title || grant.description || "UNTITLED_GRANT",
        missing_fields: missingFields.join(", "),
        url: grant.url,
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
