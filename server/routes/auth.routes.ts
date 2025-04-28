// server/routes/auth.routes.ts
import { Router } from "express";
import * as authController from "@server/controllers/auth.controller";

const router = Router();

// --- Login/Logout/Status Routes ---
// Login route
router.post("/login", authController.loginUser);

// Logout route
router.post("/logout", authController.logoutUser);

// Get authentication status
router.get("/status", authController.getAuthStatus);

// --- Magic Link Routes ---
// Request a magic link
router.post("/request-magic-link", authController.requestMagicLink);

// Verify a magic link token
router.get("/verify-magic-link/:token", authController.verifyMagicLink);

// Setup profile after magic link login
router.post("/setup-profile", authController.setupProfile);

export default router;