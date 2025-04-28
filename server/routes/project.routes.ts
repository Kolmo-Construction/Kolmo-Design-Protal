// server/routes/project.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import * as projectController from "@server/controllers/project.controller"; // Updated import
import { isAuthenticated, isAdmin } from "@server/middleware/auth.middleware"; // Updated import
// Import checkProjectAccess if you want to apply it as route middleware for GET /:id
// import { checkProjectAccess } from "../middleware/permissions.middleware";

const router = Router();

/**
 * Middleware to validate project ID param before passing to controllers
 * This prevents "Invalid project ID parameter" errors when non-numeric IDs are provided
 */
function validateProjectId(req: Request, res: Response, next: NextFunction) {
  // For routes with projectId directly in URL params (/projects/:id)
  const id = req.params.id;
  if (id !== undefined && (isNaN(parseInt(id, 10)) || parseInt(id, 10) <= 0)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }
  next();
}

// GET /api/projects - Get projects accessible to the user
router.get("/", isAuthenticated, projectController.getProjects);

// POST /api/projects - Create a new project (Admin only)
router.post("/", isAdmin, projectController.createProject); // isAdmin implies isAuthenticated

// GET /api/projects/:id - Get a specific project by ID
// Added validateProjectId middleware to prevent errors with invalid IDs
router.get("/:id", isAuthenticated, validateProjectId, projectController.getProjectById);

// PUT /api/projects/:id - Update a specific project (Admin only)
// Added validateProjectId middleware to prevent errors with invalid IDs
router.put("/:id", isAdmin, validateProjectId, projectController.updateProject);

// Note: Routes for associating clients, project managers, etc.,
// could also be added here or in admin.routes.ts as appropriate.

export default router;