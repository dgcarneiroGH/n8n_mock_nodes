// Script para ejecutar todos los scripts en orden, esperando a que termine cada uno antes de continuar.
// Uso: node run_all.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detectar todos los archivos .js que empiezan por un número y no sean este mismo script
const allFiles = fs.readdirSync(__dirname);
const scriptRegex = /^\d+.*\.js$/;
const thisScript = path.basename(__filename);

const scripts = allFiles
  .filter(f => scriptRegex.test(f) && f !== thisScript)
  .sort((a, b) => {
    // Extraer el número inicial para ordenar correctamente
    const numA = parseInt(a.match(/^\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/^\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\nEjecutando: ${script}`);
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌ Error ejecutando ${script}:`, err.message);
    process.exit(1);
  }
}

console.log('\n✅ Flujo completo ejecutado con éxito.');
