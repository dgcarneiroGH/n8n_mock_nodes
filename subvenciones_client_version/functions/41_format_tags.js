const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const seoTags = JSON.parse(
  fs.readFileSync("../results/getters/get_seo_tags.json"),
).seo_tags;
const nominatives = JSON.parse(
  fs.readFileSync("../results/getters/get_seo_tags.json"),
).nominativas;

const notionTags = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_tags.json"),
);
//#endregion

try {
  //#region Node Logic

  // Build an instant-lookup dictionary of Notion tags by normalized name
  const notionMap = new Map();
  for (const item of notionTags) {
    if (item.property_tag) {
      notionMap.set(item.property_tag.toLowerCase().trim(), item.id);
    }
  }

  // Cross seo_tags entries against the Notion dictionary
  const result = Object.entries(seoTags).map(([tagName, keywords]) => {
    const notionId = notionMap.get(tagName.toLowerCase().trim());

    return {
      tag: tagName,
      keywords,
      existsInNotion: !!notionId,
      notionPageId: notionId || ""
    };
  });

  // Add the nominatives as one more tag (their keywords are the nominatives themselves)
  const nominativeId = notionMap.get("nominativas");
  result.push({
    tag: "nominativas",
    keywords: nominatives,
    existsInNotion: !!nominativeId,
    notionPageId: nominativeId || ""
  });

  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["36_filter_ig_grants"].json
  // - Replace fs.writeFileSync with return [{ json: result }]

  fs.mkdirSync("../results", { recursive: true });
  fs.writeFileSync(
    "../results/builders/format_tags.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ Tags SEO correctamente formateados`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
