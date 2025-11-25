import { Router } from "express";
import multer from "multer";
import { isAuthenticated } from "../middleware/auth.middleware";
import { QuoteController } from "../controllers/quote.controller";

const router = Router();
const quoteController = new QuoteController();

// Configure multer for memory storage (for R2 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Protected admin routes
router.get("/", isAuthenticated, quoteController.getAllQuotes.bind(quoteController));
router.post("/", isAuthenticated, quoteController.createQuote.bind(quoteController));
router.get("/:id", isAuthenticated, quoteController.getQuoteById.bind(quoteController));
router.patch("/:id", isAuthenticated, quoteController.updateQuote.bind(quoteController));
router.delete("/:id", isAuthenticated, quoteController.deleteQuote.bind(quoteController));
router.post("/:id/send", isAuthenticated, quoteController.sendQuote.bind(quoteController));
router.patch("/:id/financials", isAuthenticated, quoteController.updateQuoteFinancials.bind(quoteController));

// Line item routes
router.get("/:id/line-items", isAuthenticated, quoteController.getQuoteLineItems.bind(quoteController));
router.post("/:id/line-items", isAuthenticated, quoteController.createLineItem.bind(quoteController));
router.patch("/line-items/:lineItemId", isAuthenticated, quoteController.updateLineItem.bind(quoteController));
router.delete("/line-items/:lineItemId", isAuthenticated, quoteController.deleteLineItem.bind(quoteController));

// Image routes
router.post("/:id/images", isAuthenticated, quoteController.uploadQuoteImage.bind(quoteController));
router.delete("/images/:imageId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));

// Photo management routes
router.get("/:id/media", isAuthenticated, quoteController.getQuoteMedia.bind(quoteController));
router.post("/:id/photos", isAuthenticated, upload.single('photo'), quoteController.uploadQuotePhoto.bind(quoteController));
router.patch("/media/:mediaId", isAuthenticated, quoteController.updateQuoteMedia.bind(quoteController));
router.delete("/media/:mediaId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));

// Before/After image specific routes
router.post("/:id/images/:type", isAuthenticated, upload.single('image'), quoteController.uploadBeforeAfterImage.bind(quoteController));
router.patch("/:id/images/:type/caption", isAuthenticated, quoteController.updateImageCaption.bind(quoteController));
router.delete("/:id/images/:type", isAuthenticated, quoteController.deleteBeforeAfterImage.bind(quoteController));

// Tax rate lookup route
router.post("/lookup/tax-rate", isAuthenticated, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || address.trim().length < 5) {
      return res.status(400).json({ error: "Address is required and must be at least 5 characters" });
    }

    // Call WA State tax lookup API from backend (avoids CORS issues)
    const url = `http://webgis.dor.wa.gov/webapi/AddressRates.aspx?output=xml&addr=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // Parse XML response to extract tax rate
    const rateMatch = xmlText.match(/<rate[^>]*>([^<]+)<\/rate>/i);
    const stateRateMatch = xmlText.match(/<StateSalesUseRate>([^<]+)<\/StateSalesUseRate>/i);
    const localRateMatch = xmlText.match(/<LocalSalesUseRate>([^<]+)<\/LocalSalesUseRate>/i);
    
    let totalRate = 0;
    if (rateMatch) {
      totalRate = parseFloat(rateMatch[1]);
    } else if (stateRateMatch && localRateMatch) {
      const stateRate = parseFloat(stateRateMatch[1]);
      const localRate = parseFloat(localRateMatch[1]);
      totalRate = stateRate + localRate;
    } else if (stateRateMatch) {
      totalRate = parseFloat(stateRateMatch[1]);
    }

    if (totalRate > 0) {
      res.json({ taxRate: totalRate });
    } else {
      res.status(404).json({ error: "No tax rate found for this address" });
    }
  } catch (error) {
    console.error("Tax rate lookup error:", error);
    res.status(500).json({ error: "Failed to lookup tax rate" });
  }
});

// Public customer routes (no authentication required)
router.get("/public/:token", quoteController.getQuoteByToken.bind(quoteController));
router.post("/public/:token/respond", quoteController.respondToQuote.bind(quoteController));

export default router;