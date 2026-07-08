const fs = require("fs");

// Replace this with real n8n data injection, for example: $input.all().map(item => item.json)
//#region Inputs
const notionGrants = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_grants.json"),
);
const notionBenefactors = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_benefactors.json"),
);
const notionRegions = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_regions.json"),
);
//#endregion

try {
  //#region Node Logic
  const normalizeText = (value) =>
    typeof value === "string" ? value.trim() : "";

  const normalizeTagSeo = (value) => normalizeText(value).toLowerCase();

  const getTags = (grant) => {
    const rawTags = Array.isArray(grant.property_tags)
      ? grant.property_tags
      : Array.isArray(grant.tags)
        ? grant.tags
        : [];

    return rawTags
      .map((tag) => normalizeText(tag).toLowerCase())
      .filter(Boolean);
  };

  const getReceivedDate = (grant) => {
    const directDate = normalizeText(
      grant.property_fecha_recepci_n,
    );
    if (directDate) {
      return directDate;
    }

    const taggedAt = normalizeText(grant.property_ltima_vez_tageado?.start);
    return taggedAt ? taggedAt.slice(0, 10) : null;
  };

  const getGrantCode = (grant) =>
    normalizeText(grant.property_c_digo || grant.code || grant.name);

  const sentenceCase = (value) => {
    if (typeof value !== "string" || value.length === 0) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const benefactorById = new Map(
    notionBenefactors.map((b) => [b.id, b]),
  );

  const regionById = new Map(notionRegions.map((r) => [r.id, r]));

  const getBenefactorName = (grant) => {
    const ids = Array.isArray(grant.property_id_beneficiario)
      ? grant.property_id_beneficiario
      : [];
    const firstId = ids[0];
    if (!firstId) return "";
    const benefactor = benefactorById.get(firstId);
    return benefactor ? sentenceCase(normalizeText(benefactor.name)) : "";
  };

  const getRegionName = (grant) => {
    const ids = Array.isArray(grant.property_id_regi_n)
      ? grant.property_id_regi_n
      : [];
    const firstId = ids[0];
    if (!firstId) return "";
    const region = regionById.get(firstId);
    return region ? sentenceCase(normalizeText(region.name)) : "";
  };

  const groupsByKey = new Map();

  for (const grant of notionGrants) {
    const tags = getTags(grant);
    const tagSeo = normalizeTagSeo(grant.tag_seo || grant.property_tag_seo);

    if (tags.length === 0 || !tagSeo) {
      continue;
    }

    const receivedDate = getReceivedDate(grant);
    const grantCode = getGrantCode(grant);
    const tagsKey = tags.join("__");
    const key = `${tagsKey}__${tagSeo}`;

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        tags,
        tag_seo: tagSeo,
        grants: new Map(),
        max_received_date: null,
        slug: `subvenciones-${tags.join("-")}-${tagSeo}`,
      });
    }

    const group = groupsByKey.get(key);
    if (grantCode && !group.grants.has(grantCode)) {
      group.grants.set(grantCode, {
        code: grantCode,
        agency: sentenceCase(normalizeText(grant.property_rgano)),
        url: grant.property_url,
        title: sentenceCase(normalizeText(grant.property_t_tulo)),
        description: sentenceCase(normalizeText(grant.property_descripci_n)),
        requirements: grant.property_requisitos
          .split(";")
          .map((r) => sentenceCase(normalizeText(r))),
        budget: grant.property_presupuesto,
        receptionDate: grant.property_fecha_de_recepci_n?.start ?? '',
        startDate: grant.property_fecha_de_inicio_de_convocatoria?.start ?? '',
        endDate: grant.property_fecha_de_fin_de_convocatoria?.start ?? '',
        benefactor: getBenefactorName(grant),
        region: getRegionName(grant),
      });
    }

    if (
      receivedDate &&
      (!group.max_received_date || receivedDate > group.max_received_date)
    ) {
      group.max_received_date = receivedDate;
    }
  }
  const result = [...groupsByKey.values()]
    .map((group) => ({
      ...group,
      count_grants: group.grants.size,
      grants: [...group.grants.values()],
    }))
    .sort((a, b) => {
      const dateA = a.max_received_date || "";
      const dateB = b.max_received_date || "";

      if (dateA !== dateB) {
        return dateA < dateB ? 1 : -1;
      }

      if (a.count_grants !== b.count_grants) {
        return b.count_grants - a.count_grants;
      }

      const keyA = `${a.tags.join("-")}-${a.tag_seo}`;
      const keyB = `${b.tags.join("-")}-${b.tag_seo}`;
      return keyA.localeCompare(keyB);
    });
  //#endregion

  // In n8N context:
  // - Replace fs.readFileSync with $node["<previous-node-name>"].json.body.output
  // - Replace fs.writeFileSync with output variable returned

  fs.mkdirSync("../results/builders", { recursive: true });
  fs.writeFileSync(
    "../results/builders/group_page_candidates.json",
    JSON.stringify(result, null, 2),
  );
  console.log(`✅ ${result.length} grouped page candidates`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
}
