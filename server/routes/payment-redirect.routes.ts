import { Router } from 'express';
import { storage } from '../storage.js';

const router = Router();

/**
 * Secure payment link redirect endpoint
 * This protects against email click tracking corruption by using a secure token system
 */
router.get('/pay/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Payment token is required' });
    }

    // Find invoice by payment token
    const invoice = await storage.invoices.getInvoiceByPaymentToken(token);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invalid or expired payment link' });
    }

    // Check if invoice is still payable
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'This invoice has already been paid' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'This invoice has been cancelled' });
    }

    // Redirect to the actual Stripe payment URL
    if (!invoice.stripePaymentIntentId) {
      return res.status(400).json({ error: 'Payment not available for this invoice' });
    }

    // Construct the direct Stripe payment URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const directPaymentUrl = `${baseUrl}/payment/${invoice.stripePaymentIntentId}`;
    
    // Redirect to the actual payment page
    return res.redirect(directPaymentUrl);
    
  } catch (error) {
    console.error('Payment redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Public payment link for invoices (using invoice number)
 */
router.get('/invoice/:invoiceNumber/pay', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    
    if (!invoiceNumber) {
      return res.status(400).json({ error: 'Invoice number is required' });
    }

    // Find invoice by invoice number
    const invoice = await storage.invoices.getInvoiceByNumber(invoiceNumber);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice is still payable
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'This invoice has already been paid' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'This invoice has been cancelled' });
    }

    // Redirect to secure payment link if available
    if (invoice.paymentToken) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const securePaymentUrl = `${baseUrl}/pay/${invoice.paymentToken}`;
      return res.redirect(securePaymentUrl);
    }

    // Fallback to direct payment link
    if (invoice.stripePaymentIntentId) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const directPaymentUrl = `${baseUrl}/payment/${invoice.stripePaymentIntentId}`;
      return res.redirect(directPaymentUrl);
    }

    return res.status(400).json({ error: 'Payment not available for this invoice' });
    
  } catch (error) {
    console.error('Invoice payment redirect error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as paymentRedirectRoutes };