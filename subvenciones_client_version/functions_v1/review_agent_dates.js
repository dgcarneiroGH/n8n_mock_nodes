const fs = require("fs");

let grantDatesCalculatorAIResponseRaw, flatGrantsForAgentRaw;
try {
  grantDatesCalculatorAIResponseRaw = JSON.parse(
    fs.readFileSync(
      "./results/grant_dates_calculator_AI_response.json",
      "utf8",
    ),
  );
  flatGrantsForAgentRaw = JSON.parse(
    fs.readFileSync("./results/flat_grants_for_agent.json", "utf8"),
  );
  formatNagerDatesRaw = JSON.parse(
    fs.readFileSync("./results/format_nager_dates.json", "utf8"),
  );
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Sustituye esto por la injección de datos real en N8N Ej:$input.all().map(item => item.json)
const aiItems = grantDatesCalculatorAIResponseRaw;
const originalItems = flatGrantsForAgentRaw;
const holidays = formatNagerDatesRaw.valid_holidays || [];

//#region Node Logic
const resultItems = [];

function isNonWorkingDay(dateStr) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr);
}

function calculateExactDate(baseDate, offset, isBusiness) {
  if (offset === null || baseDate === null) return null;

  let currentDate = new Date(baseDate);
  if (isNaN(currentDate.getTime())) return null;

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
  return currentDate.toISOString().split("T")[0];
}

function parseAgentOutput(rawText) {
  let cleanText = (rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  if (!cleanText) return [];

  if (!cleanText.startsWith("[") && cleanText.startsWith("{")) {
    return cleanText
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line.trim()));
  }

  const arrayStartIndex = cleanText.indexOf("[");
  const arrayEndIndex = cleanText.lastIndexOf("]");

  if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
    cleanText = cleanText.substring(arrayStartIndex, arrayEndIndex + 1);
  }

  const parsed = JSON.parse(cleanText);
  return Array.isArray(parsed) ? parsed : [parsed];
}

const rawText = aiItems[0]?.output || "";

try {
  const parsedArray = parseAgentOutput(rawText);
  const originalByCode = new Map(
    originalItems.map((item) => [item.code, item]),
  );

  for (const grant of parsedArray) {
    const calculatedStart =
      grant.start_explicit_date ||
      calculateExactDate(
        grant.publication_date,
        grant.start_offset,
        grant.start_is_business,
      );
    const calculatedEnd =
      grant.end_explicit_date ||
      calculateExactDate(
        grant.publication_date,
        grant.end_offset,
        grant.end_is_business,
      );

    if (calculatedEnd === null) {
      const originalGrant = originalByCode.get(grant.code);
      if (originalGrant) {
        resultItems.push({ ...originalGrant, _route: "gemini_pro" });
      }
      continue;
    }

    resultItems.push({
      code: grant.code,
      publication_date: grant.publication_date,
      calculated_start_date: calculatedStart,
      calculated_end_date: calculatedEnd,
      _route: "success",
    });
  }
} catch (error) {
  for (const orig of originalItems) {
    resultItems.push({ ...orig, _route: "gemini_pro" });
  }
}
//#endregion

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync(
    "./results/review_agent_dates.json",
    JSON.stringify(resultItems, null, 2),
    "utf8",
  );
  console.log(
    "✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.",
  );
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}
