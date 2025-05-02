// server/routes/task.routes.ts
import { Router } from "express";
import * as taskController from "@server/controllers/task.controller";
import { isAuthenticated } from "@server/middleware/auth.middleware";
import { validateResourceId } from "@server/middleware/validation.middleware";

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent router

// GET /api/projects/:projectId/tasks
router.get("/", isAuthenticated, taskController.getProjectTasks);

// POST /api/projects/:projectId/tasks
router.post("/", isAuthenticated, taskController.createTask);

// PUT /api/projects/:projectId/tasks/:taskId
router.put("/:taskId", isAuthenticated, validateResourceId('taskId'), taskController.updateTask);

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete("/:taskId", isAuthenticated, validateResourceId('taskId'), taskController.deleteTask);

// --- ADD THIS ROUTE ---
// GET /api/projects/:projectId/tasks/dependencies - Fetch dependencies for the project
router.get("/dependencies", isAuthenticated, taskController.getTaskDependencies);
// --- END ADDED ROUTE ---

// POST /api/projects/:projectId/tasks/dependencies - Create a dependency
router.post("/dependencies", isAuthenticated, taskController.createTaskDependency);

// DELETE /api/projects/:projectId/tasks/dependencies - Remove a dependency
router.delete("/dependencies", isAuthenticated, taskController.deleteTaskDependency);

// POST /api/projects/:projectId/tasks/publish - Publish all project tasks (make visible to clients)
router.post("/publish", isAuthenticated, taskController.publishProjectTasks);

// POST /api/projects/:projectId/tasks/unpublish - Unpublish all project tasks (hide from clients)
router.post("/unpublish", isAuthenticated, taskController.unpublishProjectTasks);

// Import the function directly - bypassing the module import
import { importTasksFromJson } from '../controllers/task.controller';

// POST /api/projects/:projectId/tasks/import - Import tasks from JSON
router.post("/import", isAuthenticated, importTasksFromJson);

export default router;