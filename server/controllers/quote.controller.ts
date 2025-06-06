import { Request, Response, NextFunction } from "express";
import { QuoteRepository } from "../storage/repositories/quote.repository";
import { 
  insertQuoteSchema, 
  insertQuoteLineItemSchema, 
  insertQuoteResponseSchema,
  insertQuoteMediaSchema 
} from "@shared/schema";
import { HttpError, createBadRequestError, createNotFoundError } from "../errors";
import { uploadToR2, deleteFromR2 } from "../r2-upload";
import { sendEmail } from "../email";

const quoteRepo = new QuoteRepository();

// Admin Controllers
export const getAllQuotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = await quoteRepo.getAllQuotes();
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

export const getQuoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid quote ID");
    }

    const quote = await quoteRepo.getQuoteById(id);
    if (!quote) {
      throw createNotFoundError("Quote");
    }

    res.json(quote);
  } catch (error) {
    next(error);
  }
};

export const createQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = insertQuoteSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw createBadRequestError("Invalid quote data", validationResult.error.flatten());
    }

    const user = req.user as any;
    const quoteData = {
      ...validationResult.data,
      createdById: user.id,
    };

    const quote = await quoteRepo.createQuote(quoteData);
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

export const updateQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid quote ID");
    }

    const validationResult = insertQuoteSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      throw createBadRequestError("Invalid quote data", validationResult.error.flatten());
    }

    const quote = await quoteRepo.updateQuote(id, validationResult.data);
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

export const deleteQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid quote ID");
    }

    await quoteRepo.deleteQuote(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const sendQuoteToCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid quote ID");
    }

    const quote = await quoteRepo.getQuoteById(id);
    if (!quote) {
      throw createNotFoundError("Quote");
    }

    // Generate quote link
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const quoteLink = `${baseUrl}/quotes/${quote.accessToken}`;

    // Send email to customer
    const emailSent = await sendEmail({
      to: quote.customerEmail,
      subject: `Your Project Quote from Kolmo Construction - ${quote.quoteNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Project Quote is Ready</h2>
          <p>Dear ${quote.customerName},</p>
          <p>We've prepared a detailed quote for your ${quote.projectType} project. You can view and respond to your quote using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Quote</a>
          </div>
          
          <p><strong>Quote Details:</strong></p>
          <ul>
            <li>Quote Number: ${quote.quoteNumber}</li>
            <li>Project: ${quote.title}</li>
            <li>Total Amount: $${parseFloat(quote.total.toString()).toLocaleString()}</li>
            <li>Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}</li>
          </ul>
          
          <p>If you have any questions about this quote, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>
          Kolmo Construction<br>
          (206) 410-5100<br>
          projects@kolmo.io</p>
        </div>
      `,
    });

    if (emailSent) {
      await quoteRepo.markQuoteAsSent(id);
      res.json({ message: "Quote sent successfully", quoteLink });
    } else {
      throw new HttpError(500, "Failed to send quote email");
    }
  } catch (error) {
    next(error);
  }
};

// Line Item Controllers
export const getQuoteLineItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quoteId = parseInt(req.params.quoteId);
    if (isNaN(quoteId)) {
      throw createBadRequestError("Invalid quote ID");
    }

    const lineItems = await quoteRepo.getQuoteLineItems(quoteId);
    res.json(lineItems);
  } catch (error) {
    next(error);
  }
};

export const createQuoteLineItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quoteId = parseInt(req.params.quoteId);
    if (isNaN(quoteId)) {
      throw createBadRequestError("Invalid quote ID");
    }

    const validationResult = insertQuoteLineItemSchema.safeParse({
      ...req.body,
      quoteId,
    });
    
    if (!validationResult.success) {
      throw createBadRequestError("Invalid line item data", validationResult.error.flatten());
    }

    const lineItem = await quoteRepo.createQuoteLineItem(validationResult.data);
    res.status(201).json(lineItem);
  } catch (error) {
    next(error);
  }
};

export const updateQuoteLineItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid line item ID");
    }

    const validationResult = insertQuoteLineItemSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      throw createBadRequestError("Invalid line item data", validationResult.error.flatten());
    }

    const lineItem = await quoteRepo.updateQuoteLineItem(id, validationResult.data);
    res.json(lineItem);
  } catch (error) {
    next(error);
  }
};

export const deleteQuoteLineItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid line item ID");
    }

    await quoteRepo.deleteQuoteLineItem(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Media Controllers
export const uploadQuoteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quoteId = parseInt(req.params.quoteId);
    if (isNaN(quoteId)) {
      throw createBadRequestError("Invalid quote ID");
    }

    if (!req.file) {
      throw createBadRequestError("No file uploaded");
    }

    const user = req.user as any;
    
    // Upload to R2
    const uploadResult = await uploadToR2({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      path: 'quotes/',
    });

    // Save media record
    const mediaData = {
      quoteId,
      mediaUrl: uploadResult.url,
      mediaType: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      caption: req.body.caption || '',
      category: req.body.category || 'reference',
      uploadedById: user.id,
    };

    const media = await quoteRepo.createQuoteMedia(mediaData);
    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
};

export const deleteQuoteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createBadRequestError("Invalid media ID");
    }

    // Get media info before deleting
    const quote = await quoteRepo.getQuoteById(parseInt(req.params.quoteId));
    const media = quote?.media?.find(m => m.id === id);
    
    if (media) {
      // Extract key from URL and delete from R2
      const urlParts = media.mediaUrl.split('/');
      const key = urlParts.slice(-2).join('/'); // folder/filename
      await deleteFromR2(key);
    }

    await quoteRepo.deleteQuoteMedia(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Customer Portal Controllers (Public)
export const getQuoteByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    
    const quote = await quoteRepo.getQuoteByAccessToken(token);
    if (!quote) {
      throw createNotFoundError("Quote");
    }

    res.json(quote);
  } catch (error) {
    next(error);
  }
};

export const respondToQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { action, customerName, customerEmail, message } = req.body;

    if (!action || !['accepted', 'declined', 'requested_changes'].includes(action)) {
      throw createBadRequestError("Invalid action");
    }

    const response = await quoteRepo.respondToQuote(token, action, {
      customerName,
      customerEmail,
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};