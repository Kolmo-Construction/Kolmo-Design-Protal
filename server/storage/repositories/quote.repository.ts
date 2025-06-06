import { db } from "../../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  quotes, 
  quoteLineItems, 
  quoteMedia, 
  quoteResponses,
  users,
  type Quote,
  type QuoteLineItem,
  type QuoteMedia,
  type QuoteResponse,
  type InsertQuote,
  type InsertQuoteLineItem,
  type InsertQuoteMedia,
  type InsertQuoteResponse,
  type QuoteWithDetails
} from "@shared/schema";
import { createNotFoundError, createBadRequestError } from "../../errors";
import { randomBytes } from "crypto";

export class QuoteRepository {
  
  // Generate unique quote number
  private generateQuoteNumber(): string {
    const timestamp = Date.now();
    return `QUO-${timestamp}`;
  }

  // Generate secure access token
  private generateAccessToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Create a new quote
  async createQuote(data: InsertQuote): Promise<Quote> {
    const quoteData: any = {
      ...data,
      quoteNumber: this.generateQuoteNumber(),
      accessToken: this.generateAccessToken(),
      validUntil: typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil,
      estimatedStartDate: data.estimatedStartDate ? (typeof data.estimatedStartDate === 'string' ? new Date(data.estimatedStartDate) : data.estimatedStartDate) : null,
      estimatedCompletionDate: data.estimatedCompletionDate ? (typeof data.estimatedCompletionDate === 'string' ? new Date(data.estimatedCompletionDate) : data.estimatedCompletionDate) : null,
      subtotal: data.subtotal?.toString() || '0',
      taxRate: data.taxRate?.toString() || '0.1060',
      taxAmount: data.taxAmount?.toString() || '0',
      total: data.total?.toString() || '0',
    };

    const [quote] = await db
      .insert(quotes)
      .values(quoteData)
      .returning();

    return quote;
  }

  // Get all quotes with details
  async getAllQuotes(): Promise<QuoteWithDetails[]> {
    const quotesWithDetails = await db
      .select({
        quote: quotes,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(quotes)
      .leftJoin(users, eq(quotes.createdById, users.id))
      .orderBy(desc(quotes.createdAt));

    const result: QuoteWithDetails[] = [];

    for (const row of quotesWithDetails) {
      const lineItems = await this.getQuoteLineItems(row.quote.id);
      const media = await this.getQuoteMedia(row.quote.id);
      const responses = await this.getQuoteResponses(row.quote.id);

      result.push({
        ...row.quote,
        creator: row.creator,
        lineItems,
        media,
        responses,
      });
    }

    return result;
  }

  // Get quote by ID with details
  async getQuoteById(id: number): Promise<QuoteWithDetails | null> {
    const [quoteWithCreator] = await db
      .select({
        quote: quotes,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(quotes)
      .leftJoin(users, eq(quotes.createdById, users.id))
      .where(eq(quotes.id, id));

    if (!quoteWithCreator) return null;

    const lineItems = await this.getQuoteLineItems(id);
    const media = await this.getQuoteMedia(id);
    const responses = await this.getQuoteResponses(id);

    return {
      ...quoteWithCreator.quote,
      creator: quoteWithCreator.creator,
      lineItems,
      media,
      responses,
    };
  }

  // Get quote by access token (for customer portal)
  async getQuoteByAccessToken(accessToken: string): Promise<QuoteWithDetails | null> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.accessToken, accessToken));

    if (!quote) return null;

    // Mark as viewed
    await this.markQuoteAsViewed(quote.id);

    const lineItems = await this.getQuoteLineItems(quote.id);
    const media = await this.getQuoteMedia(quote.id);
    const responses = await this.getQuoteResponses(quote.id);

    return {
      ...quote,
      lineItems,
      media,
      responses,
    };
  }

  // Update quote
  async updateQuote(id: number, data: Partial<InsertQuote>): Promise<Quote> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Handle date conversions
    if (updateData.validUntil && typeof updateData.validUntil === 'string') {
      updateData.validUntil = new Date(updateData.validUntil);
    }
    if (updateData.estimatedStartDate && typeof updateData.estimatedStartDate === 'string') {
      updateData.estimatedStartDate = new Date(updateData.estimatedStartDate);
    }
    if (updateData.estimatedCompletionDate && typeof updateData.estimatedCompletionDate === 'string') {
      updateData.estimatedCompletionDate = new Date(updateData.estimatedCompletionDate);
    }

    const [updated] = await db
      .update(quotes)
      .set(updateData)
      .where(eq(quotes.id, id))
      .returning();

    if (!updated) {
      throw createNotFoundError("Quote");
    }

    return updated;
  }

  // Delete quote
  async deleteQuote(id: number): Promise<void> {
    const result = await db
      .delete(quotes)
      .where(eq(quotes.id, id));

    if (result.rowCount === 0) {
      throw createNotFoundError("Quote");
    }
  }

  // Mark quote as viewed
  async markQuoteAsViewed(id: number): Promise<void> {
    await db
      .update(quotes)
      .set({ viewedAt: new Date() })
      .where(and(eq(quotes.id, id), sql`viewed_at IS NULL`));
  }

  // Mark quote as sent
  async markQuoteAsSent(id: number): Promise<void> {
    await db
      .update(quotes)
      .set({ 
        sentAt: new Date(),
        status: 'sent'
      })
      .where(eq(quotes.id, id));
  }

  // Line Items Management
  async getQuoteLineItems(quoteId: number): Promise<QuoteLineItem[]> {
    return await db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, quoteId))
      .orderBy(quoteLineItems.sortOrder);
  }

  async createQuoteLineItem(data: InsertQuoteLineItem): Promise<QuoteLineItem> {
    const lineItemData = {
      ...data,
      quantity: data.quantity.toString(),
      unitPrice: data.unitPrice.toString(),
      totalPrice: data.totalPrice.toString(),
    };

    const [lineItem] = await db
      .insert(quoteLineItems)
      .values(lineItemData)
      .returning();

    // Recalculate quote totals
    await this.recalculateQuoteTotals(data.quoteId);

    return lineItem;
  }

  async updateQuoteLineItem(id: number, data: Partial<InsertQuoteLineItem>): Promise<QuoteLineItem> {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Convert numeric values to strings for database
    if (updateData.quantity !== undefined) updateData.quantity = updateData.quantity.toString();
    if (updateData.unitPrice !== undefined) updateData.unitPrice = updateData.unitPrice.toString();
    if (updateData.totalPrice !== undefined) updateData.totalPrice = updateData.totalPrice.toString();

    const [updated] = await db
      .update(quoteLineItems)
      .set(updateData)
      .where(eq(quoteLineItems.id, id))
      .returning();

    if (!updated) {
      throw createNotFoundError("Quote line item");
    }

    // Recalculate quote totals
    await this.recalculateQuoteTotals(updated.quoteId);

    return updated;
  }

  async deleteQuoteLineItem(id: number): Promise<void> {
    const [deleted] = await db
      .delete(quoteLineItems)
      .where(eq(quoteLineItems.id, id))
      .returning();

    if (!deleted) {
      throw createNotFoundError("Quote line item");
    }

    // Recalculate quote totals
    await this.recalculateQuoteTotals(deleted.quoteId);
  }

  // Recalculate quote totals
  async recalculateQuoteTotals(quoteId: number): Promise<void> {
    const items = await this.getQuoteLineItems(quoteId);
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);
    
    const [quote] = await db
      .select({ taxRate: quotes.taxRate })
      .from(quotes)
      .where(eq(quotes.id, quoteId));

    if (!quote) return;

    const taxAmount = subtotal * parseFloat((quote.taxRate || '0.1060').toString());
    const total = subtotal + taxAmount;

    await db
      .update(quotes)
      .set({
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));
  }

  // Media Management
  async getQuoteMedia(quoteId: number): Promise<QuoteMedia[]> {
    return await db
      .select()
      .from(quoteMedia)
      .where(eq(quoteMedia.quoteId, quoteId))
      .orderBy(quoteMedia.sortOrder);
  }

  async createQuoteMedia(data: InsertQuoteMedia): Promise<QuoteMedia> {
    const [media] = await db
      .insert(quoteMedia)
      .values(data)
      .returning();

    return media;
  }

  async deleteQuoteMedia(id: number): Promise<void> {
    const result = await db
      .delete(quoteMedia)
      .where(eq(quoteMedia.id, id));

    if (result.rowCount === 0) {
      throw createNotFoundError("Quote media");
    }
  }

  // Response Management
  async getQuoteResponses(quoteId: number): Promise<QuoteResponse[]> {
    return await db
      .select()
      .from(quoteResponses)
      .where(eq(quoteResponses.quoteId, quoteId))
      .orderBy(desc(quoteResponses.createdAt));
  }

  async createQuoteResponse(data: InsertQuoteResponse): Promise<QuoteResponse> {
    const [response] = await db
      .insert(quoteResponses)
      .values(data)
      .returning();

    // Update quote status and response timestamp
    let status = 'pending';
    if (data.action === 'accepted') status = 'accepted';
    if (data.action === 'declined') status = 'declined';

    await db
      .update(quotes)
      .set({
        status,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, data.quoteId));

    return response;
  }

  // Customer response (public endpoint)
  async respondToQuote(
    accessToken: string, 
    action: 'accepted' | 'declined' | 'requested_changes',
    customerData: {
      customerName?: string;
      customerEmail?: string;
      message?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<QuoteResponse> {
    const quote = await this.getQuoteByAccessToken(accessToken);
    if (!quote) {
      throw createNotFoundError("Quote");
    }

    // Check if quote is still valid
    if (new Date() > new Date(quote.validUntil)) {
      throw createBadRequestError("Quote has expired");
    }

    // Check if already responded
    if (quote.responses && quote.responses.length > 0) {
      throw createBadRequestError("Quote has already been responded to");
    }

    return await this.createQuoteResponse({
      quoteId: quote.id,
      action,
      ...customerData,
    });
  }
}