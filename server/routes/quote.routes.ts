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

// ============================================================
// 1. STATIC ROUTES (no dynamic params) - MUST COME FIRST
// ============================================================
router.get("/", isAuthenticated, quoteController.getAllQuotes.bind(quoteController));
router.post("/", isAuthenticated, quoteController.createQuote.bind(quoteController));

// Tax rate lookup (static path)
router.post("/lookup/tax-rate", isAuthenticated, async (req, res) => {
  try {
    const { address, city, zip } = req.body;
    
    let addrStr = address || "";
    let cityStr = city || "";
    let zipStr = zip || "";
    
    if (!addrStr && address) {
      addrStr = address;
    }
    
    if (!addrStr || addrStr.trim().length < 3) {
      return res.status(400).json({ error: "Address is required" });
    }

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
    
    let totalRate = 0;
    
    const responseMatch = xmlText.match(/<response[^>]*rate="([^"]+)"/);
    if (responseMatch) {
      const rateDecimal = parseFloat(responseMatch[1]);
      totalRate = rateDecimal * 100;
      console.log(`[Tax Lookup] Found combined rate from response: ${rateDecimal} = ${totalRate}%`);
    }
    
    if (!totalRate || totalRate === 0) {
      const stateRateMatch = xmlText.match(/staterate="([^"]+)"/);
      const localRateMatch = xmlText.match(/localrate="([^"]+)"/);
      
      if (stateRateMatch && localRateMatch) {
        const stateRateDecimal = parseFloat(stateRateMatch[1]);
        const localRateDecimal = parseFloat(localRateMatch[1]);
        const stateRate = stateRateDecimal * 100;
        const localRate = localRateDecimal * 100;
        totalRate = stateRate + localRate;
        console.log(`[Tax Lookup] Calculated state (${stateRate}%) + local (${localRate}%) = ${totalRate}%`);
      }
    }
    
    console.log(`[Tax Lookup] Final calculated rate: ${totalRate}%`);

    if (totalRate > 0 && !isNaN(totalRate)) {
      const finalRate = Math.max(totalRate, 6.5);
      console.log(`[Tax Lookup] Returning rate: ${finalRate}%`);
      res.json({ taxRate: finalRate });
    } else {
      console.log(`[Tax Lookup] No rate found, returning default`);
      res.json({ taxRate: 9.5 });
    }
  } catch (error) {
    console.error("Tax rate lookup error:", error);
    res.json({ taxRate: 8.5 });
  }
});

// Public customer routes (static paths with token param)
router.get("/public/:token", quoteController.getQuoteByToken.bind(quoteController));
router.post("/public/:token/respond", quoteController.respondToQuote.bind(quoteController));

// ============================================================
// 2. SPECIFIC RESOURCE ROUTES (static prefix before :id)
// ============================================================

// Line item routes - These have static "line-items" prefix so they match first
router.patch("/line-items/:lineItemId", isAuthenticated, quoteController.updateLineItem.bind(quoteController));
router.delete("/line-items/:lineItemId", isAuthenticated, quoteController.deleteLineItem.bind(quoteController));

// Image routes - These have static "images" prefix
router.delete("/images/:imageId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));

// Media routes - These have static "media" prefix
router.patch("/media/:mediaId", isAuthenticated, quoteController.updateQuoteMedia.bind(quoteController));
router.delete("/media/:mediaId", isAuthenticated, quoteController.deleteQuoteImage.bind(quoteController));

// ============================================================
// 3. NESTED ROUTES WITH :id (routes that have paths AFTER :id)
// These are safe because they have specific suffixes that won't match /:id alone
// ============================================================
router.get("/:id/line-items", isAuthenticated, quoteController.getQuoteLineItems.bind(quoteController));
router.post("/:id/line-items", isAuthenticated, quoteController.createLineItem.bind(quoteController));

router.post("/:id/images", isAuthenticated, quoteController.uploadQuoteImage.bind(quoteController));
router.post("/:id/images/:type", isAuthenticated, upload.single('image'), quoteController.uploadBeforeAfterImage.bind(quoteController));
router.patch("/:id/images/:type/caption", isAuthenticated, quoteController.updateImageCaption.bind(quoteController));
router.delete("/:id/images/:type", isAuthenticated, quoteController.deleteBeforeAfterImage.bind(quoteController));

router.get("/:id/media", isAuthenticated, quoteController.getQuoteMedia.bind(quoteController));
router.post("/:id/photos", isAuthenticated, upload.single('photo'), quoteController.uploadQuotePhoto.bind(quoteController));

router.post("/:id/send", isAuthenticated, quoteController.sendQuote.bind(quoteController));
router.patch("/:id/financials", isAuthenticated, quoteController.updateQuoteFinancials.bind(quoteController));

// ============================================================
// 4. GENERIC :id ROUTES - MUST COME LAST
// These catch any request that looks like /123 (just an ID)
// ============================================================
router.get("/:id", isAuthenticated, quoteController.getQuoteById.bind(quoteController));
router.patch("/:id", isAuthenticated, quoteController.updateQuote.bind(quoteController));
router.delete("/:id", isAuthenticated, quoteController.deleteQuote.bind(quoteController));

export default router;
