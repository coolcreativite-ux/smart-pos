// Script pour nettoyer le localStorage et forcer le rechargement depuis la DB
// À exécuter dans la console du navigateur

console.log('🧹 Nettoyage du localStorage...');

// Supprimer les données mockées
localStorage.removeItem('globalProducts');
localStorage.removeItem('globalCustomers');
localStorage.removeItem('globalStores');
localStorage.removeItem('posUsers');
localStorage.removeItem('pos_manual_categories');

console.log('✅ localStorage nettoyé!');
console.log('🔄 Rechargement de la page...');

// Recharger la page
location.reload();