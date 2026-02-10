import { useEffect } from 'react';
import { useSaasBranding } from '../contexts/SaasBrandingContext';

/**
 * Hook pour mettre à jour dynamiquement le favicon du navigateur
 * en fonction du logo SaaS uploadé par le SuperAdmin
 */
export const useDynamicFavicon = () => {
  const { branding } = useSaasBranding();

  useEffect(() => {
    // Supprimer les anciens liens favicon et apple-touch-icon
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    existingLinks.forEach(link => link.remove());

    // Ajouter le nouveau favicon si disponible
    if (branding.faviconUrl) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = branding.faviconUrl;
      document.head.appendChild(link);
      
      // Ajouter aussi pour iOS
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = branding.faviconUrl;
      document.head.appendChild(appleLink);
    }

    // Mettre à jour le manifest PWA dynamiquement
    if (branding.faviconUrl || branding.logoUrl) {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Créer un manifest dynamique
        const dynamicManifest = {
          short_name: branding.appName || 'Smart POS',
          name: `${branding.appName || 'Smart POS'} - Point de Vente Intelligent`,
          icons: [
            {
              src: branding.faviconUrl || branding.logoUrl,
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: branding.faviconUrl || branding.logoUrl,
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ],
          start_url: '.',
          display: 'standalone',
          theme_color: '#4f46e5',
          background_color: '#1e293b'
        };

        // Créer un blob URL pour le manifest
        const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        // Mettre à jour le lien du manifest
        manifestLink.setAttribute('href', manifestURL);
      }
    }
  }, [branding.faviconUrl, branding.logoUrl, branding.appName]);
};
