const fs = require('fs');

let organizationsRaw, clientsRaw;
try {
  organizationsRaw = JSON.parse(fs.readFileSync('./results/get_organizations.json', 'utf8'));
  clientsRaw = JSON.parse(fs.readFileSync('./results/get_clients.json', 'utf8'));
} catch (error) {
  console.error("Error leyendo los archivos JSON.", error.message);
  process.exit(1);
}

// Emula el comportamiento de n8n: extrae la propiedad 'json' si existe, si no, asume que es el objeto directo
const organizations = organizationsRaw.map(item => item.json ? item.json : item);
const clients = clientsRaw.map(item => item.json ? item.json : item);

// --- INICIO DE LA LÓGICA DEL NODO ---

// Helpers
const removeAccents = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

const isExactMatch = (text, word) => {
  if (!word || word.trim() === "") return false;
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`\\b${escapedWord}\\b`, 'i').test(text);
};

// Dictionaries
const synonyms = {
  "musica": ["cultura", "artes escenicas", "inaem", "musica"],
  "juventud": ["juventud"],
  "tecnologia": ["digitalizacion", "innovacion", "digital", "i+d+i", "telecomunicaciones", "cdti", "red.es", "sociedad de la informacion", "transformacion digital"],
  "sostenibilidad": ["medio ambiente", "transicion ecologica", "economia circular", "eficiencia energetica", "cambio climatico", "idae"]
};

const forbiddenWords = {
  "musica": ["deporte", "deportes"],
  "juventud": ["asuntos sociales","deporte","deportes"],
  "tecnologia": ["obra civil", "mantenimiento ferroviario", "infraestructuras viarias", "maquinaria pesada"],
  "sostenibilidad": ["inia", "biodiversidad", "residuos"]
};

// 1. Flatten organizations
let flatOrgs = [];
for (const parent of organizations) {
  flatOrgs.push({ id: parent.id, desc: parent.descripcion, parentDesc: parent.descripcion });
  
  if (parent.children && parent.children.length > 0) {
    for (const child of parent.children) {
      flatOrgs.push({ id: child.id, desc: child.descripcion, parentDesc: parent.descripcion });
    }
  }
}

let processedClients = [];

// 2. Iterate clients
for (const client of clients) {
  const rawSectors = client.property_sectores || [];
  const clientSectors = rawSectors.map(s => removeAccents(s.toLowerCase())).filter(s => s !== "");

  let matchedOrgs = [];

  for (const org of flatOrgs) {
    const orgDesc = removeAccents(org.desc.toLowerCase());
    let isMatch = false;

    for (const sector of clientSectors) {
      const exclusions = forbiddenWords[sector] || [];
      
      const validExclusions = exclusions.filter(excl => {
        const normalizedExcl = removeAccents(excl.toLowerCase());
        return !clientSectors.some(s => s.includes(normalizedExcl) || normalizedExcl.includes(s));
      });

      const hasForbiddenWord = validExclusions.some(word => isExactMatch(orgDesc, removeAccents(word.toLowerCase())));
      if (hasForbiddenWord) continue;

      const keywords = synonyms[sector] || [];
      const hasKeyword = isExactMatch(orgDesc, sector) || keywords.some(kw => isExactMatch(orgDesc, kw));

      if (hasKeyword) {
        isMatch = true;
        break; 
      }
    }

    if (isMatch) matchedOrgs.push(org);
  }

  // 3. Remove duplicates and prepare API string
  const uniqueOrgs = [...new Map(matchedOrgs.map(org => [org.id, org])).values()];
  const apiIds = uniqueOrgs.map(org => org.id).join(',');

  processedClients.push({    
      client:{
        id: client.id,
        name: client.property_nombre,
        sectors: client.property_sectores
      },
      organizations: uniqueOrgs,
      organizations_api_ids: apiIds    
  });
}

// --- FIN DE LA LÓGICA DEL NODO ---

try {
  fs.writeFileSync('./results/filter_organismos.json', JSON.stringify(processedClients, null, 2), 'utf8');
  console.log("✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.");
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}