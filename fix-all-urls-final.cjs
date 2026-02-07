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
  
  // Compter les occurrences avant
  const beforeCount = (content.match(/'\$\{API_URL\}/g) || []).length;
  
  // Remplacer TOUTES les occurrences avec quotes simples
  content = content.replace(/'\$\{API_URL\}([^']+)'/g, '`${API_URL}$1`');
  
  // Remplacer TOUTES les occurrences avec quotes doubles
  content = content.replace(/"\$\{API_URL\}([^"]+)"/g, '`${API_URL}$1`');
  
  // Compter les occurrences après
  const afterCount = (content.match(/'\$\{API_URL\}/g) || []).length;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ ${file}: ${beforeCount} occurrences corrigées, ${afterCount} restantes`);
});

console.log('\n✨ Correction terminée!');
