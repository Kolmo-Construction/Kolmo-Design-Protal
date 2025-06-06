import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  // Admin controllers
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  sendQuoteToCustomer,
  
  // Line item controllers
  getQuoteLineItems,
  createQuoteLineItem,
  updateQuoteLineItem,
  deleteQuoteLineItem,
  
  // Media controllers
  uploadQuoteMedia,
  deleteQuoteMedia,
  
  // Customer portal controllers (public)
  getQuoteByToken,
  respondToQuote,
} from "../controllers/quote.controller";

const router = Router();

// Admin routes (authenticated)
router.get("/", isAuthenticated, requireRole(['admin', 'projectManager']), getAllQuotes);
router.get("/:id", isAuthenticated, requireRole(['admin', 'projectManager']), getQuoteById);
router.post("/", isAuthenticated, requireRole(['admin', 'projectManager']), createQuote);
router.put("/:id", isAuthenticated, requireRole(['admin', 'projectManager']), updateQuote);
router.delete("/:id", isAuthenticated, requireRole(['admin', 'projectManager']), deleteQuote);
router.post("/:id/send", isAuthenticated, requireRole(['admin', 'projectManager']), sendQuoteToCustomer);

// Line item routes (authenticated)
router.get("/:quoteId/line-items", isAuthenticated, requireRole(['admin', 'projectManager']), getQuoteLineItems);
router.post("/:quoteId/line-items", isAuthenticated, requireRole(['admin', 'projectManager']), createQuoteLineItem);
router.put("/line-items/:id", isAuthenticated, requireRole(['admin', 'projectManager']), updateQuoteLineItem);
router.delete("/line-items/:id", isAuthenticated, requireRole(['admin', 'projectManager']), deleteQuoteLineItem);

// Media routes (authenticated)
router.post("/:quoteId/media", isAuthenticated, requireRole(['admin', 'projectManager']), upload.single('file'), uploadQuoteMedia);
router.delete("/:quoteId/media/:id", isAuthenticated, requireRole(['admin', 'projectManager']), deleteQuoteMedia);

// Customer portal routes (public)
router.get("/public/:token", getQuoteByToken);
router.post("/public/:token/respond", respondToQuote);

export default router;