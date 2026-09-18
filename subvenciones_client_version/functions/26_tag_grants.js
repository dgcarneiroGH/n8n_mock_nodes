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
  const getNominativas = seoTagsRaw.nominativas;

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function matchesKeyword(text, keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\W)${escaped}($|\\W)`).test(text);
  }

  function isNominative(title, description) {
    const normalizedTitle = normalizeText(title);
    const normalizedDesc = normalizeText(description);
    return getNominativas.some(
      (kw) =>
        matchesKeyword(normalizedTitle, kw) ||
        matchesKeyword(normalizedDesc, kw),
    );
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

  function findRegionTag(title, description) {
    const normalizedTitle = normalizeText(title);
    const normalizedDesc = normalizeText(description);

    let bestTag = null;
    let maxScore = 0;

    for (const { slug, name } of searchableRegions) {
      let score = 0;
      if (matchesKeyword(normalizedTitle, name)) score += 3;
      if (matchesKeyword(normalizedDesc, name)) score += 1;
      if (score > maxScore) {
        maxScore = score;
        bestTag = slug;
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
  const regionsById = new Map(notionRegionsRaw.map((item) => [item.id, item]));

  const searchableRegions = notionRegionsRaw
    .filter(
      (item) =>
        item.property_tipo === "provincia" || item.property_tipo === "ccaa",
    )
    .map((item) => ({
      slug: item.property_slug.trim(),
      name: normalizeText(item.property_descripci_n),
    }));

  const result = grants.map((grant) => {
    const title = grant.title || "";
    const description = grant.description || "";
    const seoTag = findSeoTag(title, description);
    const region = grant.region_id && regionsById.get(grant.region_id);
    let regionTag = region && regionTagsById.get(grant.region_id);
    if (
      region &&
      region.property_tipo !== "provincia" &&
      region.property_tipo !== "ccaa"
    ) {
      regionTag = findRegionTag(title, description) || "espana";
    }
    const tags = [
      ...new Set(
        [
          grant.benefactor_id && benefactorTagsById.get(grant.benefactor_id),
          regionTag,
        ].filter(Boolean),
      ),
    ].sort();

    return {
      ...grant,
      tags,
      tag_seo: seoTag,
      manual_check: seoTag === null,
      is_nominative: isNominative(title, description),
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
