// server/controllers/global-finance.controller.ts
import type { Request, Response } from "express";
import { storage } from "@server/storage";
import { log as logger } from '@server/vite';

/**
 * GET /api/invoices - Get all invoices across all projects (admin only)
 */
export async function getAllInvoices(req: Request, res: Response) {
  try {
    logger('[GlobalFinanceController] Fetching all invoices across projects', 'GlobalFinanceController');
    
    const invoices = await storage.invoices.getAllInvoices();
    
    logger(`[GlobalFinanceController] Retrieved ${invoices.length} invoices`, 'GlobalFinanceController');
    res.json(invoices);
  } catch (error) {
    logger(`[GlobalFinanceController] Error fetching all invoices: ${error}`, 'GlobalFinanceController');
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
}

/**
 * GET /api/payments - Get all payments across all invoices (admin only)
 */
export async function getAllPayments(req: Request, res: Response) {
  try {
    logger('[GlobalFinanceController] Fetching all payments across invoices', 'GlobalFinanceController');
    
    const payments = await storage.payments.getAllPayments();
    
    logger(`[GlobalFinanceController] Retrieved ${payments.length} payments`, 'GlobalFinanceController');
    res.json(payments);
  } catch (error) {
    logger(`[GlobalFinanceController] Error fetching all payments: ${error}`, 'GlobalFinanceController');
    res.status(500).json({ error: "Failed to fetch payments" });
  }
}

/**
 * GET /api/milestones - Get all milestones across all projects (admin only)
 */
export async function getAllMilestones(req: Request, res: Response) {
  try {
    logger('[GlobalFinanceController] Fetching all milestones across projects', 'GlobalFinanceController');
    
    const milestones = await storage.milestones.getAllMilestones();
    
    logger(`[GlobalFinanceController] Retrieved ${milestones.length} milestones`, 'GlobalFinanceController');
    res.json(milestones);
  } catch (error) {
    logger(`[GlobalFinanceController] Error fetching all milestones: ${error}`, 'GlobalFinanceController');
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
}

/**
 * GET /api/invoices/:invoiceId/view - Get specific invoice details for viewing
 */
export async function getInvoiceForView(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: "Invalid invoice ID" });
    }

    logger(`[GlobalFinanceController] Fetching invoice ${invoiceId} for viewing`, 'GlobalFinanceController');
    
    const invoice = await storage.invoices.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get the associated project
    const project = await storage.projects.getProjectById(invoice.projectId);
    if (!project) {
      return res.status(404).json({ error: "Associated project not found" });
    }

    res.json({
      invoice,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        address: project.address,
        city: project.city,
        state: project.state,
        zipCode: project.zipCode
      }
    });
  } catch (error) {
    logger(`[GlobalFinanceController] Error fetching invoice for view: ${error}`, 'GlobalFinanceController');
    res.status(500).json({ error: "Failed to fetch invoice details" });
  }
}

/**
 * GET /api/invoices/:invoiceId/download - Download specific invoice as PDF
 */
export async function downloadInvoice(req: Request, res: Response) {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: "Invalid invoice ID" });
    }

    logger(`[GlobalFinanceController] Generating PDF for invoice ${invoiceId}`, 'GlobalFinanceController');
    
    const invoice = await storage.invoices.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get the associated project
    const project = await storage.projects.getProjectById(invoice.projectId);
    if (!project) {
      return res.status(404).json({ error: "Associated project not found" });
    }

    // Import invoice controller for PDF generation
    const invoiceController = await import('@server/controllers/invoice.controller');
    
    // Set the projectId in params for the existing PDF generation function
    req.params.projectId = invoice.projectId.toString();
    
    // Call the existing PDF generation function
    return invoiceController.downloadInvoicePdf(req, res);
  } catch (error) {
    logger(`[GlobalFinanceController] Error downloading invoice: ${error}`, 'GlobalFinanceController');
    res.status(500).json({ error: "Failed to download invoice" });
  }
}