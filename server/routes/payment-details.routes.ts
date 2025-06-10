import { Router } from "express";
import { storage } from "../storage";
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
}) : null;

const router = Router();

// GET /api/payment-details/:clientSecret - Lookup payment details for legacy payment links
router.get('/payment-details/:clientSecret', async (req, res) => {
  try {
    const { clientSecret } = req.params;
    
    if (!clientSecret) {
      return res.status(400).json({ error: 'Client secret is required' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing temporarily unavailable' });
    }

    // Extract payment intent ID from client secret
    const paymentIntentId = clientSecret.split('_secret_')[0];
    
    try {
      // Try to retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const metadata = paymentIntent.metadata;
      let paymentDetails: any = {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        description: paymentIntent.description || 'Payment'
      };

      // Check if this payment has been migrated to a Payment Link
      if (metadata?.invoiceId) {
        const invoiceId = parseInt(metadata.invoiceId);
        const invoice = await storage.invoices.getInvoiceById(invoiceId);
        
        if (invoice?.stripePaymentUrl) {
          // Redirect to the new Stripe Payment Link
          paymentDetails.stripePaymentUrl = invoice.stripePaymentUrl;
          paymentDetails.description = `Invoice #${invoice.invoiceNumber}`;
          paymentDetails.projectId = invoice.projectId;
        }
      } else if (metadata?.quoteId) {
        const quoteId = parseInt(metadata.quoteId);
        const quote = await storage.quotes.getQuoteById(quoteId);
        
        if (quote?.stripePaymentUrl) {
          paymentDetails.stripePaymentUrl = quote.stripePaymentUrl;
          paymentDetails.description = `Quote #${quote.quoteNumber}`;
        }
      }

      return res.json(paymentDetails);
      
    } catch (stripeError: any) {
      // If payment intent not found in Stripe, check our database for migrated payments
      console.error('Stripe lookup failed:', stripeError.message);
      
      // Try to find invoice or quote with matching client secret
      const invoices = await storage.invoices.getAllInvoices();
      const matchingInvoice = invoices.find((inv: any) => 
        inv.stripeClientSecret === clientSecret || 
        inv.stripePaymentIntentId === paymentIntentId
      );
      
      if (matchingInvoice && matchingInvoice.stripePaymentUrl) {
        return res.json({
          amount: matchingInvoice.amount,
          currency: 'USD',
          description: `Invoice #${matchingInvoice.invoiceNumber}`,
          stripePaymentUrl: matchingInvoice.stripePaymentUrl,
          projectId: matchingInvoice.projectId
        });
      }
      
      return res.status(404).json({ 
        error: 'Payment link not found or has expired',
        message: 'This payment link may no longer be valid. Please contact support for a new payment link.'
      });
    }
    
  } catch (error) {
    console.error('Payment details lookup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;