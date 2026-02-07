import React, { useEffect, useState } from 'react';

/**
 * Composant pour détecter et notifier les mises à jour de l'application
 * Affiche une notification quand une nouvelle version est disponible
 */
export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Vérifier si le Service Worker est supporté
    if (!('serviceWorker' in navigator)) {
      console.log('[Update] Service Worker non supporté');
      return;
    }

    // Écouter les messages du Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NEW_VERSION') {
        console.log('[Update] Nouvelle version détectée:', event.data.version);
        setShowUpdate(true);
      }
    });

    // Vérifier les mises à jour toutes les 5 minutes
    const checkForUpdates = () => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log('[Update] Vérification des mises à jour...');
          registration.update();
        }
      });
    };

    // Vérifier immédiatement
    checkForUpdates();

    // Puis toutes les 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    // Vérifier aussi quand l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Update] Onglet actif, vérification des mises à jour...');
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    
    // Envoyer un message au Service Worker pour activer la nouvelle version
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // Recharger la page après un court délai
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-2xl p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              Nouvelle version disponible !
            </h3>
            <p className="text-sm text-blue-100 mb-3">
              Une mise à jour de l'application est prête. Rechargez pour profiter des dernières améliorations.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mise à jour...
                  </span>
                ) : (
                  'Mettre à jour maintenant'
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles pour l'animation
const styles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
