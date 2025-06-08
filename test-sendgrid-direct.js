import sgMail from '@sendgrid/mail';

// Test SendGrid configuration directly
async function testSendGridDirect() {
  console.log('Testing SendGrid configuration...');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY environment variable is not set');
    return false;
  }
  
  console.log('✓ SENDGRID_API_KEY is configured');
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...');
  
  sgMail.setApiKey(apiKey);
  
  const testEmail = {
    to: 'test@example.com', // This will be used for testing
    from: {
      email: 'projects@kolmo.io',
      name: 'Kolmo Construction'
    },
    subject: 'Test Quote Email from Kolmo Construction',
    text: 'This is a test email to verify SendGrid configuration.',
    html: '<p>This is a test email to verify SendGrid configuration.</p>'
  };
  
  try {
    console.log('Attempting to send test email...');
    const result = await sgMail.send(testEmail);
    console.log('✓ Email sent successfully!');
    console.log('Response status:', result[0].statusCode);
    console.log('Response headers:', result[0].headers);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email via SendGrid:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Body:', error.response.body);
      
      if (error.response.body.errors) {
        console.error('Specific errors:');
        error.response.body.errors.forEach((err, index) => {
          console.error(`  ${index + 1}. ${err.message} (${err.field})`);
        });
      }
    }
    return false;
  }
}

testSendGridDirect().then(success => {
  console.log(success ? '\n✅ SendGrid test completed successfully!' : '\n❌ SendGrid test failed');
  process.exit(success ? 0 : 1);
});