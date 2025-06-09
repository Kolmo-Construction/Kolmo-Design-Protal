// Test script to verify payment confirmation email functionality
import { storage } from './server/storage';
import { sendEmail } from './server/email';

async function testPaymentConfirmationEmail() {
  console.log('Testing payment confirmation email...\n');

  try {
    // Get the invoice that was just updated to paid status
    const allInvoices = await storage.invoices.getAllInvoices();
    const paidInvoice = allInvoices.find(inv => 
      inv.stripePaymentIntentId === 'pi_3RXwNiKDM6eOkJhH03EZEEYJ' && 
      inv.status === 'paid'
    );

    if (!paidInvoice) {
      console.log('❌ No paid invoice found with the test payment intent ID');
      return;
    }

    console.log(`✅ Found paid invoice: ${paidInvoice.invoiceNumber}`);
    console.log(`   Amount: $${paidInvoice.amount}`);
    console.log(`   Customer: ${paidInvoice.customerEmail}`);
    
    // Get the associated project
    const project = paidInvoice.projectId ? await storage.projects.getProject(paidInvoice.projectId) : null;
    
    if (!project) {
      console.log('❌ Project not found for invoice');
      return;
    }

    console.log(`   Project: ${project.name} (ID: ${project.id})`);

    // Get the quote
    const quote = await storage.quotes.getQuoteById(paidInvoice.quoteId);
    
    if (!quote) {
      console.log('❌ Quote not found');
      return;
    }

    // Send welcome email
    const subject = `Welcome to Your Project - ${quote.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3d4552;">Welcome to Your Project!</h2>
        
        <p>Dear ${paidInvoice.customerName || 'Valued Customer'},</p>
        
        <p>Thank you for your payment! Your project <strong>${quote.title}</strong> is now officially underway.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #3d4552;">Payment Confirmed</h3>
          <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>
          <p><strong>Invoice Number:</strong> ${paidInvoice.invoiceNumber}</p>
          <p><strong>Amount Paid:</strong> $${paidInvoice.amount}</p>
          <p><strong>Project Status:</strong> ${project.status}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #3d4552;">Next Steps</h3>
          <ul>
            <li>Project planning and scheduling will begin within 2 business days</li>
            <li>You'll receive regular progress updates via email</li>
            <li>Your project manager will contact you to schedule the kick-off meeting</li>
            <li>Milestone payments will be requested as work progresses</li>
          </ul>
        </div>
        
        <p>We're excited to work with you on this project!</p>
        
        <p>Best regards,<br>
        The KOLMO Team</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: paidInvoice.customerEmail || 'test@example.com',
      subject: subject,
      html: html,
      from: 'noreply@kolmo.io',
      fromName: 'KOLMO Construction'
    });

    if (emailResult) {
      console.log(`✅ Welcome email sent successfully to ${paidInvoice.customerEmail}`);
    } else {
      console.log(`❌ Failed to send welcome email to ${paidInvoice.customerEmail}`);
    }

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('❌ Error during email test:', error);
  }
}

testPaymentConfirmationEmail();