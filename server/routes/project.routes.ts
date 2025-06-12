// server/routes/project.routes.ts
import { Router } from "express";
import * as projectController from "@server/controllers/project.controller"; 
import { isAuthenticated, isAdmin } from "@server/middleware/auth.middleware";
import { validateIdParam } from "@server/middleware/validation.middleware";
// Import checkProjectAccess if you want to apply it as route middleware for GET /:id
// import { checkProjectAccess } from "../middleware/permissions.middleware";

const router = Router();

// GET /api/projects - Get projects accessible to the user
router.get("/", isAuthenticated, projectController.getProjects);

// POST /api/projects - Create a new project (Admin only)
router.post("/", isAdmin, projectController.createProject); // isAdmin implies isAuthenticated

// GET /api/projects/:id - Get a specific project by ID
// Using our centralized validation middleware
router.get("/:id", isAuthenticated, validateIdParam, projectController.getProjectById);

// PUT /api/projects/:id - Update a specific project (Admin only)
router.put("/:id", isAdmin, validateIdParam, projectController.updateProject);

// DELETE /api/projects/:id - Delete a specific project (Admin only)
router.delete("/:id", isAdmin, validateIdParam, projectController.deleteProject);

// POST /api/projects/:id/recalculate-progress - Recalculate project progress based on tasks
router.post("/:id/recalculate-progress", isAuthenticated, validateIdParam, projectController.recalculateProjectProgress);

// Note: Routes for associating clients, project managers, etc.,
// could also be added here or in admin.routes.ts as appropriate.

export default router;