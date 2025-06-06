import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { hasRole } from "../middleware/role.middleware";
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
router.get("/", isAuthenticated, getAllQuotes);
router.get("/:id", isAuthenticated, getQuoteById);
router.post("/", isAuthenticated, createQuote);
router.put("/:id", isAuthenticated, updateQuote);
router.delete("/:id", isAuthenticated, deleteQuote);
router.post("/:id/send", isAuthenticated, sendQuoteToCustomer);

// Line item routes (authenticated)
router.get("/:quoteId/line-items", isAuthenticated, getQuoteLineItems);
router.post("/:quoteId/line-items", isAuthenticated, createQuoteLineItem);
router.put("/line-items/:id", isAuthenticated, updateQuoteLineItem);
router.delete("/line-items/:id", isAuthenticated, deleteQuoteLineItem);

// Media routes (authenticated)
router.post("/:quoteId/media", isAuthenticated, upload.single('file'), uploadQuoteMedia);
router.delete("/:quoteId/media/:id", isAuthenticated, deleteQuoteMedia);

// Customer portal routes (public)
router.get("/public/:token", getQuoteByToken);
router.post("/public/:token/respond", respondToQuote);

export default router;