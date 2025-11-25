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
    let totalRate = 0;
    
    // Format 1: root-level rate attribute (WA State returns this)
    // Example: <response ... rate=".097" ...>
    const rootRateMatch = xmlText.match(/rate="([^"]+)"/);
    if (rootRateMatch) {
      totalRate = parseFloat(rootRateMatch[1]) * 100; // Convert decimal to percentage
      console.log(`[Tax Lookup] Found root rate attribute: ${totalRate}%`);
    }
    
    // Format 2: State + Local rates from rate element
    if (totalRate === 0) {
      const stateRateMatch = xmlText.match(/staterate="([^"]+)"/);
      const localRateMatch = xmlText.match(/localrate="([^"]+)"/);
      
      if (stateRateMatch) {
        const stateRate = parseFloat(stateRateMatch[1]) * 100;
        const localRate = localRateMatch ? parseFloat(localRateMatch[1]) * 100 : 0;
        totalRate = stateRate + localRate;
        console.log(`[Tax Lookup] Found state (${stateRate}%) + local (${localRate}%) = ${totalRate}%`);
      }
    }
    
    // Format 3: Nested rate element value
    if (totalRate === 0) {
      const rateMatch = xmlText.match(/<rate[^>]*>([^<]+)<\/rate>/i);
      if (rateMatch) {
        const rateValue = parseFloat(rateMatch[1]);
        // Check if it's decimal format or percentage
        totalRate = rateValue < 1 ? rateValue * 100 : rateValue;
        console.log(`[Tax Lookup] Found nested rate element: ${totalRate}%`);
      }
    }
    
    console.log(`[Tax Lookup] Final rate: ${totalRate}%`);

    if (totalRate > 0 && !isNaN(totalRate)) {
      res.json({ taxRate: totalRate });
    } else {
      // Return a default WA state tax rate if lookup fails
      console.log(`[Tax Lookup] No rate found, returning default`);
      res.json({ taxRate: 8.5 }); // Default WA rate
    }
  } catch (error) {
    console.error("Tax rate lookup error:", error);
    // Return default WA rate on error
    res.json({ taxRate: 8.5 });
  }
});

// Public customer routes (no authentication required)
router.get("/public/:token", quoteController.getQuoteByToken.bind(quoteController));
router.post("/public/:token/respond", quoteController.respondToQuote.bind(quoteController));

export default router;