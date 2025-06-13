import { Router } from 'express';
import { getClientDashboard, getClientInvoices } from '@server/controllers/client.controller';

const router = Router();

// GET /api/client/dashboard - Get client dashboard data
// Authentication is handled at the router mount level in routes.ts
router.get('/dashboard', getClientDashboard);

// GET /api/client/invoices - Get client invoices
// Authentication is handled at the router mount level in routes.ts
router.get('/invoices', getClientInvoices);

export default router;