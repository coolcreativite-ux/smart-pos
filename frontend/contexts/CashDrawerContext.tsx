
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { CashSession, CashTransaction, User } from '../types';
import { useStores } from './StoreContext';

interface CashDrawerContextType {
    currentSession: CashSession | null; // Session du magasin ACTUELLEMENT sélectionné
    openSession: (openingCash: number, user: User) => void;
    closeSession: (closingCash: number) => void;
    addTransaction: (type: 'in' | 'out' | 'sale' | 'refund', amount: number, reason: string, user: User) => void;
    recordSale: (amount: number, user: User) => void;
    recordRefund: (amount: number, user: User) => void;
    sessionsHistory: CashSession[];
}

const CashDrawerContext = createContext<CashDrawerContextType | undefined>(undefined);

export const CashDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentStore } = useStores();
    
    // État contenant TOUTES les sessions ouvertes indexées par storeId
    const [activeSessions, setActiveSessions] = useState<Record<number, CashSession>>(() => {
        const saved = localStorage.getItem('activeCashSessions');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Re-convertir les dates string en objets Date
            Object.keys(parsed).forEach(storeId => {
                parsed[storeId].startTime = new Date(parsed[storeId].startTime);
                parsed[storeId].transactions = parsed[storeId].transactions.map((tx: any) => ({
                    ...tx,
                    timestamp: new Date(tx.timestamp)
                }));
            });
            return parsed;
        }
        return {};
    });

    const [sessionsHistory, setSessionsHistory] = useState<CashSession[]>(() => {
        const saved = localStorage.getItem('cashSessionsHistory');
        return saved ? JSON.parse(saved).map((s: any) => ({ 
            ...s, 
            startTime: new Date(s.startTime), 
            endTime: s.endTime ? new Date(s.endTime) : undefined,
            transactions: s.transactions.map((tx: any) => ({ ...tx, timestamp: new Date(tx.timestamp) }))
        })) : [];
    });

    // Sauvegarde des sessions actives dès qu'elles changent
    useEffect(() => {
        localStorage.setItem('activeCashSessions', JSON.stringify(activeSessions));
    }, [activeSessions]);

    // Sauvegarde de l'historique
    useEffect(() => {
        localStorage.setItem('cashSessionsHistory', JSON.stringify(sessionsHistory));
    }, [sessionsHistory]);

    // Déterminer la session active pour le magasin courant
    const currentSession = useMemo(() => {
        if (!currentStore) return null;
        return activeSessions[currentStore.id] || null;
    }, [activeSessions, currentStore]);

    const openSession = useCallback((openingCash: number, user: User) => {
        if (!currentStore || activeSessions[currentStore.id]) return;
        
        const newSession: CashSession = {
            id: `session_${Date.now()}_${currentStore.id}`,
            // Add missing tenantId
            tenantId: currentStore.tenantId,
            startTime: new Date(),
            openingCash,
            transactions: [],
            storeId: currentStore.id,
            status: 'open'
        };
        
        setActiveSessions(prev => ({
            ...prev,
            [currentStore.id]: newSession
        }));
    }, [activeSessions, currentStore]);

    const closeSession = useCallback((closingCash: number) => {
        if (!currentStore || !activeSessions[currentStore.id]) return;
        
        const sessionToClose = activeSessions[currentStore.id];
        const closedSession: CashSession = {
            ...sessionToClose,
            endTime: new Date(),
            closingCash,
            status: 'closed'
        };
        
        setSessionsHistory(prev => [closedSession, ...prev]);
        
        // Retirer la session des sessions actives
        setActiveSessions(prev => {
            const newState = { ...prev };
            delete newState[currentStore.id];
            return newState;
        });
    }, [activeSessions, currentStore]);

    const addTransaction = useCallback((type: 'in' | 'out' | 'sale' | 'refund', amount: number, reason: string, user: User) => {
        if (!currentStore || !activeSessions[currentStore.id]) return;
        
        const newTransaction: CashTransaction = {
            id: `tx_${Date.now()}`,
            type,
            amount,
            reason,
            timestamp: new Date(),
            userId: user.id,
            username: user.username
        };
        
        setActiveSessions(prev => {
            const session = prev[currentStore.id];
            if (!session) return prev;
            return {
                ...prev,
                [currentStore.id]: {
                    ...session,
                    transactions: [...session.transactions, newTransaction]
                }
            };
        });
    }, [activeSessions, currentStore]);

    const recordSale = (amount: number, user: User) => addTransaction('sale', amount, 'Vente POS', user);
    const recordRefund = (amount: number, user: User) => addTransaction('refund', amount, 'Remboursement client', user);

    return (
        <CashDrawerContext.Provider value={{ 
            currentSession, 
            openSession, 
            closeSession, 
            addTransaction, 
            recordSale, 
            recordRefund, 
            sessionsHistory 
        }}>
            {children}
        </CashDrawerContext.Provider>
    );
};

export const useCashDrawer = () => {
    const context = useContext(CashDrawerContext);
    if (!context) throw new Error('useCashDrawer must be used within a CashDrawerProvider');
    return context;
};
