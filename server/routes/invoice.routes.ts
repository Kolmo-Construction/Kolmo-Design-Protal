// server/routes/invoice.routes.ts
import { Router } from "express";
import * as invoiceController from "@server/controllers/invoice.controller"; // Updated import
import { isAuthenticated, isAdmin } from "@server/middleware/auth.middleware"; // Updated import
// Import checkProjectAccess if applying as middleware
// import { checkProjectAccess } from "../middleware/permissions.middleware";

// Use mergeParams: true to access :projectId from the parent router mount point
const router = Router({ mergeParams: true });

// GET /api/projects/:projectId/invoices/
// Requires authentication. Access check happens within the controller currently.
// Alternatively, apply checkProjectAccess middleware here.
router.get("/", isAuthenticated, invoiceController.getInvoicesForProject);

// POST /api/projects/:projectId/invoices/
// Requires Admin privileges (which implies authentication).
router.post("/", isAdmin, invoiceController.createInvoice);

// POST /api/projects/:projectId/invoices/:invoiceId/send
// Send a draft invoice to the customer
router.post(
  "/:invoiceId/send",
  isAdmin, // Or another appropriate permission middleware
  invoiceController.sendInvoice
);

// GET /api/projects/:projectId/invoices/:invoiceId/download
// Download invoice as PDF
router.get(
  "/:invoiceId/download",
  isAuthenticated,
  invoiceController.downloadInvoicePdf
);

// GET /api/projects/:projectId/invoices/:invoiceId/view
// Get invoice details for viewing
router.get(
  "/:invoiceId/view",
  isAuthenticated,
  invoiceController.getInvoiceDetails
);

export default router;