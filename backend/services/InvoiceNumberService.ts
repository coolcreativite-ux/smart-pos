import { Pool } from 'pg';

/**
 * Service de génération de numéros séquentiels pour factures et reçus
 * Format: [Prefix-]YYYY-NNNNN
 * - Standard: 2025-00001
 * - Avoir (credit note): A-2025-00001
 * - Proforma: P-2025-00001
 */
export class InvoiceNumberService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Génère le prochain numéro séquentiel pour un tenant
   * Gère l'isolation multi-tenant et la séparation par année
   */
  async getNextNumber(
    tenantId: number,
    documentSubtype: 'standard' | 'avoir' | 'proforma'
  ): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const currentYear = new Date().getFullYear();
      
      // Récupérer ou créer la séquence pour ce tenant/année/subtype
      const sequenceResult = await client.query(
        `INSERT INTO invoice_sequences (tenant_id, year, document_subtype, last_number)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (tenant_id, year, document_subtype)
         DO UPDATE SET last_number = invoice_sequences.last_number + 1
         RETURNING last_number`,
        [tenantId, currentYear, documentSubtype]
      );

      const lastNumber = sequenceResult.rows[0].last_number;
      const nextNumber = lastNumber + 1;

      // Mettre à jour la séquence
      await client.query(
        `UPDATE invoice_sequences 
         SET last_number = $1, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2 AND year = $3 AND document_subtype = $4`,
        [nextNumber, tenantId, currentYear, documentSubtype]
      );

      await client.query('COMMIT');

      // Formater le numéro avec préfixe approprié
      return this.formatNumber(currentYear, nextNumber, documentSubtype);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Formate le numéro avec le préfixe approprié
   */
  private formatNumber(
    year: number,
    number: number,
    documentSubtype: 'standard' | 'avoir' | 'proforma'
  ): string {
    const paddedNumber = String(number).padStart(5, '0');
    const prefix = this.getPrefix(documentSubtype);
    
    return `${prefix}${year}-${paddedNumber}`;
  }

  /**
   * Retourne le préfixe selon le type de document
   */
  private getPrefix(documentSubtype: 'standard' | 'avoir' | 'proforma'): string {
    switch (documentSubtype) {
      case 'avoir':
        return 'A-';
      case 'proforma':
        return 'P-';
      case 'standard':
      default:
        return '';
    }
  }

  /**
   * Initialise une nouvelle séquence pour une année (utilisé pour tests ou migration)
   */
  async initializeSequence(
    tenantId: number,
    year: number,
    documentSubtype: 'standard' | 'avoir' | 'proforma'
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO invoice_sequences (tenant_id, year, document_subtype, last_number)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (tenant_id, year, document_subtype) DO NOTHING`,
      [tenantId, year, documentSubtype]
    );
  }

  /**
   * Récupère le dernier numéro utilisé (pour affichage/debug)
   */
  async getLastNumber(
    tenantId: number,
    year: number,
    documentSubtype: 'standard' | 'avoir' | 'proforma'
  ): Promise<number> {
    const result = await this.pool.query(
      `SELECT last_number FROM invoice_sequences
       WHERE tenant_id = $1 AND year = $2 AND document_subtype = $3`,
      [tenantId, year, documentSubtype]
    );

    return result.rows[0]?.last_number || 0;
  }
}
