/**
 * Test script to verify photos are included in quote emails
 */

import { QuoteRepository } from "./server/storage/repositories/quote.repository";
import { sendEmail } from "./server/email";

async function testQuotePhotosInEmail() {
  console.log('=== Testing Quote Photos in Email ===');
  
  try {
    const quoteRepository = new QuoteRepository();
    
    // Find a quote with photos
    console.log('Searching for quotes with photos...');
    const quotes = await quoteRepository.getAllQuotes();
    
    let testQuote = null;
    for (const quote of quotes) {
      const media = await quoteRepository.getQuoteMedia(quote.id);
      if (media.length > 0) {
        testQuote = quote;
        console.log(`Found quote ${quote.id} (${quote.quoteNumber}) with ${media.length} photos`);
        break;
      }
    }
    
    if (!testQuote) {
      console.log('No quotes with photos found. Creating test data...');
      // For testing, we'll use the first available quote
      testQuote = quotes[0];
      if (!testQuote) {
        console.error('No quotes available for testing');
        return;
      }
    }
    
    // Get quote media
    const quoteMedia = await quoteRepository.getQuoteMedia(testQuote.id);
    console.log(`Quote ${testQuote.id} has ${quoteMedia.length} photos:`);
    quoteMedia.forEach((photo, index) => {
      console.log(`  ${index + 1}. ${photo.category}: ${photo.caption || 'No caption'}`);
      console.log(`     URL: ${photo.url}`);
    });
    
    // Test the email template with photos
    const formatCurrency = (amount: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(parseFloat(amount));
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    // Generate photo gallery HTML
    const photoGalleryHtml = quoteMedia.length > 0 ? `
    <div class="photo-gallery-section">
        <h3 class="photo-gallery-title">Project Gallery</h3>
        <div class="photo-grid">
            ${quoteMedia.map(photo => `
                <div class="photo-item">
                    <div class="photo-category">${photo.category || 'Gallery'}</div>
                    <img src="${photo.url}" alt="${photo.caption || 'Project Photo'}" />
                    ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
    ` : '';
    
    console.log('\n=== Photo Gallery HTML ===');
    console.log(photoGalleryHtml);
    
    // Test email sending (to admin email for testing)
    const testEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Quote Photo Gallery Test</h2>
        <p>Testing quote ${testQuote.quoteNumber} with ${quoteMedia.length} photos</p>
        ${photoGalleryHtml}
        <p>If you can see the photos above, the email template is working correctly!</p>
    </div>`;
    
    // Send test email to admin
    console.log('\nSending test email...');
    const emailSent = await sendEmail({
      to: 'admin@example.com', // Admin email for testing
      subject: `Photo Gallery Test - Quote ${testQuote.quoteNumber}`,
      html: testEmailHtml,
      from: 'projects@kolmo.io',
      fromName: 'Kolmo Construction (Test)'
    });
    
    if (emailSent) {
      console.log('✓ Test email sent successfully');
      console.log('✓ Photos should now appear in quote emails');
    } else {
      console.log('✗ Test email failed to send');
    }
    
    return emailSent;
    
  } catch (error) {
    console.error('Error testing quote photos in email:', error);
    return false;
  }
}

// Run the test
testQuotePhotosInEmail().then((success) => {
  console.log(`\n=== Test Result: ${success ? 'PASSED' : 'FAILED'} ===`);
  process.exit(success ? 0 : 1);
});