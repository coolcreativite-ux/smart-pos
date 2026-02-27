import { Request, Response, NextFunction } from 'express';

/**
 * Middleware d'authentification pour les routes d'invoices
 * Extrait tenantId et userId du body ou des headers
 * 
 * Note: Dans une implémentation complète, ce middleware devrait:
 * - Vérifier un JWT token
 * - Extraire tenantId et userId du token
 * - Vérifier les permissions
 * 
 * Pour l'instant, on utilise une version simplifiée qui extrait du body
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extraire tenantId et userId du body ou des headers
    // Pour les requêtes GET, req.body peut être undefined
    const tenantId = (req.body?.tenantId) || req.headers['x-tenant-id'];
    const userId = (req.body?.userId) || req.headers['x-user-id'];

    console.log('🔍 [Auth] Headers:', {
      'x-tenant-id': req.headers['x-tenant-id'],
      'x-user-id': req.headers['x-user-id']
    });
    console.log('🔍 [Auth] Body:', {
      tenantId: req.body?.tenantId,
      userId: req.body?.userId
    });

    if (!tenantId || tenantId === '' || tenantId === 'undefined') {
      console.error('❌ [Auth] tenantId manquant ou invalide:', tenantId);
      res.status(401).json({
        success: false,
        error: 'Authentification requise: tenantId manquant ou invalide'
      });
      return;
    }

    if (!userId || userId === '' || userId === 'undefined') {
      console.error('❌ [Auth] userId manquant ou invalide:', userId);
      res.status(401).json({
        success: false,
        error: 'Authentification requise: userId manquant ou invalide'
      });
      return;
    }

    // Ajouter tenantId et userId à la requête
    (req as any).tenantId = parseInt(tenantId as string);
    (req as any).userId = parseInt(userId as string);

    console.log('✅ [Auth] Authentification réussie:', {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId
    });

    next();
  } catch (error) {
    console.error('❌ [Auth] Erreur:', error);
    res.status(401).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
}

/**
 * Middleware optionnel pour vérifier les permissions par rôle
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.body.userRole || req.headers['x-user-role'];

    if (!userRole || !allowedRoles.includes(userRole as string)) {
      res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes'
      });
      return;
    }

    next();
  };
}
