import { Router } from 'express';
import { storage } from '../storage';
import { stripeService } from '../services/stripe.service';
import { HttpError } from '../lib/http-error';

const router = Router();

/**
 * Get payment details by client secret
 * This endpoint is used by customers when they click on payment links
 */
router.get('/payment/details/:clientSecret', async (req, res, next) => {
  try {
    const { clientSecret } = req.params;
    
    if (!clientSecret) {
      throw new HttpError(400, 'Client secret is required');
    }

    // Extract payment intent ID from client secret
    // Client secrets have format: pi_xxxxx_secret_xxxxx
    const paymentIntentId = clientSecret.split('_secret_')[0];
    
    if (!paymentIntentId) {
      throw new HttpError(400, 'Invalid client secret format');
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (!paymentIntent) {
      return res.json({
        isValid: false,
        error: 'Payment not found'
      });
    }

    // Check if payment is already completed
    if (paymentIntent.status === 'succeeded') {
      return res.json({
        isValid: false,
        error: 'This payment has already been completed'
      });
    }

    // Check if payment intent is valid and not expired
    if (paymentIntent.status === 'canceled') {
      return res.json({
        isValid: false,
        error: 'This payment link has been canceled'
      });
    }

    // Get invoice details from metadata
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (!invoiceId) {
      return res.json({
        isValid: false,
        error: 'Payment details not found'
      });
    }

    // Fetch invoice from database
    const invoice = await storage.invoices.getInvoiceById(parseInt(invoiceId, 10));
    if (!invoice) {
      return res.json({
        isValid: false,
        error: 'Invoice not found'
      });
    }

    // Get project details
    const project = await storage.projects.getProjectById(invoice.projectId);
    if (!project) {
      return res.json({
        isValid: false,
        error: 'Project not found'
      });
    }

    // Determine payment type from metadata or invoice type
    const paymentType = paymentIntent.metadata?.paymentType || invoice.invoiceType || 'milestone';

    // Return payment details
    res.json({
      isValid: true,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      description: paymentIntent.description || invoice.description,
      projectName: project.name,
      customerName: invoice.customerName || project.customerName || 'Customer',
      customerEmail: invoice.customerEmail || project.customerEmail || '',
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate.toISOString(),
      paymentType: paymentType === 'final' ? 'final' : 'milestone',
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    
    // Handle Stripe errors
    if (error instanceof Error && error.message.includes('No such payment_intent')) {
      return res.json({
        isValid: false,
        error: 'Payment not found or invalid link'
      });
    }
    
    next(error);
  }
});

export default router;