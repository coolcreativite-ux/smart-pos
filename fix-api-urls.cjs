const fs = require('fs');
const path = require('path');

const files = [
  'frontend/contexts/UserContext.tsx',
  'frontend/contexts/StoreContext.tsx',
  'frontend/contexts/ProductContext.tsx',
  'frontend/contexts/LicenseContext.tsx',
  'frontend/contexts/CustomerContext.tsx',
  'frontend/contexts/ActionLogContext.tsx',
  'frontend/contexts/AuthContext.tsx',
  'frontend/contexts/SettingsContext.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si l'import existe déjà
  if (!content.includes("import { API_URL } from '../config'")) {
    // Ajouter l'import après les autres imports
    const importRegex = /(import.*from.*;\n)/g;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, lastImport + "import { API_URL } from '../config';\n");
    }
  }
  
  // Remplacer toutes les occurrences de l'URL
  content = content.replace(/http:\/\/localhost:5000/g, '${API_URL}');
  content = content.replace(/'\$\{API_URL\}'/g, 'API_URL');
  content = content.replace(/`\$\{API_URL\}`/g, '`${API_URL}`');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Mis à jour: ${file}`);
});

console.log('\n✨ Tous les fichiers ont été mis à jour!');
