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

// Local WA State tax rate lookup by ZIP code
const waZipTaxRates: Record<string, number> = {
  // King County (Seattle area)
  "98101": 10.25, // Seattle Downtown
  "98102": 10.25,
  "98103": 10.25,
  "98104": 10.25,
  "98105": 10.25,
  "98106": 10.25,
  "98107": 10.25,
  "98108": 10.25,
  "98109": 10.25,
  "98110": 10.25, // Bainbridge Island
  "98111": 10.25,
  "98112": 10.25,
  "98113": 10.25,
  "98114": 10.25,
  "98115": 10.25,
  "98116": 10.25,
  "98117": 10.25,
  "98118": 10.25,
  "98119": 10.25,
  "98121": 10.25,
  "98122": 10.25,
  "98125": 10.25,
  "98126": 10.25,
  "98133": 10.25,
  "98134": 10.25,
  "98136": 10.25,
  "98138": 10.25,
  "98139": 10.25,
  "98144": 10.25,
  "98145": 10.25,
  "98146": 10.25,
  "98148": 10.25,
  "98154": 10.25,
  "98155": 10.25,
  "98158": 10.25,
  "98160": 10.25,
  "98161": 10.25,
  "98164": 10.25,
  "98165": 10.25,
  "98166": 10.25,
  "98168": 10.25,
  "98177": 10.25,
  "98178": 10.25,
  "98181": 10.25,
  "98188": 10.25,
  "98190": 10.25,
  "98191": 10.25,
  "98194": 10.25,
  "98195": 10.25,
  "98198": 10.25,
  "98199": 10.25,
  
  // Pierce County (Tacoma area)
  "98402": 10.25, // Tacoma
  "98403": 10.25,
  "98404": 10.25,
  "98405": 10.25,
  "98406": 10.25,
  "98407": 10.25,
  "98408": 10.25,
  "98409": 10.25,
  "98411": 10.25,
  "98412": 10.25,
  "98415": 10.25,
  "98416": 10.25,
  "98417": 10.25,
  "98418": 10.25,
  "98419": 10.25,
  "98421": 10.25,
  "98422": 10.25,
  "98424": 10.25,
  "98430": 10.25,
  "98431": 10.25,
  "98433": 10.25,
  "98434": 10.25,
  "98444": 10.25,
  "98445": 10.25,
  "98447": 10.25,
  "98448": 10.25,
  "98450": 10.25,
  "98460": 10.25,
  "98465": 10.25,
  "98466": 10.25,
  "98467": 10.25,
  "98471": 10.25,
  "98472": 10.25,
  "98477": 10.25,
  "98481": 10.25,
  "98490": 10.25,
  "98493": 10.25,
  
  // Snohomish County
  "98201": 10.025, // Everett
  "98204": 10.025,
  "98205": 10.025,
  "98208": 10.025,
  "98203": 9.5, // Lynnwood
  
  // King County Suburbs
  "98002": 10.25, // Algona
  "98003": 10.25, // Auburn
  "98004": 10.25, // Bellevue
  "98005": 10.25,
  "98006": 10.25,
  "98007": 10.25,
  "98008": 10.25,
  "98009": 10.25,
  "98011": 9.5, // Bothell
  "98014": 10.25, // Carnation
  "98019": 10.25, // Duvall
  "98022": 10.25, // Enumclaw
  "98024": 10.25, // Fall City
  "98030": 10.25, // Kent
  "98031": 10.25,
  "98032": 10.25,
  "98033": 10.25, // Kirkland
  "98034": 10.25,
  "98035": 10.25,
  "98036": 10.25, // Mercer Island
  "98037": 10.25, // Normandy Park
  "98038": 10.25, // Renton
  "98039": 10.25, // Sammamish
  "98040": 10.25, // Snoqualmie
  "98041": 10.25,
  "98042": 10.25, // Tukwila
  "98045": 10.25, // North Bend
  "98052": 10.25, // Redmond
  "98053": 10.25,
  "98055": 10.25, // Renton (Conc)
  "98056": 10.25, // Renton
  "98057": 10.25, // Renton
  "98058": 10.25, // Renton
  "98059": 10.25, // Redmond
  "98065": 10.25, // Snoqualmie
  "98068": 10.25, // Snoqualmie Pass
  "98070": 10.25, // Vashon Island
  "98072": 10.25, // Woodinville
  "98074": 10.25, // Woodinville
  "98075": 10.25, // Woodinville
  "98077": 10.25, // Woodinville
};

// Tax rate lookup route
router.post("/lookup/tax-rate", isAuthenticated, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || address.trim().length < 3) {
      return res.status(400).json({ error: "Address is required" });
    }

    console.log(`[Tax Lookup] Looking up tax rate for: ${address}`);
    
    // Try to extract ZIP code from address
    const zipMatch = address.match(/\b(\d{5})\b/);
    let taxRate = 8.5; // Default WA rate
    
    if (zipMatch) {
      const zip = zipMatch[1];
      console.log(`[Tax Lookup] Found ZIP: ${zip}`);
      
      if (waZipTaxRates[zip]) {
        taxRate = waZipTaxRates[zip];
        console.log(`[Tax Lookup] Found rate for ZIP ${zip}: ${taxRate}%`);
      } else {
        console.log(`[Tax Lookup] ZIP ${zip} not in lookup table, using default`);
      }
    } else {
      console.log(`[Tax Lookup] No ZIP code found in address`);
    }

    res.json({ taxRate });
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