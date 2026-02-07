import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// En développement, on n'utilise pas Supabase (on passe par le backend)
// En production, on utilise Supabase
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialisé (production)');
} else {
  console.log('ℹ️ Mode développement: Pas de Supabase (utilisation de PostgreSQL local via backend)');
}

export { supabase };

// Export db pour compatibilité avec l'ancien code
export const db = supabase;
