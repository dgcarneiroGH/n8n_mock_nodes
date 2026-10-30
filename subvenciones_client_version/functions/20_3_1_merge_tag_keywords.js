const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const checkedKeywords = JSON.parse(
  fs.readFileSync("../results/getters/get_checked_keywords.json"),
);
const existingTags = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_tags.json"),
);
const grants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);
//#endregion

try {
  //#region Node Logic
  // Cross data: scan grants against their assigned tags
  // Initialize the tags map keyed by tag name (property_tag_seo stores slugs)
  const tagsMap = {};
  for (const tag of existingTags) {
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

  // Record which of a tag's keywords appear in the grant text
  const trackUsedKeywords = (tag, grantText) => {
    for (const kw of tag.allKeywords) {
      if (grantText.includes(kw)) {
        tag.usedKeywords.add(kw);
      }
    }
  };

  // Evaluate each grant against its assigned tags
  const unmatchedSlugs = new Set();
  for (const grant of grants) {
    const title = grant.property_t_tulo || "";
    const description = grant.property_descripci_n || "";
    const grantText = (title + " " + description).toLowerCase();

    if (nominativasTag && grant.property_nominativa === true) {
      nominativasTag.count++;
      trackUsedKeywords(nominativasTag, grantText);
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
      trackUsedKeywords(tag, grantText);
    }
  }

  // Surface the data gap between grants and Notion tags
  if (unmatchedSlugs.size > 0) {
    console.warn(
      `⚠️ Slugs in property_tag_seo without a Notion tag: ${[...unmatchedSlugs].join(", ")}`,
    );
  }

  // Merge checked keywords into the tags' active keywords
  const existingTagsMap = new Map(
    existingTags.map(tag => [tag.id, tag.property_keywords_activas || []])
  );
  const flaggedUnusedMap = new Map(
    existingTags.map(tag => [tag.id, new Set(tag.property_keywords_sin_uso || [])])
  );

  const tagsToUpdate = new Map();

  for (const kw of checkedKeywords) {
    const keyword = kw.property_palabra_clave;
    const tagId = kw.property_categoría?.[0];

    if (keyword && tagId && existingTagsMap.has(tagId)) {
      if (!tagsToUpdate.has(tagId)) {
        tagsToUpdate.set(tagId, new Set(existingTagsMap.get(tagId)));
      }
      tagsToUpdate.get(tagId).add(keyword);
    }
  }

  // nominativas must always be updated, even without new checked keywords
  if (nominativasTag && !tagsToUpdate.has(nominativasTag.tagId)) {
    tagsToUpdate.set(
      nominativasTag.tagId,
      new Set(existingTagsMap.get(nominativasTag.tagId))
    );
  }

  // Enrich each update with the cross data computed for its tag
  const crossByTagId = new Map(existingTags.map(tag => [tag.id, tagsMap[tag.name]]));

  const result = Array.from(tagsToUpdate.entries()).map(([tag_id, keywords]) => {
    const cross = crossByTagId.get(tag_id);
    return {
      tag_id,
      updated_keywords: Array.from(keywords).filter(
        kw => !flaggedUnusedMap.get(tag_id).has(kw)
      ),
      totalSubvenciones: cross.count,
      unusedKeywords: cross.allKeywords.filter(kw => !cross.usedKeywords.has(kw)),
    };
  });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  //   (checked keywords, notion grants and notion tags getters)
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/merge_tag_keywords.json",
    JSON.stringify(result, null, 2),
  );
  const resultCount = Array.isArray(result) ? result.length : 1;
  console.log(`✅ ${resultCount} grant(s) reviewed`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
