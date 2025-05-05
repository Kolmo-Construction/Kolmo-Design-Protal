/**
 * RAG Routes
 * Routes for the RAG (Retrieval Augmented Generation) system
 */
import { Router, Request, Response, NextFunction } from 'express';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { hasRole } from '../middleware/role.middleware';
import * as ragController from '../controllers/rag-controller';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Project version routes
router.post('/projects/:projectId/versions', hasRole(['admin', 'project_manager']), 
  (req: Request, res: Response, next: NextFunction) => ragController.createProjectVersion(req, res, next));
router.get('/projects/:projectId/versions', 
  (req: Request, res: Response, next: NextFunction) => ragController.getProjectVersions(req, res, next));
router.get('/versions/:versionId', 
  (req: Request, res: Response, next: NextFunction) => ragController.getProjectVersion(req, res, next));

// Generation prompt routes
router.post('/versions/:versionId/prompts', hasRole(['admin', 'project_manager']), 
  (req: Request, res: Response, next: NextFunction) => ragController.createGenerationPrompt(req, res, next));
router.get('/versions/:versionId/prompts', 
  (req: Request, res: Response, next: NextFunction) => ragController.getGenerationPrompts(req, res, next));

// RAG task routes
router.post('/versions/:versionId/tasks', hasRole(['admin', 'project_manager']), 
  (req: Request, res: Response, next: NextFunction) => ragController.createRagTask(req, res, next));
router.get('/versions/:versionId/tasks', 
  (req: Request, res: Response, next: NextFunction) => ragController.getRagTasks(req, res, next));

// RAG task dependency routes
router.post('/tasks/:taskId/dependencies', hasRole(['admin', 'project_manager']), 
  (req: Request, res: Response, next: NextFunction) => ragController.createRagTaskDependency(req, res, next));
router.get('/tasks/:taskId/dependencies', 
  (req: Request, res: Response, next: NextFunction) => ragController.getRagTaskDependencies(req, res, next));

// Task feedback routes
router.post('/tasks/:taskId/feedback', 
  (req: Request, res: Response, next: NextFunction) => ragController.createTaskFeedback(req, res, next));
router.get('/tasks/:taskId/feedback', 
  (req: Request, res: Response, next: NextFunction) => ragController.getTaskFeedback(req, res, next));

// Convert RAG tasks to project tasks
router.post('/projects/:projectId/versions/:versionId/convert', 
  hasRole(['admin', 'project_manager']), 
  (req: Request, res: Response, next: NextFunction) => ragController.convertRagTasksToProjectTasks(req, res, next));

export default router;