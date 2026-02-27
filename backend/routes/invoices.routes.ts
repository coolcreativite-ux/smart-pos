import { Router } from 'express';
import { Pool } from 'pg';
import { InvoicesController } from '../controllers/invoices.controller';
import { authMiddleware } from '../middleware/auth.middleware';

/**
 * Routes pour les endpoints de facturation
 */
export function createInvoicesRouter(pool: Pool): Router {
  const router = Router();
  const controller = new InvoicesController(pool);

  // Appliquer le middleware d'authentification à toutes les routes
  router.use(authMiddleware);

  // POST /api/invoices - Créer une nouvelle facture/reçu
  router.post('/', (req, res) => controller.createInvoice(req, res));

  // GET /api/invoices - Lister les factures avec filtres
  router.get('/', (req, res) => controller.listInvoices(req, res));

  // GET /api/invoices/next-number - Obtenir le prochain numéro
  router.get('/next-number', (req, res) => controller.getNextNumber(req, res));

  // GET /api/invoices/:id - Détails d'une facture
  router.get('/:id', (req, res) => controller.getInvoiceDetails(req, res));

  // GET /api/invoices/:id/pdf - Télécharger le PDF
  router.get('/:id/pdf', (req, res) => controller.downloadPDF(req, res));

  // GET /api/invoices/:id/csv - Télécharger le CSV
  router.get('/:id/csv', (req, res) => controller.downloadCSV(req, res));

  return router;
}
