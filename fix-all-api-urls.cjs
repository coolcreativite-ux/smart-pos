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
  
  // Remplacer toutes les variations possibles
  content = content.replace(/fetch\('(\$\{API_URL\}[^']+)'\)/g, 'fetch(`$1`)');
  content = content.replace(/fetch\("(\$\{API_URL\}[^"]+)"\)/g, 'fetch(`$1`)');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Corrigé: ${file}`);
});

console.log('\n✨ Tous les fichiers ont été corrigés!');
