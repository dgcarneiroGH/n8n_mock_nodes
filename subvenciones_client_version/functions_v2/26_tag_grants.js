const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const filterFormatGrants = JSON.parse(
  fs.readFileSync("../results/filters/filter_format_grants.json"),
);
const notionBenefactorsRaw = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_benefactors.json"),
);
const notionRegionsRaw = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_regions.json"),
);
const seoTagsRaw = JSON.parse(
  fs.readFileSync("../results/getters/get_seo_tags.json"),
);
//#endregion

try {
  //#region Node Logic
  const grants = filterFormatGrants;
  const seoTags = seoTagsRaw.seo_tags;

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function matchesKeyword(text, keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  }

  function findSeoTag(title, description) {
    const normalizedTitle = normalizeText(title);
    const normalizedDesc = normalizeText(description);

    let bestTag = null;
    let maxScore = 0;

    for (const [tag, keywords] of Object.entries(seoTags)) {
      let score = 0;
      for (const kw of keywords) {
        if (matchesKeyword(normalizedTitle, kw)) score += 3;
        if (matchesKeyword(normalizedDesc, kw)) score += 1;
      }
      if (score > maxScore) {
        maxScore = score;
        bestTag = tag;
      }
    }

    return bestTag;
  }

  const benefactorTagsById = new Map(
    notionBenefactorsRaw.map((item) => [item.id, item.property_slug.trim()]),
  );
  const regionTagsById = new Map(
    notionRegionsRaw.map((item) => [item.id, item.property_slug.trim()]),
  );

  const result = grants.map((grant) => {
    const seoTag = findSeoTag(grant.title, grant.description);
    const tags = [
      ...new Set(
        [
          grant.benefactor_id && benefactorTagsById.get(grant.benefactor_id),
          grant.region_id && regionTagsById.get(grant.region_id),
        ].filter(Boolean),
      ),
    ].sort();

    return {
      ...grant,
      tags,
      tag_seo: seoTag,
      manual_check: seoTag === null,
    };
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/tag_grants.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} grants tagged`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
