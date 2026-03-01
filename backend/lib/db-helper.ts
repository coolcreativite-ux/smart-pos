import { Pool, QueryResult } from 'pg';

/**
 * Helper pour exécuter des requêtes avec retry automatique en cas d'erreur de connexion
 */
export async function queryWithRetry<T = any>(
  pool: Pool,
  text: string,
  params?: any[],
  maxRetries: number = 2
): Promise<QueryResult<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query<T>(text, params);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Retry seulement pour les erreurs de connexion
      const isConnectionError = 
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.code === '57P01' || // PostgreSQL: terminating connection
        error.code === '57P03' || // PostgreSQL: cannot connect now
        error.code === '08006' || // PostgreSQL: connection failure
        error.code === '08003';   // PostgreSQL: connection does not exist
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`⚠️ Erreur de connexion (tentative ${attempt + 1}/${maxRetries + 1}), retry...`);
      
      // Attendre un peu avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError;
}

/**
 * Helper pour obtenir un client du pool avec retry
 */
export async function getClientWithRetry(pool: Pool, maxRetries: number = 2) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      return client;
    } catch (error: any) {
      lastError = error;
      
      const isConnectionError = 
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED';
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`⚠️ Erreur obtention client (tentative ${attempt + 1}/${maxRetries + 1}), retry...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError;
}
