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

// POST /api/projects/:projectId/tasks/dependencies
// Create a dependency between two tasks
router.post("/dependencies", isAuthenticated, taskController.createTaskDependency);

// DELETE /api/projects/:projectId/tasks/dependencies
// Remove a dependency between two tasks (using request body)
router.delete("/dependencies", isAuthenticated, taskController.deleteTaskDependency);

export default router;