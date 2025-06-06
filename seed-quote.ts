import { db } from "./server/db";
import { customerQuotes, quoteLineItems, quoteImages } from "./shared/schema";

async function seedQuote() {
  try {
    console.log("Creating comprehensive seed quote...");
    
    // Create main quote
    const [quote] = await db.insert(customerQuotes).values({
      quoteNumber: "Q-2025-001",
      customerName: "Sarah Johnson",
      customerEmail: "sarah.johnson@email.com",
      customerPhone: "(555) 123-4567",
      customerAddress: "123 Oak Street, Springfield, IL 62701",
      projectTitle: "Complete Kitchen Renovation",
      projectDescription: "Full kitchen remodel including new cabinets, countertops, flooring, and appliances. Modern design with increased storage and improved workflow.",
      projectType: "Kitchen Remodel",
      projectLocation: "Springfield, IL",
      subtotal: "45000.00",
      taxAmount: "3600.00",
      totalAmount: "48600.00",
      estimatedStartDate: new Date("2025-07-01"),
      estimatedCompletionDate: new Date("2025-08-15"),
      validUntil: new Date("2025-07-01"),
      status: "pending",
      showBeforeAfter: true,
      beforeAfterTitle: "Kitchen Transformation",
      beforeAfterDescription: "See the dramatic transformation from outdated to modern kitchen design",
      showColorVerification: true,
      colorVerificationTitle: "Color Palette",
      colorVerificationDescription: "Approved color scheme for cabinets, walls, and accents",
      permitRequired: true,
      permitDetails: "Building permit required for electrical and plumbing modifications",
      downPaymentPercentage: "30",
      milestonePaymentPercentage: "40",
      finalPaymentPercentage: "30",
      milestoneDescription: "Payment due upon completion of demolition and rough-in work",
      acceptsCreditCards: true,
      creditCardProcessingFee: "2.5",
      createdBy: 1
    }).returning();

    console.log(`Created quote with ID: ${quote.id}`);

    // Create line items
    const lineItems = [
      {
        quoteId: quote.id,
        category: "Cabinets",
        description: "Custom white shaker-style cabinets with soft-close hardware",
        quantity: "1",
        unit: "set",
        unitPrice: "15000.00",
        totalPrice: "15000.00"
      },
      {
        quoteId: quote.id,
        category: "Countertops",
        description: "Quartz countertops - Calacatta Nuvo",
        quantity: "45",
        unit: "sq ft",
        unitPrice: "85.00",
        totalPrice: "3825.00"
      },
      {
        quoteId: quote.id,
        category: "Flooring",
        description: "Luxury vinyl plank flooring - Weathered Oak",
        quantity: "180",
        unit: "sq ft",
        unitPrice: "8.50",
        totalPrice: "1530.00"
      },
      {
        quoteId: quote.id,
        category: "Appliances",
        description: "Stainless steel appliance package (refrigerator, range, dishwasher, microwave)",
        quantity: "1",
        unit: "set",
        unitPrice: "8500.00",
        totalPrice: "8500.00"
      },
      {
        quoteId: quote.id,
        category: "Plumbing",
        description: "Undermount sink with pull-down faucet",
        quantity: "1",
        unit: "set",
        unitPrice: "850.00",
        totalPrice: "850.00"
      },
      {
        quoteId: quote.id,
        category: "Electrical",
        description: "Under-cabinet LED lighting and pendant lights",
        quantity: "1",
        unit: "set",
        unitPrice: "1200.00",
        totalPrice: "1200.00"
      },
      {
        quoteId: quote.id,
        category: "Paint",
        description: "Interior paint - walls and trim",
        quantity: "1",
        unit: "room",
        unitPrice: "800.00",
        totalPrice: "800.00"
      },
      {
        quoteId: quote.id,
        category: "Labor",
        description: "Installation and project management",
        quantity: "1",
        unit: "project",
        unitPrice: "13295.00",
        totalPrice: "13295.00"
      }
    ];

    await db.insert(quoteLineItems).values(lineItems);
    console.log(`Created ${lineItems.length} line items`);

    // Create placeholder image entries (these would be populated when actual images are uploaded)
    const imageEntries = [
      {
        quoteId: quote.id,
        imageUrl: "", // Will be populated when actual images are uploaded via R2
        caption: "Current kitchen state - before renovation",
        imageType: "before"
      },
      {
        quoteId: quote.id,
        imageUrl: "", // Will be populated when actual images are uploaded via R2
        caption: "Completed kitchen renovation",
        imageType: "after"
      },
      {
        quoteId: quote.id,
        imageUrl: "", // Will be populated when actual images are uploaded via R2
        caption: "Color verification - cabinet samples",
        imageType: "color_verification"
      }
    ];

    await db.insert(quoteImages).values(imageEntries);
    console.log(`Created ${imageEntries.length} image placeholders`);

    console.log("Seed quote created successfully!");
    console.log(`Quote details:`);
    console.log(`- Quote Number: ${quote.quoteNumber}`);
    console.log(`- Customer: ${quote.customerName}`);
    console.log(`- Project: ${quote.projectTitle}`);
    console.log(`- Total: $${quote.totalAmount}`);
    console.log(`- Before/After Images: ${quote.showBeforeAfter ? 'Enabled' : 'Disabled'}`);

  } catch (error) {
    console.error("Error seeding quote:", error);
  }
}

seedQuote();