import { QuoteController } from './server/controllers/quote.controller';

async function testNewQuoteTemplate() {
  try {
    const quoteController = new QuoteController();
    
    // Create a mock quote object for testing
    const testQuote = {
      id: 999,
      quoteNumber: "KOL-2025-TEST123",
      title: "Modern Kitchen Renovation",
      description: "Complete kitchen remodel with premium finishes and custom cabinetry",
      projectType: "Kitchen Renovation",
      location: "San Francisco, CA",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      total: "45000.00",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      estimatedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      estimatedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      accessToken: "test-token-123"
    };

    const quoteLink = `https://test.kolmo.io/quote/${testQuote.accessToken}`;

    console.log("Testing new quote email template...");
    console.log("Quote details:", {
      number: testQuote.quoteNumber,
      title: testQuote.title,
      total: testQuote.total,
      customer: testQuote.customerName
    });

    // Test the sendQuoteEmail method
    const result = await (quoteController as any).sendQuoteEmail(testQuote, quoteLink);
    
    if (result) {
      console.log("✅ New template email sent successfully!");
    } else {
      console.log("❌ Email sending failed");
    }

  } catch (error) {
    console.error("Error testing quote template:", error);
  }
}

testNewQuoteTemplate();