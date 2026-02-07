// Script pour générer un hash de mot de passe bcrypt
const bcrypt = require('bcrypt');

const password = process.argv[2] || 'Admin@2026';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erreur:', err);
    return;
  }
  console.log('\n=================================');
  console.log('Mot de passe:', password);
  console.log('Hash bcrypt:', hash);
  console.log('=================================\n');
  console.log('Copiez ce hash et utilisez-le dans la requête SQL ci-dessous:\n');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
  console.log('\nOu pour créer un nouveau superadmin:\n');
  console.log(`DELETE FROM users WHERE username = 'admin';`);
  console.log(`INSERT INTO users (tenant_id, username, email, first_name, last_name, password_hash, role)`);
  console.log(`VALUES (0, 'admin', 'admin@smartpos.com', 'Super', 'Admin', '${hash}', 'superadmin');`);
  console.log('\n');
});
