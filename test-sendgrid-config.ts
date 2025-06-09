import { sendEmail, isEmailServiceConfigured } from './server/email';

async function testSendGridConfiguration() {
  console.log('Testing SendGrid configuration...\n');

  // Check if email service is configured
  console.log('Email service configured:', isEmailServiceConfigured());

  // Test with projects@kolmo.io
  console.log('\n--- Testing with projects@kolmo.io ---');
  try {
    await sendEmail({
      to: 'admin@example.com', // Test recipient
      subject: 'SendGrid Configuration Test',
      html: '<p>This is a test email to verify SendGrid configuration.</p>',
      from: 'projects@kolmo.io',
      fromName: 'Kolmo Construction'
    });
    console.log('✅ Email sent successfully with projects@kolmo.io');
  } catch (error) {
    console.error('❌ Failed with projects@kolmo.io:', error);
  }

  // Test with alternative verified sender (if needed)
  console.log('\n--- Testing with alternative sender ---');
  try {
    await sendEmail({
      to: 'admin@example.com',
      subject: 'SendGrid Configuration Test - Alternative',
      html: '<p>This is a test email with alternative sender.</p>',
      from: 'noreply@kolmo.design',
      fromName: 'Kolmo Construction'
    });
    console.log('✅ Email sent successfully with noreply@kolmo.design');
  } catch (error) {
    console.error('❌ Failed with noreply@kolmo.design:', error);
  }

  // Test without specifying from address (uses default)
  console.log('\n--- Testing with default sender ---');
  try {
    await sendEmail({
      to: 'admin@example.com',
      subject: 'SendGrid Configuration Test - Default',
      html: '<p>This is a test email with default sender.</p>',
      fromName: 'Kolmo Construction'
    });
    console.log('✅ Email sent successfully with default sender');
  } catch (error) {
    console.error('❌ Failed with default sender:', error);
  }

  console.log('\nTest completed. Check the output above to identify working sender addresses.');
}

// Run the test
testSendGridConfiguration()
  .then(() => {
    console.log('\nSendGrid configuration test finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
  });