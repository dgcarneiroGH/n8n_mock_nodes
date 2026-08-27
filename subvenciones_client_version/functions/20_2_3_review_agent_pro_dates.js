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
    const dayOfWeek = new Date(dateStr).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr);
  }

  function calculateExactDate(baseDate, offset, isBusiness) {
    // Guard against null, undefined, and the -1 wildcard sentinel
    if (offset == null || offset === -1 || baseDate == null) return null;

    const currentDate = new Date(baseDate);
    if (isNaN(currentDate.getTime())) return null;

    if (isBusiness) {
      let added = 0;
      while (added < offset) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (!isNonWorkingDay(currentDate.toISOString().split("T")[0])) added++;
      }
    } else {
      currentDate.setDate(currentDate.getDate() + offset);
    }
    return currentDate.toISOString().split("T")[0];
  }

  for (const grant of parsedArray) {
    // Accept both "_days" suffixed and bare offset keys
    const startOffset = grant.start_offset_days ?? grant.start_offset;
    const endOffset = grant.end_offset_days ?? grant.end_offset;

    const calculatedStart =
      grant.start_explicit_date ||
      calculateExactDate(
        grant.publication_date,
        startOffset,
        grant.start_is_business,
      );

    const calculatedEnd =
      grant.end_explicit_date ||
      calculateExactDate(
        grant.publication_date,
        endOffset,
        grant.end_is_business,
      );

    if (calculatedStart === null && calculatedEnd === null) {
      resultItems.push({ ...originalItem });
      continue;
    }

    resultItems.push({
      code: grant.code,
      publication_date: grant.publication_date,
      calculated_start_date: calculatedStart,
      calculated_end_date: calculatedEnd,
    });
  }
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/review_agent_pro_dates.json",
    JSON.stringify(resultItems, null, 2),
  );
  const resultCount = Array.isArray(resultItems) ? resultItems.length : 1;
  console.log(`✅ ${resultCount} grant(s) reviewed`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
