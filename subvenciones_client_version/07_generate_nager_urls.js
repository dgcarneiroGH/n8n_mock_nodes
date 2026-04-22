const fs = require('fs');

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

const urlCurrent = `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/ES`;
const urlNext = `https://date.nager.at/api/v3/PublicHolidays/${nextYear}/ES`;

const urls= [
  { json: { url_nager: urlCurrent, year: currentYear } },
  { json: { url_nager: urlNext, year: nextYear } }
];

//Sustituye esto por el return de datos correspondiente
try {
  fs.writeFileSync('./results/generate_nager_urls.json', JSON.stringify(urls, null, 2), 'utf8');
  console.log("✅ ¡Éxito! El archivo resultado.json se ha creado o actualizado correctamente en tu carpeta.");
} catch (err) {
  console.error("❌ Error al guardar el archivo:", err.message);
}