const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const parsedData = JSON.parse(
  fs.readFileSync("../results/builders/format_agent_response.json"),
);
const parsedArray = Array.isArray(parsedData) ? parsedData : (parsedData.output || [parsedData]);
console.log(parsedArray);

const originalItem = JSON.parse(
  fs.readFileSync("../results/builders/merge_notion_dates.json"),
);
const holidays = JSON.parse(
  fs.readFileSync("../results/format_nager_dates.json"),
);

//#endregion

try {
  //#region Node Logic
  const resultItems = [];

  function isNonWorkingDay(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr);
  }

  function calculateExactDate(baseDate, offset, isBusiness) {
    if (offset === null || offset === -1 || baseDate === null) return null;

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

  let originalCodeProcessed = false;

  for (const grant of parsedArray) {
    // 1. HALLUCINATION DETECTION (model returned schema or garbage)
    // If there is no code, or the code is not text, skip this result.
    if (!grant.code || typeof grant.code !== "string" || grant.type === "object") {
      continue;
    }

    const calculatedStart = grant.start_explicit_date === ""
      ? ""
      : (grant.start_explicit_date || calculateExactDate(grant.publication_date, grant.start_offset, grant.start_is_business));

    const calculatedEnd = grant.end_explicit_date === "" || !grant.end_explicit_date
      ? ""
      : (grant.end_explicit_date || calculateExactDate(grant.publication_date, grant.end_offset, grant.end_is_business));

    // If calculated dates are null, the AI failed at extraction
    if (!calculatedEnd || !calculatedStart) {
      continue;
    }

    // On full success, store the result and mark the code as processed
    if (grant.code === originalItem?.code) originalCodeProcessed = true;

    resultItems.push({
      code: grant.code,
      publication_date: grant.publication_date,
      calculated_start_date: calculatedStart,
      calculated_end_date: calculatedEnd,
      _route: "success",
    });
  }

  if (!originalCodeProcessed) {
    resultItems.push({ ...originalItem, _route: "gemini_pro" });
  }
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/review_agent_lite_dates.json",
    JSON.stringify(resultItems, null, 2),
  );
  const resultCount = Array.isArray(resultItems) ? resultItems.length : 1;
  console.log(`✅ ${resultCount} grant(s) reviewed`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
