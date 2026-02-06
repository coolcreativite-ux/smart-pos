
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration via variables d'environnement
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Détection du mode (Production vs Développement)
const isProd = process.env.NODE_ENV === 'production';
const LOCAL_API_URL = 'http://localhost:5000/api';

// Instance Supabase - Initialisée seulement si nécessaire et possible
let supabase: SupabaseClient | null = null;

if (isProd && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

/**
 * Service de base de données unifié
 * Gère les appels Supabase en prod et les appels REST en dev
 */
export const db = {
    // Méthode générique pour récupérer des données
    async from(table: string) {
        if (isProd && supabase) {
            return supabase.from(table).select('*');
        } else {
            try {
                const response = await fetch(`${LOCAL_API_URL}/${table}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                return { data, error: null };
            } catch (err) {
                // Silencieusement échouer en mode dev si le serveur n'est pas lancé
                return { data: null, error: err };
            }
        }
    },

    // Méthode d'insertion
    async insert(table: string, payload: any) {
        if (isProd && supabase) {
            return supabase.from(table).insert(payload).select();
        } else {
            try {
                const response = await fetch(`${LOCAL_API_URL}/${table}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                // Normalize result to match Supabase's { data, error } format
                return { data: Array.isArray(data) ? data : [data], error: null };
            } catch (err) {
                // Si le serveur local est absent, on retourne un succès simulé 
                // pour que le frontend puisse utiliser son propre mécanisme de fallback (ID temp)
                return { 
                    data: [{ id: Date.now(), ...payload }], 
                    error: null,
                    isFallback: true 
                };
            }
        }
    }
};

export { supabase };
