const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const filterResult = JSON.parse(
  fs.readFileSync("../results/filters/filter_page_candidates.json"),
);
const existingPages = JSON.parse(
  fs.readFileSync("../results/getters/get_existing_pages.json"),
);
//#endregion

try {
  //#region Node Logic
  const existingSet = new Set(existingPages.existing_slugs);

  const pagesToCreate = filterResult.desired_create_pages.filter(
    (group) => !existingSet.has(group.slug),
  );

  const result = {
    pages_to_create: pagesToCreate,
    pages_to_update: [...existingPages.existing_slugs],
  };
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/page_actions.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ ${pagesToCreate.length} pages to create, ${result.pages_to_update.length} pages to update`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}