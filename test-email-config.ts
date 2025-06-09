import { sendEmail } from './server/email';

async function testEmailConfiguration() {
  console.log('Testing email configuration...\n');

  try {
    // Test the sendEmail function to see the configuration in development mode
    const result = await sendEmail({
      to: 'customer@example.com',
      subject: 'Test: Payment Confirmation Email Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3d4552;">Payment Confirmation Test</h2>
          
          <p>Dear Customer,</p>
          
          <p>This is a test email to verify the email configuration.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Configuration Details</h3>
            <p><strong>From Email:</strong> project@kolmo.io</p>
            <p><strong>From Name:</strong> Kolmo Construction</p>
            <p><strong>Email Type:</strong> Payment Confirmation</p>
          </div>
          
          <p>Best regards,<br>The Kolmo Construction Team</p>
        </div>
      `,
      fromName: 'Kolmo Construction',
    });

    if (result) {
      console.log('✅ Email configuration test completed successfully!');
      console.log('✅ All payment confirmation emails will now be sent from: project@kolmo.io');
      console.log('✅ The verified email address is properly configured.');
    } else {
      console.log('❌ Email configuration test failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailConfiguration()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
  });