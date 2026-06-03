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
const notionPurposesRaw = JSON.parse(
  fs.readFileSync("../results/getters/get_notion_purposes.json"),
);
//#endregion

try {
  //#region Node Logic
  const grants = filterFormatGrants;
  const notionBenefactors = notionBenefactorsRaw;
  const notionRegions = notionRegionsRaw;
  const notionPurposes = notionPurposesRaw;

  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function extractNotionTag(item) {
    return item.property_slug.trim();
  }

  const benefactorTagById = new Map(
    notionBenefactors.map((item) => [item.id, extractNotionTag(item)]),
  );
  const regionTagById = new Map(
    notionRegions.map((item) => [item.id, extractNotionTag(item)]),
  );
  const purposeTagById = new Map(
    notionPurposes.map((item) => [item.id, extractNotionTag(item)]),
  );

  const tagsSeoPrincipales = {
    musica: [
      "musica",
      "orquesta",
      "concierto",
      "festival musical",
      "compositor",
    ],
    teatro: ["teatro", "dramatico", "escenico", "representacion", "actores"],
    cine: [
      "cine",
      "rodaje",
      "produccion audiovisual",
      "pelicula",
      "cinematograf",
    ],
    danza: ["danza", "ballet", "coreografia", "danzarin"],
    patrimonio: ["patrimonio", "restauracion", "museo", "historico"],
    formacion: [
      "formacion",
      "cursos",
      "capacitacion",
      "educacion",
      "aprendizaje",
    ],
    economia_digital: [
      "digitalizacion",
      "transformacion digital",
      "software",
      "tic",
    ],
    agroalimentario: ["agro", "agricultura", "ganaderia", "alimentos"],
    turismo: ["turismo", "turistico", "experiencia turistica", "hospedaje"],
    gastronomia: ["gastronomia", "restauracion", "hosteleria", "cocina"],
    salud: ["salud", "bienestar", "sanitario", "medico"],
    energia: ["energia", "renovable", "sostenible", "electrico"],
    economia_circular: ["economia circular", "reciclaje", "residuos"],
    innovacion: ["innovacion", "i+d", "investigacion", "desarrollo"],
    internacionalizacion: [
      "internacionalizacion",
      "exportacion",
      "comercio exterior",
    ],
    comercio: ["comercio", "retail", "venta", "distribucion"],
    movilidad: ["movilidad", "transporte", "logistica"],
  };

  function getSeoTag(title, description) {
    const normalizedTitle = normalizeText(title);
    const normalizedDescription = normalizeText(description);

    for (const [tag, keywords] of Object.entries(tagsSeoPrincipales)) {
      if (keywords.some((kw) => normalizedTitle.includes(kw))) {
        return tag;
      }
    }

    for (const [tag, keywords] of Object.entries(tagsSeoPrincipales)) {
      if (keywords.some((kw) => normalizedDescription.includes(kw))) {
        return tag;
      }
    }

    return null;
  }

  const result = grants.map((grant) => {
    const benefactorTag = benefactorTagById.get(grant.benefactor_id);
    const regionTag = regionTagById.get(grant.region_id);
    const purposeTag = purposeTagById.get(grant.purpose_id);

    const tagSeo = getSeoTag(grant.title, grant.description);

    const tags = [
      ...new Set(
        [benefactorTag, regionTag, purposeTag, tagSeo].filter(Boolean),
      ),
    ].sort();

    return {
      ...grant,
      tags,
      tag_seo: tagSeo,
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
