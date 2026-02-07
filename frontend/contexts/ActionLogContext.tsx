
import React, { createContext, useState, ReactNode, useCallback, useContext, useEffect } from 'react';
import { ActionLogEntry } from '../types';
import { API_URL } from '../config';

interface ActionLogContextType {
  logs: ActionLogEntry[];
  logAction: (userId: number, username: string, action: string, details?: string, tenantId?: number) => Promise<void>;
  clearLogs: () => void;
  loadLogs: () => Promise<void>;
}

export const ActionLogContext = createContext<ActionLogContextType | undefined>(undefined);

export const ActionLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<ActionLogEntry[]>([]);

  // Charger les logs depuis la base de données
  const loadLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/action-logs`);
      if (response.ok) {
        const data = await response.json();
        // Convertir les timestamps en objets Date
        const logsWithDates = data.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(logsWithDates);
      } else {
        console.warn('Erreur lors du chargement des logs depuis la DB');
        // Fallback vers localStorage
        const saved = localStorage.getItem('actionLogs');
        if (saved) {
          const parsedLogs = JSON.parse(saved).map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          setLogs(parsedLogs);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des logs:', error);
      // Fallback vers localStorage
      const saved = localStorage.getItem('actionLogs');
      if (saved) {
        const parsedLogs = JSON.parse(saved).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(parsedLogs);
      }
    }
  }, []);

  // Charger les logs au démarrage
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Enregistrer une action (avec persistance en base de données)
  const logAction = useCallback(async (userId: number, username: string, action: string, details?: string, tenantId?: number) => {
    const newEntry: ActionLogEntry = {
      id: Date.now(),
      tenantId: tenantId || 0,
      timestamp: new Date(),
      userId,
      username,
      action,
      details,
    };

    // Ajouter immédiatement au state local pour une réactivité instantanée
    setLogs(prev => [newEntry, ...prev]);

    try {
      // Sauvegarder en base de données
      const response = await fetch('${API_URL}/api/action-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId || 0,
          user_id: userId,
          action,
          details
        })
      });

      if (!response.ok) {
        console.warn('Erreur lors de la sauvegarde du log en DB');
        // Fallback vers localStorage
        const currentLogs = [newEntry, ...logs];
        localStorage.setItem('actionLogs', JSON.stringify(currentLogs));
      }
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du log:', error);
      // Fallback vers localStorage
      const currentLogs = [newEntry, ...logs];
      localStorage.setItem('actionLogs', JSON.stringify(currentLogs));
    }
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('actionLogs');
  }, []);

  return (
    <ActionLogContext.Provider value={{ logs, logAction, clearLogs, loadLogs }}>
      {children}
    </ActionLogContext.Provider>
  );
};

export const useActionLog = () => {
    const context = useContext(ActionLogContext);
    if(context === undefined) {
        throw new Error('useActionLog must be used within a ActionLogProvider');
    }
    return context;
}
