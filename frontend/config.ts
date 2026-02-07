// Configuration de l'application
// Détection automatique de l'environnement
const getApiUrl = () => {
  // En production, utiliser l'URL de production
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://api.smartpos.com';
  }
  
  // En développement, utiliser l'URL configurée ou localhost
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  
  // Fallback: localhost
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();

console.log('🔧 API URL configurée:', API_URL);
console.log('🌍 Mode:', import.meta.env.MODE);
console.log('📱 Pour accès mobile, utilisez: http://[VOTRE_IP_LOCALE]:5000');
