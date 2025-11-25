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

// Protected admin routes - collection level
router.get("/", isAuthenticated, quoteController.getAllQuotes.bind(quoteController));
router.post("/", isAuthenticated, quoteController.createQuote.bind(quoteController));

// Specific non-ID routes (must come before :id routes)
router.post("/lookup/tax-rate", isAuthenticated, async (req, res) => {
  try {
    const { address, city, zip } = req.body;
    
    // Parse address if only full address is provided
    let addrStr = address || "";
    let cityStr = city || "";
    let zipStr = zip || "";
    
    if (!addrStr && address) {
      addrStr = address;
    }
    
    if (!addrStr || addrStr.trim().length < 3) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Build URL with separated address components (WA State API format)
    // Format: https://webgis.dor.wa.gov/webapi/AddressRates.aspx?output=xml&addr=STREET&city=CITY&zip=ZIP
    const params = new URLSearchParams({
      output: "xml",
      addr: addrStr.trim(),
      ...(cityStr && { city: cityStr.trim() }),
      ...(zipStr && { zip: zipStr.trim() }),
    });
    
    const url = `https://webgis.dor.wa.gov/webapi/AddressRates.aspx?${params.toString()}`;
    
    console.log(`[Tax Lookup] Requesting: ${url}`);
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    console.log(`[Tax Lookup] XML Response length: ${xmlText.length}, First 1000 chars: ${xmlText.substring(0, 1000)}`);
    
    // Parse XML response to extract tax rate
    // WA API returns: <response ... rate=".097" ...> where .097 = 9.7% (state 6.5% + local 3.2%)
    let totalRate = 0;
    
    // Format 1: Combined rate attribute from response root element (preferred)
    // Look specifically for rate=" to match the combined rate, not localrate
    const responseMatch = xmlText.match(/<response[^>]*rate="([^"]+)"/);
    if (responseMatch) {
      const rateDecimal = parseFloat(responseMatch[1]);
      totalRate = rateDecimal * 100; // Convert decimal (0.097) to percentage (9.7)
      console.log(`[Tax Lookup] Found combined rate from response: ${rateDecimal} = ${totalRate}%`);
    }
    
    // Format 2: Manual calculation from state + local rates (fallback)
    if (!totalRate || totalRate === 0) {
      const stateRateMatch = xmlText.match(/staterate="([^"]+)"/);
      const localRateMatch = xmlText.match(/localrate="([^"]+)"/);
      
      if (stateRateMatch && localRateMatch) {
        const stateRateDecimal = parseFloat(stateRateMatch[1]);
        const localRateDecimal = parseFloat(localRateMatch[1]);
        const stateRate = stateRateDecimal * 100;
        const localRate = localRateDecimal * 100;
        totalRate = stateRate + localRate; // e.g., 6.5 + 3.2 = 9.7
        console.log(`[Tax Lookup] Calculated state (${stateRate}%) + local (${localRate}%) = ${totalRate}%`);
      }
    }
    
    console.log(`[Tax Lookup] Final calculated rate: ${totalRate}%`);

    if (totalRate > 0 && !isNaN(totalRate)) {
      // Ensure rate includes WA state tax minimum of 6.5%
      const finalRate = Math.max(totalRate, 6.5);
      console.log(`[Tax Lookup] Returning rate: ${finalRate}%`);
      res.json({ taxRate: finalRate });
    } else {
      // Return default WA state + local average rate if lookup fails
      console.log(`[Tax Lookup] No rate found, returning default`);
      res.json({ taxRate: 9.5 }); // Default: 6.5% state + ~3% local
    }
  } catch (error) {
    console.error("Tax rate lookup error:", error);
    // Return default WA rate on error
    res.json({ taxRate: 8.5 });
  }
});

// Public customer routes (no authentication required) - must come before :id routes
router.get("/public/:token", quoteController.getQuoteByToken.bind(quoteController));
router.post("/public/:token/respond", quoteController.respondToQuote.bind(quoteController));

// Routes with nested resources (must come before generic :id routes)
// Line item routes
router.get("/:id/line-items", isAuthenticated, quoteController.getQuoteLineItems.bind(quoteController));
router.post("/:id/line-items", isAuthenticated, quoteController.createLineItem.bind(quoteController));
router.patch("/:id/line-items/:lineItemId", isAuthenticated, quoteController.updateLineItem.bind(quoteController));
router.delete("/:id/line-items/:lineItemId", isAuthenticated, quoteController.deleteLineItem.bind(quoteController));

// Image routes
router.post("/:id/images", isAuthenticated, quoteController.uploadQuoteImage.bind(quoteController));
router.post("/:id/images/:type", isAuthenticated, upload.single('image'), quoteController.uploadBeforeAfterImage.bind(quoteController));
router.patch("/:id/images/:type/caption", isAuthenticated, quoteController.updateImageCaption.bind(quoteController));
router.delete("/:id/images/:type", isAuthenticated, quoteController.deleteBeforeAfterImage.bind(quoteController));

// Photo management routes
router.get("/:id/media", isAuthenticated, quoteController.getQuoteMedia.bind(quoteController));
router.post("/:id/photos", isAuthenticated, upload.single('photo'), quoteController.uploadQuotePhoto.bind(quoteController));

// Non-nested resource deletion routes (specific paths that could be mistaken for :id)
router.delete("/images/:imageId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));
router.patch("/media/:mediaId", isAuthenticated, quoteController.updateQuoteMedia.bind(quoteController));
router.delete("/media/:mediaId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));

// Generic :id routes (MUST COME LAST after all more specific routes)
router.get("/:id", isAuthenticated, quoteController.getQuoteById.bind(quoteController));
router.patch("/:id", isAuthenticated, quoteController.updateQuote.bind(quoteController));
router.delete("/:id", isAuthenticated, quoteController.deleteQuote.bind(quoteController));
router.post("/:id/send", isAuthenticated, quoteController.sendQuote.bind(quoteController));
router.patch("/:id/financials", isAuthenticated, quoteController.updateQuoteFinancials.bind(quoteController));

export default router;
