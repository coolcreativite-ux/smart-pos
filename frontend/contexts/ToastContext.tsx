import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    // Génération d'ID unique avec timestamp + random string
    const id = Date.now() + Math.random();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastContainer component to render the toasts
interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    const getToastColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-500/90 text-white';
            case 'error': return 'bg-red-500/90 text-white';
            case 'info': return 'bg-sky-500/90 text-white';
            default: return 'bg-slate-800/90 text-white';
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-[100] space-y-3">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center justify-between w-full max-w-xs p-4 rounded-lg shadow-lg ${getToastColors(toast.type)} animate-fade-in-up`}
                >
                    <span>{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="ml-4 -mr-1 p-1 rounded-full hover:bg-white/20">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};
