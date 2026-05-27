# Fase 3 — Generación y despliegue automático de webs (Hugo + GitHub + Netlify)

## Objetivo
Generar automáticamente 3-5 webs temáticas cada día basadas en combinaciones de `región + tag_seo`, con despliegue automático sin intervención manual.

## Stack elegido: Hugo + GitHub + Netlify

**Por qué esta opción:**
- ✅ Costo: ~€10/año (solo dominio)
- ✅ Deploy automático en cada push
- ✅ Velocidad: compila 100 páginas en <30 segundos
- ✅ SEO: HTML puro
- ✅ Escalable: miles de páginas sin problema
- ✅ Curva de aprendizaje corta

## Requisitos previos

- ✓ Cuenta GitHub (gratuita)
- ✓ Cuenta Netlify (gratuita)
- ✓ Git instalado localmente
- ✓ Hugo instalado localmente (opcional, Netlify lo instala)
- ✓ Notion con tablas Query History + Subvenciones pobladas (Fase 1 + 2)
- ✓ n8n funcionando con acceso a Notion API

## Base de datos: Estrategia Notion → PostgreSQL

### Fase 1-2 (Ahora): Mantén Notion

**Por qué:**
- ✅ Ya está configurado
- ✅ Interfaz visual para revisar datos manualmente
- ✅ Zero mantenimiento
- ✅ API integrada con n8n (connector nativo)
- ✅ Cero fricción = Máxima velocidad de desarrollo

**Limitaciones (aún no relevantes):**
- ⚠️ API REST más lenta (~500ms por query)
- ⚠️ Rate limiting si escalas masivamente
- ⚠️ Costo: gratuito ahora, €12-15/mes si necesitas plan Team

```
Volumen esperado: <100K registros total → Notion funciona perfectamente
```

### Fase 3 (Después): Migra a PostgreSQL en Oracle VPS

**Por qué esperar:**
- Sabes exactamente qué datos necesitas (cero sorpresas)
- El sistema ya funciona → migración es trivial (10 minutos)
- Velocidad importa más: queries <50ms vs. 500ms
- Costo: €0 (tu servidor Oracle ya existe)
- Sin downtime

**Ventajas de PostgreSQL:**
- ✅ Queries muy rápidas (<50ms)
- ✅ Escritura masiva eficiente (batch inserts)
- ✅ Sin límites de rate limiting
- ✅ Acceso desde n8n igual de fácil (connector nativo)
- ✅ Exportación de datos trivial

### Plan de migración (fácil)

```
Semana 1-2: Sistema funcionando en Notion
    ↓
Semana 3: Migración a PostgreSQL (10 minutos)
    1. Exportar datos de Notion (1 click)
    2. Crear schema PostgreSQL en Oracle (5 min)
    3. Importar datos (2 min)
    4. Cambiar connection string en n8n (1 min)
    5. Listo, sin downtime
```

### Setup PostgreSQL en Oracle VPS (cuando llegue el momento)

```bash
# 1. Conectar al servidor
ssh user@your-oracle-instance

# 2. Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 3. Crear base de datos
sudo -u postgres createdb subvenciones

# 4. Crear usuario
sudo -u postgres createuser n8n_user -P

# 5. Configurar permisos
sudo -u postgres psql -c "ALTER ROLE n8n_user WITH CREATEDB;"

# 6. Configurar acceso remoto desde n8n
# Editar /etc/postgresql/14/main/postgresql.conf
# Cambiar: listen_addresses = 'localhost' → listen_addresses = '*'
```

**Conexión desde n8n (cuando migres):**
```
Host: tu-ip-oracle
Port: 5432
Database: subvenciones
User: n8n_user
Password: [tu contraseña]
```

---

## Arquitectura Web: Hugo + GitHub + Netlify

**Por qué esta opción:**

1. **Costo:** ~€10/año (solo dominio)
2. **Automatización:** Deploy automático al hacer push a GitHub
3. **Velocidad:** Hugo compila 1000 páginas en <30 segundos
4. **Simpleza:** Solo markdown, sin lógica compleja
5. **Escalabilidad:** Maneja 1000+ páginas sin problema
6. **SEO:** Static HTML puro = SEO perfecto

**Flujo diario:**

```
6:00 AM: Fase 1 - Query History (Notion)
    ↓ (30 min después)
6:30 AM: Fase 2 - Tagging de subvenciones (Notion)
    ↓ (30 min después)
7:00 AM: Fase 3 - Generar webs (n8n)
    ├─ Lee 3 combos prioritarias de Notion
    ├─ Genera 3 archivos .md
    ├─ Commit + push a GitHub
    └─ Auto-triggers Netlify build
    ↓
7:05 AM: Webs vivas en URLs públicas
```

## Implementación: Hugo + GitHub + Netlify

### Paso 1: Estructura Hugo

```
subvenciones-site/
├── config.toml
├── themes/
│   └── minimal/
│       ├── layouts/
│       │   ├── _default/
│       │   │   ├── baseof.html
│       │   │   ├── single.html
│       │   │   └── list.html
│       │   └── partials/
│       └── static/
│           └── css/style.css
├── content/
│   └── subvenciones/
├── netlify.toml
└── public/ (generado)
```

### Paso 2: Template Hugo básico

**File: `themes/minimal/layouts/_default/single.html`**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ .Title }} - Subvenciones</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <h1>{{ .Title }}</h1>
        <p>{{ .Count }} subvenciones activas en {{ .Region }}</p>
    </header>
    
    <main>
        {{ .Content }}
    </main>
    
    <footer>
        <p>Última actualización: {{ .Date.Format "02/01/2006" }}</p>
    </footer>
</body>
</html>
```

### Paso 3: Markdown generado (ejemplo)

**Resultado: `content/subvenciones/musica-galicia.md`**
```markdown
---
title: Subvenciones para Música en Galicia
region: galicia
tag_seo: musica
count: 12
date: 2026-05-26
---

## Subvenciones activas

### 1. Ayudas para orquestas sinfónicas
- **Beneficiario:** PYME
- **Fechas:** 01/06/2026 - 30/06/2026
- **Enlace:** [Ver en InfoSubvenciones](https://infosubvenciones.es/...)

### 2. Festival de Música Clásica
- **Beneficiario:** Asociación
- **Fechas:** 15/06/2026 - 15/08/2026
- **Enlace:** [Ver detalles](https://infosubvenciones.es/...)
```

### Paso 4: Nodo n8n - Generar Markdown desde Notion

```javascript
// Workflow n8n - Nodo: "Generar Markdown"
// Input: combos prioritarias de hoy (3 combos de Notion)

const combosHoy = $input.first().json.combos;

for (let combo of combosHoy) {
  const { región_id, tag_seo } = combo;
  const región = await notionRead('Regiones', región_id);
  
  // Query Notion: Subvenciones con este tag_seo y región
  const subs = await notionQuery('Subvenciones', {
    filter: `región = "${región_id}" AND tag_seo = "${tag_seo}" AND status = "active"`
  });
  
  // Generar markdown
  let md = `---
title: Subvenciones para ${tag_seo.toUpperCase()} en ${región.nombre}
region: ${región.slug}
tag_seo: ${tag_seo}
count: ${subs.length}
date: ${new Date().toISOString().split('T')[0]}
---

## Subvenciones activas (${subs.length})\n\n`;
  
  for (let sub of subs) {
    md += `### ${sub.titulo}
- **Beneficiario:** ${sub.beneficiario}
- **Fechas:** ${sub.fecha_inicio} - ${sub.fecha_fin}
- **Enlace:** [Ver en InfoSubvenciones](${sub.url})

`;
  }
  
  return {
    filename: `content/subvenciones/${tag_seo}-${región.slug}.md`,
    content: md
  };
}
```

### Paso 5: Nodo n8n - Push a GitHub

```javascript
// Workflow n8n - Nodo: "Push a GitHub"

const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const git = simpleGit('/tmp/subvenciones-site');

// Clonar repo
await git.clone('https://github.com/tuuser/subvenciones-site.git', '/tmp/subvenciones-site');

// Recibir archivos del nodo anterior
const files = $input.all();

// Escribir archivos
for (let file of files) {
  const fullPath = path.join('/tmp/subvenciones-site', file.filename);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.content);
}

// Git commit y push
await git.add('content/');
await git.commit(`Auto-update: ${files.length} subvenciones (${new Date().toLocaleString()})`);
await git.push('origin', 'main');

return {
  status: 'success',
  filesUpdated: files.length,
  timestamp: new Date().toISOString()
};
```

### Paso 6: Configuración Netlify

**File: `netlify.toml`** (en raíz del repo)
```toml
[build]
  command = "hugo"
  publish = "public"

[build.environment]
  HUGO_VERSION = "0.111.0"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

**Setup en Netlify:**
1. Conectar GitHub repo
2. Build command: `hugo`
3. Publish directory: `public`
4. Deploy branch: `main`
5. Auto-deploy ✓

---

## Checklist de implementación

**Semana 1: Setup base**
- [ ] Crear repo Hugo con estructura básica
- [ ] Template HTML minimalista
- [ ] Conectar GitHub a Netlify
- [ ] Testear con 1 página de prueba

**Semana 2: Integración n8n**
- [ ] Nodo para generar markdown desde Notion
- [ ] Nodo para push a GitHub
- [ ] Pipeline completo funcionando
- [ ] Testear con 3 páginas

**Semana 3: Optimización**
- [ ] Sitemap.xml automático
- [ ] Meta tags SEO
- [ ] CSS minimalista pero profesional
- [ ] Scheduling diario

**Semana 4: Productivización**
- [ ] Monitoreo de builds
- [ ] Alertas si falla deploy
- [ ] Documentación mantenimiento
- [ ] Go-live

---

---

## Alternativa más simple (sin Git)

Si prefieres no tocar GitHub:
1. **n8n genera HTML completo**
2. **Sube directamente a Netlify via API**
3. **URLs actualizadas al instante**

Costo: igual (€10/año) | Complejidad: menor | Versionado: no existe

---

## Costos finales

| Concepto               | Costo              |
| ---------------------- | ------------------ |
| Netlify (hosting)      | €0                 |
| GitHub (repositorio)   | €0                 |
| Notion (base de datos) | €0 (plan gratuito) |
| Dominio                | ~€10/año           |
| **TOTAL**              | **€10/año**        |

*Nota: Migrará a PostgreSQL en Oracle VPS después (costo €0)*

---
