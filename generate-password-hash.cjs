const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'Admin@2026';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('=== HASH GÉNÉRÉ ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('=== REQUÊTE SQL À EXÉCUTER DANS SUPABASE ===');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
  console.log('');
  console.log('Après avoir exécuté cette requête, vous pourrez vous connecter avec:');
  console.log('Username: admin');
  console.log('Password:', password);
}

generateHash();
