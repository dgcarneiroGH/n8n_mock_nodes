const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const grants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);

const notionTags = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_tags.json"),
);
//#endregion

try {
  //#region Node Logic
  // Initialize the tags map keyed by tag name (property_tag_seo stores slugs)
  const tagsMap = {};
  for (const tag of notionTags) {
    const cleanKeywords = (tag.property_keywords_activas || [])
      .map(kw => (typeof kw === "object" ? kw.name : kw).toLowerCase().trim())
      .filter(kw => kw.length > 0);

    tagsMap[tag.name] = {
      tagId: tag.id,
      count: 0,
      allKeywords: cleanKeywords,
      usedKeywords: new Set(),
    };
  }

  // The "nominativas" tag identifies its grants via the boolean property,
  // in addition to the regular review of each grant's assigned tags
  const nominativasTag = tagsMap["nominativas"];

  // Evaluate each grant against its assigned tags
  const unmatchedSlugs = new Set();
  for (const grant of grants) {
    const title = grant.property_t_tulo || "";
    const description = grant.property_descripci_n || "";
    const grantText = (title + " " + description).toLowerCase();

    if (nominativasTag && grant.property_nominativa === true) {
      nominativasTag.count++;
      for (const kw of nominativasTag.allKeywords) {
        if (grantText.includes(kw)) {
          nominativasTag.usedKeywords.add(kw);
        }
      }
    }

    // Support a single value or an array (n8n may return either)
    const rawTags = grant.property_tag_seo || [];
    const assignedTags = Array.isArray(rawTags) ? rawTags : [rawTags];

    // Iterate only over the tags already assigned to this grant
    for (const tagRelation of assignedTags) {
      // property_tag_seo stores slugs (names), not relation IDs
      const tagName = typeof tagRelation === "object" ? tagRelation.name : tagRelation;

      const tag = tagsMap[tagName];
      if (!tag) {
        unmatchedSlugs.add(tagName);
        continue;
      }

      // The grant belongs to this tag, increment the counter
      tag.count++;

      // Check which of this tag's keywords appear in the grant text
      for (const kw of tag.allKeywords) {
        if (grantText.includes(kw)) {
          tag.usedKeywords.add(kw);
        }
      }
    }
  }

  // Surface the data gap between grants and Notion tags
  if (unmatchedSlugs.size > 0) {
    console.warn(
      `⚠️ Slugs in property_tag_seo without a Notion tag: ${[...unmatchedSlugs].join(", ")}`,
    );
  }

  // Compute unused keywords and build the output payload
  const result = notionTags.map(tag => {
    const entry = tagsMap[tag.name];
    return {
      tagId: entry.tagId,
      totalSubvenciones: entry.count,
      unusedKeywords: entry.allKeywords.filter(kw => !entry.usedKeywords.has(kw)),
    };
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["36_filter_ig_grants"].json
  // - Replace fs.writeFileSync with return [{ json: result }]

  fs.mkdirSync("../results", { recursive: true });
  fs.writeFileSync(
    "../results/builders/cross_data.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `✅ Cross data generado`,
  );
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
