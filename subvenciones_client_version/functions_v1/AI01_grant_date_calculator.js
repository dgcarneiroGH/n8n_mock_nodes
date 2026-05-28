const fs = require("fs");

let formatNagerDatesRaw;
try {
  formatNagerDatesRaw = JSON.parse(
    fs.readFileSync("./results/format_nager_dates.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N: const holidays = {{ JSON.stringify($("Format Nager Dates").first().json.valid_holidays) }};
const holidays = formatNagerDatesRaw.valid_holidays;

function isNonWorkingDay(dateStr) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr);
}

const baseDate = $input.item.base_date;
const offset = $input.item.offset_days;
const isBusiness = $input.item.is_business_days;

let currentDate = new Date(baseDate);

if (isBusiness) {
  let added = 0;
  while (added < offset) {
    currentDate.setDate(currentDate.getDate() + 1);
    const formatted = currentDate.toISOString().split("T")[0];
    if (!isNonWorkingDay(formatted)) added++;
  }
} else {
  currentDate.setDate(currentDate.getDate() + offset);
}

const result = {
  calculated_date: currentDate.toISOString().split("T")[0],
};

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/grant_date_calculator.json",
    JSON.stringify(result, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
